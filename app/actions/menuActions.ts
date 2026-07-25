"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMenuList(kategoriId?: number, search?: string) {
  try {
    const where: any = {};

    if (kategoriId && kategoriId > 0) {
      where.kategoriId = kategoriId;
    }

    if (search && search.trim() !== "") {
      where.nama = {
        contains: search.trim(),
      };
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        kategori: true,
      },
      orderBy: { nama: "asc" },
    });

    return { success: true, data: menus };
  } catch (error: any) {
    console.error("Error fetching menus:", error);
    return { success: false, error: "Gagal mengambil data menu" };
  }
}

export async function createMenu(data: {
  nama: string;
  harga: number;
  kategoriId: number;
  gambar?: string;
  tersedia?: boolean;
}) {
  try {
    if (!data.nama || data.nama.trim() === "") {
      return { success: false, error: "Nama menu wajib diisi" };
    }
    if (isNaN(data.harga) || data.harga < 0) {
      return { success: false, error: "Harga menu tidak boleh negatif" };
    }
    if (!data.kategoriId || data.kategoriId <= 0) {
      return { success: false, error: "Kategori wajib dipilih" };
    }

    const newMenu = await prisma.menu.create({
      data: {
        nama: data.nama.trim(),
        harga: Number(data.harga),
        kategoriId: Number(data.kategoriId),
        gambar: data.gambar ? data.gambar.trim() : null,
        tersedia: data.tersedia !== undefined ? data.tersedia : true,
      },
      include: {
        kategori: true,
      },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, data: newMenu };
  } catch (error: any) {
    console.error("Error creating menu:", error);
    return { success: false, error: "Gagal membuat menu baru" };
  }
}

export async function updateMenu(
  id: number,
  data: {
    nama: string;
    harga: number;
    kategoriId: number;
    gambar?: string;
    tersedia?: boolean;
  }
) {
  try {
    if (!data.nama || data.nama.trim() === "") {
      return { success: false, error: "Nama menu wajib diisi" };
    }
    if (isNaN(data.harga) || data.harga < 0) {
      return { success: false, error: "Harga menu tidak boleh negatif" };
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        nama: data.nama.trim(),
        harga: Number(data.harga),
        kategoriId: Number(data.kategoriId),
        gambar: data.gambar !== undefined ? (data.gambar ? data.gambar.trim() : null) : undefined,
        tersedia: data.tersedia,
      },
      include: {
        kategori: true,
      },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, data: updatedMenu };
  } catch (error: any) {
    console.error("Error updating menu:", error);
    return { success: false, error: "Gagal memperbarui menu" };
  }
}

export async function toggleMenuAvailability(id: number, tersedia: boolean) {
  try {
    const updated = await prisma.menu.update({
      where: { id },
      data: { tersedia },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling menu availability:", error);
    return { success: false, error: "Gagal mengubah status ketersediaan" };
  }
}

export async function deleteMenu(id: number) {
  try {
    await prisma.menu.delete({
      where: { id },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting menu:", error);
    return { success: false, error: "Gagal menghapus menu" };
  }
}
