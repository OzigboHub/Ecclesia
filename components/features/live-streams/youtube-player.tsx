"use client";

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      // /watch?v=VIDEO_ID
      const vParam = parsed.searchParams.get("v");
      if (vParam) return vParam;

      // /embed/VIDEO_ID
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("?")[0] || null;
      }

      // /live/VIDEO_ID
      if (parsed.pathname.startsWith("/live/")) {
        return parsed.pathname.split("/live/")[1]?.split("?")[0] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function YouTubePlayer({ url, title, className }: YouTubePlayerProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted p-8">
        <p className="text-sm text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${className || ""}`}
      style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=0&rel=0`}
        title={title || "Live Stream"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function YouTubeThumbnail({
  url,
  title,
}: {
  url: string;
  title?: string;
}) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground">No preview</p>
      </div>
    );
  }

  return (
    <img
      src={`https://img.youtube.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`}
      alt={title || "Stream thumbnail"}
      className="aspect-video w-full rounded-lg object-cover"
    />
  );
}
