'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { OrganizationFormState } from '@/app/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { User } from '@prisma/client';

// Simple Submit Button
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Organization'}
        </Button>
    );
}

interface OrganizationFormProps {
    action: (state: OrganizationFormState, formData: FormData) => Promise<OrganizationFormState>;
    initialData?: {
        name: string;
        description?: string | null;
        presidentId?: string | null;
        secretaryId?: string | null;
    };
    users: Partial<User>[]; // Pass potential leaders
}

export function OrganizationForm({ action, initialData, users }: OrganizationFormProps) {
    const initialState: OrganizationFormState = { message: '', errors: {} };
    const [state, formAction] = useFormState(action, initialState);

    return (
        <form action={formAction} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-sm border">
            <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={initialData?.name}
                    placeholder="e.g. Catholic Women Organization"
                    required
                />
                {state.errors?.name && (
                    <p className="text-sm text-red-500">{state.errors.name.join(', ')}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={initialData?.description || ''}
                    placeholder="Brief description of the organization..."
                />
                {state.errors?.description && (
                    <p className="text-sm text-red-500">{state.errors.description.join(', ')}</p>
                )}
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="presidentId">President</Label>
                    <Select name="presidentId" defaultValue={initialData?.presidentId || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select President" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id || ''}>
                                    {user.firstName} {user.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="secretaryId">Secretary</Label>
                    <Select name="secretaryId" defaultValue={initialData?.secretaryId || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Secretary" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id || ''}>
                                    {user.firstName} {user.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="pt-4">
                {state.message && (
                    <div className={`p-3 rounded mb-4 ${state.message === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {state.message}
                    </div>
                )}
                <SubmitButton />
            </div>
        </form>
    );
}
