"use client";

import Link from "next/link";
import type { ClientSafeProvider } from "next-auth/react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

  useEffect(() => {
    let isMounted = true;
    getProviders()
      .then((result) => {
        if (isMounted) {
          setProviders(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProviders(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    if (error === "CredentialsSignin") {
      return "Invalid credentials. Try again.";
    }
    if (error === "Configuration") {
      return "GitHub sign-in is not configured. Set GITHUB_ID and GITHUB_SECRET or use credentials.";
    }
    return "Sign-in failed. Try again.";
  }, [error]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
    setIsLoading(false);
  };

  const hasGithubProvider = Boolean(providers?.github);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef5ff,transparent_55%),radial-gradient(circle_at_20%_20%,#fef2e2,transparent_45%)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold">Sign in to Jiraffe</h1>
          <p className="mt-2 text-muted">
            Track tickets, manage sprints, and keep teams aligned.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs uppercase text-muted">
                Email
                <Input
                  className="mt-2"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block text-xs uppercase text-muted">
                Password
                <Input
                  className="mt-2"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {hasGithubProvider ? (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                type="button"
              >
                Sign in with GitHub
              </Button>
            ) : (
              <p className="text-xs text-muted">GitHub sign-in is disabled.</p>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted">
          Need an account?{" "}
          <Link href="/signup" className="font-semibold text-foreground">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
