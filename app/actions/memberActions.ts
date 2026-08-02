"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMemberListAction(query?: string) {
  try {
    const where: any = {};
    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { nama: { contains: q } },
        { nomorHp: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { transaksiList: true },
        },
      },
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("Get member list error:", error);
    return { success: false, error: "Gagal mengambil daftar member" };
  }
}

export async function findMemberByHpAction(nomorHp: string) {
  try {
    if (!nomorHp || !nomorHp.trim()) {
      return { success: false, error: "Nomor HP wajib diisi" };
    }

    const cleanHp = nomorHp.replace(/\D/g, "");

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { nomorHp: cleanHp },
          { nomorHp: `0${cleanHp.slice(2)}` },
          { nomorHp: { contains: cleanHp } },
        ],
      },
    });

    if (!member) {
      return { success: false, error: "Member tidak ditemukan" };
    }

    return { success: true, data: member };
  } catch (error: any) {
    console.error("Find member error:", error);
    return { success: false, error: "Gagal mencari member" };
  }
}

export async function createMemberAction(data: {
  nama: string;
  nomorHp: string;
  email?: string;
}) {
  try {
    if (!data.nama || !data.nama.trim()) {
      return { success: false, error: "Nama member wajib diisi" };
    }

    if (!data.nomorHp || !data.nomorHp.trim()) {
      return { success: false, error: "Nomor HP / WhatsApp wajib diisi" };
    }

    const cleanHp = data.nomorHp.replace(/\D/g, "");

    const existing = await prisma.member.findFirst({
      where: {
        OR: [
          { nomorHp: cleanHp },
          { nomorHp: data.nomorHp.trim() },
        ],
      },
    });

    if (existing) {
      return { success: false, error: `Member dengan nomor HP ${data.nomorHp} sudah terdaftar!` };
    }

    const member = await prisma.member.create({
      data: {
        nama: data.nama.trim(),
        nomorHp: cleanHp,
        email: data.email ? data.email.trim() : null,
        poin: 0,
        tipeMember: "BRONZE",
      },
    });

    revalidatePath("/members");
    revalidatePath("/");
    return { success: true, data: member };
  } catch (error: any) {
    console.error("Create member error:", error);
    return { success: false, error: "Gagal me-registrasi member baru" };
  }
}

export async function updateMemberAction(
  id: number,
  data: {
    nama: string;
    nomorHp: string;
    email?: string;
  }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const cleanHp = data.nomorHp.replace(/\D/g, "");

    const updated = await prisma.member.update({
      where: { id },
      data: {
        nama: data.nama.trim(),
        nomorHp: cleanHp,
        email: data.email ? data.email.trim() : null,
      },
    });

    revalidatePath("/members");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update member error:", error);
    return { success: false, error: "Gagal memperbarui data member" };
  }
}

export async function deleteMemberAction(id: number) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    await prisma.member.delete({
      where: { id },
    });

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    console.error("Delete member error:", error);
    return { success: false, error: "Gagal menghapus member" };
  }
}
