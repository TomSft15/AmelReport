import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentDeleteButton } from "@/components/admin/comment-delete-button";
import { formatRelativeDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface CommentsPageProps {
  searchParams: Promise<{ article?: string }>;
}

export default async function CommentsPage({ searchParams }: CommentsPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Build query
  let query = supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      profiles!comments_user_id_fkey (
        display_name,
        avatar_url
      ),
      articles!comments_article_id_fkey (
        id,
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  // Filter by article if specified
  if (params.article) {
    query = query.eq("article_id", params.article);
  }

  const { data: comments } = (await query) as any;

  // Get all articles for the filter dropdown
  const { data: articles } = (await supabase
    .from("articles")
    .select("id, title")
    .order("title", { ascending: true })) as any;

  // Check if comment is new (< 24h)
  const isNew = (createdAt: string) => {
    const commentDate = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Truncate content
  const truncate = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commentaires</h1>
        <p className="text-muted-foreground">
          Modérez les commentaires des articles
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des commentaires</CardTitle>
              <CardDescription>
                {comments?.length || 0} commentaire(s) au total
              </CardDescription>
            </div>
            <div className="w-[250px]">
              <Select defaultValue={params.article || "all"}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par article" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <Link href="/admin/comments">Tous les articles</Link>
                  </SelectItem>
                  {articles?.map((article: any) => (
                    <SelectItem key={article.id} value={article.id}>
                      <Link href={`/admin/comments?article=${article.id}`}>
                        {article.title}
                      </Link>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {comments && comments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment: any) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles?.display_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {comment.profiles?.display_name || "Utilisateur"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/articles/${comment.articles?.slug}`}
                        className="text-primary hover:underline"
                      >
                        {comment.articles?.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isNew(comment.created_at) && (
                          <Badge variant="default" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {truncate(comment.content)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeDate(comment.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <CommentDeleteButton commentId={comment.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun commentaire</h3>
              <p className="text-sm text-muted-foreground">
                {params.article
                  ? "Aucun commentaire pour cet article"
                  : "Les commentaires apparaîtront ici"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
