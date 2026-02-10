import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commentaires</h1>
        <p className="text-muted-foreground">
          Modérez les commentaires des utilisateurs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des commentaires</CardTitle>
          <CardDescription>
            Cette fonctionnalité sera implémentée dans la Phase 8
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            La modération des commentaires sera disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
