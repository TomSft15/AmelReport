import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/admin/article-form";

export default async function NewArticlePage() {
  const supabase = await createServerSupabaseClient();

  // Get all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true }) as any;

  return <ArticleForm mode="create" categories={categories || []} />;
}
