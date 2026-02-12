"use client";

import { useState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function LoginForm({ error }: { error?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setFormError(undefined);

    const result = await login(formData);

    if (result?.error) {
      setFormError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>
              {formError === "account_disabled"
                ? "Votre compte a été désactivé."
                : formError}
            </AlertDescription>
          </Alert>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nom@exemple.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Vous avez un code d'invitation ?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
