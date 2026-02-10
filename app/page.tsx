import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  // If admin, redirect to admin dashboard
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  // Otherwise, show public homepage (will be implemented in Phase 9)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Blog d'Amel</h1>
      <p className="text-muted-foreground">Interface publique en cours de développement...</p>
    </main>
  );
}
