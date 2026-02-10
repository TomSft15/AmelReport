"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteComment(id: string) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get comment to check ownership
  const { data: comment } = (await supabase
    .from("comments")
    .select("user_id")
    .eq("id", id)
    .single()) as any;

  if (!comment) {
    return { error: "Commentaire non trouvé" };
  }

  // Check if user is admin or comment owner
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as any;

  const isAdmin = profile?.role === "admin";
  const isOwner = comment.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return { error: "Accès non autorisé" };
  }

  // Delete comment (CASCADE will delete replies)
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    return { error: "Erreur lors de la suppression du commentaire" };
  }

  revalidatePath("/admin/comments");

  return { success: true };
}

export async function createComment(
  articleId: string,
  content: string,
  parentId?: string | null
) {
  const supabase = await createServerSupabaseClient();

  // Check if current user is authenticated and active
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("invitation_status")
    .eq("id", user.id)
    .single()) as any;

  if (profile?.invitation_status !== "active") {
    return { error: "Votre compte n'est pas actif" };
  }

  // Validate content
  if (!content.trim()) {
    return { error: "Le commentaire ne peut pas être vide" };
  }

  if (content.length > 2000) {
    return { error: "Le commentaire est trop long (max 2000 caractères)" };
  }

  // Create comment
  const { error } = await supabase
    .from("comments")
    // @ts-ignore - Supabase types issue
    .insert({
      article_id: articleId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    });

  if (error) {
    return { error: "Erreur lors de la création du commentaire" };
  }

  revalidatePath(`/articles/[slug]`, "page");

  return { success: true };
}
