"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getKategoriList() {
  try {
    const kategori = await prisma.kategori.findMany({
      orderBy: { nama: "asc" },
      include: {
        _count: {
          select: { menus: true },
        },
      },
    });
    return { success: true, data: kategori };
  } catch (error: any) {
    console.error("Error fetching kategori:", error);
    return { success: false, error: "Gagal mengambil data kategori" };
  }
}

export async function createKategori(nama: string) {
  try {
    const trimmedNama = nama.trim();
    if (!trimmedNama) {
      return { success: false, error: "Nama kategori tidak boleh kosong" };
    }

    const existing = await prisma.kategori.findUnique({
      where: { nama: trimmedNama },
    });
    if (existing) {
      return { success: false, error: "Nama kategori sudah ada" };
    }

    const kategori = await prisma.kategori.create({
      data: { nama: trimmedNama },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, data: kategori };
  } catch (error: any) {
    console.error("Error creating kategori:", error);
    return { success: false, error: "Gagal membuat kategori" };
  }
}

export async function updateKategori(id: number, nama: string) {
  try {
    const trimmedNama = nama.trim();
    if (!trimmedNama) {
      return { success: false, error: "Nama kategori tidak boleh kosong" };
    }

    const existing = await prisma.kategori.findFirst({
      where: {
        nama: trimmedNama,
        NOT: { id },
      },
    });
    if (existing) {
      return { success: false, error: "Nama kategori sudah digunakan" };
    }

    const updated = await prisma.kategori.update({
      where: { id },
      data: { nama: trimmedNama },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating kategori:", error);
    return { success: false, error: "Gagal memperbarui kategori" };
  }
}

export async function deleteKategori(id: number) {
  try {
    await prisma.kategori.delete({
      where: { id },
    });

    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting kategori:", error);
    return { success: false, error: "Gagal menghapus kategori" };
  }
}
