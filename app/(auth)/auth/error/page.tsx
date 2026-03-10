import { Suspense } from "react";
import { AuthErrorContent } from "./error-content";

function ErrorSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
            <div className="h-8 bg-muted rounded mx-auto w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<ErrorSkeleton />}>
      <AuthErrorContent />
    </Suspense>
  );
}
