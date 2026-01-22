'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressBarProvider() {
	return (
		<ProgressBar
			height="3px"
			color="#eab308"
			options={{ showSpinner: false }}
			shallowRouting
		/>
	);
}
