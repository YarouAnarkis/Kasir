"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getActiveShiftAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Sesi tidak ditemukan" };

    const activeShift = await prisma.shiftKasir.findFirst({
      where: {
        kasirId: session.id,
        status: "OPEN",
      },
      orderBy: { waktuBuka: "desc" },
    });

    if (!activeShift) return { success: true, data: null };

    // Calculate current live totals from transactions executed during this shift
    const transactions = await prisma.transaksi.findMany({
      where: {
        kasirId: session.id,
        isVoid: false,
        tanggal: { gte: activeShift.waktuBuka },
      },
      select: {
        metodePembayaran: true,
        jenisTransaksi: true,
        totalHarga: true,
        subtotal: true,
      },
    });

    let liveTunai = 0;
    let liveQris = 0;
    let liveFree = 0;

    transactions.forEach((t) => {
      if (t.jenisTransaksi === "karyawan") {
        liveFree += t.subtotal;
      } else if (t.metodePembayaran === "QRIS") {
        liveQris += t.totalHarga;
      } else {
        liveTunai += t.totalHarga;
      }
    });

    return {
      success: true,
      data: {
        ...activeShift,
        liveTunai,
        liveQris,
        liveFree,
        totalTransaksi: transactions.length,
      },
    };
  } catch (error: any) {
    console.error("Get active shift error:", error);
    return { success: false, error: "Gagal mengambil data shift kasir" };
  }
}

export async function startShiftAction(modalAwal: number) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Sesi tidak ditemukan" };

    const modalNum = Math.max(0, Number(modalAwal) || 0);

    // Close any unclosed dangling shift for safety
    await prisma.shiftKasir.updateMany({
      where: {
        kasirId: session.id,
        status: "OPEN",
      },
      data: {
        status: "CLOSED",
        waktuTutup: new Date(),
      },
    });

    const newShift = await prisma.shiftKasir.create({
      data: {
        kasirId: session.id,
        namaKasir: session.nama,
        modalAwal: modalNum,
        status: "OPEN",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "START_SHIFT",
        details: `Membuka Shift Kasir dengan Modal Awal Kas Rp ${modalNum.toLocaleString("id-ID")}`,
      },
    });

    revalidatePath("/");
    return { success: true, data: newShift };
  } catch (error: any) {
    console.error("Start shift error:", error);
    return { success: false, error: "Gagal membuka shift kasir" };
  }
}

export async function closeShiftAction(hitungFisikTunai: number, catatan?: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Sesi tidak ditemukan" };

    const activeShift = await prisma.shiftKasir.findFirst({
      where: {
        kasirId: session.id,
        status: "OPEN",
      },
    });

    if (!activeShift) {
      return { success: false, error: "Tidak ada shift aktif yang perlu ditutup" };
    }

    const transactions = await prisma.transaksi.findMany({
      where: {
        kasirId: session.id,
        isVoid: false,
        tanggal: { gte: activeShift.waktuBuka },
      },
      select: {
        metodePembayaran: true,
        jenisTransaksi: true,
        totalHarga: true,
        subtotal: true,
      },
    });

    let totalTunaiSistem = 0;
    let totalQrisSistem = 0;
    let totalFreeOrderSistem = 0;

    transactions.forEach((t) => {
      if (t.jenisTransaksi === "karyawan") {
        totalFreeOrderSistem += t.subtotal;
      } else if (t.metodePembayaran === "QRIS") {
        totalQrisSistem += t.totalHarga;
      } else {
        totalTunaiSistem += t.totalHarga;
      }
    });

    const fisikNum = Math.max(0, Number(hitungFisikTunai) || 0);
    const expectedCashInDrawer = activeShift.modalAwal + totalTunaiSistem;
    const selisihKas = fisikNum - expectedCashInDrawer;

    const closedShift = await prisma.shiftKasir.update({
      where: { id: activeShift.id },
      data: {
        status: "CLOSED",
        waktuTutup: new Date(),
        totalTunaiSistem,
        totalQrisSistem,
        totalFreeOrderSistem,
        hitungFisikTunai: fisikNum,
        selisihKas,
        catatan: catatan?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CLOSE_SHIFT",
        details: `Menutup Shift Kasir. Modal: Rp ${activeShift.modalAwal.toLocaleString("id-ID")}, Tunai Sistem: Rp ${totalTunaiSistem.toLocaleString("id-ID")}, Fisik Uang: Rp ${fisikNum.toLocaleString("id-ID")}, Selisih: Rp ${selisihKas.toLocaleString("id-ID")}`,
      },
    });

    revalidatePath("/");
    return { success: true, data: closedShift };
  } catch (error: any) {
    console.error("Close shift error:", error);
    return { success: false, error: "Gagal menutup shift kasir" };
  }
}
