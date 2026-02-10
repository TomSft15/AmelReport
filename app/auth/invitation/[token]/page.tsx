import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InvitationForm } from "@/components/auth/invitation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notFound } from "next/navigation";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  // Find invitation with this token
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("email, status, expires_at")
    .eq("token", token)
    .single() as {
    data: {
      email: string;
      status: string;
      expires_at: string;
    } | null;
    error: any;
  };

  if (error || !invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Invitation invalide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Cette invitation n'existe pas ou a été révoquée.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check if already accepted
  if (invitation.status === "accepted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Invitation déjà acceptée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Cette invitation a déjà été acceptée. Vous pouvez vous connecter avec votre
              compte.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check if expired
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date()
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Invitation expirée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Cette invitation a expiré. Veuillez contacter l'administrateur pour en
              recevoir une nouvelle.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return <InvitationForm token={token} email={invitation.email} />;
}
