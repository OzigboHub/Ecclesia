"use client";

import { getMassDays, getMasses } from "@/app/actions/mass.actions"; // Ensure this action handles getting masses by date
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
	Calendar as CalendarIcon,
	Clock,
	FileText,
	MapPin,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MassEditDialog } from "./mass-edit-dialog";
import { MassPaymentTypesManager } from "./mass-payment-types";

interface MassCalendarProps {
	canManage?: boolean;
	userEmail?: string;
	userName?: string;
	parishionerId?: string | null;
	organizationId?: string;
}

export function MassCalendar({
	canManage = false,
	userEmail,
	userName,
	parishionerId,
	organizationId,
}: MassCalendarProps) {
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
	const [masses, setMasses] = useState<any[]>([]);
	const [massDays, setMassDays] = useState<Date[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (date) {
			loadMasses(date);
		}
	}, [date]);

	useEffect(() => {
		loadMassDays(currentMonth);
	}, [currentMonth]);

	const loadMasses = async (selectedDate: Date) => {
		setLoading(true);
		const res = await getMasses(selectedDate);
		if (res.success) {
			setMasses(res.data);
		} else {
			toast.error("Failed to load masses");
		}
		setLoading(false);
	};

	const loadMassDays = async (month: Date) => {
		const start = startOfMonth(month);
		const end = endOfMonth(month);
		const res = await getMassDays(start, end);
		if (res.success && res.data) {
			setMassDays(res.data.map((d: string) => new Date(d)));
		}
	};

	return (
		<div className="grid md:grid-cols-[350px_1fr] gap-8 items-start">
			<Card className="shadow-lg border-none bg-secondary/5">
				<CardContent className="p-4">
					<Calendar
						mode="single"
						selected={date}
						onSelect={setDate}
						onMonthChange={setCurrentMonth}
						className="rounded-xl border shadow-sm bg-background"
						modifiers={{
							hasMass: massDays,
						}}
					/>
				</CardContent>
			</Card>

			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold tracking-tight text-primary">
						{date ? format(date, "EEEE, MMMM do") : "Select a date"}
					</h2>
					<Badge
						variant="outline"
						className="px-3 py-1 text-sm font-medium"
					>
						{masses.length}{" "}
						{masses.length === 1 ? "Mass" : "Masses"}
					</Badge>
				</div>

				{loading ?
					<div className="flex items-center justify-center h-48">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				: masses.length === 0 ?
					<Card className="border-dashed bg-secondary/10">
						<CardContent className="flex flex-col items-center justify-center p-12 text-center">
							<div className="bg-background p-4 rounded-full shadow-sm mb-4">
								<CalendarIcon className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-lg font-medium text-muted-foreground">
								No masses scheduled for this day
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								{canManage ?
									"Try selecting another date or generate new masses."
								:	"Try selecting another date or contact your parish office."
								}
							</p>
						</CardContent>
					</Card>
				:	<div className="grid gap-4">
						{masses.map((mass) => (
							<Card
								key={mass.id}
								className="group hover:shadow-md transition-all border-none shadow-sm bg-secondary/5"
							>
								<CardContent className="p-6 flex items-start justify-between">
									<div className="space-y-4 flex-1">
										<div className="flex items-center gap-3">
											<div className="bg-primary/10 p-2 rounded-lg">
												<Clock className="h-5 w-5 text-primary" />
											</div>
											<span className="font-bold text-2xl tracking-tight">
												{mass.time}
											</span>
											<div className="flex gap-2 ml-2">
												<Badge
													variant={
														(
															mass.status ===
															"CANCELLED"
														) ?
															"destructive"
														:	"secondary"
													}
													className="font-semibold uppercase tracking-wider text-[10px]"
												>
													{mass.status}
												</Badge>
												<Badge
													variant="outline"
													className="font-medium text-[10px] uppercase border-primary/20 bg-primary/5"
												>
													{mass.massType.replace(
														"_",
														" ",
													)}
												</Badge>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												<span>
													{mass.location ||
														"Main Church"}
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<FileText className="h-4 w-4" />
												<span>{mass.language}</span>
											</div>
											{mass.celebrant && (
												<div className="flex items-center gap-2 text-sm font-medium text-foreground">
													<User className="h-4 w-4 text-primary" />
													<span>
														{mass.celebrant}
													</span>
												</div>
											)}
										</div>

										<div className="flex items-center gap-4 bg-background/50 p-2 rounded-lg w-fit">
											<div className="text-xs font-semibold uppercase tracking-tighter text-muted-foreground">
												Intentions
											</div>
											<div className="flex items-center gap-2">
												<div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
													<div
														className={cn(
															"h-full transition-all",
															(
																mass._count
																	?.intentions >=
																	mass.maxIntentions
															) ?
																"bg-destructive"
															:	"bg-primary",
														)}
														style={{
															width: `${Math.min(
																((mass._count
																	?.intentions ||
																	0) /
																	mass.maxIntentions) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
												<span className="text-sm font-bold">
													{mass._count?.intentions ||
														0}{" "}
													/ {mass.maxIntentions}
												</span>
											</div>
										</div>

										<MassPaymentTypesManager
											massId={mass.id}
											canManage={canManage}
											userEmail={userEmail}
											userName={userName}
											parishionerId={parishionerId}
											organizationId={organizationId}
										/>
									</div>
									{canManage && (
										<div className="flex items-center gap-2">
											<MassEditDialog
												mass={mass}
												onSuccess={() =>
													date && loadMasses(date)
												}
											/>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				}
			</div>
		</div>
	);
}
