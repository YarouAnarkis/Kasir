"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { evaluateMenuPromo } from "@/lib/promoEngine";

export interface CartItemPayload {
  menuId: number;
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
  kategoriId?: number;
}

export interface CreateTransaksiPayload {
  items: CartItemPayload[];
  pajak: number;
  dibayar: number;
  namaKasir?: string;
  metodePembayaran?: string;
  jenisTransaksi?: "regular" | "karyawan";
  karyawanId?: number;
  namaKaryawan?: string;
}

export async function createTransaksi(payload: CreateTransaksiPayload) {
  try {
    const session = await getSession();
    const {
      items,
      pajak,
      dibayar,
      namaKasir,
      metodePembayaran,
      jenisTransaksi = "regular",
      karyawanId,
      namaKaryawan,
    } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "Keranjang belanja masih kosong" };
    }

    const isKaryawanOrder = jenisTransaksi === "karyawan";

    let calculatedSubtotal = 0;
    let totalHargaAsliSum = 0;
    let totalDiskonSum = 0;

    const processedDetailItems = [];

    // Evaluate promo & calculate prices for each cart item
    for (const item of items) {
      if (item.jumlah <= 0) {
        return { success: false, error: `Jumlah item ${item.namaMenu} harus lebih dari 0` };
      }

      // Fetch menu to ensure current price & category
      const dbMenu = await prisma.menu.findUnique({
        where: { id: item.menuId },
      });

      const hargaNormal = dbMenu ? dbMenu.harga : item.hargaSatuan;
      const mKategoriId = dbMenu ? dbMenu.kategoriId : item.kategoriId || 0;

      // Evaluate dynamic promo
      const promoResult = isKaryawanOrder
        ? null
        : await evaluateMenuPromo(item.menuId, hargaNormal, mKategoriId);

      const unitHargaFinal = isKaryawanOrder
        ? 0
        : promoResult
        ? promoResult.hargaPromo
        : item.hargaSatuan;

      const itemSubtotal = unitHargaFinal * item.jumlah;
      const itemHargaAsliSubtotal = hargaNormal * item.jumlah;

      calculatedSubtotal += itemSubtotal;
      totalHargaAsliSum += itemHargaAsliSubtotal;

      if (promoResult) {
        totalDiskonSum += (hargaNormal - promoResult.hargaPromo) * item.jumlah;
      }

      processedDetailItems.push({
        menuId: item.menuId,
        namaMenu: item.namaMenu,
        hargaAsli: hargaNormal,
        hargaPromo: promoResult ? promoResult.hargaPromo : null,
        promoId: promoResult ? promoResult.promoId : null,
        namaPromo: promoResult ? promoResult.namaPromo : null,
        hargaSatuan: unitHargaFinal,
        jumlah: item.jumlah,
        subtotal: itemSubtotal,
      });
    }

    const calculatedPajak = isKaryawanOrder ? 0 : Math.round(pajak);
    const calculatedTotalHarga = isKaryawanOrder ? 0 : calculatedSubtotal + calculatedPajak;

    const effectiveDibayar = isKaryawanOrder ? 0 : Math.round(dibayar);

    if (!isKaryawanOrder && effectiveDibayar < calculatedTotalHarga) {
      return {
        success: false,
        error: `Uang dibayar (Rp ${effectiveDibayar.toLocaleString('id-ID')}) kurang dari total (Rp ${calculatedTotalHarga.toLocaleString('id-ID')})`,
      };
    }

    const kembalian = isKaryawanOrder ? 0 : effectiveDibayar - calculatedTotalHarga;

    // Save transaction
    const transaksi = await prisma.transaksi.create({
      data: {
        jenisTransaksi,
        karyawanId: isKaryawanOrder && karyawanId ? Number(karyawanId) : null,
        namaKaryawan: isKaryawanOrder ? namaKaryawan : null,
        kasirId: session ? session.id : null,
        namaKasir: session ? session.nama : (namaKasir && namaKasir.trim() !== "" ? namaKasir.trim() : "Kasir Cafe"),
        metodePembayaran: isKaryawanOrder ? "FREE ORDER" : (metodePembayaran || "TUNAI"),
        subtotal: calculatedSubtotal,
        totalHargaAsli: totalHargaAsliSum,
        totalDiskon: totalDiskonSum,
        pajak: calculatedPajak,
        totalHarga: calculatedTotalHarga,
        dibayar: effectiveDibayar,
        kembalian: Math.max(0, Math.round(kembalian)),
        detailTransaksi: {
          create: processedDetailItems,
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

export async function getTransaksiHistory(
  startDate?: string,
  endDate?: string,
  jenisTransaksiFilter?: string,
  kasirIdFilter?: string
) {
  try {
    const session = await getSession();
    const where: any = {};

    // Karyawan role can only see their own transactions
    if (session && session.role === "karyawan") {
      where.OR = [
        { kasirId: session.id },
        { namaKasir: session.nama },
      ];
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      where.tanggal = { gte: start, lte: end };
    }

    if (jenisTransaksiFilter && jenisTransaksiFilter !== "all") {
      where.jenisTransaksi = jenisTransaksiFilter;
    }

    if (kasirIdFilter && kasirIdFilter !== "all") {
      where.kasirId = Number(kasirIdFilter);
    }

    const transactions = await prisma.transaksi.findMany({
      where,
      include: {
        detailTransaksi: true,
        karyawan: {
          select: { nama: true },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Gagal mengambil riwayat transaksi" };
  }
}

export async function voidTransaksiAction(id: number, reason: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Hanya Admin / Super Admin yang bisa melakukan Void transaksi" };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "Alasan pembatalan (Void) wajib diisi" };
    }

    const transaction = await prisma.transaksi.findUnique({ where: { id } });
    if (!transaction) return { success: false, error: "Transaksi tidak ditemukan" };

    if (transaction.isVoid) {
      return { success: false, error: "Transaksi ini sudah dibatalkan sebelumnya" };
    }

    const updated = await prisma.transaksi.update({
      where: { id },
      data: {
        isVoid: true,
        voidReason: reason.trim(),
        voidBy: session.nama,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "VOID_TRANSACTION",
        details: `Membatalkan (Void) transaksi #${transaction.nomorStruk}. Alasan: ${reason.trim()}`,
      },
    });

    revalidatePath("/riwayat");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Void transaction error:", error);
    return { success: false, error: "Gagal membatalkan transaksi" };
  }
}

export async function getDashboardStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [todayTransactions, topItemsRaw, recentTransactions, totalSemuaTransaksi] =
      await Promise.all([
        prisma.transaksi.findMany({
          where: {
            isVoid: false,
            tanggal: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          select: {
            totalHarga: true,
          },
        }),
        prisma.detailTransaksi.groupBy({
          where: {
            transaksi: { isVoid: false },
          },
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
        }),
        prisma.transaksi.findMany({
          where: {
            isVoid: false,
            tanggal: {
              gte: sevenDaysAgo,
            },
          },
          select: {
            tanggal: true,
            totalHarga: true,
          },
        }),
        prisma.transaksi.count({ where: { isVoid: false } }),
      ]);

    const totalHariIni = todayTransactions.reduce((acc, t) => acc + t.totalHarga, 0);
    const jumlahTransaksiHariIni = todayTransactions.length;

    const topItems = topItemsRaw.map((item) => ({
      nama: item.namaMenu,
      terjual: item._sum.jumlah || 0,
      totalPendapatan: item._sum.subtotal || 0,
    }));

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

export async function getKaryawanListAction() {
  try {
    const karyawans = await prisma.user.findMany({
      where: { aktif: true, role: "karyawan" },
      select: { id: true, nama: true, username: true },
      orderBy: { nama: "asc" },
    });
    return { success: true, data: karyawans };
  } catch (err) {
    return { success: false, data: [] };
  }
}
