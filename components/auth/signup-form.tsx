"use client";

import { useState } from "react";
import { signupWithCode } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);

    const result = await signupWithCode(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Créer un compte
        </CardTitle>
        <CardDescription className="text-center">
          Utilisez votre code d'invitation pour créer votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(new FormData(e.currentTarget));
        }} className="space-y-4">
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="code">Code d'invitation</Label>
            <Input
              id="code"
              name="code"
              type="text"
              placeholder="ABC123"
              required
              disabled={isLoading}
              maxLength={6}
              className="uppercase"
            />
          </div>

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
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Votre nom"
              required
              disabled={isLoading}
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Au moins 8 caractères"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Répétez votre mot de passe"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Création du compte..." : "Créer mon compte"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
