import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PromoManagement, { PromoItem } from "@/components/PromoManagement";

export const revalidate = 0;

export default async function PromoPage() {
  const session = await getSession();

  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    redirect("/?unauthorized=true");
  }

  const [promos, categories, menus] = await Promise.all([
    prisma.promo.findMany({
      include: {
        creator: {
          select: { nama: true, username: true },
        },
        kategori: {
          select: { nama: true },
        },
        promoMenus: {
          include: {
            menu: {
              select: { id: true, nama: true },
            },
          },
        },
        _count: {
          select: { detailTransaksi: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.kategori.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.menu.findMany({
      select: { id: true, nama: true, harga: true },
      orderBy: { nama: "asc" },
    }),
  ]);

  return (
    <PromoManagement
      initialPromos={JSON.parse(JSON.stringify(promos)) as PromoItem[]}
      categories={categories}
      menus={menus}
    />
  );
}
