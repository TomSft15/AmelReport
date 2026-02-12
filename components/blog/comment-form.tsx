"use client";

import { useState } from "react";
import { createComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentFormProps {
  articleId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  articleId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "Écrivez votre commentaire...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    setIsLoading(true);

    const result = await createComment(articleId, content, parentId);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Commentaire ajouté avec succès");
      setContent("");
      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={2000}
        disabled={isLoading}
        className="resize-none w-full break-words"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/2000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Publication..." : "Publier"}
          </Button>
        </div>
      </div>
    </form>
  );
}
