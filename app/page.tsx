import { prisma } from "@/lib/prisma";
import KasirPOS from "@/components/KasirPOS";
import { getActivePromosFromDb } from "@/lib/promoEngine";
import { getSystemSettingsAction } from "@/app/actions/systemActions";

export const revalidate = 0;

export default async function TransaksiPage() {
  let menus: any[] = [];
  let categories: any[] = [];
  let activePromos: any[] = [];
  let persenPajak = 10;
  let dbError = false;

  try {
    const [fetchedMenus, fetchedCategories, fetchedPromos, settingsRes] = await Promise.all([
      prisma.menu.findMany({
        include: {
          kategori: true,
        },
        orderBy: { nama: "asc" },
      }),
      prisma.kategori.findMany({
        orderBy: { nama: "asc" },
      }),
      getActivePromosFromDb(),
      getSystemSettingsAction(),
    ]);

    menus = fetchedMenus;
    categories = fetchedCategories;
    activePromos = fetchedPromos;
    if (settingsRes.success && settingsRes.data) {
      persenPajak = settingsRes.data.persenPajak;
    }
  } catch (error) {
    console.error("Database connection error on Vercel:", error);
    dbError = true;
  }

  return (
    <div className="space-y-4">
      {dbError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong className="block font-bold">Koneksi Database Belum Dikonfigurasi di Vercel</strong>
              <span>Vercel tidak dapat terhubung ke <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">localhost:3306</code> (PC lokal). Mohon set Environment Variable <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">DATABASE_URL</code> cloud database di Vercel Dashboard.</span>
            </div>
          </div>
        </div>
      )}
      <KasirPOS
        initialMenus={JSON.parse(JSON.stringify(menus))}
        initialCategories={JSON.parse(JSON.stringify(categories))}
        initialPromos={JSON.parse(JSON.stringify(activePromos))}
        systemPajakPercent={persenPajak}
      />
    </div>
  );
}
