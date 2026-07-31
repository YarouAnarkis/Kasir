"use client";

import { useState, useTransition } from "react";
import {
  updateSystemSettingsAction,
  purgeTransactionDataAction,
} from "@/app/actions/systemActions";
import {
  Settings,
  ShieldAlert,
  FileText,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Percent,
  Store,
  Phone,
  MapPin,
  Clock,
  UserCheck
} from "lucide-react";

export interface SystemSettingsData {
  id: number;
  namaToko: string;
  alamatToko: string;
  teleponToko: string;
  persenPajak: number;
}

export interface AuditLogData {
  id: number;
  action: string;
  details: string;
  createdAt: Date | string;
  user: {
    nama: string;
    username: string;
    role: string;
  };
}

interface SystemSettingsClientProps {
  initialSettings: SystemSettingsData;
  initialAuditLogs: AuditLogData[];
}

export default function SystemSettingsClient({
  initialSettings,
  initialAuditLogs,
}: SystemSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "audit" | "danger">("settings");

  // Form Settings State
  const [namaToko, setNamaToko] = useState(initialSettings.namaToko);
  const [alamatToko, setAlamatToko] = useState(initialSettings.alamatToko);
  const [teleponToko, setTeleponToko] = useState(initialSettings.teleponToko);
  const [persenPajak, setPersenPajak] = useState<string>(String(initialSettings.persenPajak));

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const pajakNum = Number(persenPajak);
    if (!namaToko.trim() || isNaN(pajakNum) || pajakNum < 0) {
      setErrorMsg("Nama toko dan persentase pajak wajib diisi dengan benar.");
      return;
    }

    startTransition(async () => {
      const res = await updateSystemSettingsAction({
        namaToko,
        alamatToko,
        teleponToko,
        persenPajak: pajakNum,
      });

      if (res.success && res.data) {
        setSuccessMsg("Pengaturan sistem berhasil diperbarui!");
      } else {
        setErrorMsg(res.error || "Gagal memperbarui pengaturan sistem");
      }
    });
  };

  const handlePurgeData = () => {
    const confirmText = prompt(
      'Ketik "HAPUS PERMANEN" untuk mengonfirmasi pembersihan seluruh riwayat transaksi.'
    );
    if (confirmText !== "HAPUS PERMANEN") {
      alert("Konfirmasi dibatalkan.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await purgeTransactionDataAction();
      if (res.success) {
        setSuccessMsg("Seluruh data riwayat transaksi berhasil dihapus secara permanen.");
      } else {
        setErrorMsg(res.error || "Gagal menghapus data transaksi");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Fitur Khusus Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Pengaturan Sistem & Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Konfigurasi Pajak Resto, informasi toko, log aktivitas sensitif, dan pembersihan data.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-amber-700 text-white shadow"
                : "text-stone-400 hover:text-stone-100"
            }`}
          >
            Pengaturan Toko
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-amber-700 text-white shadow"
                : "text-stone-400 hover:text-stone-100"
            }`}
          >
            Audit Log ({initialAuditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("danger")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "danger"
                ? "bg-red-800 text-white shadow"
                : "text-red-400 hover:bg-red-950/40"
            }`}
          >
            Hapus Data
          </button>
        </div>
      </div>

      {/* Notices */}
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

      {/* Tab 1: Pengaturan Sistem */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-6 coffee-card-shadow">
          <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Store className="w-5 h-5 text-amber-700" />
            Informasi Toko & Pajak Resto
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-500" /> Nama Coffee Shop / Outlet
              </label>
              <input
                type="text"
                value={namaToko}
                onChange={(e) => setNamaToko(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-bold focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-500" /> Alamat Lengkap
              </label>
              <input
                type="text"
                value={alamatToko}
                onChange={(e) => setAlamatToko(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-500" /> Nomor Telepon / WA
                </label>
                <input
                  type="text"
                  value={teleponToko}
                  onChange={(e) => setTeleponToko(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-mono focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-stone-500" /> Default Pajak Resto (%)
                </label>
                <input
                  type="number"
                  value={persenPajak}
                  onChange={(e) => setPersenPajak(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isPending ? "Simpan..." : "Simpan Pengaturan Toko"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Audit Log */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden coffee-card-shadow">
          <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
            <h2 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-700" />
              Catatan Audit Log Aktivitas Penting ({initialAuditLogs.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-[11px] font-extrabold text-stone-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Waktu Kejadian</th>
                  <th className="py-3.5 px-4">Pengguna (User)</th>
                  <th className="py-3.5 px-4">Aksi Audit</th>
                  <th className="py-3.5 px-4">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                {initialAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-stone-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      <span>{log.user.nama}</span>
                      <span className="ml-1 text-[10px] text-stone-400 font-mono">
                        (@{log.user.username})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-700 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permanent Data Wipe */}
      {activeTab === "danger" && (
        <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-md space-y-4 coffee-card-shadow">
          <div className="flex items-center gap-3 text-red-700">
            <ShieldAlert className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-lg font-extrabold text-red-950">Zona Bahaya: Pembersihan Data Permanen</h2>
              <p className="text-xs text-red-800">
                Fitur ini khusus Super Admin untuk menghapus seluruh data riwayat transaksi dan detailnya dari database.
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
            <p className="font-bold">⚠️ PERINGATAN KERAS:</p>
            <ul className="list-disc pl-5 space-y-1 text-stone-700">
              <li>Tindakan ini akan <strong>menghapus seluruh riwayat transaksi</strong> secara permanen.</li>
              <li>Data yang telah dihapus <strong>tidak dapat dikembalikan (irreversible)</strong>.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handlePurgeData}
              disabled={isPending}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPending ? "Proses Menghapus..." : "Hapus Seluruh Riwayat Transaksi"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
