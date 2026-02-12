import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if this is an invitation callback
      // Token can come from query params OR user metadata
      const invitationToken = token || user?.user_metadata?.invitation_token;

      if (invitationToken && user && user.email) {
        // Verify the invitation token exists and is valid
        const { data: invitation } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", invitationToken)
          .eq("email", user.email)
          .single() as any;

        // Check if invitation needs completion (pending or user_created)
        if (invitation && (invitation.status === "pending" || invitation.status === "user_created")) {
          // Check if not expired
          if (new Date(invitation.expires_at) > new Date()) {
            // Redirect to profile completion page with token
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";

            const redirectUrl = `/auth/complete-profile?token=${invitationToken}`;

            if (isLocalEnv) {
              return NextResponse.redirect(`http://localhost:3000${redirectUrl}`);
            } else if (forwardedHost) {
              return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`);
            } else {
              return NextResponse.redirect(new URL(redirectUrl, request.url));
            }
          } else {
            // Mark invitation as expired
            await supabase
              .from("invitations")
              // @ts-ignore
              .update({ status: "expired" })
              .eq("id", invitation.id);

            return NextResponse.redirect(
              new URL("/auth/login?error=invitation_expired", request.url)
            );
          }
        }
      }

      // Regular login - update last login
      if (user) {
        await supabase
          .from("profiles")
          // @ts-ignore - Supabase types issue with update
          .update({
            last_login_at: new Date().toISOString()
          })
          .eq("id", user.id);
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
