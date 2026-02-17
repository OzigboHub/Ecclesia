import { redirect } from 'next/navigation';

/**
 * Parish login alias: /parish/login -> /auth/login
 * Handles "parish login" (common wording) so users don't get 404.
 */
export default function ParishLoginPage() {
  redirect('/auth/login');
}
