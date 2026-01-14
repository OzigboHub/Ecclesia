# Skill: Axios HTTP Client Usage

## Metadata

-   **ID**: `ecclesia.http.axios`
-   **Version**: 1.0.0
-   **Category**: HTTP/API
-   **Priority**: Medium

## Purpose

Use Axios for external API calls when needed. Configure interceptors, handle errors consistently, and implement proper typing for request/response.

## When to Use

-   Calling external third-party APIs
-   Complex HTTP configurations (interceptors, retry logic)
-   File uploads with progress tracking
-   When you need request/response transformation

## When NOT to Use

-   **Internal data fetching** — use Server Components with Prisma
-   **Server Actions** — call database directly
-   **Simple fetches** — native fetch is sufficient

## Axios Instance Configuration

```ts
// lib/axios.ts
import axios, {
	type AxiosInstance,
	type AxiosError,
	type InternalAxiosRequestConfig,
} from 'axios';

// Create configured instance
const api: AxiosInstance = axios.create({
	baseURL: process.env.EXTERNAL_API_URL,
	timeout: 30000, // 30 seconds
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor
api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Add auth token if available
		const token = process.env.EXTERNAL_API_KEY;
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// Response interceptor
api.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		// Log error for debugging
		console.error('API Error:', {
			url: error.config?.url,
			status: error.response?.status,
			message: error.message,
		});

		// Transform error for consistent handling
		if (error.response) {
			// Server responded with error status
			const message =
				(error.response.data as { message?: string })?.message ||
				'An error occurred';
			return Promise.reject(new Error(message));
		} else if (error.request) {
			// Request made but no response
			return Promise.reject(
				new Error('Network error. Please check your connection.')
			);
		} else {
			// Request setup error
			return Promise.reject(new Error('Failed to make request.'));
		}
	}
);

export default api;
```

## Type-Safe API Functions

```ts
// lib/api/sms.api.ts
import api from '@/lib/axios';

interface SendSMSRequest {
	to: string;
	message: string;
}

interface SendSMSResponse {
	id: string;
	status: 'sent' | 'queued' | 'failed';
	credits_used: number;
}

interface APIResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export async function sendSMS(
	data: SendSMSRequest
): Promise<APIResponse<SendSMSResponse>> {
	try {
		const response = await api.post<SendSMSResponse>('/sms/send', data);
		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			data: null as unknown as SendSMSResponse,
			message:
				error instanceof Error ? error.message : 'Failed to send SMS',
		};
	}
}

// Usage in Server Action
('use server');

import { sendSMS } from '@/lib/api/sms.api';

export async function notifyParishioner(
	parishionerId: string,
	message: string
) {
	const parishioner = await db.parishioner.findUnique({
		where: { id: parishionerId },
		select: { phone: true },
	});

	if (!parishioner?.phone) {
		return { success: false, message: 'No phone number on file' };
	}

	const result = await sendSMS({
		to: parishioner.phone,
		message,
	});

	return result;
}
```

## Payment Gateway Integration

```ts
// lib/api/paystack.api.ts
import api from '@/lib/axios';

const paystackApi = axios.create({
	baseURL: 'https://api.paystack.co',
	headers: {
		Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
		'Content-Type': 'application/json',
	},
});

interface InitializePaymentRequest {
	email: string;
	amount: number; // In kobo (NGN * 100)
	reference: string;
	callback_url: string;
	metadata?: Record<string, unknown>;
}

interface PaystackResponse<T> {
	status: boolean;
	message: string;
	data: T;
}

interface InitializePaymentData {
	authorization_url: string;
	access_code: string;
	reference: string;
}

export async function initializePayment(
	data: InitializePaymentRequest
): Promise<PaystackResponse<InitializePaymentData>> {
	const response = await paystackApi.post<
		PaystackResponse<InitializePaymentData>
	>('/transaction/initialize', data);
	return response.data;
}

export async function verifyPayment(reference: string): Promise<
	PaystackResponse<{
		status: string;
		amount: number;
		currency: string;
	}>
> {
	const response = await paystackApi.get(`/transaction/verify/${reference}`);
	return response.data;
}
```

## File Upload with Progress

```ts
// lib/api/upload.api.ts
import axios from 'axios';

interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export async function uploadFile(
	file: File,
	onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; url?: string; message?: string }> {
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await axios.post<{ url: string }>(
			'/api/upload',
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				onUploadProgress: (progressEvent) => {
					if (progressEvent.total && onProgress) {
						const percentage = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
						onProgress({
							loaded: progressEvent.loaded,
							total: progressEvent.total,
							percentage,
						});
					}
				},
			}
		);

		return {
			success: true,
			url: response.data.url,
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Upload failed',
		};
	}
}

// Usage in component
('use client');

import { uploadFile } from '@/lib/api/upload.api';

export function FileUploader() {
	const [progress, setProgress] = useState(0);
	const [uploading, setUploading] = useState(false);

	const handleUpload = async (file: File) => {
		setUploading(true);
		setProgress(0);

		const result = await uploadFile(file, (p) => {
			setProgress(p.percentage);
		});

		setUploading(false);

		if (result.success) {
			toast.success('File uploaded successfully');
		} else {
			toast.error(result.message);
		}
	};

	return (
		<div>
			<input
				type='file'
				onChange={(e) =>
					e.target.files?.[0] && handleUpload(e.target.files[0])
				}
			/>
			{uploading && (
				<div className='mt-2'>
					<Progress value={progress} />
					<span className='text-sm text-muted-foreground'>
						{progress}%
					</span>
				</div>
			)}
		</div>
	);
}
```

## Retry Logic

```ts
// lib/api/with-retry.ts
import axios, { type AxiosError } from 'axios';

interface RetryConfig {
	retries: number;
	delay: number;
	shouldRetry?: (error: AxiosError) => boolean;
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	config: RetryConfig = { retries: 3, delay: 1000 }
): Promise<T> {
	const { retries, delay, shouldRetry } = config;

	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			// Check if we should retry
			if (shouldRetry && !shouldRetry(error as AxiosError)) {
				throw error;
			}

			// Don't wait on last attempt
			if (attempt < retries) {
				await new Promise((resolve) =>
					setTimeout(resolve, delay * (attempt + 1))
				);
			}
		}
	}

	throw lastError;
}

// Usage
const data = await withRetry(() => api.get('/unreliable-endpoint'), {
	retries: 3,
	delay: 1000,
	shouldRetry: (error) => {
		// Only retry on network errors or 5xx
		return !error.response || error.response.status >= 500;
	},
});
```

## Cancel Requests

```ts
// Useful for search/autocomplete that may have stale requests
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export function SearchWithCancel() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const cancelTokenRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (!query) {
			setResults([]);
			return;
		}

		// Cancel previous request
		if (cancelTokenRef.current) {
			cancelTokenRef.current.abort();
		}

		// Create new abort controller
		cancelTokenRef.current = new AbortController();

		const fetchResults = async () => {
			try {
				const response = await axios.get('/api/search', {
					params: { q: query },
					signal: cancelTokenRef.current?.signal,
				});
				setResults(response.data);
			} catch (error) {
				if (axios.isCancel(error)) {
					// Request was cancelled, ignore
					return;
				}
				console.error('Search error:', error);
			}
		};

		const debounceTimer = setTimeout(fetchResults, 300);

		return () => {
			clearTimeout(debounceTimer);
		};
	}, [query]);

	return (
		<div>
			<Input
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder='Search...'
			/>
			{/* Render results */}
		</div>
	);
}
```

## Error Handling Pattern

```ts
// Consistent error handling for API calls
export async function apiCall<T>(
	fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
	try {
		const data = await fn();
		return { success: true, data };
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const message =
				error.response?.data?.message ||
				error.message ||
				'An error occurred';
			return { success: false, error: message };
		}
		return { success: false, error: 'An unexpected error occurred' };
	}
}

// Usage
const result = await apiCall(() => api.get('/users'));

if (result.success) {
	console.log(result.data);
} else {
	toast.error(result.error);
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Using Axios for internal data
'use client'
useEffect(() => {
  axios.get('/api/parishioners').then(...)  // Don't do this!
}, [])

// ✅ CORRECT: Use Server Component
export default async function Page() {
  const parishioners = await db.parishioner.findMany()
}

// ❌ WRONG: No error handling
const response = await api.get('/endpoint')
return response.data  // What if it fails?

// ✅ CORRECT: Proper error handling
try {
  const response = await api.get('/endpoint')
  return { success: true, data: response.data }
} catch (error) {
  return { success: false, message: 'Failed to fetch data' }
}

// ❌ WRONG: Hardcoded API keys in code
axios.create({
  headers: { Authorization: 'sk_live_abc123' }  // Never!
})

// ✅ CORRECT: Use environment variables
axios.create({
  headers: { Authorization: `Bearer ${process.env.API_KEY}` }
})

// ❌ WRONG: Not typing responses
const { data } = await api.get('/users')
// data is 'any'

// ✅ CORRECT: Type the response
const { data } = await api.get<User[]>('/users')
// data is User[]
```

## When to Use Native Fetch Instead

```tsx
// For simple Server Component fetches, native fetch is fine
export default async function Page() {
	// Next.js extends fetch with caching
	const res = await fetch('https://api.example.com/data', {
		next: { revalidate: 3600 }, // Cache for 1 hour
	});
	const data = await res.json();

	return <div>{/* render data */}</div>;
}

// Use Axios when you need:
// - Request/response interceptors
// - Progress tracking
// - Automatic request cancellation
// - Complex retry logic
// - Request transformation
```

## Testing Checklist

-   [ ] Axios instance configured with base URL
-   [ ] Interceptors handle auth and errors
-   [ ] Responses are properly typed
-   [ ] Errors handled consistently
-   [ ] No API keys in code (use env vars)
-   [ ] Timeouts configured
-   [ ] Cancel logic for user-initiated requests

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.components.server_components`
-   `ecclesia.feedback.error_handling`

## References

-   [Axios Documentation](https://axios-http.com/docs/intro)
-   [lib/axios.ts](../../lib/axios.ts)
