import { getEvent } from '@/app/actions/event.actions';
import { getPublicOrganization } from '@/app/actions/organization.actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Video, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { PublicPaymentForm } from '@/components/payments/public-payment-form';

export default async function PublicEventPage({
    params,
}: {
    params: Promise<{ parishId: string; id: string }>;
}) {
    const { parishId, id } = await params;
    if (!parishId || !id) {
        notFound();
    }

    const [eventRes, orgRes] = await Promise.all([
        getEvent(id, parishId),
        getPublicOrganization(parishId),
    ]);

    if (!eventRes.success || !orgRes.success) {
        notFound();
    }

    const event = eventRes.data;
    const organization = orgRes.data;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <Badge variant="outline" className="mb-2">
                    {event.type}
                </Badge>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{event.title}</h1>
                <p className="text-lg text-slate-600 font-medium">{organization.name}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Livestream Section */}
                    {event.streamUrl && (
                        <Card className="overflow-hidden border-2 border-blue-100 shadow-xl shadow-blue-50">
                            <div className="aspect-video bg-slate-900 relative">
                                {/* Placeholder for iframe embed - improved logic needed for different platforms */}
                                <iframe
                                    src={event.streamUrl.replace('watch?v=', 'embed/')}
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>
                            <CardContent className="p-4 bg-blue-50/50 flex items-center justify-between">
                                <div className="flex items-center text-blue-700 font-medium">
                                    <Video className="w-5 h-5 mr-2 animate-pulse" />
                                    Live Stream
                                </div>
                                <a
                                    href={event.streamUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline font-medium"
                                >
                                    View on Platform
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>About this Event</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate max-w-none">
                                {event.description || 'No description provided.'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                                <div>
                                    <p className="font-semibold text-slate-900">Date & Time</p>
                                    <p className="text-slate-600">
                                        {format(new Date(event.startTime), 'EEEE, MMMM do, yyyy')}
                                    </p>
                                    <p className="text-slate-600">
                                        {format(new Date(event.startTime), 'h:mm a')} -{' '}
                                        {format(new Date(event.endTime), 'h:mm a')}
                                    </p>
                                </div>
                            </div>

                            {event.location && (
                                <div className="flex items-start space-x-3 border-t pt-4">
                                    <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-slate-900">Location</p>
                                        <p className="text-slate-600">{event.location}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Section */}
                    {event.enablePayments && (
                        <Card className="border-green-100 bg-green-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center text-green-800">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Support this Event
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-700 mb-4">
                                    Your donations help us organize and sustain our activities. Thank you for your generosity!
                                </p>
                                <PublicPaymentForm
                                    organizationId={parishId}
                                    eventId={id}
                                    purpose="EVENT_PAYMENT"
                                    title={event.title}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
