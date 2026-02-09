import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/board/:path*",
    "/settings/:path*",
    "/api/users/:path*",
    "/api/products/:path*",
    "/api/incidents/:path*",
  ],
};
