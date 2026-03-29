/**
 * YouTube Data API v3 utilities for checking video live broadcast status.
 * Requires a YOUTUBE_API_KEY environment variable (server-side only).
 *
 * Docs: https://developers.google.com/youtube/v3/docs/videos/list
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export type YouTubeLiveStatus = "live" | "upcoming" | "none";

export interface YouTubeVideoStatus {
  videoId: string;
  liveBroadcastContent: YouTubeLiveStatus;
  actualStartTime: string | null;
  actualEndTime: string | null;
  title: string | null;
}

/**
 * Extract a YouTube video ID from various URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      const vParam = parsed.searchParams.get("v");
      if (vParam) return vParam;

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("?")[0] || null;
      }

      if (parsed.pathname.startsWith("/live/")) {
        return parsed.pathname.split("/live/")[1]?.split("?")[0] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch the live broadcast status of one or more YouTube videos.
 * Returns status for each video ID provided.
 * The API supports up to 50 IDs per request.
 */
export async function getYouTubeVideoStatuses(
  videoIds: string[],
): Promise<YouTubeVideoStatus[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn(
      "YOUTUBE_API_KEY not configured — skipping YouTube status check",
    );
    return [];
  }

  if (videoIds.length === 0) return [];

  // YouTube API allows max 50 IDs per request
  const batchSize = 50;
  const results: YouTubeVideoStatus[] = [];

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const ids = batch.join(",");

    const url = `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${encodeURIComponent(ids)}&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      next: { revalidate: 0 }, // no caching for live status
    });

    if (!response.ok) {
      console.error(
        `YouTube API error: ${response.status} ${response.statusText}`,
      );
      continue;
    }

    const data = await response.json();

    for (const item of data.items ?? []) {
      results.push({
        videoId: item.id,
        liveBroadcastContent:
          (item.snippet?.liveBroadcastContent as YouTubeLiveStatus) ?? "none",
        actualStartTime: item.liveStreamingDetails?.actualStartTime ?? null,
        actualEndTime: item.liveStreamingDetails?.actualEndTime ?? null,
        title: item.snippet?.title ?? null,
      });
    }
  }

  return results;
}

/**
 * Check a single YouTube video's live status.
 */
export async function getYouTubeVideoStatus(
  videoId: string,
): Promise<YouTubeVideoStatus | null> {
  const results = await getYouTubeVideoStatuses([videoId]);
  return results[0] ?? null;
}
