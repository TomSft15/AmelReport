import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Header } from "@/components/blog/header";
import { redirect } from "next/navigation";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    .select("display_name, avatar_url, role, invitation_status")
    .eq("id", user.id)
    .single()) as any;

  if (!profile || profile.invitation_status !== "active") {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={{
          email: user.email!,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          isAdmin: profile.role === "admin",
        }}
      />
      <main className="flex-1">
        <div className="container py-8">{children}</div>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Blog d&apos;Amel. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
