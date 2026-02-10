"use client";

import { useState } from "react";
import { toggleUserStatus, resendInvitation } from "@/lib/actions/users";
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
import { MoreVertical, Ban, CheckCircle, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  email: string;
  status: string;
  isCurrentUser: boolean;
}

export function UserActions({ userId, email, status, isCurrentUser }: UserActionsProps) {
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    } else if (result?.invitationUrl) {
      navigator.clipboard.writeText(result.invitationUrl);
      toast.success("Lien d'invitation copié !");
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
            <DropdownMenuItem onClick={handleResendInvitation}>
              <Mail className="mr-2 h-4 w-4" />
              Renvoyer l'invitation
            </DropdownMenuItem>
          )}

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
    </>
  );
}
