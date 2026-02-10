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

  // Check if email already exists in profiles
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existingProfile) {
    return { error: "Cet email est déjà inscrit" };
  }

  // Check if email already has a pending invitation
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", data.email)
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    return { error: "Une invitation est déjà en attente pour cet email" };
  }

  // Generate token and expiration (7 days)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create invitation
  // @ts-ignore - Supabase types issue
  const { error: insertError } = await supabase.from("invitations").insert({
    email: data.email,
    token: token,
    expires_at: expiresAt.toISOString(),
    status: "pending",
    invited_by: user.id,
  });

  if (insertError) {
    console.error("Error creating invitation:", insertError);
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

  // Get invitation (userId is now the invitation id, not profile id)
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", userId)
    .single() as any;

  if (!invitation) {
    return { error: "Invitation introuvable" };
  }

  if (invitation.status !== "pending") {
    return { error: "Cette invitation a déjà été acceptée" };
  }

  // Generate new token and expiration
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from("invitations")
    // @ts-ignore - Supabase types issue
    .update({
      token: token,
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error resending invitation:", error);
    return { error: "Erreur lors du renvoi de l'invitation" };
  }

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${token}`;

  revalidatePath("/admin/users");

  return { success: true, invitationUrl };
}

export async function deleteInvitation(invitationId: string) {
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

  // Delete invitation
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    console.error("Error deleting invitation:", error);
    return { error: "Erreur lors de la suppression de l'invitation" };
  }

  revalidatePath("/admin/users");

  return { success: true };
}
