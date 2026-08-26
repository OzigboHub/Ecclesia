const CACHE_NAME = "ecclesia-v1";

const PRECACHE_ASSETS = ["/dashboard", "/offline"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// Skip Chrome extension and non-http(s) requests
	if (!request.url.startsWith("http")) return;

	const url = new URL(request.url);

	// In local development, always bypass service worker caching
	if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
		return;
	}

	// Skip API routes and auth routes — always go to network
	if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
		return;
	}

	// Network-first strategy for navigation requests
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const clone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(request, clone));
					return response;
				})
				.catch(() =>
					caches
						.match(request)
						.then((cached) => cached || caches.match("/offline")),
				),
		);
		return;
	}

	// Cache-first strategy for static assets
	if (
		request.destination === "image" ||
		request.destination === "font" ||
		request.destination === "style" ||
		request.destination === "script"
	) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						const clone = response.clone();
						caches
							.open(CACHE_NAME)
							.then((cache) => cache.put(request, clone));
						return response;
					}),
			),
		);
		return;
	}
});

self.addEventListener("push", (event) => {
	if (self.Notification && self.Notification.permission !== "granted") {
		return;
	}

	let data = {};
	if (event.data) {
		try {
			data = event.data.json();
		} catch {
			const text = event.data.text();
			data = {
				title: "New announcement",
				body: text,
				url: "/announcements",
			};
		}
	}

	const title = data.title || "New announcement";
	const options = {
		body: data.body || "A new announcement is available.",
		icon: data.imageUrl || "/icons/icon-192x192.png",
		badge: "/icons/icon-192x192.png",
		data: {
			url: data.url || "/announcements",
		},
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const targetUrl = event.notification?.data?.url || "/announcements";

	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientsArr) => {
				for (const client of clientsArr) {
					if ("focus" in client) {
						client.navigate(targetUrl);
						return client.focus();
					}
				}
				if (self.clients.openWindow) {
					return self.clients.openWindow(targetUrl);
				}
			}),
	);
});
