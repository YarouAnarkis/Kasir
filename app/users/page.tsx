import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagement, { UserItem } from "@/components/UserManagement";

export const revalidate = 0;

export default async function UsersPage() {
  const session = await getSession();

  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    redirect("/?unauthorized=true");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      aktif: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UserManagement
      initialUsers={JSON.parse(JSON.stringify(users)) as UserItem[]}
      currentSessionRole={session.role}
      currentSessionId={session.id}
    />
  );
}
