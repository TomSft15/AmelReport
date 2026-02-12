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

export async function signupWithCode(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const data = {
    code: formData.get("code") as string,
    email: formData.get("email") as string,
    displayName: formData.get("displayName") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const result = invitationAcceptSchema.safeParse({
    displayName: data.displayName,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Find invitation with this code
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("code", data.code.toUpperCase())
    .single() as any;

  if (invitationError || !invitation) {
    return { error: "Code d'invitation invalide" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("invitations")
      // @ts-ignore
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "Ce code d'invitation a expiré" };
  }

  // Check if already used
  if (invitation.status !== "pending") {
    return { error: "Ce code d'invitation a déjà été utilisé" };
  }

  // Check if email matches (optional - remove if you want anyone with code to use any email)
  if (invitation.email && data.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "Cet email ne correspond pas à l'invitation" };
  }

  // Create user with admin API (email already confirmed)
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
    email: data.email,
    password: data.password,
    email_confirm: true, // ✅ Email confirmed automatically
    user_metadata: {
      display_name: data.displayName,
    },
  });

  if (signUpError || !authData.user) {
    return { error: "Erreur lors de la création du compte: " + (signUpError?.message || "Unknown error") };
  }

  // Update profile to active status
  await supabaseAdmin
    .from("profiles")
    // @ts-ignore
    .update({
      invitation_status: "active",
      display_name: data.displayName,
    })
    .eq("id", authData.user.id);

  // Mark invitation as accepted
  await supabaseAdmin
    .from("invitations")
    // @ts-ignore
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  // Sign in the user immediately
  await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  revalidatePath("/", "layout");
  redirect("/");
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

  // Check if already fully accepted
  if (invitation.status === "accepted") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Check if not valid for acceptance (must be 'pending' or 'user_created')
  if (invitation.status !== "pending" && invitation.status !== "user_created") {
    return { error: "Cette invitation n'est pas valide" };
  }

  // Use admin client to create or update user
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

  // Check if user already exists (created by inviteUserByEmail)
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === invitation.email);

  let userId: string;

  if (existingUser) {
    // User exists - update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: data.password,
        email_confirm: true,
        user_metadata: {
          display_name: data.displayName,
        },
      }
    );

    if (updateError) {
      return { error: "Erreur lors de la mise à jour du compte: " + updateError.message };
    }

    userId = existingUser.id;
  } else {
    // User doesn't exist - create new one
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        display_name: data.displayName,
      },
    });

    if (createError || !authData.user) {
      return { error: "Erreur lors de la création du compte: " + createError?.message };
    }

    userId = authData.user.id;
  }

  // Create or update profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: invitation.email,
      display_name: data.displayName,
      invitation_status: "active",
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      last_login_at: new Date().toISOString(),
    });

  if (profileError) {
    // Profile error - non-blocking
  }

  // Mark invitation as accepted
  await supabaseAdmin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

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

export async function completeProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const data = {
    displayName: formData.get("displayName") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    token: formData.get("token") as string,
    userId: formData.get("userId") as string,
  };

  // Validate input
  const result = invitationAcceptSchema.safeParse({
    displayName: data.displayName,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || user.id !== data.userId) {
    return { error: "Non authentifié" };
  }

  // Verify invitation
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", data.token)
    .eq("email", user.email)
    .single() as any;

  if (invitationError || !invitation) {
    return { error: "Invitation invalide" };
  }

  if (invitation.status === "accepted") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Check if not valid for completion (must be 'pending' or 'user_created')
  if (invitation.status !== "pending" && invitation.status !== "user_created") {
    return { error: "Cette invitation n'est pas valide" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("invitations")
      // @ts-ignore
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "Cette invitation a expiré" };
  }

  // Update user password using admin API
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

  const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      password: data.password,
      user_metadata: {
        display_name: data.displayName,
      },
    }
  );

  if (updatePasswordError) {
    return { error: "Erreur lors de la mise à jour du mot de passe: " + updatePasswordError.message };
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    // @ts-ignore
    .update({
      display_name: data.displayName,
      invitation_status: "active",
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Erreur lors de la mise à jour du profil" };
  }

  // Mark invitation as accepted
  const { error: invitationUpdateError } = await supabase
    .from("invitations")
    // @ts-ignore
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    // Invitation update error - non-blocking
  }

  revalidatePath("/", "layout");
  redirect("/");
}
