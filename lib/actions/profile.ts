"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const displayName = formData.get("displayName") as string;

  if (!displayName?.trim()) {
    return { error: "Le nom d'affichage est requis" };
  }

  if (displayName.length > 50) {
    return { error: "Le nom d'affichage est trop long (max 50 caractères)" };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    // @ts-ignore - Supabase types issue
    .update({
      display_name: displayName.trim(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/profile");

  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const file = formData.get("file") as File;

  if (!file) {
    return { error: "Aucun fichier sélectionné" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Type de fichier non autorisé (JPEG, PNG, WebP, GIF uniquement)" };
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 2 MB)" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: "Erreur lors de l'upload de l'image" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    // @ts-ignore - Supabase types issue
    .update({
      avatar_url: publicUrl,
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/profile");

  return { success: true, avatarUrl: publicUrl };
}

export async function changePassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || !confirmPassword) {
    return { error: "Tous les champs sont requis" };
  }

  if (newPassword.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: "Erreur lors du changement de mot de passe" };
  }

  return { success: true };
}
