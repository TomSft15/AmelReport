import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/blog/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = (await supabase
    .from("profiles")
    .select("display_name, avatar_url, created_at, invitation_status")
    .eq("id", user.id)
    .single()) as any;

  if (!profile || profile.invitation_status !== "active") {
    redirect("/auth/login");
  }

  // Get user's comments with article info
  const { data: comments } = (await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      articles!comments_article_id_fkey (
        title,
        slug
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)) as any;

  // Get total comments count
  const { count: totalComments } = (await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)) as any;

  // Truncate comment content
  const truncate = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight break-words">Mon Profil</h1>
        <p className="text-muted-foreground break-words">
          Gérez vos informations personnelles et votre activité
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-full">
        {/* Statistics */}
        <div className="space-y-6 max-w-full overflow-hidden">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membre depuis</p>
                  <p className="font-semibold">{formatDate(profile.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commentaires</p>
                  <p className="font-semibold">{totalComments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Commentaires récents</CardTitle>
              <CardDescription>Vos 10 derniers commentaires</CardDescription>
            </CardHeader>
            <CardContent className="max-w-full overflow-hidden">
              {comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="space-y-2 pb-4 border-b last:border-0 max-w-full overflow-hidden">
                      <Link
                        href={`/articles/${comment.articles?.slug}`}
                        className="text-sm font-medium hover:underline break-words block"
                      >
                        {comment.articles?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground break-words">
                        {truncate(comment.content, 80)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(comment.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun commentaire</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 max-w-full overflow-hidden">
          <ProfileForm
            user={{
              email: user.email!,
              displayName: profile.display_name || "Utilisateur",
              avatarUrl: profile.avatar_url,
            }}
          />
        </div>
      </div>
    </div>
  );
}
