"use client";

import {
	getCurrentOrganization,
	updateOrganization,
	updateOrganizationFeatures,
} from "@/app/actions/organization.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useRole } from "@/hooks/use-role";
import {
	featureCategories,
	featureDescriptions,
	featureLabels,
	type FeatureName,
} from "@/lib/features";
import {
	Building as BuildingIcon,
	CreditCard as CreditCardIcon,
	Heart as HeartIcon,
	LayoutGrid as LayoutIcon,
	Lock as LockIcon,
	Save as SaveIcon,
	Settings as SettingsIcon,
	Share2 as ShareIcon,
	Shield as ShieldIcon,
	Zap as ZapIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const categoryIcons: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	core: ShieldIcon,
	payments: CreditCardIcon,
	spiritual: HeartIcon,
	communication: ShareIcon,
	organization: LayoutIcon,
	advanced: ZapIcon,
};

export default function SettingsPage() {
	const router = useRouter();
	const {
		settings,
		isLoading: featuresLoading,
		refetch,
	} = useFeatureSettings();
	const { isSuperAdmin, role } = useRole();

	// Only Super Admin can access Settings
	React.useEffect(() => {
		if (featuresLoading) return;
		if (!isSuperAdmin) {
			router.replace("/dashboard");
		}
	}, [isSuperAdmin, featuresLoading, router]);

	const [isSaving, setIsSaving] = React.useState(false);
	const [localFeatures, setLocalFeatures] = React.useState<
		Record<string, boolean>
	>({});
	const [hasChanges, setHasChanges] = React.useState(false);

	// Organization details state
	const [orgLoading, setOrgLoading] = React.useState(true);
	const [orgDetails, setOrgDetails] = React.useState({
		name: "",
		address: "",
		phone: "",
		email: "",
	});
	const [orgHasChanges, setOrgHasChanges] = React.useState(false);

	// Load organization details
	React.useEffect(() => {
		const loadOrg = async () => {
			const result = await getCurrentOrganization();
			if (result.success && result.data) {
				setOrgDetails({
					name: result.data.name,
					address: result.data.address || "",
					phone: result.data.phone || "",
					email: result.data.email || "",
				});
			}
			setOrgLoading(false);
		};
		loadOrg();
	}, []);

	// Sync settings to local state when loaded
	React.useEffect(() => {
		if (settings) {
			const featureState: Record<string, boolean> = {};
			Object.entries(settings).forEach(([key, value]) => {
				if (typeof value === "boolean") {
					featureState[key] = value;
				}
			});
			setLocalFeatures(featureState);
		}
	}, [settings]);

	const handleFeatureToggle = (feature: FeatureName) => {
		if (!isSuperAdmin) {
			toast.error("You do not have permission to change settings");
			return;
		}

		setLocalFeatures((prev) => {
			const updated = { ...prev, [feature]: !prev[feature] };
			setHasChanges(true);
			return updated;
		});
	};

	const handleSaveFeatures = async () => {
		if (!isSuperAdmin) {
			toast.error("You do not have permission to save settings");
			return;
		}

		setIsSaving(true);
		try {
			// Only send changed values
			const updates: Partial<Record<FeatureName, boolean>> = {};
			if (settings) {
				Object.keys(localFeatures).forEach((key) => {
					const featureKey = key as FeatureName;
					if (localFeatures[featureKey] !== settings[featureKey]) {
						updates[featureKey] = localFeatures[featureKey];
					}
				});
			}

			if (Object.keys(updates).length === 0) {
				toast.info("No changes to save");
				setIsSaving(false);
				return;
			}

			const result = await updateOrganizationFeatures(updates);

			if (result.success) {
				toast.success("Feature settings saved successfully");
				setHasChanges(false);
				await refetch();
			} else {
				toast.error(result.message || "Failed to save settings");
			}
		} catch (error) {
			toast.error("An error occurred while saving");
			console.error("Save settings error:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleOrgDetailChange = (field: string, value: string) => {
		setOrgDetails((prev) => ({ ...prev, [field]: value }));
		setOrgHasChanges(true);
	};

	const handleSaveOrgDetails = async () => {
		if (!isSuperAdmin) {
			toast.error("You do not have permission to save settings");
			return;
		}

		setIsSaving(true);
		try {
			const result = await updateOrganization({
				name: orgDetails.name,
				address: orgDetails.address || undefined,
				phone: orgDetails.phone || undefined,
				email: orgDetails.email || undefined,
			});

			if (result.success) {
				toast.success("Organization details saved successfully");
				setOrgHasChanges(false);
				router.refresh();
			} else {
				toast.error(
					result.message || "Failed to save organization details",
				);
			}
		} catch (error) {
			toast.error("An error occurred while saving");
			console.error("Save org details error:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleOpenTwoFactor = () => {
		router.push("/settings/security/2fa");
	};

	if (featuresLoading || orgLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Settings
					</h1>
					<p className="text-muted-foreground mt-1">
						Configure your parish settings
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-64 rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
						<SettingsIcon className="h-8 w-8" />
						Settings
					</h1>
					<p className="text-muted-foreground mt-1">
						Configure your parish and feature settings
					</p>
				</div>
			</div>

			{/* Super Admin only - show notice if somehow non-super-admin lands here */}
			{!isSuperAdmin && (
				<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
					<LockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-yellow-800 dark:text-yellow-200">
							Access restricted
						</p>
						<p className="text-sm text-yellow-700 dark:text-yellow-300">
							Only System / Super Admin can access settings. Your
							role is <span className="font-medium">{role}</span>.
							Redirecting…
						</p>
					</div>
				</div>
			)}

			{isSuperAdmin && (
				<div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="font-medium text-foreground">Security</p>
						<p className="text-sm text-muted-foreground">
							Manage two-factor authentication for admin accounts.
						</p>
					</div>
					<Button onClick={handleOpenTwoFactor}>
						<LockIcon className="mr-2 h-4 w-4" />
						Open 2FA Settings
					</Button>
				</div>
			)}

			{/* Settings Tabs */}
			<Tabs defaultValue="features" className="space-y-6">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger
						value="features"
						className="flex items-center gap-2"
					>
						<ZapIcon className="h-4 w-4" />
						Features
					</TabsTrigger>
					<TabsTrigger
						value="organization"
						className="flex items-center gap-2"
					>
						<BuildingIcon className="h-4 w-4" />
						Organization
					</TabsTrigger>
				</TabsList>

				{/* Features Tab */}
				<TabsContent value="features" className="space-y-6">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground">
							Enable or disable features for your organization
						</p>
						{isSuperAdmin && (
							<Button
								onClick={handleSaveFeatures}
								disabled={isSaving || !hasChanges}
							>
								<SaveIcon className="mr-2 h-4 w-4" />
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{Object.entries(featureCategories).map(
							([categoryKey, category]) => {
								const IconComponent =
									categoryIcons[categoryKey] || SettingsIcon;
								return (
									<div
										key={categoryKey}
										className="bg-background border border-border rounded-lg shadow-sm overflow-hidden h-fit"
									>
										<div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center gap-3">
											<IconComponent className="h-5 w-5 text-primary" />
											<div>
												<h2 className="font-bold text-foreground">
													{category.label}
												</h2>
												<p className="text-xs text-muted-foreground">
													{category.description}
												</p>
											</div>
										</div>
										<div className="p-4 space-y-1">
											{category.features.map(
												(feature) => (
													<div
														key={feature}
														className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-md transition-colors"
													>
														<div className="flex-1 mr-4">
															<p className="font-medium text-sm">
																{
																	featureLabels[
																		feature
																	]
																}
															</p>
															<p className="text-xs text-muted-foreground">
																{
																	featureDescriptions[
																		feature
																	]
																}
															</p>
														</div>
														<Switch
															checked={
																localFeatures[
																	feature
																] ?? false
															}
															onCheckedChange={() =>
																handleFeatureToggle(
																	feature,
																)
															}
															disabled={
																!isSuperAdmin ||
																isSaving
															}
														/>
													</div>
												),
											)}
										</div>
									</div>
								);
							},
						)}
					</div>
				</TabsContent>

				{/* Organization Tab */}
				<TabsContent value="organization" className="space-y-6">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground">
							Update your organization&apos;s basic information
						</p>
						{isSuperAdmin && (
							<Button
								onClick={handleSaveOrgDetails}
								disabled={isSaving || !orgHasChanges}
							>
								<SaveIcon className="mr-2 h-4 w-4" />
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						)}
					</div>

					<div className="bg-background border border-border rounded-lg shadow-sm p-6 max-w-2xl">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="orgName">
									Organization Name
								</Label>
								<Input
									id="orgName"
									value={orgDetails.name}
									onChange={(e) =>
										handleOrgDetailChange(
											"name",
											e.target.value,
										)
									}
									disabled={!isSuperAdmin || isSaving}
									placeholder="Parish name"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="orgEmail">Email Address</Label>
								<Input
									id="orgEmail"
									type="email"
									value={orgDetails.email}
									onChange={(e) =>
										handleOrgDetailChange(
											"email",
											e.target.value,
										)
									}
									disabled={!isSuperAdmin || isSaving}
									placeholder="contact@parish.org"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="orgPhone">Phone Number</Label>
								<Input
									id="orgPhone"
									type="tel"
									value={orgDetails.phone}
									onChange={(e) =>
										handleOrgDetailChange(
											"phone",
											e.target.value,
										)
									}
									disabled={!isSuperAdmin || isSaving}
									placeholder="+234 xxx xxx xxxx"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="orgAddress">Address</Label>
								<Textarea
									id="orgAddress"
									value={orgDetails.address}
									onChange={(e) =>
										handleOrgDetailChange(
											"address",
											e.target.value,
										)
									}
									disabled={!isSuperAdmin || isSaving}
									placeholder="Parish address"
									rows={3}
								/>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
