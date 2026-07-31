"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSystemSettingsAction() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 1,
          namaToko: "Kasir Coffee Shop",
          alamatToko: "Jl. Kopi Harapan No. 88, Jakarta",
          teleponToko: "0812-3456-7890",
          persenPajak: 10,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Get system settings error:", error);
    return { success: false, error: "Gagal mengambil pengaturan sistem" };
  }
}

export async function updateSystemSettingsAction(data: {
  namaToko: string;
  alamatToko: string;
  teleponToko: string;
  persenPajak: number;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return { success: false, error: "Hanya Super Admin yang bisa memperbarui pengaturan sistem" };
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 1 },
      update: {
        namaToko: data.namaToko.trim(),
        alamatToko: data.alamatToko.trim(),
        teleponToko: data.teleponToko.trim(),
        persenPajak: Number(data.persenPajak) || 0,
      },
      create: {
        id: 1,
        namaToko: data.namaToko.trim(),
        alamatToko: data.alamatToko.trim(),
        teleponToko: data.teleponToko.trim(),
        persenPajak: Number(data.persenPajak) || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_SYSTEM_SETTINGS",
        details: `Memperbarui pengaturan sistem: Pajak=${data.persenPajak}%, Toko=${data.namaToko}`,
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update settings error:", error);
    return { success: false, error: "Gagal memperbarui pengaturan sistem" };
  }
}

export async function getAuditLogsAction() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return { success: false, error: "Hanya Super Admin yang bisa mengakses Audit Log" };
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { nama: true, username: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { success: true, data: logs };
  } catch (error: any) {
    console.error("Get audit logs error:", error);
    return { success: false, error: "Gagal mengambil audit log" };
  }
}

export async function purgeTransactionDataAction() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return { success: false, error: "Hanya Super Admin yang bisa menghapus data transaksi secara permanen" };
    }

    await prisma.detailTransaksi.deleteMany({});
    await prisma.transaksi.deleteMany({});

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "PURGE_TRANSACTIONS",
        details: `Menghapus seluruh riwayat transaksi secara permanen (Data Reset)`,
      },
    });

    revalidatePath("/riwayat");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Purge transactions error:", error);
    return { success: false, error: "Gagal menghapus data transaksi" };
  }
}
