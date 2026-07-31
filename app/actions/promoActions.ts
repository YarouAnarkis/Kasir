"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { evaluateMenuPromo } from "@/lib/promoEngine";

export async function getPromosAction() {
  try {
    const promos = await prisma.promo.findMany({
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
    });

    return { success: true, data: promos };
  } catch (error: any) {
    console.error("Get promos error:", error);
    return { success: false, error: "Gagal mengambil data promo" };
  }
}

export async function createPromoAction(data: {
  nama: string;
  tipeDiskon: "persentase" | "nominal" | "harga_tetap";
  nilai: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  jamMulai?: string;
  jamSelesai?: string;
  berlakuUntuk: "semua" | "kategori" | "menu_tertentu";
  kategoriId?: number;
  menuIds?: number[];
}) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    if (!data.nama.trim() || data.nilai <= 0) {
      return { success: false, error: "Nama promo dan nilai diskon wajib valid" };
    }

    const newPromo = await prisma.promo.create({
      data: {
        nama: data.nama.trim(),
        tipeDiskon: data.tipeDiskon,
        nilai: Number(data.nilai),
        tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : null,
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : null,
        jamMulai: data.jamMulai || null,
        jamSelesai: data.jamSelesai || null,
        berlakuUntuk: data.berlakuUntuk,
        kategoriId: data.kategoriId ? Number(data.kategoriId) : null,
        aktif: true,
        createdBy: session.id,
        promoMenus:
          data.berlakuUntuk === "menu_tertentu" && data.menuIds && data.menuIds.length > 0
            ? {
                create: data.menuIds.map((mId) => ({ menuId: Number(mId) })),
              }
            : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_PROMO",
        details: `Membuat promo baru: ${newPromo.nama} (${newPromo.tipeDiskon}: ${newPromo.nilai})`,
      },
    });

    revalidatePath("/promo");
    revalidatePath("/");
    return { success: true, data: newPromo };
  } catch (error: any) {
    console.error("Create promo error:", error);
    return { success: false, error: "Gagal membuat promo baru" };
  }
}

export async function togglePromoStatusAction(id: number, aktif: boolean) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const updated = await prisma.promo.update({
      where: { id },
      data: { aktif },
    });

    revalidatePath("/promo");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Toggle promo error:", error);
    return { success: false, error: "Gagal mengubah status promo" };
  }
}

export async function deletePromoAction(id: number) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    await prisma.promo.delete({ where: { id } });

    revalidatePath("/promo");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete promo error:", error);
    return { success: false, error: "Gagal menghapus promo" };
  }
}

export async function evaluateCartItemPromo(menuId: number, hargaAsli: number, kategoriId: number) {
  return await evaluateMenuPromo(menuId, hargaAsli, kategoriId);
}
