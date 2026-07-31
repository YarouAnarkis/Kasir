"use client";

import { useState, useTransition } from "react";
import {
  createPromoAction,
  togglePromoStatusAction,
  deletePromoAction,
} from "@/app/actions/promoActions";
import {
  Tag,
  Plus,
  Percent,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Layers,
  Check
} from "lucide-react";

export interface PromoItem {
  id: number;
  nama: string;
  tipeDiskon: string;
  nilai: number;
  tanggalMulai?: string | Date | null;
  tanggalSelesai?: string | Date | null;
  jamMulai?: string | null;
  jamSelesai?: string | null;
  berlakuUntuk: string;
  kategoriId?: number | null;
  kategori?: { nama: string } | null;
  aktif: boolean;
  creator: { nama: string; username: string };
  promoMenus?: { menu: { id: number; nama: string } }[];
  _count?: { detailTransaksi: number };
  createdAt: string | Date;
}

export interface CategoryOption {
  id: number;
  nama: string;
}

export interface MenuOption {
  id: number;
  nama: string;
  harga: number;
}

interface PromoManagementProps {
  initialPromos: PromoItem[];
  categories: CategoryOption[];
  menus: MenuOption[];
}

export default function PromoManagement({
  initialPromos,
  categories,
  menus,
}: PromoManagementProps) {
  const [promos, setPromos] = useState<PromoItem[]>(initialPromos);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [nama, setNama] = useState("");
  const [tipeDiskon, setTipeDiskon] = useState<"persentase" | "nominal" | "harga_tetap">("persentase");
  const [nilai, setNilai] = useState<string>("");
  const [conditionType, setConditionType] = useState<"time" | "date" | "both">("time");
  const [jamMulai, setJamMulai] = useState("21:00");
  const [jamSelesai, setJamSelesai] = useState("00:00");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [berlakuUntuk, setBerlakuUntuk] = useState<"semua" | "kategori" | "menu_tertentu">("semua");
  const [kategoriId, setKategoriId] = useState<string>("");
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggleMenuSelection = (mId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const nilaiNum = Number(nilai);
    if (!nama.trim() || isNaN(nilaiNum) || nilaiNum <= 0) {
      setErrorMsg("Nama promo dan nilai diskon wajib diisi dengan benar");
      return;
    }

    startTransition(async () => {
      const res = await createPromoAction({
        nama,
        tipeDiskon,
        nilai: nilaiNum,
        jamMulai: conditionType === "time" || conditionType === "both" ? jamMulai : undefined,
        jamSelesai: conditionType === "time" || conditionType === "both" ? jamSelesai : undefined,
        tanggalMulai: conditionType === "date" || conditionType === "both" ? tanggalMulai : undefined,
        tanggalSelesai: conditionType === "date" || conditionType === "both" ? tanggalSelesai : undefined,
        berlakuUntuk,
        kategoriId: berlakuUntuk === "kategori" && kategoriId ? Number(kategoriId) : undefined,
        menuIds: berlakuUntuk === "menu_tertentu" ? selectedMenuIds : undefined,
      });

      if (res.success && res.data) {
        setPromos((prev) => [res.data as unknown as PromoItem, ...prev]);
        setSuccessMsg(`Promo "${res.data.nama}" berhasil dibuat!`);
        setIsAddModalOpen(false);
        setNama("");
        setNilai("");
        setSelectedMenuIds([]);
      } else {
        setErrorMsg(res.error || "Gagal membuat promo");
      }
    });
  };

  const handleToggleStatus = (p: PromoItem) => {
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await togglePromoStatusAction(p.id, !p.aktif);
      if (res.success && res.data) {
        setPromos((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, aktif: res.data.aktif } : item))
        );
        setSuccessMsg(`Status promo "${p.nama}" diubah menjadi ${res.data.aktif ? "Aktif" : "Non-Aktif"}`);
      } else {
        setErrorMsg(res.error || "Gagal mengubah status promo");
      }
    });
  };

  const handleDeletePromo = (p: PromoItem) => {
    if (!confirm(`Yakin ingin menghapus promo "${p.nama}"?`)) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await deletePromoAction(p.id);
      if (res.success) {
        setPromos((prev) => prev.filter((item) => item.id !== p.id));
        setSuccessMsg(`Promo "${p.nama}" berhasil dihapus.`);
      } else {
        setErrorMsg(res.error || "Gagal menghapus promo");
      }
    });
  };

  const formatDiscountDisplay = (tipe: string, val: number) => {
    if (tipe === "persentase") return `Diskon ${val}%`;
    if (tipe === "nominal") return `Potongan Rp ${val.toLocaleString("id-ID")}`;
    if (tipe === "harga_tetap") return `Harga Spesial Rp ${val.toLocaleString("id-ID")}`;
    return `${val}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Manajemen Diskon & Promo Dinamis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Kelola Promo Happy Hour & Tanggal Khusus
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Buat promo Happy Hour recurring (termasuk lintas tengah malam) atau harga diskon tanggal tertentu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Promo Baru</span>
        </button>
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

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-3xl p-5 border shadow-md flex flex-col justify-between transition-all coffee-card-shadow ${
              p.aktif ? "border-amber-200" : "border-stone-200 bg-stone-50/70"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {formatDiscountDisplay(p.tipeDiskon, p.nilai)}
                  </span>
                  <h3 className="text-base font-extrabold text-stone-900 mt-1">
                    {p.nama}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    p.aktif
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-stone-100 text-stone-600 border-stone-300"
                  }`}
                >
                  {p.aktif ? "Aktif" : "Non-Aktif"}
                </span>
              </div>

              {/* Conditions Info */}
              <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                {p.jamMulai && p.jamSelesai && (
                  <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Jam: <strong>{p.jamMulai} - {p.jamSelesai}</strong>
                    </span>
                  </div>
                )}

                {p.tanggalMulai && p.tanggalSelesai && (
                  <div className="flex items-center gap-1.5 text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      Tanggal: {new Date(p.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                      {new Date(p.tanggalSelesai).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-stone-700">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    Cakupan:{" "}
                    <strong>
                      {p.berlakuUntuk === "semua"
                        ? "Semua Menu"
                        : p.berlakuUntuk === "kategori"
                        ? `Kategori ${p.kategori?.nama || ""}`
                        : "Menu Terpilih"}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-stone-500 text-[11px] pt-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Telah Dipakai: <strong>{p._count?.detailTransaksi || 0}x</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => handleToggleStatus(p)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                  p.aktif
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                }`}
              >
                {p.aktif ? "Non-aktifkan" : "Aktifkan"}
              </button>

              <button
                type="button"
                onClick={() => handleDeletePromo(p)}
                disabled={isPending}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Hapus Promo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Promo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-100">Buat Promo Diskon Baru</h3>
                  <p className="text-[11px] text-amber-200">Atur Happy Hour atau promo tanggal khusus</p>
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

            <form onSubmit={handleCreatePromo} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Nama Promo</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Happy Hour Kopi 20%"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Tipe Diskon</label>
                  <select
                    value={tipeDiskon}
                    onChange={(e) => setTipeDiskon(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="persentase">Persentase (%)</option>
                    <option value="nominal">Potongan Nominal (Rp)</option>
                    <option value="harga_tetap">Harga Spesial Tetap (Rp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Nilai Diskon</label>
                  <input
                    type="number"
                    value={nilai}
                    onChange={(e) => setNilai(e.target.value)}
                    placeholder={tipeDiskon === "persentase" ? "20" : "15000"}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-600 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Condition Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Jenis Kondisi Waktu</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConditionType("time")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                      conditionType === "time"
                        ? "bg-amber-700 text-white border-amber-800 shadow"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    Rentang Jam (Recurring)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionType("date")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                      conditionType === "date"
                        ? "bg-amber-700 text-white border-amber-800 shadow"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    Tanggal Khusus
                  </button>
                </div>
              </div>

              {/* Time inputs */}
              {(conditionType === "time" || conditionType === "both") && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Jam Berlaku (Mendukung Lintas Tengah Malam e.g. 21:00 - 00:00)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600">Jam Mulai</label>
                      <input
                        type="time"
                        value={jamMulai}
                        onChange={(e) => setJamMulai(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600">Jam Selesai</label>
                      <input
                        type="time"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date inputs */}
              {(conditionType === "date" || conditionType === "both") && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-600" /> Tanggal Event Khusus
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={tanggalMulai}
                        onChange={(e) => setTanggalMulai(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={tanggalSelesai}
                        onChange={(e) => setTanggalSelesai(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Cakupan Menu Promo</label>
                <select
                  value={berlakuUntuk}
                  onChange={(e) => setBerlakuUntuk(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-bold"
                >
                  <option value="semua">Semua Menu</option>
                  <option value="kategori">Kategori Spesifik</option>
                  <option value="menu_tertentu">Menu Tertentu (Pilih beberapa)</option>
                </select>
              </div>

              {berlakuUntuk === "kategori" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Pilih Kategori</label>
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {berlakuUntuk === "menu_tertentu" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Pilih Menu Spesifik ({selectedMenuIds.length} dipilih)
                  </label>
                  <div className="max-h-36 overflow-y-auto p-2 bg-stone-50 border border-stone-200 rounded-xl space-y-1 divide-y divide-stone-100">
                    {menus.map((m) => {
                      const isSelected = selectedMenuIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMenuSelection(m.id)}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                            isSelected ? "bg-amber-100/70 text-amber-900 font-bold" : "hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          <span>{m.nama} (Rp {m.harga.toLocaleString("id-ID")})</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-800" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  {isPending ? "Simpan..." : "Simpan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
