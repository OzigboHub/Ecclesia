import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1, // Run sequentially to prevent DB state collision across tests
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		reducedMotion: "reduce",
		actionTimeout: 10000,
		navigationTimeout: 15000,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile-chromium",
			use: {
				...devices["Pixel 5"],
				viewport: { width: 360, height: 800 },
				deviceScaleFactor: 2,
				isMobile: true,
				hasTouch: true,
			},
		},
	],
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000/feed",
		reuseExistingServer: true,
		timeout: 120 * 1000,
	},
});
