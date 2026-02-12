"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import { Reply, Trash2, Loader2 } from "lucide-react";
import { CommentForm } from "./comment-form";
import { deleteComment } from "@/lib/actions/comments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
  articleId: string;
  depth?: number;
  onCommentDeleted?: () => void;
}

export function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  articleId,
  depth = 0,
  onCommentDeleted,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = isAdmin || comment.user.id === currentUserId;
  const maxDepth = 3; // Limite la profondeur des réponses

  async function handleDelete() {
    setIsDeleting(true);

    const result = await deleteComment(comment.id);

    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Commentaire supprimé");
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    }
  }

  return (
    <div className={depth === 1 ? "md:ml-12 lg:ml-16 xl:ml-20 mt-4 max-w-full" : depth > 1 ? "mt-4 max-w-full" : "mt-6 max-w-full"}>
      <div className="flex gap-3 max-w-full overflow-hidden">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.user.avatar_url || undefined} />
          <AvatarFallback>
            {comment.user.display_name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {comment.user.display_name}
            </span>
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatRelativeDate(comment.created_at)}
            </span>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
            {comment.content}
          </p>

          <div className="flex items-center gap-2">
            {depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-8 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Répondre
              </Button>
            )}

            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer le commentaire</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette
                      action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isReplying && (
            <div className="mt-4">
              <CommentForm
                articleId={articleId}
                parentId={comment.id}
                placeholder={`Répondre à ${comment.user.display_name}...`}
                onSuccess={() => {
                  setIsReplying(false);
                  if (onCommentDeleted) {
                    onCommentDeleted(); // Recharger les commentaires
                  }
                }}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  articleId={articleId}
                  depth={depth + 1}
                  onCommentDeleted={onCommentDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
