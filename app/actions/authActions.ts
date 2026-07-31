"use server";

import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signToken,
  setSessionCookie,
  removeSessionCookie,
  getSession,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: { username: string; password: string }) {
  try {
    const { username, password } = formData;
    if (!username || !password) {
      return { success: false, error: "Username dan password wajib diisi" };
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user) {
      return { success: false, error: "Username atau password salah" };
    }

    if (!user.aktif) {
      return { success: false, error: "Akun Anda telah dinonaktifkan. Hubungi admin." };
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return { success: false, error: "Username atau password salah" };
    }

    const sessionPayload = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role as "karyawan" | "admin" | "super_admin",
    };

    const token = await signToken(sessionPayload);
    await setSessionCookie(token);

    return { success: true, data: sessionPayload };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: "Terjadi kesalahan saat login" };
  }
}

export async function logoutAction() {
  await removeSessionCookie();
  return { success: true };
}

export async function getCurrentUserAction() {
  return await getSession();
}

/**
 * Verify admin password for sensitive operations (e.g., approving Employee Free Orders)
 */
export async function verifyAdminPasswordAction(passwordInput: string) {
  try {
    if (!passwordInput || !passwordInput.trim()) {
      return { success: false, error: "Password otoritas admin wajib diisi" };
    }

    // Find all active admins and super admins
    const admins = await prisma.user.findMany({
      where: {
        aktif: true,
        role: { in: ["admin", "super_admin"] },
      },
    });

    for (const admin of admins) {
      const isMatch = await verifyPassword(passwordInput, admin.password);
      if (isMatch) {
        return {
          success: true,
          adminName: admin.nama,
          adminRole: admin.role,
        };
      }
    }

    return { success: false, error: "Password otoritas admin salah atau tidak valid" };
  } catch (error: any) {
    console.error("Verify admin password error:", error);
    return { success: false, error: "Gagal memverifikasi password admin" };
  }
}

export async function getUsersAction() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const where: any = {};

    // Point 7: Regular Admin CANNOT view Super Admin accounts
    if (session.role === "admin") {
      where.role = { not: "super_admin" };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error: any) {
    console.error("Get users error:", error);
    return { success: false, error: "Gagal mengambil data user" };
  }
}

export async function createUserAction(data: {
  nama: string;
  username: string;
  password: string;
  role: "karyawan" | "admin" | "super_admin";
}) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    // Point 1: Admin can ONLY create karyawan accounts
    if (session.role === "admin" && data.role !== "karyawan") {
      return { success: false, error: "Admin biasa hanya diperbolehkan membuat akun karyawan/kasir" };
    }

    if (!data.nama.trim() || !data.username.trim() || !data.password) {
      return { success: false, error: "Semua bidang wajib diisi" };
    }

    const usernameLower = data.username.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { username: usernameLower },
    });
    if (existing) {
      return { success: false, error: "Username sudah digunakan" };
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        nama: data.nama.trim(),
        username: usernameLower,
        password: hashedPassword,
        role: data.role,
        aktif: true,
      },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_USER",
        details: `Membuat akun user baru: ${newUser.username} (${newUser.role})`,
      },
    });

    revalidatePath("/users");
    return { success: true, data: newUser };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, error: "Gagal membuat user baru" };
  }
}

export async function toggleUserStatusAction(id: number, aktif: boolean) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return { success: false, error: "Akses tidak diizinkan" };
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { success: false, error: "User tidak ditemukan" };
    }

    if (session.role === "admin" && targetUser.role !== "karyawan") {
      return { success: false, error: "Admin hanya bisa mengubah status karyawan" };
    }

    if (session.id === id) {
      return { success: false, error: "Anda tidak bisa menonaktifkan akun sendiri" };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { aktif },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "TOGGLE_USER_STATUS",
        details: `Mengubah status user ${targetUser.username} menjadi ${aktif ? "Aktif" : "Non-Aktif"}`,
      },
    });

    revalidatePath("/users");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Toggle status error:", error);
    return { success: false, error: "Gagal mengubah status user" };
  }
}

export async function deleteUserAction(id: number) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return { success: false, error: "Hanya Super Admin yang bisa menghapus user" };
    }

    if (session.id === id) {
      return { success: false, error: "Tidak dapat menghapus akun sendiri" };
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return { success: false, error: "User tidak ditemukan" };

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE_USER",
        details: `Menghapus user permanen: ${targetUser.username} (${targetUser.role})`,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, error: "Gagal menghapus user" };
  }
}
