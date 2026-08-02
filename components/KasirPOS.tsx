"use client";

import { useEffect, useState, useTransition } from "react";
import { getMenuList } from "@/app/actions/menuActions";
import { createTransaksi, getKaryawanListAction } from "@/app/actions/transaksiActions";
import { getCurrentUserAction, verifyAdminPasswordAction } from "@/app/actions/authActions";
import {
  getActiveShiftAction,
  startShiftAction,
  closeShiftAction,
} from "@/app/actions/shiftActions";
import { evaluatePromoInMemory } from "@/lib/promoEngine";
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
  CreditCard,
  UserCheck,
  Tag,
  ShieldCheck,
  Lock,
  Clock,
  LogOut,
  Printer
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
  hargaAsli: number;
  namaPromo?: string | null;
  jumlah: number;
  subtotal: number;
  gambar: string | null;
  kategoriId?: number;
}

interface KaryawanOption {
  id: number;
  nama: string;
  username: string;
}

interface KasirPOSProps {
  initialMenus: Menu[];
  initialCategories: Category[];
  initialPromos?: any[];
  systemPajakPercent?: number;
}

export default function KasirPOS({
  initialMenus,
  initialCategories,
  initialPromos = [],
  systemPajakPercent = 10,
}: KasirPOSProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [categories] = useState<Category[]>(initialCategories);
  const [activePromos] = useState<any[]>(initialPromos);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // Session User
  const [currentUser, setCurrentUser] = useState<{ id: number; nama: string; role: string } | null>(null);

  // Shift Control State
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState<boolean>(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [modalAwalInput, setModalAwalInput] = useState<string>("100.000");
  const [fisikTunaiInput, setFisikTunaiInput] = useState<string>("");
  const [catatanShiftInput, setCatatanShiftInput] = useState<string>("");
  const [closedShiftSummary, setClosedShiftSummary] = useState<any | null>(null);

  // Cashier Name State
  const [namaKasir, setNamaKasir] = useState<string>("Budi");

  // Employee Order State
  const [isEmployeeOrder, setIsEmployeeOrder] = useState<boolean>(false);
  const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<number | null>(null);
  const [customKaryawanNama, setCustomKaryawanNama] = useState<string>("");

  // Admin Auth Modal State
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [adminAuthError, setAdminAuthError] = useState<string>("");

  // Payment Method & QRIS Modal State
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "QRIS">("TUNAI");
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [enableTax, setEnableTax] = useState<boolean>(false);
  const [dibayarInput, setDibayarInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const fetchActiveShift = async () => {
    const shiftRes = await getActiveShiftAction();
    if (shiftRes.success) {
      setActiveShift(shiftRes.data);
    }
  };

  useEffect(() => {
    // Fetch active session user and active shift
    const fetchSession = async () => {
      const u = await getCurrentUserAction();
      if (u) {
        setCurrentUser(u);
        setNamaKasir(u.nama);
      }
    };
    fetchSession();
    fetchActiveShift();

    // Fetch employee list for employee free order
    const fetchKaryawan = async () => {
      const res = await getKaryawanListAction();
      if (res.success && res.data) {
        setKaryawanList(res.data);
        if (res.data.length > 0) setSelectedKaryawanId(res.data[0].id);
      }
    };
    fetchKaryawan();
  }, []);

  const handleStartShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const modalNum = Number(modalAwalInput.replace(/\D/g, "")) || 0;

    startTransition(async () => {
      const res = await startShiftAction(modalNum);
      if (res.success && res.data) {
        setIsStartShiftModalOpen(false);
        fetchActiveShift();
      } else {
        setErrorMsg(res.error || "Gagal membuka shift");
      }
    });
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fisikNum = Number(fisikTunaiInput.replace(/\D/g, "")) || 0;

    startTransition(async () => {
      const res = await closeShiftAction(fisikNum, catatanShiftInput);
      if (res.success && res.data) {
        setClosedShiftSummary(res.data);
        setIsCloseShiftModalOpen(false);
        fetchActiveShift();
      } else {
        setErrorMsg(res.error || "Gagal menutup shift");
      }
    });
  };

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

  const addToCart = (menu: Menu) => {
    if (!menu.tersedia) return;

    // Evaluate promo for this menu item
    const promoResult = evaluatePromoInMemory(menu.id, menu.harga, menu.kategoriId, activePromos);

    const finalPrice = promoResult ? promoResult.hargaPromo : menu.harga;
    const promoName = promoResult ? promoResult.namaPromo : null;

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
            hargaSatuan: finalPrice,
            hargaAsli: menu.harga,
            namaPromo: promoName,
            jumlah: 1,
            subtotal: finalPrice,
            gambar: menu.gambar,
            kategoriId: menu.kategoriId,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (menuId: number, delta: number) => {
    setCart((prev) =>
      prev
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
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (menuId: number) => {
    setCart((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const clearCart = () => {
    setCart([]);
    setDibayarInput("");
    setErrorMsg("");
  };

  // Calculations & Dynamic System Tax %
  const rawSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotal = isEmployeeOrder ? 0 : rawSubtotal;
  const pajak = !isEmployeeOrder && enableTax ? Math.round(subtotal * (systemPajakPercent / 100)) : 0;
  const totalHarga = isEmployeeOrder ? 0 : subtotal + pajak;

  const dibayarNum = isEmployeeOrder
    ? 0
    : paymentMethod === "QRIS"
    ? totalHarga
    : Number(dibayarInput.replace(/\D/g, "")) || 0;

  const kembalian = isEmployeeOrder
    ? 0
    : paymentMethod === "QRIS"
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

  const initiatePay = () => {
    setErrorMsg("");
    if (cart.length === 0) {
      setErrorMsg("Keranjang belanja masih kosong!");
      return;
    }

    if (isEmployeeOrder) {
      setAdminPasswordInput("");
      setAdminAuthError("");
      setIsAdminAuthModalOpen(true);
    } else if (paymentMethod === "QRIS") {
      setIsQrisModalOpen(true);
    } else {
      executePayTransaction("TUNAI");
    }
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");

    if (!adminPasswordInput || !adminPasswordInput.trim()) {
      setAdminAuthError("Password admin wajib diisi!");
      return;
    }

    startTransition(async () => {
      const verifyRes = await verifyAdminPasswordAction(adminPasswordInput);
      if (verifyRes.success) {
        setIsAdminAuthModalOpen(false);
        executePayTransaction("TUNAI");
      } else {
        setAdminAuthError(verifyRes.error || "Password admin tidak valid");
      }
    });
  };

  const executePayTransaction = (overrideMethod?: "TUNAI" | "QRIS") => {
    const method = overrideMethod || paymentMethod;
    setErrorMsg("");

    const isKaryawanRole = currentUser?.role === "karyawan";
    const selectedEmp = karyawanList.find((k) => k.id === selectedKaryawanId);

    const targetKaryawanNama = isKaryawanRole
      ? currentUser?.nama || "Karyawan"
      : selectedEmp
      ? selectedEmp.nama
      : customKaryawanNama.trim() || "Karyawan Store";

    const targetKaryawanId = isKaryawanRole
      ? currentUser?.id
      : selectedKaryawanId || undefined;

    const effectiveDibayar = isEmployeeOrder ? 0 : method === "QRIS" ? totalHarga : dibayarNum;

    if (!isEmployeeOrder && effectiveDibayar < totalHarga) {
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
          kategoriId: item.kategoriId,
        })),
        pajak,
        dibayar: effectiveDibayar,
        namaKasir: currentUser?.nama || namaKasir || "Kasir Cafe",
        metodePembayaran: isEmployeeOrder ? "FREE ORDER" : method,
        jenisTransaksi: isEmployeeOrder ? "karyawan" : "regular",
        karyawanId: isEmployeeOrder ? targetKaryawanId : undefined,
        namaKaryawan: isEmployeeOrder ? targetKaryawanNama : undefined,
      });

      if (res.success && res.data) {
        setReceiptData({
          nomorStruk: res.data.nomorStruk,
          tanggal: res.data.tanggal,
          namaKasir: res.data.namaKasir,
          jenisTransaksi: res.data.jenisTransaksi,
          namaKaryawan: res.data.namaKaryawan || undefined,
          metodePembayaran: res.data.metodePembayaran,
          subtotal: res.data.subtotal,
          pajak: res.data.pajak,
          totalHarga: res.data.totalHarga,
          dibayar: res.data.dibayar,
          kembalian: res.data.kembalian,
          totalHargaAsli: res.data.totalHargaAsli,
          totalDiskon: res.data.totalDiskon,
          detailTransaksi: res.data.detailTransaksi,
        });
        setIsQrisModalOpen(false);
        setIsEmployeeOrder(false);
        clearCart();
        fetchActiveShift(); // Refresh shift live totals
      } else {
        setErrorMsg(res.error || "Gagal memproses transaksi");
      }
    });
  };

  const getCategoryIcon = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes("espresso")) return <Coffee className="w-4 h-4" />;
    if (name.includes("signature")) return <Sparkles className="w-4 h-4 text-amber-500" />;
    if (name.includes("teh") || name.includes("non-kopi")) return <CupSoda className="w-4 h-4" />;
    if (name.includes("makanan")) return <UtensilsCrossed className="w-4 h-4" />;
    if (name.includes("snack")) return <Cookie className="w-4 h-4" />;
    if (name.includes("dessert")) return <Cake className="w-4 h-4" />;
    return <Coffee className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Shift Control Widget Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200/90 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 coffee-card-shadow">
        {activeShift ? (
          <div className="flex items-center gap-3.5 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-stone-900">
                  Shift Aktif: {activeShift.namaKasir}
                </span>
                <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  OPEN
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Modal Awal: <strong className="text-stone-900 font-mono">Rp {activeShift.modalAwal.toLocaleString("id-ID")}</strong> • Live Tunai: <strong className="text-emerald-700 font-mono">Rp {activeShift.liveTunai.toLocaleString("id-ID")}</strong> ({activeShift.totalTransaksi} Transaksi)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-amber-950">
                Shift Kasir Belum Dibuka
              </div>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Silakan buka shift kasir baru dan masukkan modal kas awal laci sebelum memulai transaksi.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {activeShift ? (
            <button
              type="button"
              onClick={() => {
                setFisikTunaiInput(
                  String(activeShift.modalAwal + activeShift.liveTunai)
                );
                setCatatanShiftInput("");
                setIsCloseShiftModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-red-500/30 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Tutup Shift Kasir</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsStartShiftModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-500/30 active:scale-[0.98]"
            >
              <Clock className="w-4 h-4" />
              <span>Buka Shift Kasir Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-stone-200 space-y-4 coffee-card-shadow">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilter(selectedCategory, e.target.value)}
              placeholder="Cari menu kopi, minuman, atau makanan..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
            <span className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-700" />
              {menus.filter((m) => m.tersedia).length} Menu Tersedia
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => handleFilter(0, searchQuery)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 0
                ? "bg-stone-900 text-amber-400 shadow-md border border-stone-800"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 border border-stone-200/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semua Kategori</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleFilter(cat.id, searchQuery)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-amber-700 text-white shadow-md border border-amber-600"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200/60"
                }`}
              >
                {getCategoryIcon(cat.nama)}
                <span>{cat.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Menu Cards, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Menu Cards (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {isSearching ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-bold text-stone-500">Mencari daftar menu...</p>
            </div>
          ) : menus.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm space-y-2">
              <Coffee className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-extrabold text-stone-800">Menu Tidak Ditemukan</h3>
              <p className="text-xs text-stone-500">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {menus.map((menu) => {
                const inCartItem = cart.find((item) => item.menuId === menu.id);
                const isOut = !menu.tersedia;
                const hasImgError = imgErrors[menu.id];

                // Evaluate Promo for visual price strikethrough
                const promoRes = evaluatePromoInMemory(menu.id, menu.harga, menu.kategoriId, activePromos);
                const isDiscounted = promoRes !== null && promoRes.hargaPromo < menu.harga;

                return (
                  <div
                    key={menu.id}
                    onClick={() => !isOut && addToCart(menu)}
                    className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group coffee-card-shadow relative ${
                      isOut
                        ? "opacity-60 grayscale border-stone-200"
                        : "border-stone-200/90 hover:border-amber-500/80 hover:-translate-y-1 coffee-card-hover cursor-pointer"
                    }`}
                  >
                    {/* Badge Quantity in Cart */}
                    {inCartItem && (
                      <div className="absolute top-2.5 right-2.5 z-10 bg-amber-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg border border-amber-400/40 animate-in zoom-in-75">
                        {inCartItem.jumlah}x di keranjang
                      </div>
                    )}

                    {/* Promo Badge Tag */}
                    {isDiscounted && !isOut && (
                      <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md border border-red-300 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{promoRes.namaPromo}</span>
                      </div>
                    )}

                    {/* Menu Image */}
                    <div className="relative h-32 sm:h-36 bg-stone-100 overflow-hidden">
                      {menu.gambar && !hasImgError ? (
                        <img
                          src={menu.gambar}
                          alt={menu.nama}
                          onError={() => setImgErrors((prev) => ({ ...prev, [menu.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100/60 to-stone-200 text-amber-900">
                          <Coffee className="w-10 h-10 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOut && (
                        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-600 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full inline-block mb-1">
                          {menu.kategori?.nama || "Kopi"}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                          {menu.nama}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <div>
                          {isDiscounted ? (
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-red-500 line-through">
                                Rp {menu.harga.toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-amber-950">
                                Rp {promoRes.hargaPromo.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-black text-amber-950">
                              Rp {menu.harga.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isOut}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-2xl flex items-center justify-center transition-all ${
                            isOut
                              ? "bg-stone-100 text-stone-400"
                              : "bg-stone-900 text-amber-400 group-hover:bg-amber-700 group-hover:text-white shadow-sm"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Shopping Cart & Register (4/5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden coffee-card-shadow flex flex-col max-h-[85vh]">
            {/* Cart Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between border-b border-amber-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-600/30 text-amber-300 flex items-center justify-center border border-amber-500/40">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-100 leading-tight">
                    Keranjang Pesanan
                  </h3>
                  <p className="text-[11px] text-amber-200/80">
                    {cart.length} jenis item terpilih
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-stone-400 hover:text-red-400 p-1.5 rounded-xl hover:bg-stone-800 transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  title="Kosongkan Keranjang"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Employee Order Toggle */}
            <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>Pesan Karyawan (Free Order)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsEmployeeOrder(!isEmployeeOrder)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    isEmployeeOrder ? "bg-amber-700" : "bg-stone-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isEmployeeOrder ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isEmployeeOrder && (
                <div className="pt-2 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-200">
                  <p className="text-[11px] font-bold text-amber-900">Penerima Konsumsi Karyawan:</p>

                  {currentUser?.role === "karyawan" ? (
                    <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-xs font-extrabold text-amber-950 flex items-center justify-between">
                      <span>👤 {currentUser.nama} (Akun Anda)</span>
                      <span className="text-[9px] bg-amber-800 text-white px-2 py-0.5 rounded-full uppercase">Terkunci</span>
                    </div>
                  ) : karyawanList.length > 0 ? (
                    <select
                      value={selectedKaryawanId || ""}
                      onChange={(e) => setSelectedKaryawanId(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-600"
                    >
                      {karyawanList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} (@{k.username})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customKaryawanNama}
                      onChange={(e) => setCustomKaryawanNama(e.target.value)}
                      placeholder="Tuliskan nama karyawan"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                    />
                  )}
                  <span className="text-[10px] text-amber-800 block italic">
                    🔒 Memerlukan Password Otorisasi Admin untuk konfirmasi pembayaran Rp 0.
                  </span>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Cart Item List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-stone-100">
              {cart.length === 0 ? (
                <div className="py-10 text-center space-y-2 text-stone-400">
                  <ShoppingCart className="w-10 h-10 mx-auto stroke-[1.2] text-stone-300" />
                  <p className="text-xs font-bold text-stone-500">Keranjang masih kosong</p>
                  <p className="text-[11px] text-stone-400">
                    Klik item di sebelah kiri untuk menambah pesanan.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const hasDiscount = item.hargaAsli > item.hargaSatuan;
                  return (
                    <div key={item.menuId} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-stone-900 truncate">
                            {item.namaMenu}
                          </h4>
                          {item.namaPromo && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                              {item.namaPromo}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-amber-950 font-bold flex items-center gap-1.5 mt-0.5">
                          {hasDiscount && (
                            <span className="text-[10px] text-red-500 line-through font-normal">
                              Rp {item.hargaAsli.toLocaleString("id-ID")}
                            </span>
                          )}
                          <span>Rp {item.hargaSatuan.toLocaleString("id-ID")} / unit</span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.menuId, -1)}
                          className="w-6 h-6 rounded-xl bg-white text-stone-700 hover:bg-amber-100 hover:text-amber-900 flex items-center justify-center font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-6 text-center font-black text-xs text-stone-900">
                          {item.jumlah}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.menuId, 1)}
                          className="w-6 h-6 rounded-xl bg-stone-900 text-amber-400 hover:bg-amber-700 hover:text-white flex items-center justify-center font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className="font-black text-xs text-amber-950">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuId)}
                          className="text-[10px] text-stone-400 hover:text-red-600 font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Payment Summary Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-stone-50/90 border-t border-stone-200 space-y-3">
                {!isEmployeeOrder && (
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <label htmlFor="tax-toggle" className="flex items-center gap-1.5 cursor-pointer">
                      <Percent className="w-3.5 h-3.5 text-amber-700" />
                      <span>Tambah Pajak Resto ({systemPajakPercent}%)</span>
                    </label>
                    <input
                      id="tax-toggle"
                      type="checkbox"
                      checked={enableTax}
                      onChange={(e) => setEnableTax(e.target.checked)}
                      className="w-4 h-4 accent-amber-700 rounded cursor-pointer"
                    />
                  </div>
                )}

                <div className="space-y-1 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal Pesanan</span>
                    <span className="font-bold text-stone-900">
                      Rp {subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {!isEmployeeOrder && enableTax && (
                    <div className="flex justify-between text-amber-900 font-medium">
                      <span>Pajak Resto ({systemPajakPercent}%)</span>
                      <span>Rp {pajak.toLocaleString("id-ID")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm sm:text-base font-black text-stone-950 pt-2 border-t border-stone-200">
                    <span>TOTAL BAYAR</span>
                    <span className="text-amber-900 font-mono">
                      Rp {totalHarga.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {!isEmployeeOrder && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Metode Pembayaran
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => switchPaymentMethod("TUNAI")}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "TUNAI"
                            ? "bg-amber-800 text-white shadow-md border border-amber-700"
                            : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>💵 Tunai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchPaymentMethod("QRIS")}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "QRIS"
                            ? "bg-amber-800 text-white shadow-md border border-amber-700"
                            : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>📱 QRIS</span>
                      </button>
                    </div>
                  </div>
                )}

                {!isEmployeeOrder && paymentMethod === "TUNAI" && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">
                        Uang Diterima (Rp)
                      </label>
                      <input
                        type="text"
                        value={dibayarInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setDibayarInput(val ? Number(val).toLocaleString("id-ID") : "");
                        }}
                        placeholder="Contoh: 50.000"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(totalHarga)}
                        className="py-1 px-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-lg transition-colors border border-amber-200 cursor-pointer"
                      >
                        Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(20000)}
                        className="py-1 px-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition-colors border border-stone-200 cursor-pointer"
                      >
                        20rb
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(50000)}
                        className="py-1 px-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition-colors border border-stone-200 cursor-pointer"
                      >
                        50rb
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickNominal(100000)}
                        className="py-1 px-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition-colors border border-stone-200 cursor-pointer"
                      >
                        100rb
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950">
                      <span>Kembalian:</span>
                      <span className="text-sm font-black font-mono">
                        Rp {kembalian.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Pay Button */}
                <button
                  type="button"
                  onClick={initiatePay}
                  disabled={isPending}
                  className={`w-full py-3.5 font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isEmployeeOrder
                      ? "bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white"
                      : "bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 hover:from-amber-950 hover:to-stone-900 text-white"
                  }`}
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses Transaksi...</span>
                    </>
                  ) : isEmployeeOrder ? (
                    <>
                      <UserCheck className="w-4 h-4 text-amber-300" />
                      <span>Proses Pesan Karyawan (Butuh Otorisasi Admin)</span>
                    </>
                  ) : paymentMethod === "QRIS" ? (
                    <>
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>Buka Kode QRIS</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Bayar & Cetak Struk (Rp {totalHarga.toLocaleString("id-ID")})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Start Shift (Modal Awal Kas) */}
      {isStartShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Buka Shift Kasir Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStartShiftModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartShiftSubmit} className="p-6 space-y-4">
              <p className="text-xs text-stone-600">
                Masukkan jumlah modal kas awal di laci kasir (*cash drawer float*) untuk memulai shift.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Modal Kas Awal Laci (Rp)</label>
                <input
                  type="text"
                  value={modalAwalInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setModalAwalInput(val ? Number(val).toLocaleString("id-ID") : "");
                  }}
                  placeholder="Contoh: 100.000"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsStartShiftModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Membuka Shift..." : "Konfirmasi Buka Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Close Shift (Penutupan Shift & Hitung Uang Laci) */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-stone-900 to-red-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <LogOut className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Tutup Shift Kasir (Close Shift)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-stone-100 border border-stone-200 rounded-2xl space-y-1 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span>Modal Awal Kas:</span>
                  <span className="font-bold">Rp {activeShift.modalAwal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tunai Sistem:</span>
                  <span className="font-bold text-emerald-700">+ Rp {activeShift.liveTunai.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-1 font-extrabold text-stone-900">
                  <span>Target Uang Fisik Laci:</span>
                  <span className="font-mono">Rp {(activeShift.modalAwal + activeShift.liveTunai).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Hitung Uang Fisik Tunai di Laci (Rp)</label>
                <input
                  type="text"
                  value={fisikTunaiInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFisikTunaiInput(val ? Number(val).toLocaleString("id-ID") : "");
                  }}
                  placeholder="Masukkan jumlah fisik uang tunai"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-red-600 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Catatan Shift (Opsional)</label>
                <textarea
                  rows={2}
                  value={catatanShiftInput}
                  onChange={(e) => setCatatanShiftInput(e.target.value)}
                  placeholder="Contoh: Uang pecahan 100rb habis untuk kembalian"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Menutup Shift..." : "Konfirmasi Tutup Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closed Shift Summary Printable Modal */}
      {closedShiftSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col no-print">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Laporan Penutupan Shift Kasir
              </h3>
              <button
                type="button"
                onClick={() => setClosedShiftSummary(null)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center border-b border-stone-200 pb-3">
                <h2 className="text-base font-black text-stone-900">LEMBAR REKAP TUTUP SHIFT</h2>
                <p className="text-[11px] text-stone-500 font-mono">
                  {new Date(closedShiftSummary.waktuTutup).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Nama Kasir:</span>
                  <span className="font-bold">{closedShiftSummary.namaKasir}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modal Awal Laci:</span>
                  <span className="font-mono">Rp {closedShiftSummary.modalAwal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tunai Sistem:</span>
                  <span className="font-mono font-bold text-emerald-700">Rp {closedShiftSummary.totalTunaiSistem.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total QRIS Sistem:</span>
                  <span className="font-mono">Rp {closedShiftSummary.totalQrisSistem.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fisik Uang di Laci:</span>
                  <span className="font-mono font-black text-stone-900">Rp {closedShiftSummary.hitungFisikTunai?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-black">
                  <span>Selisih Kas (Over/Short):</span>
                  <span className={`font-mono ${closedShiftSummary.selisihKas < 0 ? "text-red-600" : closedShiftSummary.selisihKas > 0 ? "text-emerald-600" : "text-stone-800"}`}>
                    Rp {closedShiftSummary.selisihKas?.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Struk Shift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClosedShiftSummary(null)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Authorization Password Modal */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-100">Otorisasi Admin Dibutuhkan</h3>
                  <p className="text-[11px] text-amber-200">Pesan Karyawan (Free Order Rp 0)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminAuthModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" /> Konfirmasi Otorisasi Supervisor
                </p>
                <p>
                  Setiap transaksi konsumsi karyawan bernilai Rp 0 wajib dikonfirmasi dengan memasukkan <strong>Password Admin / Super Admin</strong>.
                </p>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
                  ⚠️ {adminAuthError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Password Admin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Masukkan password admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 font-bold focus:outline-none focus:border-amber-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? "Memverifikasi..." : "Verifikasi & Proses Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QRIS Scan Modal */}
      {isQrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col coffee-card-shadow">
            <div className="p-4 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm">Pembayaran QRIS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4 bg-stone-50">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm inline-block mx-auto space-y-2">
                <div className="w-48 h-48 mx-auto bg-stone-100 p-2 rounded-xl flex items-center justify-center border border-stone-200 relative">
                  <QrCode className="w-40 h-40 text-stone-900 stroke-[1.2]" />
                </div>
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  NMID: ID1029384756201
                </div>
              </div>

              <div>
                <div className="text-xs text-stone-500 font-medium">Total Tagihan Pesanan:</div>
                <div className="text-xl font-black text-amber-950 font-mono">
                  Rp {totalHarga.toLocaleString("id-ID")}
                </div>
              </div>

              <button
                type="button"
                onClick={() => executePayTransaction("QRIS")}
                disabled={isPending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Pembayaran QRIS Berhasil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Printable Modal */}
      <ReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
}
