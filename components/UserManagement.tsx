"use client";

import { useState, useTransition } from "react";
import {
  createUserAction,
  toggleUserStatusAction,
  deleteUserAction,
} from "@/app/actions/authActions";
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Key
} from "lucide-react";

export interface UserItem {
  id: number;
  nama: string;
  username: string;
  role: string;
  aktif: boolean;
  createdAt: Date | string;
}

interface UserManagementProps {
  initialUsers: UserItem[];
  currentSessionRole: "karyawan" | "admin" | "super_admin";
  currentSessionId: number;
}

export default function UserManagement({
  initialUsers,
  currentSessionRole,
  currentSessionId,
}: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formNama, setFormNama] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"karyawan" | "admin">("karyawan");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formNama.trim() || !formUsername.trim() || !formPassword) {
      setErrorMsg("Semua bidang wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        nama: formNama,
        username: formUsername,
        password: formPassword,
        role: formRole,
      });

      if (res.success && res.data) {
        setUsers((prev) => [res.data as UserItem, ...prev]);
        setSuccessMsg(`Akun ${res.data.username} berhasil dibuat!`);
        setIsAddModalOpen(false);
        setFormNama("");
        setFormUsername("");
        setFormPassword("");
      } else {
        setErrorMsg(res.error || "Gagal membuat user baru");
      }
    });
  };

  const handleToggleStatus = (user: UserItem) => {
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await toggleUserStatusAction(user.id, !user.aktif);
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, aktif: res.data.aktif } : u))
        );
        setSuccessMsg(
          `Status akun ${user.username} diubah menjadi ${res.data.aktif ? "Aktif" : "Non-Aktif"}`
        );
      } else {
        setErrorMsg(res.error || "Gagal mengubah status user");
      }
    });
  };

  const handleDeleteUser = (user: UserItem) => {
    if (!confirm(`Yakin ingin menghapus akun ${user.username} secara permanen?`)) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setSuccessMsg(`Akun ${user.username} berhasil dihapus.`);
      } else {
        setErrorMsg(res.error || "Gagal menghapus user");
      }
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "super_admin":
        return { label: "Super Admin", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "admin":
        return { label: "Admin Store", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      default:
        return { label: "Kasir / Karyawan", bg: "bg-amber-50 text-amber-800 border-amber-200" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Pengguna & Hak Akses (RBAC)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Kelola Akun Karyawan & Admin
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Tambah staf kasir baru, atur role hak akses, dan kelola akun pengguna aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden coffee-card-shadow">
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
          <h2 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            Daftar Akun Pengguna ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100/70 border-b border-stone-200 text-[11px] font-extrabold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nama Pengguna</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {users.map((u) => {
                const roleBadge = getRoleDisplay(u.role);
                const isSelf = u.id === currentSessionId;
                return (
                  <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-stone-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-extrabold text-xs border border-stone-200">
                          {u.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{u.nama}</span>
                          {isSelf && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-semibold text-stone-700">
                      @{u.username}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {u.aktif ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isPending}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              u.aktif
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                            }`}
                          >
                            {u.aktif ? "Non-aktifkan" : "Aktifkan"}
                          </button>
                        )}

                        {currentSessionRole === "super_admin" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isPending}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Akun Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-100">Buat Akun Pengguna Baru</h3>
                  <p className="text-[11px] text-amber-200">Tambah akun karyawan / admin baru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Username Login</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: budi"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Password</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Role Hak Akses</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "karyawan" | "admin")}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600"
                >
                  <option value="karyawan">Kasir / Karyawan (Input transaksi)</option>
                  <option value="admin">Admin Store (CRUD Menu, Laporan, Promo)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Simpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
