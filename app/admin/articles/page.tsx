import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Build query
  let query = supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      status,
      published_at,
      created_at,
      profiles!articles_author_id_fkey(display_name),
      article_categories(
        categories(name)
      )
    `)
    .order("created_at", { ascending: false });

  // Filter by status
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Search by title
  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  const { data: articles } = await query as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gérez vos articles et publications
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel article
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des articles</CardTitle>
              <CardDescription>
                {articles?.length || 0} article(s) au total
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <Tabs defaultValue={params.status || "all"}>
                <TabsList>
                  <TabsTrigger value="all" asChild>
                    <Link href="/admin/articles?status=all">Tous</Link>
                  </TabsTrigger>
                  <TabsTrigger value="published" asChild>
                    <Link href="/admin/articles?status=published">Publiés</Link>
                  </TabsTrigger>
                  <TabsTrigger value="draft" asChild>
                    <Link href="/admin/articles?status=draft">Brouillons</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              className="pl-10"
              defaultValue={params.search}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catégories</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles && articles.length > 0 ? (
                articles.map((article: any) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={article.status === "published" ? "default" : "secondary"}
                      >
                        {article.status === "published" ? "Publié" : "Brouillon"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {article.article_categories?.map((ac: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {ac.categories?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{article.profiles?.display_name || "Admin"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(article.published_at || article.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/articles/edit/${article.id}`}>
                          Modifier
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun article trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
