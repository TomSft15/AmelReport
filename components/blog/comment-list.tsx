"use client";

import { useEffect, useState } from "react";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentListProps {
  articleId: string;
  initialComments: Comment[];
  currentUserId: string;
  isAdmin: boolean;
}

export function CommentList({
  articleId,
  initialComments,
  currentUserId,
  isAdmin,
}: CommentListProps) {
  const [comments, setComments] = useState(initialComments);
  const [refreshKey, setRefreshKey] = useState(0);

  // Organiser les commentaires en arbre (parent/enfants)
  const organizeComments = (allComments: Comment[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // Créer une map de tous les commentaires
    allComments.forEach((comment) => {
      commentMap.set(comment.id, {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: comment.user_id,
          display_name: comment.profiles.display_name,
          avatar_url: comment.profiles.avatar_url,
        },
        replies: [],
      });
    });

    // Organiser en arbre
    allComments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const organizedComments = organizeComments(comments);

  const handleCommentChange = () => {
    // Forcer le rechargement de la page pour obtenir les nouveaux commentaires
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <Separator />

      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Commentaires ({comments.length})
        </h2>

        {/* Comment Form */}
        <div className="mb-8">
          <CommentForm
            articleId={articleId}
            onSuccess={handleCommentChange}
          />
        </div>

        {/* Comments List */}
        {organizedComments.length > 0 ? (
          <div className="space-y-6">
            {organizedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                articleId={articleId}
                onCommentDeleted={handleCommentChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm">Soyez le premier à commenter !</p>
          </div>
        )}
      </div>
    </div>
  );
}
