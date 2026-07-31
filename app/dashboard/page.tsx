import { getDashboardStats } from "@/app/actions/transaksiActions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient, { DashboardData } from "@/components/DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    redirect("/?unauthorized=true");
  }

  const statsRes = await getDashboardStats();
  const initialData = statsRes.success && statsRes.data ? statsRes.data : {
    totalHariIni: 0,
    jumlahTransaksiHariIni: 0,
    totalSemuaTransaksi: 0,
    topItems: [],
    salesChart: [],
  };

  return (
    <DashboardClient
      initialData={JSON.parse(JSON.stringify(initialData)) as DashboardData}
    />
  );
}
