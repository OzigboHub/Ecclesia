import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { GlobalActionsContent } from './global-actions-content';

export default async function GlobalActionsPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	return <GlobalActionsContent />;
}
