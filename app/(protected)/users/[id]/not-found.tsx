import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { UserX, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function UserNotFound() {
	return (
		<div className='flex min-h-[50vh] items-center justify-center'>
			<Card className='max-w-md text-center'>
				<CardHeader>
					<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
						<UserX className='h-8 w-8 text-muted-foreground' />
					</div>
					<CardTitle className='text-2xl'>User Not Found</CardTitle>
					<CardDescription>
						The user you are looking for does not exist or has been
						removed from the system.
					</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button
						variant='outline'
						asChild
					>
						<Link href='/users'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Users
						</Link>
					</Button>
					<Button asChild>
						<Link href='/users/new'>
							<Users className='mr-2 h-4 w-4' />
							Add New User
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
