"use client";

import { useState } from "react";
import { createArticle, updateArticle } from "@/lib/actions/articles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/admin/image-upload";
import { CategorySelector } from "@/components/admin/category-selector";
import { ArticleEditor } from "@/components/admin/article-editor";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ArticleFormProps {
  mode: "create" | "edit";
  categories: Array<{ id: string; name: string }>;
  article?: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    cover_image_url: string | null;
    status: "draft" | "published";
    categoryIds: string[];
  };
}

export function ArticleForm({ mode, categories, article }: ArticleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Form state
  const [title, setTitle] = useState(article?.title || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [coverImageUrl, setCoverImageUrl] = useState(article?.cover_image_url || "");
  const [content, setContent] = useState(article?.content || "");
  const [categoryIds, setCategoryIds] = useState<string[]>(article?.categoryIds || []);

  async function handleSubmit(status: "draft" | "published") {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    // Calculer la taille approximative des données
    const dataSize = new Blob([
      title,
      content,
      excerpt || "",
      coverImageUrl || "",
      JSON.stringify(categoryIds),
    ]).size;

    // Vérifier si les données dépassent 4.5MB (marge de sécurité)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB en bytes
    if (dataSize > maxSize) {
      const sizeInMB = (dataSize / (1024 * 1024)).toFixed(2);
      toast.error(
        `Votre article est trop volumineux (${sizeInMB} MB). ` +
        `La limite est de 5 MB. Veuillez réduire la taille de votre contenu ou utiliser des liens pour les grandes images.`
      );
      return;
    }

    setIsLoading(true);
    setError(undefined);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("excerpt", excerpt);
    formData.append("coverImageUrl", coverImageUrl);
    formData.append("status", status);
    formData.append("categoryIds", JSON.stringify(categoryIds));

    try {
      const result =
        mode === "create"
          ? await createArticle(formData)
          : await updateArticle(article!.id, formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success(
          status === "published"
            ? "Article publié avec succès !"
            : "Brouillon sauvegardé avec succès !"
        );
        // Redirect handled by server action
      }
    } catch (error: any) {
      // Ignorer les erreurs de redirection Next.js (comportement normal)
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        return;
      }

      setIsLoading(false);
      const errorMessage =
        error.message?.includes("Body exceeded") || error.message?.includes("1mb")
          ? "Votre article est trop volumineux (plus de 5 MB). Veuillez réduire la taille du contenu ou utiliser des liens pour les images."
          : "Une erreur est survenue lors de la sauvegarde de l'article.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Nouvel article" : "Modifier l'article"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Créez un nouveau billet de blog"
                : "Modifiez votre article"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Sauvegarde..." : "Sauvegarder brouillon"}
          </Button>
          <Button onClick={() => handleSubmit("published")} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Publication..." : "Publier"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Mon super article..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait (optionnel)</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Courte description de l'article (max 300 caractères)..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  disabled={isLoading}
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {excerpt.length}/300
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contenu *</Label>
                <ArticleEditor content={content} onChange={setContent} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Image de couverture</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                onRemove={() => setCoverImageUrl("")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategorySelector
                categories={categories}
                selectedIds={categoryIds}
                onChange={setCategoryIds}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
