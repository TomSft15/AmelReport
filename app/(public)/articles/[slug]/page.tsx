import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArticleContent } from "@/components/blog/article-content";
import { CommentList } from "@/components/blog/comment-list";
import { formatDate, calculateReadingTime } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";
import { Metadata } from "next";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: article } = (await supabase
    .from("articles")
    .select("title, excerpt, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single()) as any;

  if (!article) {
    return {
      title: "Article non trouvé",
    };
  }

  return {
    title: article.title,
    description: article.excerpt || undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get user profile
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as any;

  // Get article
  const { data: article } = (await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      content,
      excerpt,
      cover_image_url,
      published_at,
      profiles!articles_author_id_fkey (
        display_name,
        avatar_url
      ),
      article_categories (
        categories (
          name,
          slug
        )
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()) as any;

  if (!article) {
    notFound();
  }

  // Get comments for this article
  const { data: comments } = (await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user_id,
      parent_id,
      profiles!comments_user_id_fkey (
        display_name,
        avatar_url
      )
    `
    )
    .eq("article_id", article.id)
    .order("created_at", { ascending: true })) as any;

  const readingTime = calculateReadingTime(article.content);

  return (
    <article className="max-w-4xl mx-auto px-6 md:px-8">
      {/* Cover Image */}
      {article.cover_image_url && (
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Header */}
      <header className="space-y-6 mb-8">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {article.article_categories?.map((ac: any, idx: number) => (
            <Badge key={idx} variant="secondary">
              {ac.categories?.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-muted-foreground">{article.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-y">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={article.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                {article.profiles?.display_name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {article.profiles?.display_name || "Admin"}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(article.published_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime} min de lecture
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <ArticleContent content={article.content} />

      {/* Comments Section */}
      <div className="mt-12">
        <CommentList
          articleId={article.id}
          initialComments={comments || []}
          currentUserId={user.id}
          isAdmin={profile?.role === "admin"}
        />
      </div>
    </article>
  );
}
