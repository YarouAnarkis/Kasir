import { prisma } from "@/lib/prisma";
import RiwayatTransaksi from "@/components/RiwayatTransaksi";

export const revalidate = 0; // Dynamic server rendering

export default async function RiwayatPage() {
  let transactions: any[] = [];
  let dbError = false;

  try {
    transactions = await prisma.transaksi.findMany({
      include: {
        detailTransaksi: true,
      },
      orderBy: { tanggal: "desc" },
    });
  } catch (error) {
    console.error("Database connection error on Vercel:", error);
    dbError = true;
  }

  return (
    <div className="space-y-4">
      {dbError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs sm:text-sm font-medium">
          <strong>⚠️ Koneksi Database Belum Dikonfigurasi di Vercel:</strong> Set Environment Variable <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">DATABASE_URL</code> cloud database di Vercel Dashboard.
        </div>
      )}
      <RiwayatTransaksi
        initialTransactions={JSON.parse(JSON.stringify(transactions))}
      />
    </div>
  );
}
