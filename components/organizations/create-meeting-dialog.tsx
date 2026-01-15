'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { createMeeting } from '@/app/actions/organizations';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export function CreateMeetingDialog({ organizationId, piousOrganizationId }: { organizationId: string, piousOrganizationId: string }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = () => {
        if (!title || !date || !time) {
            toast.error('Please fill in all required fields');
            return;
        }

        const startDateTime = new Date(`${date}T${time}`);
        // Default duration 1 hour
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        startTransition(async () => {
            try {
                await createMeeting(
                    organizationId,
                    piousOrganizationId,
                    title,
                    startDateTime,
                    endDateTime,
                    description,
                    location
                );
                toast.success('Meeting scheduled successfully');
                setOpen(false);
                setTitle('');
                setDate('');
                setTime('');
                setDescription('');
                setLocation('');
                router.refresh();
            } catch (error) {
                toast.error('Failed to schedule meeting');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Meeting</DialogTitle>
                    <DialogDescription>
                        Create a new meeting or event for this organization.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Monthly General Meeting"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Parish Hall"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Agenda..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Schedule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
