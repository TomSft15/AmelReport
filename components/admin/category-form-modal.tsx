"use client";

import { useState, useEffect } from "react";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils";

interface CategoryFormModalProps {
  mode: "create" | "edit";
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  trigger?: React.ReactNode;
}

export function CategoryFormModal({ mode, category, trigger }: CategoryFormModalProps) {
  const [open, setOpen] = useState(false);

  // Auto-open modal when mounted without trigger (edit mode from dropdown)
  useEffect(() => {
    if (!trigger && mode === "edit") {
      setOpen(true);
    }
  }, [trigger, mode]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [name, setName] = useState(category?.name || "");
  const [previewSlug, setPreviewSlug] = useState(category?.slug || "");

  useEffect(() => {
    if (name) {
      setPreviewSlug(generateSlug(name));
    } else {
      setPreviewSlug("");
    }
  }, [name]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);

    const result =
      mode === "create"
        ? await createCategory(formData)
        : await updateCategory(category!.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      toast.success(
        mode === "create"
          ? "Catégorie créée avec succès !"
          : "Catégorie mise à jour avec succès !"
      );
      setOpen(false);
      setName("");
      setPreviewSlug("");
      setIsLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setError(undefined);
    setName(category?.name || "");
    setPreviewSlug(category?.slug || "");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {mode === "create" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Créez une nouvelle catégorie pour organiser vos articles."
              : "Modifiez les informations de la catégorie."}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Technologie"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              minLength={2}
              maxLength={50}
            />
          </div>

          {previewSlug && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Slug (URL)</Label>
              <div className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
                {previewSlug}
              </div>
              <p className="text-xs text-muted-foreground">
                Le slug est généré automatiquement à partir du nom
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Chargement..."
                : mode === "create"
                ? "Créer"
                : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
