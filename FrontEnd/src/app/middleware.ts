export { auth as middleware } from "@/auth"
// This matcher configures which routes the middleware should protect.
// It's a regex that says "protect everything except the API routes, static files, and the sign-in page itself."
export const config = {
    matcher: [
        /*
         * Match all paths except those that start with:
         * - /api (API routes)
         * - /_next/static (static files)
         * - /_next/image (image optimization files)
         * - /favicon.ico (favicon file)
         * - /sign-in (the sign-in page)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|signin|signup).*)",
        // "/",  // Protect the profile route and its sub-paths,
        // "/profile",  // Protect the profile route and its sub-paths,
        // "/profile/:path*"  // Protect the profile route and its sub-paths,
    ],

};