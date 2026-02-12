import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/invitation", "/auth/callback", "/auth/signup"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Special paths for invitation flow - accessible with auth but shouldn't redirect
  const invitationFlowPaths = ["/api/auth/callback", "/auth/complete-profile", "/auth/callback"];
  const isInvitationFlow = invitationFlowPaths.some((path) => pathname.startsWith(path));

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicPath && !isInvitationFlow) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth pages (but not invitation flow)
  if (user && isPublicPath && !isInvitationFlow) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Skip status check for invitation flow paths
  if (isInvitationFlow) {
    return supabaseResponse;
  }

  // Check admin access for /admin routes
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, invitation_status")
      .eq("id", user.id)
      .single() as any;

    if (profile?.role !== "admin" || profile?.invitation_status !== "active") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Check if user is active for all authenticated routes
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("invitation_status")
      .eq("id", user.id)
      .single() as any;

    if (profile?.invitation_status !== "active") {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("error", "account_disabled");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
