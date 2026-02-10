import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/invitation"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth pages
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("invitation_status")
      .eq("id", user.id)
      .single() as any;

    // DEBUG LOG
    console.log("🔍 Middleware check:", {
      userId: user.id,
      userEmail: user.email,
      profile,
      profileError,
      invitation_status: profile?.invitation_status,
    });

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
