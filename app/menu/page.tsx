import { prisma } from "@/lib/prisma";
import MenuManagement from "@/components/MenuManagement";

export const revalidate = 0; // Dynamic server rendering

export default async function MenuPage() {
  const [menus, categories] = await Promise.all([
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

  return (
    <MenuManagement
      initialMenus={JSON.parse(JSON.stringify(menus))}
      initialCategories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
