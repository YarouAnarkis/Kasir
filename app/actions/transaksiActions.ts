"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getActivePromosFromDb, evaluatePromoInMemory } from "@/lib/promoEngine";

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

    // Point 4: Eliminate N+1 DB queries by batching menu & promo lookups in parallel
    const menuIds = Array.from(new Set(items.map((i) => i.menuId)));

    const [dbMenus, activePromos, recipes] = await Promise.all([
      prisma.menu.findMany({
        where: { id: { in: menuIds } },
      }),
      isKaryawanOrder ? Promise.resolve([]) : getActivePromosFromDb(),
      prisma.resepMenu.findMany({
        where: { menuId: { in: menuIds } },
      }),
    ]);

    const dbMenuMap = new Map(dbMenus.map((m) => [m.id, m]));

    let calculatedSubtotal = 0;
    let totalHargaAsliSum = 0;
    let totalDiskonSum = 0;

    const processedDetailItems = [];

    // Evaluate in memory (0 DB queries in loop)
    for (const item of items) {
      if (item.jumlah <= 0) {
        return { success: false, error: `Jumlah item ${item.namaMenu} harus lebih dari 0` };
      }

      const dbMenu = dbMenuMap.get(item.menuId);

      const hargaNormal = dbMenu ? dbMenu.harga : item.hargaSatuan;
      const mKategoriId = dbMenu ? dbMenu.kategoriId : item.kategoriId || 0;

      // In-memory promo evaluation
      const promoResult = isKaryawanOrder
        ? null
        : evaluatePromoInMemory(item.menuId, hargaNormal, mKategoriId, activePromos);

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

    const calculatedKembalian = isKaryawanOrder ? 0 : Math.max(0, effectiveDibayar - calculatedTotalHarga);

    const activeKasirId = session ? session.id : undefined;
    const finalNamaKasir = namaKasir || (session ? session.nama : "Kasir Cafe");

    // Deduct raw material inventory based on menu recipes
    if (recipes.length > 0) {
      for (const item of items) {
        const itemRecipes = recipes.filter((r) => r.menuId === item.menuId);
        for (const r of itemRecipes) {
          const deductQty = r.jumlahPakai * item.jumlah;
          try {
            await prisma.bahanBaku.update({
              where: { id: r.bahanBakuId },
              data: {
                stok: { decrement: deductQty },
              },
            });
          } catch (e) {
            console.error("Deduct stock error:", e);
          }
        }
      }
    }

    const newTransaksi = await prisma.transaksi.create({
      data: {
        jenisTransaksi,
        karyawanId: isKaryawanOrder ? karyawanId : undefined,
        namaKaryawan: isKaryawanOrder ? namaKaryawan : undefined,
        kasirId: activeKasirId,
        namaKasir: finalNamaKasir,
        metodePembayaran: isKaryawanOrder ? "FREE ORDER" : metodePembayaran || "TUNAI",
        subtotal: calculatedSubtotal,
        totalHargaAsli: totalHargaAsliSum,
        totalDiskon: totalDiskonSum,
        pajak: calculatedPajak,
        totalHarga: calculatedTotalHarga,
        dibayar: effectiveDibayar,
        kembalian: calculatedKembalian,
        detailTransaksi: {
          create: processedDetailItems,
        },
      },
      include: {
        detailTransaksi: true,
      },
    });

    revalidatePath("/riwayat");
    revalidatePath("/dashboard");
    revalidatePath("/stok");
    revalidatePath("/");

    return {
      success: true,
      data: newTransaksi,
    };
  } catch (error: any) {
    console.error("Error creating transaksi:", error);
    return {
      success: false,
      error: "Gagal menyimpan transaksi ke database: " + error.message,
    };
  }
}

export async function getTransaksiHistory(
  filterDate?: string,
  kasirId?: number,
  jenisTransaksi?: string
) {
  try {
    const where: any = {};

    if (filterDate) {
      const start = new Date(filterDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(filterDate);
      end.setHours(23, 59, 59, 999);

      where.tanggal = {
        gte: start,
        lte: end,
      };
    }

    if (kasirId) {
      where.kasirId = kasirId;
    }

    if (jenisTransaksi && jenisTransaksi !== "all") {
      where.jenisTransaksi = jenisTransaksi;
    }

    const history = await prisma.transaksi.findMany({
      where,
      include: {
        detailTransaksi: true,
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    return { success: true, data: history };
  } catch (error: any) {
    console.error("Error fetching transaksi history:", error);
    return { success: false, error: "Gagal mengambil riwayat transaksi" };
  }
}

export async function getKaryawanListAction() {
  try {
    const list = await prisma.user.findMany({
      where: { aktif: true },
      select: { id: true, nama: true, username: true, role: true },
      orderBy: { nama: "asc" },
    });
    return { success: true, data: list };
  } catch (error: any) {
    console.error("Get karyawan list error:", error);
    return { success: false, error: "Gagal mengambil daftar karyawan" };
  }
}

export async function voidTransaksiAction(transaksiId: number, reason: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Hanya Admin / Super Admin yang bisa membatalkan (Void) transaksi" };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "Alasan pembatalan transaksi wajib diisi" };
    }

    const tx = await prisma.transaksi.findUnique({
      where: { id: transaksiId },
      include: { detailTransaksi: true },
    });

    if (!tx) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    if (tx.isVoid) {
      return { success: false, error: "Transaksi ini sudah dibatalkan sebelumnya" };
    }

    // Revert raw material inventory
    const menuIds = Array.from(new Set(tx.detailTransaksi.map((d) => d.menuId).filter(Boolean))) as number[];
    if (menuIds.length > 0) {
      const recipes = await prisma.resepMenu.findMany({
        where: { menuId: { in: menuIds } },
      });

      for (const detail of tx.detailTransaksi) {
        if (!detail.menuId) continue;
        const itemRecipes = recipes.filter((r) => r.menuId === detail.menuId);
        for (const r of itemRecipes) {
          const revertQty = r.jumlahPakai * detail.jumlah;
          try {
            await prisma.bahanBaku.update({
              where: { id: r.bahanBakuId },
              data: {
                stok: { increment: revertQty },
              },
            });
          } catch (e) {
            console.error("Revert stock error:", e);
          }
        }
      }
    }

    const voided = await prisma.transaksi.update({
      where: { id: transaksiId },
      data: {
        isVoid: true,
        voidReason: reason.trim(),
        voidBy: `${session.nama} (${session.role})`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "VOID_TRANSACTION",
        details: `Membatalkan Transaksi #${tx.nomorStruk.slice(-8)}. Alasan: ${reason.trim()}`,
      },
    });

    revalidatePath("/riwayat");
    revalidatePath("/dashboard");
    revalidatePath("/stok");
    revalidatePath("/");

    return { success: true, data: voided };
  } catch (error: any) {
    console.error("Void transaksi error:", error);
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

    const recentTransactions = await prisma.transaksi.findMany({
      where: {
        isVoid: false,
        tanggal: { gte: sevenDaysAgo },
      },
      include: {
        detailTransaksi: true,
      },
      orderBy: { tanggal: "asc" },
    });

    // Total Hari Ini
    const todayTx = recentTransactions.filter((t) => new Date(t.tanggal) >= todayStart);
    const totalHariIni = todayTx.reduce((acc, t) => acc + (t.jenisTransaksi === "karyawan" ? 0 : t.totalHarga), 0);
    const jumlahTransaksiHariIni = todayTx.length;

    // Hourly Peak Hours Chart (07:00 - 23:00)
    const hourlyMap: Record<string, { hour: string; count: number; omset: number }> = {};
    for (let h = 7; h <= 23; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;
      hourlyMap[label] = { hour: label, count: 0, omset: 0 };
    }

    recentTransactions.forEach((t) => {
      const d = new Date(t.tanggal);
      const hStr = `${String(d.getHours()).padStart(2, "0")}:00`;
      if (hourlyMap[hStr]) {
        hourlyMap[hStr].count += 1;
        if (t.jenisTransaksi !== "karyawan") {
          hourlyMap[hStr].omset += t.totalHarga;
        }
      }
    });
    const hourlyPeak = Object.values(hourlyMap);

    // Weekly Revenue Trend (Last 7 Days)
    const weeklyMap: Record<string, { date: string; dateLabel: string; omset: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      weeklyMap[dateKey] = { date: dateKey, dateLabel, omset: 0, count: 0 };
    }

    recentTransactions.forEach((t) => {
      const dateKey = new Date(t.tanggal).toISOString().split("T")[0];
      if (weeklyMap[dateKey]) {
        weeklyMap[dateKey].count += 1;
        if (t.jenisTransaksi !== "karyawan") {
          weeklyMap[dateKey].omset += t.totalHarga;
        }
      }
    });
    const weeklyTrend = Object.values(weeklyMap);

    // Payment Method Breakdown
    let totalTunai = 0;
    let totalQris = 0;
    let totalFree = 0;

    recentTransactions.forEach((t) => {
      if (t.jenisTransaksi === "karyawan") {
        totalFree += t.subtotal;
      } else if (t.metodePembayaran === "QRIS") {
        totalQris += t.totalHarga;
      } else {
        totalTunai += t.totalHarga;
      }
    });

    // Top 5 Best Sellers
    const itemMap: Record<string, { nama: string; totalQty: number; totalOmset: number }> = {};
    recentTransactions.forEach((t) => {
      t.detailTransaksi.forEach((d) => {
        if (!itemMap[d.namaMenu]) {
          itemMap[d.namaMenu] = { nama: d.namaMenu, totalQty: 0, totalOmset: 0 };
        }
        itemMap[d.namaMenu].totalQty += d.jumlah;
        itemMap[d.namaMenu].totalOmset += d.subtotal;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    return {
      success: true,
      data: {
        totalHariIni,
        jumlahTransaksiHariIni,
        totalSemuaTransaksi: recentTransactions.length,
        hourlyPeak,
        weeklyTrend,
        paymentBreakdown: { totalTunai, totalQris, totalFree },
        topItems,
      },
    };
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: "Gagal mengambil statistik dashboard" };
  }
}
