import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/blog/article-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Build articles query
  let articlesQuery = supabase
    .from("articles")
    .select(
      `
      slug,
      title,
      excerpt,
      cover_image_url,
      published_at,
      content,
      profiles!articles_author_id_fkey (
        display_name,
        avatar_url
      ),
      article_categories (
        categories (
          name
        )
      )
    `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // Filter by category if specified
  if (params.category) {
    // Get category ID from slug
    const { data: category } = (await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single()) as any;

    if (category) {
      // Get article IDs for this category
      const { data: articleCategories } = (await supabase
        .from("article_categories")
        .select("article_id")
        .eq("category_id", category.id)) as any;

      const articleIds = articleCategories?.map((ac: any) => ac.article_id) || [];
      if (articleIds.length > 0) {
        articlesQuery = articlesQuery.in("id", articleIds);
      } else {
        // No articles in this category
        articlesQuery = articlesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }
  }

  // Search by title if specified
  if (params.search) {
    articlesQuery = articlesQuery.ilike("title", `%${params.search}%`);
  }

  const { data: articles } = (await articlesQuery) as any;

  // Get categories with article counts
  const { data: categoriesData } = (await supabase.rpc("get_categories_with_counts")) as any;

  // Format articles data
  const formattedArticles =
    articles?.map((article: any) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      cover_image_url: article.cover_image_url,
      published_at: article.published_at,
      content: article.content,
      author: {
        display_name: article.profiles?.display_name || "Admin",
        avatar_url: article.profiles?.avatar_url,
      },
      categories: article.article_categories?.map((ac: any) => ({
        name: ac.categories?.name,
      })) || [],
    })) || [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Blog d&apos;Amel</h1>
        <p className="text-xl text-muted-foreground">
          Bienvenue sur mon espace de partage
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form action="/home" method="GET">
            <Input
              type="text"
              name="search"
              placeholder="Rechercher un article..."
              defaultValue={params.search}
              className="pl-10"
            />
          </form>
        </div>
      </div>

      {/* Category Filter */}
      {categoriesData && categoriesData.length > 0 && (
        <CategoryFilter
          categories={categoriesData}
          activeCategory={params.category}
        />
      )}

      {/* Articles Grid */}
      {formattedArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {formattedArticles.map((article: any) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {params.search || params.category
              ? "Aucun article trouvé"
              : "Aucun article publié pour le moment"}
          </p>
        </div>
      )}
    </div>
  );
}
