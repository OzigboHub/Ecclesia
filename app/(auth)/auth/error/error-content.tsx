"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; description: string }> =
    {
      CredentialsSignin: {
        title: "Invalid Email or Password",
        description:
          "The email or password you entered is incorrect. Please try again.",
      },
      AccessDenied: {
        title: "Access Denied",
        description:
          "Your account is not active or you do not have permission to access this resource.",
      },
      Callback: {
        title: "Callback Error",
        description:
          "There was an error during the authentication process. Please try again.",
      },
      OAuthSignin: {
        title: "OAuth Sign In Error",
        description:
          "There was an error connecting to the authentication provider. Please try again.",
      },
      OAuthCallback: {
        title: "OAuth Callback Error",
        description:
          "There was an error processing your authentication. Please try again.",
      },
      OAuthCreateAccount: {
        title: "OAuth Account Creation Error",
        description:
          "Could not create an account with the OAuth provider. Please try a different method.",
      },
      EmailCreateAccount: {
        title: "Email Account Creation Error",
        description:
          "Could not create an account with this email. Please try again.",
      },
      EmailSignInError: {
        title: "Email Sign In Error",
        description:
          "There was an error sending the sign in email. Please try again.",
      },
      SessionCallback: {
        title: "Session Error",
        description:
          "There was an error creating your session. Please try signing in again.",
      },
      SignoutCallback: {
        title: "Sign Out Error",
        description: "There was an error signing you out. Please try again.",
      },
    };

  const errorInfo = errorMessages[error as keyof typeof errorMessages] || {
    title: "Authentication Error",
    description:
      "An unexpected error occurred during authentication. Please try again.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8">
          {/* Error Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold mb-2 text-center">
            {errorInfo.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-center mb-6">
            {errorInfo.description}
          </p>

          {/* Error Code (if specific error) */}
          {error && (
            <div className="mb-6 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Error Code: <span className="font-mono">{error}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-muted-foreground text-center">
            If the problem persists, please contact your parish administrator
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
