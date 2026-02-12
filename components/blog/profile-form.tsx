"use client";

import { useState, useRef } from "react";
import { updateProfile, uploadAvatar, changePassword } from "@/lib/actions/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: {
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoadingProfile(true);

    const formData = new FormData();
    formData.append("displayName", displayName);

    const result = await updateProfile(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoadingProfile(false);
    } else {
      toast.success("Profil mis à jour avec succès");
      setIsLoadingProfile(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingAvatar(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoadingAvatar(false);
    } else {
      toast.success("Avatar mis à jour avec succès");
      if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
      }
      setIsLoadingAvatar(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setIsLoadingPassword(true);

    const formData = new FormData();
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const result = await changePassword(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoadingPassword(false);
    } else {
      toast.success("Mot de passe changé avec succès");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoadingPassword(false);
    }
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Avatar Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Changez votre photo de profil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-full">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="w-full sm:w-auto text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isLoadingAvatar}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingAvatar}
              >
                {isLoadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Changer l&apos;avatar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 break-words">
                JPEG, PNG, WebP ou GIF (max 2 MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
          <CardDescription>Modifiez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="max-w-full">
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-full">
            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="displayName">Nom d&apos;affichage</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                maxLength={50}
                disabled={isLoadingProfile}
              />
            </div>

            <Button type="submit" disabled={isLoadingProfile}>
              {isLoadingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>
            Assurez-vous d&apos;utiliser un mot de passe fort
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-full">
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-full">
            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                disabled={isLoadingPassword}
              />
            </div>

            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                disabled={isLoadingPassword}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoadingPassword || !newPassword || !confirmPassword}
            >
              {isLoadingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changement...
                </>
              ) : (
                "Changer le mot de passe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
