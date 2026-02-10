"use client";

import { useState } from "react";
import { inviteUser } from "@/lib/actions/users";
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
import { UserPlus, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function UserInviteModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [invitationUrl, setInvitationUrl] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    setInvitationUrl(undefined);

    const result = await inviteUser(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success && result?.invitationUrl) {
      setInvitationUrl(result.invitationUrl);
      setIsLoading(false);
      toast.success("Invitation envoyée avec succès !");
    }
  }

  function handleCopy() {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset state after a small delay to avoid flickering
    setTimeout(() => {
      setError(undefined);
      setInvitationUrl(undefined);
      setCopied(false);
    }, 200);
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    // Reset state when closing the dialog
    if (!newOpen) {
      setTimeout(() => {
        setError(undefined);
        setInvitationUrl(undefined);
        setCopied(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour donner accès au blog.
          </DialogDescription>
        </DialogHeader>

        {!invitationUrl ? (
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ami@exemple.com"
                required
                disabled={isLoading}
              />
            </div>

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
                {isLoading ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Invitation créée avec succès ! Partagez ce lien avec la personne invitée :
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Input
                value={invitationUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Ce lien expire dans 7 jours. L'invitation a également été envoyée par email.
            </p>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
