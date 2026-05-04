import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { env } from "@/lib/config";
import { parseCredentials } from "@/modules/auth/auth.dto";
import { authenticateWithPassword } from "@/modules/auth/auth.service";
import { findUserById } from "@/modules/user/user.repository";

type AuthRole = "user" | "admin";

function toAuthRole(role: unknown): AuthRole {
  return role === "admin" ? "admin" : "user";
}

const providers: NonNullable<NextAuthOptions["providers"]> = [];

if (env.GITHUB_ID && env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const parsed = parseCredentials(credentials);
        const user = await authenticateWithPassword(parsed.email, parsed.password);
        if (!user) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      } catch {
        return null;
      }
    },
  })
);

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = toAuthRole((user as { role?: AuthRole }).role);
        return token;
      }

      if (token.id) {
        const currentUser = await findUserById(token.id);
        token.role = toAuthRole(currentUser?.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = toAuthRole(token.role);
      }
      return session;
    },
  },
};
