"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articleSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import sanitizeHtml from "sanitize-html";

// Configuration sanitize-html pour l'éditeur Tiptap
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'figure', 'figcaption',
    'pre', 'code',
    'blockquote', 'cite',
    'mark', 'del', 'ins',
    'hr', 'br',
    'video', 'audio', 'source',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'style'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    video: ['src', 'controls', 'width', 'height'],
    audio: ['src', 'controls'],
    source: ['src', 'type'],
    code: ['class'],
    pre: ['class'],
  },
  allowedStyles: {
    '*': {
      'color': [/^#[0-9a-f]{3,6}$/i, /^rgb\(/i, /^rgba\(/i],
      'background-color': [/^#[0-9a-f]{3,6}$/i, /^rgb\(/i, /^rgba\(/i],
      'text-align': [/^left$/i, /^right$/i, /^center$/i, /^justify$/i],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
      'text-decoration': [/^underline$/, /^line-through$/],
    },
  },
};

export async function createArticle(formData: FormData) {
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
    title: formData.get("title") as string,
    slug: generateSlug(formData.get("title") as string),
    content: sanitizeHtml(formData.get("content") as string, sanitizeOptions),
    excerpt: formData.get("excerpt") as string || null,
    coverImageUrl: formData.get("coverImageUrl") as string || null,
    status: formData.get("status") as "draft" | "published",
    categoryIds: JSON.parse(formData.get("categoryIds") as string || "[]"),
  };

  // Validate input
  const result = articleSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", data.slug)
    .single();

  if (existing) {
    return { error: "Un article avec ce titre existe déjà" };
  }

  // Create article
  const { data: article, error: articleError } = (await supabase
    .from("articles")
    // @ts-ignore - Supabase types issue
    .insert({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      cover_image_url: data.coverImageUrl,
      author_id: user.id,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single()) as any;

  if (articleError || !article) {
    return {
      error: articleError?.message || "Erreur lors de la création de l'article",
    };
  }

  // Add categories
  if (data.categoryIds && data.categoryIds.length > 0) {
    const categoryLinks = data.categoryIds.map((categoryId: string) => ({
      article_id: article.id,
      category_id: categoryId,
    }));

    await supabase.from("article_categories").insert(categoryLinks);
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin");

  redirect("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
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
    title: formData.get("title") as string,
    slug: generateSlug(formData.get("title") as string),
    content: sanitizeHtml(formData.get("content") as string, sanitizeOptions),
    excerpt: formData.get("excerpt") as string || null,
    coverImageUrl: formData.get("coverImageUrl") as string || null,
    status: formData.get("status") as "draft" | "published",
    categoryIds: JSON.parse(formData.get("categoryIds") as string || "[]"),
  };

  // Validate input
  const result = articleSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Données invalides" };
  }

  // Check if slug already exists (excluding current article)
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", data.slug)
    .neq("id", id)
    .single();

  if (existing) {
    return { error: "Un article avec ce titre existe déjà" };
  }

  // Update article
  const { error: articleError } = await supabase
    .from("articles")
    // @ts-ignore - Supabase types issue
    .update({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      cover_image_url: data.coverImageUrl,
      status: data.status,
      published_at:
        data.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (articleError) {
    return {
      error: articleError?.message || "Erreur lors de la mise à jour de l'article",
    };
  }

  // Update categories - delete old ones and add new ones
  await supabase.from("article_categories").delete().eq("article_id", id);

  if (data.categoryIds && data.categoryIds.length > 0) {
    const categoryLinks = data.categoryIds.map((categoryId: string) => ({
      article_id: id,
      category_id: categoryId,
    }));

    await supabase.from("article_categories").insert(categoryLinks);
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/edit/${id}`);
  revalidatePath("/admin");

  redirect("/admin/articles");
}

export async function saveDraft(id: string, content: string) {
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

  // Sanitize content
  const sanitizedContent = sanitizeHtml(content, sanitizeOptions);

  // Update article content
  const { error } = await supabase
    .from("articles")
    // @ts-ignore - Supabase types issue
    .update({
      content: sanitizedContent,
    })
    .eq("id", id);

  if (error) {
    return { error: "Erreur lors de la sauvegarde" };
  }

  return { success: true };
}

export async function deleteArticle(id: string) {
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

  // Delete article (categories and comments will be deleted by CASCADE)
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    return { error: "Erreur lors de la suppression de l'article" };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin");

  return { success: true };
}
