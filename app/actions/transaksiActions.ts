"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CartItemPayload {
  menuId: number;
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
}

export interface CreateTransaksiPayload {
  items: CartItemPayload[];
  pajak: number;
  dibayar: number;
  namaKasir?: string;
  metodePembayaran?: string;
}

export async function createTransaksi(payload: CreateTransaksiPayload) {
  try {
    const { items, pajak, dibayar, namaKasir, metodePembayaran } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "Keranjang belanja masih kosong" };
    }

    // Verify subtotal calculation
    let calculatedSubtotal = 0;
    for (const item of items) {
      if (item.jumlah <= 0) {
        return { success: false, error: `Jumlah item ${item.namaMenu} harus lebih dari 0` };
      }
      calculatedSubtotal += item.hargaSatuan * item.jumlah;
    }

    const calculatedPajak = Math.round(pajak);
    const calculatedTotalHarga = calculatedSubtotal + calculatedPajak;

    if (dibayar < calculatedTotalHarga) {
      return {
        success: false,
        error: `Uang dibayar (Rp ${dibayar.toLocaleString('id-ID')}) kurang dari total (Rp ${calculatedTotalHarga.toLocaleString('id-ID')})`,
      };
    }

    const kembalian = dibayar - calculatedTotalHarga;

    // Execute database transaction
    const transaksi = await prisma.transaksi.create({
      data: {
        namaKasir: namaKasir && namaKasir.trim() !== "" ? namaKasir.trim() : "Kasir Cafe",
        metodePembayaran: metodePembayaran || "TUNAI",
        subtotal: calculatedSubtotal,
        pajak: calculatedPajak,
        totalHarga: calculatedTotalHarga,
        dibayar: Math.round(dibayar),
        kembalian: Math.round(kembalian),
        detailTransaksi: {
          create: items.map((item) => ({
            menuId: item.menuId,
            namaMenu: item.namaMenu,
            hargaSatuan: item.hargaSatuan,
            jumlah: item.jumlah,
            subtotal: item.hargaSatuan * item.jumlah,
          })),
        },
      },
      include: {
        detailTransaksi: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/riwayat");
    revalidatePath("/dashboard");

    return { success: true, data: transaksi };
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Gagal menyimpan transaksi" };
  }
}

export async function getTransaksiHistory(startDate?: string, endDate?: string) {
  try {
    const where: any = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      where.tanggal = {
        gte: start,
        lte: end,
      };
    }

    const transactions = await prisma.transaksi.findMany({
      where,
      include: {
        detailTransaksi: true,
      },
      orderBy: { tanggal: "desc" },
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Gagal mengambil riwayat transaksi" };
  }
}

export async function getTransaksiById(id: number) {
  try {
    const transaction = await prisma.transaksi.findUnique({
      where: { id },
      include: {
        detailTransaksi: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    return { success: true, data: transaction };
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    return { success: false, error: "Gagal mengambil detail transaksi" };
  }
}

export async function getDashboardStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's stats
    const todayTransactions = await prisma.transaksi.findMany({
      where: {
        tanggal: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const totalHariIni = todayTransactions.reduce((acc, t) => acc + t.totalHarga, 0);
    const jumlahTransaksiHariIni = todayTransactions.length;

    // Top selling items
    const topItemsRaw = await prisma.detailTransaksi.groupBy({
      by: ["namaMenu"],
      _sum: {
        jumlah: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          jumlah: "desc",
        },
      },
      take: 5,
    });

    const topItems = topItemsRaw.map((item) => ({
      nama: item.namaMenu,
      terjual: item._sum.jumlah || 0,
      totalPendapatan: item._sum.subtotal || 0,
    }));

    // Last 7 days sales for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTransactions = await prisma.transaksi.findMany({
      where: {
        tanggal: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        tanggal: true,
        totalHarga: true,
      },
    });

    // Group by date
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dailyMap[dateStr] = 0;
    }

    recentTransactions.forEach((t) => {
      const dateStr = t.tanggal.toISOString().split("T")[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += t.totalHarga;
      }
    });

    const salesChart = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      total,
    }));

    // Total all time revenue & transactions
    const totalSemuaTransaksi = await prisma.transaksi.count();

    return {
      success: true,
      data: {
        totalHariIni,
        jumlahTransaksiHariIni,
        totalSemuaTransaksi,
        topItems,
        salesChart,
      },
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Gagal mengambil data statistik dashboard" };
  }
}
