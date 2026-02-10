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
  redirect("/login");
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

  // Find profile with this token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("invitation_token", token)
    .single() as any;

  if (profileError || !profile) {
    return { error: "Invitation invalide ou expirée" };
  }

  // Check if token is expired
  if (
    profile.invitation_expires_at &&
    new Date(profile.invitation_expires_at) < new Date()
  ) {
    return { error: "Cette invitation a expiré" };
  }

  // Check if already accepted
  if (profile.invitation_status === "active") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Create auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: profile.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName,
      },
    },
  });

  if (signUpError) {
    return { error: "Erreur lors de la création du compte: " + signUpError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    // @ts-ignore - Supabase types issue
    .update({
      display_name: data.displayName,
      invitation_status: "active",
      invitation_token: null,
      invitation_expires_at: null,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", authData.user.id);

  if (updateError) {
    return { error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: "Erreur lors de la connexion avec Google" };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Une erreur inattendue s'est produite" };
}
