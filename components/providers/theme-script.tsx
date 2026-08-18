import { THEME_COOKIE } from "@/lib/theme";

/**
 * Stamps data-theme on <html> before first paint.
 *
 * This runs as a blocking inline script rather than reading the cookie in the
 * root layout on purpose: calling cookies() there would opt every route in the
 * app into dynamic rendering, including the static marketing pages. The script
 * is a few hundred bytes and runs ahead of any paint, so there is no flash.
 *
 * "system" (and no cookie at all) deliberately stamps nothing, leaving the
 * prefers-color-scheme block in globals.css in charge.
 */
export function ThemeScript() {
	const script = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);var v=m&&decodeURIComponent(m[1]);if(v==="dark"||v==="light"){document.documentElement.setAttribute("data-theme",v);}}catch(e){}})();`;

	return (
		<script
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: script }}
		/>
	);
}
