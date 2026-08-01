import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InventoryClient, {
  BahanBakuItem,
  MenuItemOption,
} from "@/components/InventoryClient";

export const revalidate = 0;

export default async function StokPage() {
  const session = await getSession();

  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    redirect("/?unauthorized=true");
  }

  const [rawMaterials, menus] = await Promise.all([
    prisma.bahanBaku.findMany({
      orderBy: { nama: "asc" },
      include: {
        resepMenus: {
          include: {
            menu: { select: { nama: true } },
          },
        },
      },
    }),
    prisma.menu.findMany({
      orderBy: { nama: "asc" },
      include: {
        kategori: { select: { nama: true } },
        resepMenus: {
          include: {
            bahanBaku: { select: { nama: true, satuan: true } },
          },
        },
      },
    }),
  ]);

  return (
    <InventoryClient
      initialBahanBaku={JSON.parse(JSON.stringify(rawMaterials)) as BahanBakuItem[]}
      initialMenus={JSON.parse(JSON.stringify(menus)) as MenuItemOption[]}
      userRole={session.role}
    />
  );
}
