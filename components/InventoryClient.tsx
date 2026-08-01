"use client";

import { useState, useTransition } from "react";
import {
  createBahanBakuAction,
  updateBahanBakuAction,
  deleteBahanBakuAction,
  setResepMenuAction,
} from "@/app/actions/inventoryActions";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Save,
  Coffee,
  X,
  Layers,
  Sparkles,
  Scale
} from "lucide-react";

export interface BahanBakuItem {
  id: number;
  nama: string;
  satuan: string;
  stok: number;
  stokMinim: number;
  hargaSatuan: number;
  resepMenus?: any[];
}

export interface MenuItemOption {
  id: number;
  nama: string;
  harga: number;
  kategori: { nama: string };
  resepMenus: {
    id: number;
    bahanBakuId: number;
    jumlahPakai: number;
    bahanBaku: { nama: string; satuan: string };
  }[];
}

interface InventoryClientProps {
  initialBahanBaku: BahanBakuItem[];
  initialMenus: MenuItemOption[];
  userRole?: string;
}

export default function InventoryClient({
  initialBahanBaku,
  initialMenus,
  userRole = "admin",
}: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<"stok" | "resep">("stok");
  const [bahanList, setBahanList] = useState<BahanBakuItem[]>(initialBahanBaku);
  const [menuList, setMenuList] = useState<MenuItemOption[]>(initialMenus);

  // Bahan Baku Modal State
  const [isBahanModalOpen, setIsBahanModalOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState<BahanBakuItem | null>(null);
  const [namaInput, setNamaInput] = useState("");
  const [satuanInput, setSatuanInput] = useState("gram");
  const [stokInput, setStokInput] = useState("0");
  const [stokMinimInput, setStokMinimInput] = useState("10");
  const [hargaSatuanInput, setHargaSatuanInput] = useState("0");

  // Recipe Modal State
  const [selectedMenu, setSelectedMenu] = useState<MenuItemOption | null>(
    initialMenus.length > 0 ? initialMenus[0] : null
  );
  const [recipeRows, setRecipeRows] = useState<{ bahanBakuId: number; jumlahPakai: string }[]>(
    []
  );

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Open Add/Edit Bahan Modal
  const openBahanModal = (item?: BahanBakuItem) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (item) {
      setEditingBahan(item);
      setNamaInput(item.nama);
      setSatuanInput(item.satuan);
      setStokInput(String(item.stok));
      setStokMinimInput(String(item.stokMinim));
      setHargaSatuanInput(String(item.hargaSatuan));
    } else {
      setEditingBahan(null);
      setNamaInput("");
      setSatuanInput("gram");
      setStokInput("0");
      setStokMinimInput("10");
      setHargaSatuanInput("0");
    }
    setIsBahanModalOpen(true);
  };

  const handleSaveBahan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!namaInput.trim()) {
      setErrorMsg("Nama bahan baku wajib diisi");
      return;
    }

    startTransition(async () => {
      const payload = {
        nama: namaInput,
        satuan: satuanInput,
        stok: Number(stokInput) || 0,
        stokMinim: Number(stokMinimInput) || 10,
        hargaSatuan: Number(hargaSatuanInput) || 0,
      };

      let res;
      if (editingBahan) {
        res = await updateBahanBakuAction(editingBahan.id, payload);
      } else {
        res = await createBahanBakuAction(payload);
      }

      if (res.success && res.data) {
        if (editingBahan) {
          setBahanList((prev) => prev.map((b) => (b.id === editingBahan.id ? { ...b, ...res.data } : b)));
          setSuccessMsg(`Bahan baku "${namaInput}" berhasil diperbarui!`);
        } else {
          setBahanList((prev) => [...prev, res.data as BahanBakuItem]);
          setSuccessMsg(`Bahan baku "${namaInput}" berhasil ditambahkan!`);
        }
        setIsBahanModalOpen(false);
      } else {
        setErrorMsg(res.error || "Gagal menyimpan bahan baku");
      }
    });
  };

  const handleDeleteBahan = (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus bahan baku "${nama}"?`)) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await deleteBahanBakuAction(id);
      if (res.success) {
        setBahanList((prev) => prev.filter((b) => b.id !== id));
        setSuccessMsg(`Bahan baku "${nama}" berhasil dihapus.`);
      } else {
        setErrorMsg(res.error || "Gagal menghapus bahan baku");
      }
    });
  };

  // Recipe handlers
  const handleSelectMenuForRecipe = (menu: MenuItemOption) => {
    setSelectedMenu(menu);
    if (menu.resepMenus && menu.resepMenus.length > 0) {
      setRecipeRows(
        menu.resepMenus.map((r) => ({
          bahanBakuId: r.bahanBakuId,
          jumlahPakai: String(r.jumlahPakai),
        }))
      );
    } else {
      setRecipeRows([]);
    }
  };

  const addRecipeRow = () => {
    if (bahanList.length === 0) {
      alert("Tambahkan bahan baku terlebih dahulu!");
      return;
    }
    setRecipeRows((prev) => [...prev, { bahanBakuId: bahanList[0].id, jumlahPakai: "1" }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) return;
    setErrorMsg("");
    setSuccessMsg("");

    const formattedRows = recipeRows.map((r) => ({
      bahanBakuId: Number(r.bahanBakuId),
      jumlahPakai: Number(r.jumlahPakai) || 0,
    }));

    startTransition(async () => {
      const res = await setResepMenuAction(selectedMenu.id, formattedRows);
      if (res.success) {
        setSuccessMsg(`Resep komposisi untuk menu "${selectedMenu.nama}" berhasil disimpan!`);
      } else {
        setErrorMsg(res.error || "Gagal menyimpan resep menu");
      }
    });
  };

  const lowStockCount = bahanList.filter((b) => b.stok <= b.stokMinim).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Manajemen Inventaris & Resep (BOM)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Stok Bahan Baku & Resep Menu
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Pantau ketersediaan fisik bahan baku dan resep komposisi otomatis per porsi menu.
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab("stok")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "stok"
                  ? "bg-amber-700 text-white shadow"
                  : "text-stone-400 hover:text-stone-100"
              }`}
            >
              Stok Bahan Baku ({bahanList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("resep");
                if (initialMenus.length > 0) handleSelectMenuForRecipe(initialMenus[0]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "resep"
                  ? "bg-amber-700 text-white shadow"
                  : "text-stone-400 hover:text-stone-100"
              }`}
            >
              Resep Komposisi (BOM)
            </button>
          </div>

          {activeTab === "stok" && (
            <button
              type="button"
              onClick={() => openBahanModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Stok Bahan Baku */}
      {activeTab === "stok" && (
        <div className="space-y-4">
          {lowStockCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs sm:text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                ⚠️ Perhatian: Ada {lowStockCount} jenis bahan baku yang berada di bawah Stok Minimum!
              </span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden coffee-card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-[11px] font-extrabold text-stone-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Nama Bahan Baku</th>
                    <th className="py-3.5 px-4">Satuan</th>
                    <th className="py-3.5 px-4">Stok Fisik saat Ini</th>
                    <th className="py-3.5 px-4">Stok Minimum</th>
                    <th className="py-3.5 px-4">Estimasi Harga / Satuan</th>
                    <th className="py-3.5 px-4">Status Ketersediaan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                  {bahanList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        Belum ada data bahan baku. Klik "Tambah Bahan Baku" untuk memulai.
                      </td>
                    </tr>
                  ) : (
                    bahanList.map((b) => {
                      const isLow = b.stok <= b.stokMinim;
                      return (
                        <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 font-extrabold text-stone-900">
                            {b.nama}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-900 uppercase text-xs">
                            {b.satuan}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-stone-900 text-base">
                            {b.stok.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-500 text-xs">
                            {b.stokMinim.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-800 text-xs">
                            Rp {b.hargaSatuan.toLocaleString("id-ID")} / {b.satuan}
                          </td>
                          <td className="py-3.5 px-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
                                <AlertTriangle className="w-3 h-3" /> STOK TIPIS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle className="w-3 h-3" /> STOK AMAN
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openBahanModal(b)}
                              className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Bahan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBahan(b.id, b.nama)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Bahan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resep Komposisi Menu (BOM) */}
      {activeTab === "resep" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Menu Selector */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-3 coffee-card-shadow">
            <h2 className="font-extrabold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-2">
              <Coffee className="w-4 h-4 text-amber-700" />
              Pilih Menu yang Diatur Resepnya:
            </h2>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 divide-y divide-stone-100">
              {menuList.map((m) => {
                const isSelected = selectedMenu?.id === m.id;
                const recipeCount = m.resepMenus ? m.resepMenus.length : 0;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMenuForRecipe(m)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between pt-2.5 first:pt-3 ${
                      isSelected
                        ? "bg-amber-800 text-white font-extrabold shadow"
                        : "hover:bg-amber-50/60 text-stone-800"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{m.nama}</h4>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-amber-200" : "text-stone-400"
                        }`}
                      >
                        {m.kategori.nama} • Rp {m.harga.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-amber-900 text-amber-200 border-amber-700"
                          : "bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      {recipeCount} Bahan
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recipe Editor Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-6 coffee-card-shadow">
            {selectedMenu ? (
              <form onSubmit={handleSaveRecipe} className="space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Resep Komposisi (BOM)
                    </span>
                    <h2 className="text-xl font-black text-stone-900 mt-1">
                      {selectedMenu.nama}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={addRecipeRow}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-amber-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahan</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {recipeRows.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-1">
                      <Scale className="w-8 h-8 text-stone-400 mx-auto" />
                      <p className="text-xs font-bold text-stone-600">Belum ada resep bahan baku</p>
                      <p className="text-[11px] text-stone-400">
                        Klik "Tambah Bahan" di kanan atas untuk menyusun takaran resep menu ini.
                      </p>
                    </div>
                  ) : (
                    recipeRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">
                            Bahan Baku
                          </label>
                          <select
                            value={row.bahanBakuId}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRecipeRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, bahanBakuId: val } : r))
                              );
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                          >
                            {bahanList.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.nama} ({b.satuan}) - Stok: {b.stok}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">
                            Takaran per Porsi
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={row.jumlahPakai}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecipeRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, jumlahPakai: val } : r))
                              );
                            }}
                            placeholder="Misal: 18"
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                            required
                          />
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => removeRecipeRow(idx)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isPending ? "Menyimpan Resep..." : "Simpan Resep Komposisi"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-stone-400">
                Pilih menu di sebelah kiri untuk mengatur resep komposisi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Add/Edit Bahan Baku */}
      {isBahanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingBahan ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsBahanModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBahan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Nama Bahan Baku</label>
                <input
                  type="text"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  placeholder="Contoh: Biji Kopi Arabica / Susu UHT Fresh"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Satuan Ukur</label>
                  <select
                    value={satuanInput}
                    onChange={(e) => setSatuanInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">ml (milliliter)</option>
                    <option value="pcs">pcs (biji/buah)</option>
                    <option value="saset">saset</option>
                    <option value="pack">pack</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="liter">liter</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Stok Fisik Saat Ini</label>
                  <input
                    type="number"
                    step="any"
                    value={stokInput}
                    onChange={(e) => setStokInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Stok Minimum Warning</label>
                  <input
                    type="number"
                    step="any"
                    value={stokMinimInput}
                    onChange={(e) => setStokMinimInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Harga per Satuan (Rp)</label>
                  <input
                    type="number"
                    value={hargaSatuanInput}
                    onChange={(e) => setHargaSatuanInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBahanModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Simpan..." : "Simpan Bahan Baku"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
