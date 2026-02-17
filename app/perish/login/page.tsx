import { redirect } from 'next/navigation';

/**
 * Typo alias: /perish/login -> /auth/login
 * "Perish" is a common misspelling of "parish".
 */
export default function PerishLoginPage() {
  redirect('/auth/login');
}
