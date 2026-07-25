"use client";

import { useState, useTransition, useRef } from "react";
import {
  getMenuList,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuAvailability,
} from "@/app/actions/menuActions";
import {
  createKategori,
  deleteKategori,
} from "@/app/actions/kategoriActions";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  FolderPlus,
  Utensils,
  X,
  Coffee,
  Check,
  Tag,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";

interface Category {
  id: number;
  nama: string;
  _count?: {
    menus: number;
  };
}

interface Menu {
  id: number;
  nama: string;
  harga: number;
  kategoriId: number;
  kategori: Category;
  gambar: string | null;
  tersedia: boolean;
}

interface MenuManagementProps {
  initialMenus: Menu[];
  initialCategories: Category[];
}

export default function MenuManagement({ initialMenus, initialCategories }: MenuManagementProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // Modal Menu State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"FILE" | "URL">("FILE");
  const [menuForm, setMenuForm] = useState({
    nama: "",
    harga: "",
    kategoriId: "",
    gambar: "",
    tersedia: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Kategori State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // Global Messages
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleFilter = async (catId: number, query: string) => {
    setSelectedCategory(catId);
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const res = await getMenuList(catId, query);
      if (res.success && res.data) {
        setMenus(res.data as Menu[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const res = await getMenuList(selectedCategory, searchQuery);
      if (res.success && res.data) {
        setMenus(res.data as Menu[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateMenuModal = () => {
    setEditingMenu(null);
    setImageInputMode("FILE");
    setMenuForm({
      nama: "",
      harga: "",
      kategoriId: categories.length > 0 && categories[0]?.id ? categories[0].id.toString() : "",
      gambar: "",
      tersedia: true,
    });
    setErrorMsg("");
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (menu: Menu) => {
    setEditingMenu(menu);
    // If current image is data URL or empty, set to FILE mode, else if HTTP URL set to URL mode
    if (menu.gambar && menu.gambar.startsWith("http")) {
      setImageInputMode("URL");
    } else {
      setImageInputMode("FILE");
    }
    setMenuForm({
      nama: menu.nama || "",
      harga: menu.harga !== undefined && menu.harga !== null ? menu.harga.toString() : "",
      kategoriId: menu.kategoriId !== undefined && menu.kategoriId !== null ? menu.kategoriId.toString() : "",
      gambar: menu.gambar || "",
      tersedia: menu.tersedia ?? true,
    });
    setErrorMsg("");
    setIsMenuModalOpen(true);
  };

  // Handle File Upload & Convert to Data URL (Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    // Limit file size to 2MB for fast database & network performance
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar maksimal 2MB");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setMenuForm((prev) => ({ ...prev, gambar: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setMenuForm((prev) => ({ ...prev, gambar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const hargaNum = Number(menuForm.harga);
    if (!menuForm.nama.trim()) {
      setErrorMsg("Nama menu wajib diisi");
      return;
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      setErrorMsg("Harga menu tidak boleh negatif");
      return;
    }
    if (!menuForm.kategoriId) {
      setErrorMsg("Kategori wajib dipilih");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingMenu) {
        res = await updateMenu(editingMenu.id, {
          nama: menuForm.nama,
          harga: hargaNum,
          kategoriId: Number(menuForm.kategoriId),
          gambar: menuForm.gambar,
          tersedia: menuForm.tersedia,
        });
      } else {
        res = await createMenu({
          nama: menuForm.nama,
          harga: hargaNum,
          kategoriId: Number(menuForm.kategoriId),
          gambar: menuForm.gambar,
          tersedia: menuForm.tersedia,
        });
      }

      if (res.success) {
        setSuccessMsg(editingMenu ? "Menu berhasil diperbarui!" : "Menu baru berhasil ditambahkan!");
        setIsMenuModalOpen(false);
        await refreshAllData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Gagal menyimpan menu");
      }
    });
  };

  const handleToggleStatus = (menu: Menu) => {
    startTransition(async () => {
      const res = await toggleMenuAvailability(menu.id, !menu.tersedia);
      if (res.success) {
        setMenus((prev) =>
          prev.map((item) =>
            item.id === menu.id ? { ...item, tersedia: !menu.tersedia } : item
          )
        );
      }
    });
  };

  const handleDeleteMenu = (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${nama}"?`)) return;

    startTransition(async () => {
      const res = await deleteMenu(id);
      if (res.success) {
        setSuccessMsg(`Menu "${nama}" berhasil dihapus`);
        await refreshAllData();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const res = await createKategori(newCategoryName);
      if (res.success && res.data) {
        setNewCategoryName("");
        setSuccessMsg("Kategori baru berhasil ditambahkan");
        setCategories((prev) => [...prev, res.data as Category]);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Gagal menambah kategori");
      }
    });
  };

  const handleDeleteCategory = (id: number, nama: string) => {
    if (!confirm(`Hapus kategori "${nama}"? Menu di bawah kategori ini juga akan terpengaruh.`)) return;

    startTransition(async () => {
      const res = await deleteKategori(id);
      if (res.success) {
        setSuccessMsg(`Kategori "${nama}" berhasil dihapus`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        await refreshAllData();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-stone-100 p-5 sm:p-7 rounded-3xl border border-amber-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola Menu & Kategori
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg">
            Tambah varian sajian baru, upload foto menu, sesuaikan harga, dan atur ketersediaan menu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="py-3 px-4 rounded-2xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-xs sm:text-sm font-bold border border-stone-700 flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            Kelola Kategori
          </button>
          <button
            onClick={openCreateMenuModal}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-amber-950/30 transition-all active:scale-95 border border-amber-500/40"
          >
            <Plus className="w-4 h-4" />
            Tambah Menu Baru
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-stone-200/90 coffee-card-shadow">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => handleFilter(0, searchQuery)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === 0
                ? "bg-amber-950 text-white shadow-md shadow-amber-950/20"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            Semua ({menus.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilter(cat.id, searchQuery)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-950 text-white shadow-md shadow-amber-950/20"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {cat.nama}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => handleFilter(selectedCategory, e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 text-stone-900"
          />
        </div>
      </div>

      {/* Menu Grid */}
      {isSearching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-stone-200/60 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : menus.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 coffee-card-shadow">
          <Coffee className="w-12 h-12 text-stone-300 mx-auto stroke-[1.5]" />
          <p className="font-bold text-stone-800 text-base">Belum ada menu</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Klik tombol "Tambah Menu Baru" untuk menambahkan varian menu coffee shop.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 coffee-card-shadow hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Image & Availability Switch */}
              <div className="relative w-full h-40 rounded-2xl bg-stone-100 overflow-hidden mb-3 border border-stone-200/60 shadow-inner">
                {menu.gambar && !imgErrors[menu.id] ? (
                  <img
                    src={menu.gambar}
                    alt={menu.nama}
                    onError={() => setImgErrors((prev) => ({ ...prev, [menu.id]: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100/90 p-2 text-center">
                    <Coffee className="w-9 h-9 text-amber-800/50 mb-1 stroke-[1.5]" />
                    <span className="text-[10px] font-bold text-stone-500 line-clamp-1">{menu.nama}</span>
                  </div>
                )}

                <button
                  onClick={() => handleToggleStatus(menu)}
                  className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1.5 transition-transform active:scale-95 ${
                    menu.tersedia
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                  title="Klik untuk ubah status ketersediaan"
                >
                  {menu.tersedia ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersedia
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Habis
                    </>
                  )}
                </button>
              </div>

              {/* Menu Info */}
              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                  {menu.kategori?.nama || "Menu"}
                </span>
                <h3 className="font-bold text-stone-900 text-base line-clamp-1">
                  {menu.nama}
                </h3>
                <p className="font-extrabold text-amber-950 text-lg">
                  Rp {menu.harga.toLocaleString("id-ID")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => openEditMenuModal(menu)}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-950 text-xs font-bold border border-stone-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMenu(menu.id, menu.nama)}
                  className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-700 text-xs font-bold border border-stone-200 flex items-center justify-center gap-1.5 transition-colors"
                  title="Hapus Menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Menu */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden coffee-card-shadow">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">
                  {editingMenu ? "Edit Menu Sajian" : "Tambah Menu Sajian Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nama Menu Sajian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sea Salt Caramel Latte"
                  value={menuForm.nama || ""}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, nama: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="32000"
                    value={menuForm.harga || ""}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, harga: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Kategori *
                  </label>
                  <select
                    required
                    value={menuForm.kategoriId || ""}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, kategoriId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-stone-900 bg-white font-semibold"
                  >
                    <option value="" disabled>
                      Pilih Kategori
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Input Section (File Upload vs URL Mode) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    Foto Menu Sajian
                  </label>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("FILE")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        imageInputMode === "FILE"
                          ? "bg-amber-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("URL")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        imageInputMode === "URL"
                          ? "bg-amber-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 inline mr-1" />
                      URL Link
                    </button>
                  </div>
                </div>

                {imageInputMode === "FILE" ? (
                  <div className="space-y-2">
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="menu-file-input"
                    />

                    {menuForm.gambar ? (
                      /* Image Preview Box */
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 group">
                        <img
                          src={menuForm.gambar}
                          alt="Preview foto menu"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label
                            htmlFor="menu-file-input"
                            className="py-1.5 px-3 bg-white text-stone-900 text-xs font-bold rounded-xl cursor-pointer hover:bg-stone-100 transition-colors"
                          >
                            Ganti Foto
                          </label>
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="py-1.5 px-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
                          >
                            Hapus Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <label
                        htmlFor="menu-file-input"
                        className="w-full h-32 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-600 bg-stone-50 hover:bg-amber-50/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group text-center p-4"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 stroke-[2]" />
                        </div>
                        <p className="text-xs font-bold text-stone-800">
                          Klik untuk pilih foto dari galeri / komputer
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Format JPG, PNG, atau WebP (Maksimal 2MB)
                        </p>
                      </label>
                    )}
                  </div>
                ) : (
                  /* URL Input Mode */
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={menuForm.gambar || ""}
                      onChange={(e) =>
                        setMenuForm({ ...menuForm, gambar: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-stone-900 font-mono text-xs"
                    />
                    {menuForm.gambar && (
                      <div className="w-full h-28 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100">
                        <img
                          src={menuForm.gambar}
                          alt="Preview URL"
                          className="w-full h-full object-cover"
                          onError={() => setErrorMsg("URL Gambar tidak dapat dimuat")}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 bg-amber-50 p-3 rounded-2xl border border-amber-200/80">
                <input
                  type="checkbox"
                  id="tersedia"
                  checked={menuForm.tersedia}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, tersedia: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-900 rounded border-stone-300 focus:ring-amber-600"
                />
                <label htmlFor="tersedia" className="text-xs font-bold text-amber-950">
                  Status Tersedia (Siap Dijual di Kasir)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl border border-stone-300 text-stone-700 text-sm font-bold hover:bg-stone-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white text-sm font-extrabold shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all"
                >
                  {isPending ? "Simpan..." : "Simpan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Kategori */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden coffee-card-shadow">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Kelola Kategori Menu
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-stone-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-stone-900 font-medium"
                />
                <button
                  type="submit"
                  disabled={isPending || !newCategoryName.trim()}
                  className="py-2.5 px-4 bg-amber-900 hover:bg-amber-950 text-white rounded-2xl text-xs font-extrabold shadow-md disabled:opacity-50 transition-all"
                >
                  Tambah
                </button>
              </form>

              <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto pt-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-bold text-stone-800">
                      {cat.nama} <span className="text-stone-400 font-normal">({cat._count?.menus || 0} menu)</span>
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.nama)}
                      className="text-stone-400 hover:text-red-600 p-1.5 transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-full py-3 px-4 rounded-2xl border border-stone-300 text-stone-700 text-sm font-bold hover:bg-stone-100 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
