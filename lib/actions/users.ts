"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inviteUserSchema } from "@/lib/validations";
import crypto from "crypto";

export async function inviteUser(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  if (profile?.role !== "admin") {
    return { error: "Accès non autorisé" };
  }

  const data = {
    email: formData.get("email") as string,
  };

  // Validate input
  const result = inviteUserSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Email invalide" };
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existing) {
    return { error: "Cet email est déjà invité" };
  }

  // Generate token and expiration (7 days)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create profile
  // @ts-ignore - Supabase types issue
  const { error: insertError } = await supabase.from("profiles").insert({
    id: crypto.randomUUID(),
    email: data.email,
    invitation_token: token,
    invitation_expires_at: expiresAt.toISOString(),
    invitation_status: "pending",
    invited_by: user.id,
  });

  if (insertError) {
    return { error: "Erreur lors de la création de l'invitation" };
  }

  // In production, send email here using Supabase Auth
  // For now, we'll just return the invitation link
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${token}`;

  revalidatePath("/admin/users");

  return { success: true, invitationUrl };
}

export async function toggleUserStatus(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  if (profile?.role !== "admin") {
    return { error: "Accès non autorisé" };
  }

  // Get current status
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("invitation_status")
    .eq("id", userId)
    .single() as any;

  if (!targetProfile) {
    return { error: "Utilisateur introuvable" };
  }

  const newStatus =
    targetProfile.invitation_status === "active" ? "disabled" : "active";

  const { error } = await supabase
    .from("profiles")
    // @ts-ignore - Supabase types issue
    .update({ invitation_status: newStatus })
    .eq("id", userId);

  if (error) {
    return { error: "Erreur lors de la mise à jour du statut" };
  }

  revalidatePath("/admin/users");

  return { success: true };
}

export async function resendInvitation(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  if (profile?.role !== "admin") {
    return { error: "Accès non autorisé" };
  }

  // Get user profile
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single() as any;

  if (!targetProfile) {
    return { error: "Utilisateur introuvable" };
  }

  if (targetProfile.invitation_status !== "pending") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Generate new token and expiration
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from("profiles")
    // @ts-ignore - Supabase types issue
    .update({
      invitation_token: token,
      invitation_expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error: "Erreur lors du renvoi de l'invitation" };
  }

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${token}`;

  revalidatePath("/admin/users");

  return { success: true, invitationUrl };
}
