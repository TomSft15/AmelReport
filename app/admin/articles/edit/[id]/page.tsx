import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/admin/article-form";
import { notFound } from "next/navigation";

interface EditArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Get article data
  const { data: article } = (await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      content,
      excerpt,
      cover_image_url,
      status,
      article_categories (
        category_id
      )
    `
    )
    .eq("id", id)
    .single()) as any;

  if (!article) {
    notFound();
  }

  // Get all categories
  const { data: categories } = (await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true })) as any;

  // Transform article data for the form
  const articleData = {
    id: article.id,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    cover_image_url: article.cover_image_url,
    status: article.status,
    categoryIds: article.article_categories?.map((ac: any) => ac.category_id) || [],
  };

  return <ArticleForm mode="edit" categories={categories || []} article={articleData} />;
}
