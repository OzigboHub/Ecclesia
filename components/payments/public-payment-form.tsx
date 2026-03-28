'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentSchema, type CreatePaymentInput } from '@/lib/validators/payment.schema';
import { createPayment } from '@/app/actions/payment.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';

interface PublicPaymentFormProps {
    organizationId: string;
    eventId?: string;
    donationCampaignId?: string;
    purpose: 'EVENT_PAYMENT' | 'DONATION_CAMPAIGN';
    title: string;
}

export function PublicPaymentForm({
    organizationId,
    eventId,
    donationCampaignId,
    purpose,
    title,
}: PublicPaymentFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreatePaymentInput>({
        resolver: zodResolver(createPaymentSchema),
        defaultValues: {
            amount: 1000,
            purpose,
            paymentMethod: 'CARD', // Default to digital for public
            payerName: '',
            payerEmail: '',
            payerPhone: '',
            eventId,
            donationCampaignId,
        },
    });

    async function onSubmit(data: CreatePaymentInput) {
        setIsSubmitting(true);
        try {
            const res = await createPayment(data, organizationId);
            if (res.success) {
                toast.success('Payment initiated successfully');
                // Here we would integrate with Paystack/Flutterwave
                // For now, we simulate success and redirect
                toast.info('Redirecting to secure payment gateway...');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="payerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="payerEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payerPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="08012345678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Pay Securely with Card
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                    Secured by Paystack. Your data is protected.
                </p>
            </form>
        </Form>
    );
}
