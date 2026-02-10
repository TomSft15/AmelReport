"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";

export async function createCategory(formData: FormData) {
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
    name: formData.get("name") as string,
    slug: generateSlug(formData.get("name") as string),
  };

  // Validate input
  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", data.slug)
    .single();

  if (existing) {
    return { error: "Une catégorie avec ce nom existe déjà" };
  }

  // Create category
  // @ts-ignore - Supabase types issue
  const { error } = await supabase.from("categories").insert({
    name: data.name,
    slug: data.slug,
  });

  if (error) {
    return { error: "Erreur lors de la création de la catégorie" };
  }

  revalidatePath("/admin/categories");

  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
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
    name: formData.get("name") as string,
    slug: generateSlug(formData.get("name") as string),
  };

  // Validate input
  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Check if slug already exists (excluding current category)
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", data.slug)
    .neq("id", id)
    .single();

  if (existing) {
    return { error: "Une catégorie avec ce nom existe déjà" };
  }

  // Update category
  const { error } = await supabase
    .from("categories")
    // @ts-ignore - Supabase types issue
    .update({
      name: data.name,
      slug: data.slug,
    })
    .eq("id", id);

  if (error) {
    return { error: "Erreur lors de la mise à jour de la catégorie" };
  }

  revalidatePath("/admin/categories");

  return { success: true };
}

export async function deleteCategory(id: string) {
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

  // Check if category is used by articles
  const { count } = await supabase
    .from("article_categories")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      error: `Impossible de supprimer cette catégorie car elle est utilisée par ${count} article(s)`,
    };
  }

  // Delete category
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: "Erreur lors de la suppression de la catégorie" };
  }

  revalidatePath("/admin/categories");

  return { success: true };
}
