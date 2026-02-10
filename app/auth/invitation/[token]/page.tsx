import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InvitationForm } from "@/components/auth/invitation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notFound } from "next/navigation";

export default async function InvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Find profile with this token
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, invitation_status, invitation_expires_at")
    .eq("invitation_token", params.token)
    .single() as {
    data: {
      email: string;
      invitation_status: string;
      invitation_expires_at: string | null;
    } | null;
    error: any;
  };

  if (error || !profile) {
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
  if (profile.invitation_status === "active") {
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
    profile.invitation_expires_at &&
    new Date(profile.invitation_expires_at) < new Date()
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

  return <InvitationForm token={params.token} email={profile.email} />;
}
