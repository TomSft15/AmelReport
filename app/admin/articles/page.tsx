import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ArticlesPage() {
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
          <CardTitle>Liste des articles</CardTitle>
          <CardDescription>
            Cette fonctionnalité sera implémentée dans la Phase 7
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            L'éditeur d'articles et la gestion des publications seront disponibles prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
