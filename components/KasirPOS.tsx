"use client";

import { useEffect, useState, useTransition } from "react";
import { getMenuList } from "@/app/actions/menuActions";
import { createTransaksi } from "@/app/actions/transaksiActions";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Coffee,
  AlertCircle,
  Percent,
  Banknote,
  RotateCcw,
  Sparkles,
  CupSoda,
  Cookie,
  UtensilsCrossed,
  Cake,
  User,
  QrCode,
  X,
  CheckCircle2,
  CreditCard
} from "lucide-react";

export interface Category {
  id: number;
  nama: string;
}

export interface Menu {
  id: number;
  nama: string;
  harga: number;
  kategoriId: number;
  kategori: Category;
  gambar: string | null;
  tersedia: boolean;
}

export interface CartItem {
  menuId: number;
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
  gambar: string | null;
}

interface KasirPOSProps {
  initialMenus: Menu[];
  initialCategories: Category[];
}

export default function KasirPOS({ initialMenus, initialCategories }: KasirPOSProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [categories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // Cashier Name & Shift State
  const [namaKasir, setNamaKasir] = useState<string>("Budi");

  // Payment Method & QRIS Modal State
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "QRIS">("TUNAI");
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("kasir_nama");
      if (savedName) setNamaKasir(savedName);
    }
  }, []);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [enableTax, setEnableTax] = useState<boolean>(false);
  const [dibayarInput, setDibayarInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Filter handler
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

  // Cart helper functions
  const addToCart = (menu: Menu) => {
    if (!menu.tersedia) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.menuId === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menuId === menu.id
            ? {
                ...item,
                jumlah: item.jumlah + 1,
                subtotal: (item.jumlah + 1) * item.hargaSatuan,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            menuId: menu.id,
            namaMenu: menu.nama,
            hargaSatuan: menu.harga,
            jumlah: 1,
            subtotal: menu.harga,
            gambar: menu.gambar,
          },
        ];
      }
    });
  };

  const updateQuantity = (menuId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuId === menuId) {
            const newQty = item.jumlah + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              jumlah: newQty,
              subtotal: newQty * item.hargaSatuan,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (menuId: number) => {
    setCart((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const clearCart = () => {
    setCart([]);
    setDibayarInput("");
    setErrorMsg("");
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const pajak = enableTax ? Math.round(subtotal * 0.1) : 0;
  const totalHarga = subtotal + pajak;

  const dibayarNum =
    paymentMethod === "QRIS"
      ? totalHarga
      : Number(dibayarInput.replace(/\D/g, "")) || 0;

  const kembalian =
    paymentMethod === "QRIS"
      ? 0
      : dibayarNum >= totalHarga
      ? dibayarNum - totalHarga
      : 0;

  const applyQuickNominal = (amount: number) => {
    setDibayarInput(amount > 0 ? amount.toLocaleString("id-ID") : "");
  };

  const switchPaymentMethod = (method: "TUNAI" | "QRIS") => {
    setPaymentMethod(method);
    if (method === "QRIS") {
      setDibayarInput(totalHarga.toLocaleString("id-ID"));
    }
  };

  const handlePay = (overrideMethod?: "TUNAI" | "QRIS") => {
    const method = overrideMethod || paymentMethod;
    setErrorMsg("");

    if (cart.length === 0) {
      setErrorMsg("Keranjang belanja masih kosong!");
      return;
    }

    const effectiveDibayar = method === "QRIS" ? totalHarga : dibayarNum;

    if (effectiveDibayar < totalHarga) {
      setErrorMsg(
        `Uang dibayar (Rp ${effectiveDibayar.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${totalHarga.toLocaleString("id-ID")})`
      );
      return;
    }

    startTransition(async () => {
      const res = await createTransaksi({
        items: cart.map((item) => ({
          menuId: item.menuId,
          namaMenu: item.namaMenu,
          hargaSatuan: item.hargaSatuan,
          jumlah: item.jumlah,
          subtotal: item.subtotal,
        })),
        pajak,
        dibayar: effectiveDibayar,
        namaKasir: namaKasir || "Kasir Cafe",
        metodePembayaran: method,
      });

      if (res.success && res.data) {
        setReceiptData({
          nomorStruk: res.data.nomorStruk,
          tanggal: res.data.tanggal,
          namaKasir: res.data.namaKasir,
          metodePembayaran: res.data.metodePembayaran,
          subtotal: res.data.subtotal,
          pajak: res.data.pajak,
          totalHarga: res.data.totalHarga,
          dibayar: res.data.dibayar,
          kembalian: res.data.kembalian,
          detailTransaksi: res.data.detailTransaksi,
        });
        setIsQrisModalOpen(false);
        clearCart();
      } else {
        setErrorMsg(res.error || "Gagal memproses transaksi");
      }
    });
  };

  // Category Icon Resolver
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("kopi")) return Coffee;
    if (lower.includes("teh") || lower.includes("non")) return CupSoda;
    if (lower.includes("makanan") || lower.includes("main")) return UtensilsCrossed;
    if (lower.includes("dessert") || lower.includes("cake")) return Cake;
    return Cookie;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-stone-100 p-5 sm:p-7 rounded-3xl border border-amber-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Coffee className="w-64 h-64 text-amber-300" />
        </div>

        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kasir Point of Sale
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg">
            Pilih varian kopi & sajian favorit untuk dimasukkan ke keranjang belanja kasir.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 relative z-10">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari espresso, matcha, croissant..."
            value={searchQuery}
            onChange={(e) => handleFilter(selectedCategory, e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-stone-900/80 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Main Grid: Menu Catalog vs Shopping Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Categories & Menu Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleFilter(0, searchQuery)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                selectedCategory === 0
                  ? "bg-gradient-to-r from-amber-800 to-amber-900 text-white border-amber-700 shadow-md shadow-amber-950/20"
                  : "bg-white text-stone-700 hover:bg-stone-100 border-stone-200 coffee-card-shadow"
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Semua Menu</span>
            </button>
            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat.nama);
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleFilter(cat.id, searchQuery)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-800 to-amber-900 text-white border-amber-700 shadow-md shadow-amber-950/20"
                      : "bg-white text-stone-700 hover:bg-stone-100 border-stone-200 coffee-card-shadow"
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? "text-amber-300" : "text-stone-500"}`} />
                  <span>{cat.nama}</span>
                </button>
              );
            })}
          </div>

          {/* Menu Catalog Grid */}
          {isSearching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-52 bg-stone-200/60 animate-pulse rounded-3xl"
                ></div>
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 coffee-card-shadow">
              <Coffee className="w-12 h-12 text-stone-300 mx-auto stroke-[1.5]" />
              <p className="font-bold text-stone-800 text-base">Menu tidak ditemukan</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {menus.map((menu) => {
                const inCart = cart.find((item) => item.menuId === menu.id);
                return (
                  <div
                    key={menu.id}
                    onClick={() => addToCart(menu)}
                    className={`group text-left bg-white rounded-3xl border p-3.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden coffee-card-shadow ${
                      !menu.tersedia
                        ? "opacity-60 cursor-not-allowed border-stone-200 bg-stone-50"
                        : "hover:border-amber-600 coffee-card-hover hover:-translate-y-1 active:scale-[0.98] border-stone-200/90 cursor-pointer"
                    }`}
                  >
                    {/* Badge In Cart */}
                    {inCart && (
                      <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg z-10 border border-amber-400/40 animate-in fade-in zoom-in">
                        {inCart.jumlah}x
                      </span>
                    )}

                    {/* Image Box */}
                    <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-stone-100 mb-3 border border-stone-200/60 shadow-inner">
                      {menu.gambar && !imgErrors[menu.id] ? (
                        <img
                          src={menu.gambar}
                          alt={menu.nama}
                          onError={() => setImgErrors((prev) => ({ ...prev, [menu.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100/90 p-2 text-center">
                          <Coffee className="w-9 h-9 text-amber-800/50 mb-1 stroke-[1.5]" />
                          <span className="text-[10px] font-bold text-stone-500 line-clamp-1">{menu.nama}</span>
                        </div>
                      )}

                      {/* Status Overlay */}
                      {!menu.tersedia && (
                        <div className="absolute inset-0 bg-stone-900/65 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-lg shadow-md">
                            Habis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                        {menu.kategori?.nama || "Menu"}
                      </span>
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base line-clamp-1 group-hover:text-amber-900 transition-colors">
                        {menu.nama}
                      </h3>
                      <p className="font-extrabold text-amber-950 text-base sm:text-lg">
                        Rp {menu.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Shopping Cart Register */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden flex flex-col max-h-[85vh] coffee-card-shadow">
            {/* Cart Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600/30 flex items-center justify-center border border-amber-500/40">
                  <ShoppingCart className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-none">Keranjang Belanja</h2>
                  <span className="text-[10px] text-stone-400 font-medium">Order Summary</span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 hover:underline bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Cashier Name Shift Selector */}
            <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <User className="w-3.5 h-3.5 text-amber-800" />
                <span>Kasir Jaga Hari Ini:</span>
              </div>
              <input
                type="text"
                placeholder="Nama Kasir"
                value={namaKasir}
                onChange={(e) => {
                  setNamaKasir(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("kasir_nama", e.target.value);
                  }
                }}
                className="font-extrabold text-stone-900 bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-right focus:outline-none focus:ring-2 focus:ring-amber-600/40 w-32 shadow-xs"
              />
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-stone-100 space-y-3 min-h-[180px]">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-stone-400 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-300">
                    <ShoppingCart className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-bold text-stone-600">
                    Keranjang masih kosong
                  </p>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Klik pada kartu menu untuk menambahkan item ke pesanan.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.menuId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 truncate">
                        {item.namaMenu}
                      </h4>
                      <p className="text-xs text-stone-500">
                        @ Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs font-extrabold text-amber-950 mt-0.5">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 shadow-inner">
                      <button
                        onClick={() => updateQuantity(item.menuId, -1)}
                        className="w-7 h-7 rounded-xl bg-white border border-stone-300/80 flex items-center justify-center text-stone-700 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-stone-900">
                        {item.jumlah}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuId, 1)}
                        className="w-7 h-7 rounded-xl bg-white border border-stone-300/80 flex items-center justify-center text-stone-700 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.menuId)}
                      className="text-stone-400 hover:text-red-600 p-1.5 transition-colors"
                      title="Hapus Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Payment Section */}
            <div className="p-4 sm:p-5 bg-stone-50/90 border-t border-stone-200 space-y-3.5">
              {/* Pajak Resto Toggle */}
              <div className="flex items-center justify-between text-xs text-stone-700 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <Percent className="w-4 h-4 text-amber-700" />
                  <span>Pajak Resto / Service (10%)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTax}
                    onChange={(e) => setEnableTax(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-800"></div>
                </label>
              </div>

              {/* Payment Method Tabs (TUNAI vs QRIS STATIS) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-800" />
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-200/80 p-1 rounded-2xl border border-stone-300/80">
                  <button
                    type="button"
                    onClick={() => switchPaymentMethod("TUNAI")}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "TUNAI"
                        ? "bg-white text-stone-900 shadow-md"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchPaymentMethod("QRIS")}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "QRIS"
                        ? "bg-gradient-to-r from-red-600 to-amber-700 text-white shadow-md"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    QRIS
                  </button>
                </div>
              </div>

              {/* Subtotal & Total Bill */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between font-medium">
                  <span>Subtotal Item</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {enableTax && (
                  <div className="flex justify-between text-stone-500">
                    <span>Pajak (10%)</span>
                    <span>Rp {pajak.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-stone-900 text-lg pt-2 border-t border-stone-200/80">
                  <span>TOTAL BILL</span>
                  <span className="text-amber-950">
                    Rp {totalHarga.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Payment Section - TUNAI vs QRIS */}
              {paymentMethod === "TUNAI" ? (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    Jumlah Uang Tunai Dibayar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-stone-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={dibayarInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setDibayarInput(raw ? Number(raw).toLocaleString("id-ID") : "");
                      }}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-extrabold bg-white border border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 text-stone-900 shadow-sm"
                    />
                  </div>

                  {/* Quick Nominal Buttons */}
                  {totalHarga > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(totalHarga)}
                        className="py-1.5 text-[11px] font-extrabold bg-amber-100 text-amber-950 rounded-xl hover:bg-amber-200 border border-amber-300/60 transition-colors shadow-xs"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(20000)}
                        className="py-1.5 text-[11px] font-bold bg-white text-stone-800 rounded-xl hover:bg-stone-100 border border-stone-300/80 transition-colors shadow-xs"
                      >
                        20.000
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(50000)}
                        className="py-1.5 text-[11px] font-bold bg-white text-stone-800 rounded-xl hover:bg-stone-100 border border-stone-300/80 transition-colors shadow-xs"
                      >
                        50.000
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(100000)}
                        className="py-1.5 text-[11px] font-bold bg-white text-stone-800 rounded-xl hover:bg-stone-100 border border-stone-300/80 transition-colors shadow-xs"
                      >
                        100.000
                      </button>
                    </div>
                  )}

                  {/* Kembalian Banner */}
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-2xl text-xs shadow-xs">
                    <span className="font-bold text-emerald-900">Kembalian Kasir:</span>
                    <span className="font-extrabold text-emerald-900 text-base">
                      Rp {kembalian.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ) : (
                /* QRIS Mode Box */
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-950">
                    <QrCode className="w-4 h-4 text-amber-800" />
                    <span>Pembayaran QRIS</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Tunjukkan Kode QRIS Cafe ke pelanggan untuk dipindai (GoPay, DANA, OVO, Bank).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsQrisModalOpen(true)}
                    disabled={cart.length === 0}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:from-red-700 hover:to-amber-800 transition-all disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tampilkan Kode QRIS (Rp {totalHarga.toLocaleString("id-ID")})</span>
                  </button>
                </div>
              )}

              {/* Pay Action Button */}
              <button
                onClick={() => {
                  if (paymentMethod === "QRIS") {
                    setIsQrisModalOpen(true);
                  } else {
                    handlePay("TUNAI");
                  }
                }}
                disabled={cart.length === 0 || (paymentMethod === "TUNAI" && dibayarNum < totalHarga) || isPending}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98] ${
                  cart.length === 0 || (paymentMethod === "TUNAI" && dibayarNum < totalHarga) || isPending
                    ? "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white shadow-amber-950/20"
                }`}
              >
                {isPending ? (
                  <span>Memproses Transaksi...</span>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 text-amber-300" />
                    <span>
                      {paymentMethod === "QRIS" ? "BAYAR VIA QRIS" : "BAYAR SEKARANG"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kode QRIS Statis */}
      {isQrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden coffee-card-shadow text-center">
            {/* National QRIS Header Style */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-extrabold text-xs px-2 py-0.5 rounded tracking-widest">
                  QRIS
                </span>
                <span className="text-xs font-bold text-stone-300">Standar Pembayaran Nasional</span>
              </div>
              <button
                onClick={() => setIsQrisModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg uppercase tracking-wider">
                  KASIR COFFEE SHOP
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">NMID: ID1024392810482</p>
              </div>

              {/* QRIS Code Graphic Container */}
              <div className="bg-white p-4 rounded-2xl border-2 border-stone-900 inline-block shadow-md relative">
                <div className="w-48 h-48 bg-stone-900/5 rounded-xl border border-stone-300 p-2 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* High Quality Visual QRIS Graphic */}
                  <QrCode className="w-40 h-40 text-stone-900 stroke-[1.5]" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white border-2 border-red-600 px-2 py-0.5 rounded shadow-md">
                      <span className="text-[10px] font-extrabold text-red-600">QRIS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Nominal Display */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-0.5">
                <p className="text-xs text-amber-900 font-medium">Total Nominal Transaksi:</p>
                <p className="text-2xl font-extrabold text-amber-950">
                  Rp {totalHarga.toLocaleString("id-ID")}
                </p>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Scan QRIS menggunakan aplikasi <span className="font-bold text-stone-800">GoPay, DANA, OVO, ShopeePay, BCA, Mandiri</span> dll.
              </p>

              {/* Confirmation Action */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrisModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handlePay("QRIS")}
                  disabled={isPending}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isPending ? "Proses..." : "Konfirmasi Berhasil"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal after transaction success */}
      <ReceiptModal
        receipt={receiptData}
        onClose={() => setReceiptData(null)}
      />
    </div>
  );
}
