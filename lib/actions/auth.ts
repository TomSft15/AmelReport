"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginSchema, invitationAcceptSchema } from "@/lib/validations";
import { z } from "zod";

export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Attempt sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // Update last login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      // @ts-ignore - Supabase types issue
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function acceptInvitation(token: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const data = {
    displayName: formData.get("displayName") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const result = invitationAcceptSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Find invitation with this token
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single() as any;

  if (invitationError || !invitation) {
    return { error: "Invitation invalide ou expirée" };
  }

  // Check if token is expired
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date()
  ) {
    // Mark as expired
    await supabase
      .from("invitations")
      // @ts-ignore - Supabase types issue
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "Cette invitation a expiré" };
  }

  // Check if already accepted
  if (invitation.status === "accepted") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Create auth user using Admin API to bypass email rate limit
  // The Admin API allows creating users without sending confirmation emails
  // The trigger will automatically:
  // 1. Create a profile with invitation_status = 'active', display_name, and last_login_at
  // 2. Mark the invitation as 'accepted'
  // 3. Set invited_by and invited_at from the invitation

  // Use admin client to create user without email confirmation
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email,
    password: data.password,
    email_confirm: true, // Auto-confirm email without sending
    user_metadata: {
      display_name: data.displayName,
    },
  });

  if (signUpError) {
    return { error: "Erreur lors de la création du compte: " + signUpError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Sign in the user automatically
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: data.password,
  });

  if (signInError) {
    return { error: "Compte créé mais erreur de connexion: " + signInError.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
