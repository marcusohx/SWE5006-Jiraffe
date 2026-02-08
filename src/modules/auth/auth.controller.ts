import NextAuth from "next-auth";
import { authOptions } from "@/modules/auth/auth.options";

export const authHandler = NextAuth(authOptions);
