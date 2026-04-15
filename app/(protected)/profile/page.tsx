import { getProfile } from "@/app/actions/profile.actions";
import { ProfileForm } from "@/components/forms/profile-form";
import { redirect } from "next/navigation";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const result = await getProfile();

  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal information and profile picture
          </p>
        </div>
      </div>
      <ProfileForm user={result.data} />
    </div>
  );
}
