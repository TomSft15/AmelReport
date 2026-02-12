"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatus, resendInvitation, deleteInvitation } from "@/lib/actions/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Ban, CheckCircle, Mail, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  email: string;
  status: string;
  isCurrentUser: boolean;
}

export function UserActions({ userId, email, status, isCurrentUser }: UserActionsProps) {
  const router = useRouter();
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDeleteInvitation() {
    setIsLoading(true);
    const result = await deleteInvitation(userId);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Invitation supprimée avec succès");
      setShowDeleteDialog(false);
      router.refresh();
    }
  }

  async function handleToggleStatus() {
    setIsLoading(true);
    const result = await toggleUserStatus(userId);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(
        status === "active" ? "Utilisateur désactivé" : "Utilisateur activé"
      );
    }

    setIsLoading(false);
    setShowToggleDialog(false);
  }

  async function handleResendInvitation() {
    setIsLoading(true);
    const result = await resendInvitation(userId);

    if (result?.error) {
      toast.error(result.error);
    } else if (result?.code && result?.signupUrl) {
      const invitationText = `Code d'invitation : ${result.code}\n\nLien d'inscription : ${result.signupUrl}\n\nValable 7 jours`;

      try {
        await navigator.clipboard.writeText(invitationText);
        toast.success("Code d'invitation copié !");
      } catch (err) {
        // Fallback pour navigateurs sans permission clipboard
        const textarea = document.createElement('textarea');
        textarea.value = invitationText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          toast.success("Code d'invitation copié !");
        } catch (fallbackErr) {
          toast.error("Impossible de copier le code");
        }
        document.body.removeChild(textarea);
      }
    }

    setIsLoading(false);
  }

  if (isCurrentUser) {
    return <span className="text-muted-foreground text-sm">Vous</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {status === "pending" && (
            <>
              <DropdownMenuItem onClick={handleResendInvitation} disabled={isLoading}>
                <Copy className="mr-2 h-4 w-4" />
                {isLoading ? "Copie..." : "Copier le code"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer l'invitation
              </DropdownMenuItem>
            </>
          )}

          {status !== "pending" && (
            <DropdownMenuItem
              onClick={() => setShowToggleDialog(true)}
              className={status === "active" ? "text-destructive" : ""}
            >
              {status === "active" ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {status === "active" ? "Désactiver" : "Activer"} cet utilisateur ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === "active" ? (
                <>
                  <strong>{email}</strong> ne pourra plus se connecter au blog.
                  Vous pourrez le réactiver à tout moment.
                </>
              ) : (
                <>
                  <strong>{email}</strong> pourra à nouveau se connecter au blog.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'invitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'invitation pour{" "}
              <strong>{email}</strong> ?
              <br />
              <br />
              Le code ne fonctionnera plus et cette personne ne
              pourra pas créer de compte avec ce code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteInvitation();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
