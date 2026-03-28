import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}
	return <>{children}</>;
}
