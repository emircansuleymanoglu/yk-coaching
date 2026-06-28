import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import { PushToggle } from "@/components/push/PushToggle";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profilim</h1>
      <PushToggle />
      <ProfileForm profile={profile} email={user?.email ?? ""} />
    </div>
  );
}
