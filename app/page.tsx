import { prisma } from "@/lib/prisma";
import KasirPOS from "@/components/KasirPOS";

export const revalidate = 0; // Dynamic server rendering

export default async function TransaksiPage() {
  const [menus, categories] = await Promise.all([
    prisma.menu.findMany({
      include: {
        kategori: true,
      },
      orderBy: { nama: "asc" },
    }),
    prisma.kategori.findMany({
      orderBy: { nama: "asc" },
    }),
  ]);

  return (
    <KasirPOS
      initialMenus={JSON.parse(JSON.stringify(menus))}
      initialCategories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
