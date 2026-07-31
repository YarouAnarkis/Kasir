import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MenuManagement from "@/components/MenuManagement";

export const revalidate = 0;

export default async function MenuPage() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    redirect("/?unauthorized=true");
  }

  let menus: any[] = [];
  let categories: any[] = [];
  let dbError = false;

  try {
    const [fetchedMenus, fetchedCategories] = await Promise.all([
      prisma.menu.findMany({
        include: {
          kategori: true,
        },
        orderBy: { nama: "asc" },
      }),
      prisma.kategori.findMany({
        include: {
          _count: {
            select: { menus: true },
          },
        },
        orderBy: { nama: "asc" },
      }),
    ]);
    menus = fetchedMenus;
    categories = fetchedCategories;
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
      <MenuManagement
        initialMenus={JSON.parse(JSON.stringify(menus))}
        initialCategories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
