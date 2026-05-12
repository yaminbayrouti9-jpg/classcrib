import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/money/:path*",
    "/neighborhood/:path*",
    "/virtual-home/:path*",
    "/workspace/:path*",
  ],
};
