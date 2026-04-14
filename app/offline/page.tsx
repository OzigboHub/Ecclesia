"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">Offline</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You are currently offline. Please check your internet connection and
          try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90">
          Try Again
        </button>
      </div>
    </div>
  );
}
