import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user email exists in profiles
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("invitation_status")
          .eq("email", user.email)
          .single();

        // If profile doesn't exist or not invited, sign out
        if (!profile) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            new URL(
              "/auth/login?error=not_invited",
              request.url
            )
          );
        }

        // Update last login
        try {
          const { error: updateError } = await supabase
            .from("profiles")
            // @ts-ignore - Supabase types issue with update
            .update({
              last_login_at: new Date().toISOString()
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating last login:", updateError);
          }
        } catch (err) {
          console.error("Error updating last login:", err);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`http://localhost:3000${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(new URL(next, request.url));
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_error", request.url)
  );
}
