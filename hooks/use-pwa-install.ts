"use client";

import { useEffect, useState } from "react";

export function usePwaInstall() {
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check if already installed
		if (window.matchMedia("(display-mode: standalone)").matches) {
			setIsInstalled(true);
			return;
		}

		const installedHandler = () => {
			setIsInstalled(true);
		};

		window.addEventListener("appinstalled", installedHandler);

		return () => {
			window.removeEventListener("appinstalled", installedHandler);
		};
	}, []);

	const install = async () => {
		// Browser-managed install prompt mode: no custom prompt object.
		return false;
	};

	return {
		canInstall: false,
		isInstalled,
		install,
	};
}
