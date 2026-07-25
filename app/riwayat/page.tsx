import { prisma } from "@/lib/prisma";
import RiwayatTransaksi from "@/components/RiwayatTransaksi";

export const revalidate = 0; // Dynamic server rendering

export default async function RiwayatPage() {
  const transactions = await prisma.transaksi.findMany({
    include: {
      detailTransaksi: true,
    },
    orderBy: { tanggal: "desc" },
  });

  return (
    <RiwayatTransaksi
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
    />
  );
}
