import MemberManagement from "@/components/MemberManagement";
import { getMemberListAction } from "@/app/actions/memberActions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const res = await getMemberListAction();
  const members = res.success && res.data ? res.data : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MemberManagement initialMembers={members} userRole={session.role} />
    </div>
  );
}
