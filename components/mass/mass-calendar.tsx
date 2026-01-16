'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getMasses } from '@/app/actions/mass.actions'; // Ensure this action handles getting masses by date
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MassCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [masses, setMasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (date) {
            loadMasses(date);
        }
    }, [date]);

    const loadMasses = async (selectedDate: Date) => {
        setLoading(true);
        const res = await getMasses(selectedDate);
        if (res.success) {
            setMasses(res.data);
        } else {
            toast.error('Failed to load masses');
        }
        setLoading(false);
    };

    return (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <Card>
                <CardContent className="p-3">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                    Masses for {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
                </h2>

                {loading ? (
                    <div>Loading...</div>
                ) : masses.length === 0 ? (
                    <div className="text-muted-foreground">No masses scheduled for this date.</div>
                ) : (
                    <div className="grid gap-4">
                        {masses.map((mass) => (
                            <Card key={mass.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{mass.time}</span>
                                            <Badge variant={mass.status === 'CANCELLED' ? 'destructive' : 'default'}>
                                                {mass.status}
                                            </Badge>
                                            <Badge variant="outline">{mass.massType.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {mass.language} • {mass.location || 'Main Church'}
                                        </div>
                                        {mass.celebrant && (
                                            <div className="text-sm mt-1">Celebrant: {mass.celebrant}</div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Intentions: {mass._count?.intentions || 0} / {mass.maxIntentions}
                                        </div>
                                    </div>
                                    {/* Actions like Edit/Cancel could go here */}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
