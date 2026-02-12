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
import { UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function UserInviteModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string>("");
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [signupUrl, setSignupUrl] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    setSuccess(false);

    const email = formData.get("email") as string;
    const result = await inviteUser(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      setSuccess(true);
      setInvitedEmail(email);
      setInvitationCode(result.code || "");
      setSignupUrl(result.signupUrl || "");
      setIsLoading(false);
      toast.success("Code d'invitation créé !");
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset state after a small delay to avoid flickering
    setTimeout(() => {
      setError(undefined);
      setSuccess(false);
      setInvitedEmail("");
      setInvitationCode("");
      setSignupUrl("");
    }, 200);
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    // Reset state when closing the dialog
    if (!newOpen) {
      setTimeout(() => {
        setError(undefined);
        setSuccess(false);
        setInvitedEmail("");
        setInvitationCode("");
        setSignupUrl("");
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
          <DialogTitle>Créer un code d'invitation</DialogTitle>
          <DialogDescription>
            Générez un code pour permettre à quelqu'un de créer un compte.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2" suppressHydrationWarning>
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
                {isLoading ? "Création..." : "Créer le code"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Code créé avec succès pour <strong>{invitedEmail}</strong> !
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Code d'invitation :</p>
                <div className="inline-flex items-center gap-2 bg-background rounded-lg px-6 py-3 border-2 border-primary">
                  <span className="text-3xl font-bold font-mono tracking-widest">
                    {invitationCode}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Instructions :</p>
                <ol className="text-sm text-muted-foreground space-y-1 pl-5 list-decimal">
                  <li>Partagez le code <strong>{invitationCode}</strong></li>
                  <li>L'utilisateur entre le code dans le formulaire d'inscription</li>
                </ol>
                <p className="text-sm text-muted-foreground pt-2">
                  ⏱️ Le code expire dans 7 jours
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
