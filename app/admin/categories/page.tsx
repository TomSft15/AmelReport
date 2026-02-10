import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryFormModal } from "@/components/admin/category-form-modal";
import { CategoryActions } from "@/components/admin/category-actions";

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient();

  // Get all categories with article count
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      id,
      name,
      slug,
      created_at,
      article_categories(count)
    `)
    .order("name", { ascending: true }) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            Organisez vos articles par catégories
          </p>
        </div>
        <CategoryFormModal mode="create" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>
            {categories?.length || 0} catégorie(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories && categories.length > 0 ? (
                categories.map((category: any) => {
                  const articleCount = category.article_categories?.[0]?.count || 0;

                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {articleCount} article{articleCount !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <CategoryActions
                          category={{
                            id: category.id,
                            name: category.name,
                            slug: category.slug,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucune catégorie. Créez-en une pour commencer !
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
