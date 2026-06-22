"use client";

import {
	createMassScheduleTemplate,
	deleteMassScheduleTemplate,
	getMassScheduleTemplates,
	updateMassScheduleTemplate,
} from "@/app/actions/mass-schedule.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { formatTime12h } from "@/lib/format-time";
import { zodResolver } from "@hookform/resolvers/zod";
import { MassScheduleTemplate } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod"; // Reuse or redefine schema constraints

// Copied schema for client-side form validation (can import if shared)
const templateSchema = z.object({
	dayOfWeek: z.enum([
		"MONDAY",
		"TUESDAY",
		"WEDNESDAY",
		"THURSDAY",
		"FRIDAY",
		"SATURDAY",
		"SUNDAY",
	]),
	time: z
		.string()
		.regex(
			/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
			"Invalid time format (HH:mm)",
		),
	massType: z.enum([
		"DAILY_MASS",
		"SUNDAY_MASS",
		"HOLY_DAY_MASS",
		"SPECIAL_MASS",
		"WEDDING_MASS",
		"FUNERAL_MASS",
		"THANKSGIVING_MASS",
	]),
	language: z.string().optional(),
	location: z.string().optional(),
});

type FormData = z.infer<typeof templateSchema>;

interface MassScheduleManagerProps {
	initialTemplates?: MassScheduleTemplate[];
	canDelete?: boolean;
	canEdit?: boolean;
}

export function MassScheduleManager({
	initialTemplates = [],
	canDelete = false,
	canEdit = true,
}: MassScheduleManagerProps) {
	const [templates, setTemplates] =
		useState<MassScheduleTemplate[]>(initialTemplates);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<MassScheduleTemplate | null>(null);

	const createForm = useForm<FormData>({
		resolver: zodResolver(templateSchema),
		defaultValues: {
			dayOfWeek: "SUNDAY",
			time: "06:00",
			massType: "DAILY_MASS",
			language: "English",
			location: "Main Church",
		},
	});

	const editForm = useForm<FormData>({
		resolver: zodResolver(templateSchema),
		defaultValues: {
			dayOfWeek: "SUNDAY",
			time: "06:00",
			massType: "DAILY_MASS",
			language: "English",
			location: "Main Church",
		},
	});

	const loadTemplates = async () => {
		const res = await getMassScheduleTemplates();
		if (res.success && res.data) {
			setTemplates(res.data);
		} else {
			toast.error(res.message || "Failed to load templates");
		}
	};

	const onCreateSubmit = async (data: FormData) => {
		const res = await createMassScheduleTemplate({
			...data,
			isActive: true,
		});
		if (res.success) {
			toast.success("Template created");
			setIsCreateOpen(false);
			createForm.reset();
			loadTemplates();
		} else {
			toast.error(res.message);
		}
	};

	const openEditDialog = (template: MassScheduleTemplate) => {
		setEditingTemplate(template);
		editForm.reset({
			dayOfWeek: template.dayOfWeek,
			time: template.time,
			massType: template.massType,
			language: template.language ?? "",
			location: template.location ?? "",
		});
		setIsEditOpen(true);
	};

	const onEditSubmit = async (data: FormData) => {
		if (!editingTemplate) {
			toast.error("No template selected");
			return;
		}

		const res = await updateMassScheduleTemplate(editingTemplate.id, data);
		if (res.success) {
			toast.success("Template updated");
			setIsEditOpen(false);
			setEditingTemplate(null);
			loadTemplates();
			return;
		}

		toast.error(res.message || "Failed to update template");
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure?")) return;
		const res = await deleteMassScheduleTemplate(id);
		if (res.success) {
			toast.success("Template deleted");
			loadTemplates();
		} else {
			toast.error(res.message);
		}
	};

	const days = [
		"MONDAY",
		"TUESDAY",
		"WEDNESDAY",
		"THURSDAY",
		"FRIDAY",
		"SATURDAY",
		"SUNDAY",
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-xl sm:text-2xl font-semibold">
					Weekly Schedule Templates
				</h2>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" /> Add Template
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								Add Mass Schedule Template
							</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={createForm.handleSubmit(onCreateSubmit)}
							className="space-y-4"
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Day of Week
									</label>
									<Controller
										name="dayOfWeek"
										control={createForm.control}
										render={({ field }) => (
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select day" />
												</SelectTrigger>
												<SelectContent className="bg-primary">
													{days.map((day) => (
														<SelectItem
															key={day}
															value={day}
														>
															{day}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{createForm.formState.errors.dayOfWeek && (
										<p className="text-red-500 text-sm">
											{
												createForm.formState.errors
													.dayOfWeek.message
											}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										Time
									</label>
									<Controller
										name="time"
										control={createForm.control}
										render={({ field }) => (
											<TimePicker
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
									{createForm.formState.errors.time && (
										<p className="text-red-500 text-sm">
											{
												createForm.formState.errors.time
													.message
											}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Mass Type
								</label>
								<Controller
									name="massType"
									control={createForm.control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent className="bg-primary">
												{[
													"DAILY_MASS",
													"SUNDAY_MASS",
													"SPECIAL_MASS",
													"HOLY_DAY_MASS",
													"WEDDING_MASS",
													"FUNERAL_MASS",
													"THANKSGIVING_MASS",
												].map((t) => (
													<SelectItem
														key={t}
														value={t}
													>
														{t.replace("_", " ")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{createForm.formState.errors.massType && (
									<p className="text-red-500 text-sm">
										{
											createForm.formState.errors.massType
												.message
										}
									</p>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Language
									</label>
									<Input
										{...createForm.register("language")}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Location
									</label>
									<Input
										{...createForm.register("location")}
									/>
								</div>
							</div>

							<Button type="submit" className="w-full">
								Create Template
							</Button>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog
					open={isEditOpen}
					onOpenChange={(open) => {
						setIsEditOpen(open);
						if (!open) {
							setEditingTemplate(null);
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								Edit Mass Schedule Template
							</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={editForm.handleSubmit(onEditSubmit)}
							className="space-y-4"
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Day of Week
									</label>
									<Controller
										name="dayOfWeek"
										control={editForm.control}
										render={({ field }) => (
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select day" />
												</SelectTrigger>
												<SelectContent className="bg-primary">
													{days.map((day) => (
														<SelectItem
															key={day}
															value={day}
														>
															{day}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{editForm.formState.errors.dayOfWeek && (
										<p className="text-red-500 text-sm">
											{
												editForm.formState.errors
													.dayOfWeek.message
											}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										Time
									</label>
									<Controller
										name="time"
										control={editForm.control}
										render={({ field }) => (
											<TimePicker
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
									{editForm.formState.errors.time && (
										<p className="text-red-500 text-sm">
											{
												editForm.formState.errors.time
													.message
											}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Mass Type
								</label>
								<Controller
									name="massType"
									control={editForm.control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent className="bg-primary">
												{[
													"DAILY_MASS",
													"SUNDAY_MASS",
													"SPECIAL_MASS",
													"HOLY_DAY_MASS",
													"WEDDING_MASS",
													"FUNERAL_MASS",
													"THANKSGIVING_MASS",
												].map((t) => (
													<SelectItem
														key={t}
														value={t}
													>
														{t.replace("_", " ")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{editForm.formState.errors.massType && (
									<p className="text-red-500 text-sm">
										{
											editForm.formState.errors.massType
												.message
										}
									</p>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Language
									</label>
									<Input {...editForm.register("language")} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Location
									</label>
									<Input {...editForm.register("location")} />
								</div>
							</div>

							<Button type="submit" className="w-full">
								Save Changes
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{days.map((day) => {
					const dayTemplates = templates.filter(
						(t) => t.dayOfWeek === day,
					);
					if (dayTemplates.length === 0) return null;
					return (
						<Card key={day}>
							<CardHeader className="pb-3">
								<CardTitle className="text-base sm:text-lg">
									{day}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{dayTemplates.map((t) => (
									<div
										key={t.id}
										className="flex items-start justify-between gap-2 p-3 bg-secondary/20 rounded-lg"
									>
										<div className="min-w-0">
											<div className="font-semibold text-sm sm:text-base">
												{formatTime12h(t.time)}
												<span className="text-xs font-normal text-muted-foreground ml-2">
													{t.massType.replace(
														/_/g,
														" ",
													)}
												</span>
											</div>
											<div className="text-xs text-muted-foreground mt-0.5">
												{t.language} · {t.location}
											</div>
										</div>
										<div className="flex items-center gap-1">
											{canEdit && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														openEditDialog(t)
													}
												>
													<Pencil className="h-4 w-4" />
												</Button>
											)}
											{canDelete && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleDelete(t.id)
													}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											)}
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
