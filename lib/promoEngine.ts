import { prisma } from "@/lib/prisma";

export interface EvaluatedPromo {
  promoId: number;
  namaPromo: string;
  hargaAsli: number;
  hargaPromo: number;
  potongan: number;
}

/**
 * Check if current time HH:mm falls within jamMulai and jamSelesai
 * Correctly handles overnight time ranges (e.g. 21:00 -> 02:00)
 */
export function isCurrentTimeInWindow(
  now: Date,
  jamMulai?: string | null,
  jamSelesai?: string | null
): boolean {
  if (!jamMulai || !jamSelesai) return true;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = jamMulai.split(":").map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = jamSelesai.split(":").map(Number);
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Normal range e.g. 14:00 -> 17:00
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight range e.g. 21:00 -> 02:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Evaluate active promo for a menu item based on current date & time
 */
export async function evaluateMenuPromo(
  menuId: number,
  hargaAsli: number,
  kategoriId: number,
  targetDate: Date = new Date()
): Promise<EvaluatedPromo | null> {
  try {
    // Fetch all active promos
    const activePromos = await prisma.promo.findMany({
      where: { aktif: true },
      include: {
        promoMenus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (activePromos.length === 0) return null;

    let selectedPromo: any = null;

    // 1. High Priority: Specific Date Promos (e.g. 17 Agustus)
    for (const p of activePromos) {
      if (p.tanggalMulai && p.tanggalSelesai) {
        const start = new Date(p.tanggalMulai);
        start.setHours(0, 0, 0, 0);

        const end = new Date(p.tanggalSelesai);
        end.setHours(23, 59, 59, 999);

        if (targetDate >= start && targetDate <= end) {
          // Check scope applicability
          if (p.berlakuUntuk === "semua") {
            selectedPromo = p;
            break;
          } else if (p.berlakuUntuk === "kategori" && p.kategoriId === kategoriId) {
            selectedPromo = p;
            break;
          } else if (
            p.berlakuUntuk === "menu_tertentu" &&
            p.promoMenus.some((pm) => pm.menuId === menuId)
          ) {
            selectedPromo = p;
            break;
          }
        }
      }
    }

    // 2. Second Priority: Recurring Hour Promos (e.g. Happy Hour 21:00 -> 00:00)
    if (!selectedPromo) {
      for (const p of activePromos) {
        if (p.jamMulai && p.jamSelesai && !p.tanggalMulai) {
          if (isCurrentTimeInWindow(targetDate, p.jamMulai, p.jamSelesai)) {
            if (p.berlakuUntuk === "semua") {
              selectedPromo = p;
              break;
            } else if (p.berlakuUntuk === "kategori" && p.kategoriId === kategoriId) {
              selectedPromo = p;
              break;
            } else if (
              p.berlakuUntuk === "menu_tertentu" &&
              p.promoMenus.some((pm) => pm.menuId === menuId)
            ) {
              selectedPromo = p;
              break;
            }
          }
        }
      }
    }

    if (!selectedPromo) return null;

    let hargaFinal = hargaAsli;

    if (selectedPromo.tipeDiskon === "harga_tetap") {
      hargaFinal = Math.max(0, Math.round(selectedPromo.nilai));
    } else if (selectedPromo.tipeDiskon === "persentase") {
      const discountAmount = (hargaAsli * selectedPromo.nilai) / 100;
      hargaFinal = Math.max(0, Math.round(hargaAsli - discountAmount));
    } else if (selectedPromo.tipeDiskon === "nominal") {
      hargaFinal = Math.max(0, Math.round(hargaAsli - selectedPromo.nilai));
    }

    const potongan = Math.max(0, hargaAsli - hargaFinal);

    return {
      promoId: selectedPromo.id,
      namaPromo: selectedPromo.nama,
      hargaAsli,
      hargaPromo: hargaFinal,
      potongan,
    };
  } catch (err) {
    console.error("Error evaluating promo:", err);
    return null;
  }
}
