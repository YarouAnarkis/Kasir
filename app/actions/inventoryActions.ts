"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBahanBakuListAction() {
  try {
    const list = await prisma.bahanBaku.findMany({
      orderBy: { nama: "asc" },
      include: {
        resepMenus: {
          include: {
            menu: { select: { nama: true } },
          },
        },
      },
    });

    return { success: true, data: list };
  } catch (error: any) {
    console.error("Get bahan baku error:", error);
    return { success: false, error: "Gagal mengambil daftar bahan baku" };
  }
}

export async function createBahanBakuAction(data: {
  nama: string;
  satuan: string;
  stok: number;
  stokMinim: number;
  hargaSatuan: number;
}) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const created = await prisma.bahanBaku.create({
      data: {
        nama: data.nama.trim(),
        satuan: data.satuan.trim().toLowerCase(),
        stok: Number(data.stok) || 0,
        stokMinim: Number(data.stokMinim) || 10,
        hargaSatuan: Number(data.hargaSatuan) || 0,
      },
    });

    revalidatePath("/stok");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Create bahan baku error:", error);
    return { success: false, error: "Gagal menambahkan bahan baku" };
  }
}

export async function updateBahanBakuAction(
  id: number,
  data: {
    nama: string;
    satuan: string;
    stok: number;
    stokMinim: number;
    hargaSatuan: number;
  }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const updated = await prisma.bahanBaku.update({
      where: { id },
      data: {
        nama: data.nama.trim(),
        satuan: data.satuan.trim().toLowerCase(),
        stok: Number(data.stok) || 0,
        stokMinim: Number(data.stokMinim) || 10,
        hargaSatuan: Number(data.hargaSatuan) || 0,
      },
    });

    revalidatePath("/stok");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update bahan baku error:", error);
    return { success: false, error: "Gagal mengedit bahan baku" };
  }
}

export async function deleteBahanBakuAction(id: number) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    await prisma.bahanBaku.delete({
      where: { id },
    });

    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Delete bahan baku error:", error);
    return { success: false, error: "Gagal menghapus bahan baku" };
  }
}

export async function getResepByMenuAction(menuId: number) {
  try {
    const resep = await prisma.resepMenu.findMany({
      where: { menuId },
      include: {
        bahanBaku: true,
      },
    });

    return { success: true, data: resep };
  } catch (error: any) {
    console.error("Get resep error:", error);
    return { success: false, error: "Gagal mengambil resep menu" };
  }
}

export async function setResepMenuAction(
  menuId: number,
  resepItems: { bahanBakuId: number; jumlahPakai: number }[]
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    // Delete existing recipe items for this menu
    await prisma.resepMenu.deleteMany({
      where: { menuId },
    });

    // Insert new recipe items
    if (resepItems.length > 0) {
      await prisma.resepMenu.createMany({
        data: resepItems.map((item) => ({
          menuId,
          bahanBakuId: item.bahanBakuId,
          jumlahPakai: Number(item.jumlahPakai) || 0,
        })),
      });
    }

    revalidatePath("/stok");
    revalidatePath("/menu");
    return { success: true };
  } catch (error: any) {
    console.error("Set resep error:", error);
    return { success: false, error: "Gagal menyimpan resep menu" };
  }
}
