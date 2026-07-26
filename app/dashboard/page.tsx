import { getDashboardStats } from "@/app/actions/transaksiActions";
import DashboardClient, { DashboardData } from "@/components/DashboardClient";

export const revalidate = 10; // Incremental Static Revalidation with instant Server Action revalidatePath

export default async function DashboardPage() {
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
