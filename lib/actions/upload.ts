"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { imageUploadSchema } from "@/lib/validations";

export async function uploadImage(formData: FormData) {
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

  const file = formData.get("file") as File;

  if (!file) {
    return { error: "Aucun fichier fourni" };
  }

  // Validate file
  const result = imageUploadSchema.safeParse({ file });
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Fichier invalide" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("article-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: "Erreur lors de l'upload de l'image" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("article-images").getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}
