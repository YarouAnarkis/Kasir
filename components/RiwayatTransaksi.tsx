"use client";

import { useState } from "react";
import { getTransaksiHistory } from "@/app/actions/transaksiActions";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import {
  History,
  Printer,
  ChevronDown,
  ChevronUp,
  Receipt,
  Clock,
  DollarSign,
  ShoppingBag,
  Sparkles
} from "lucide-react";

interface DetailItem {
  id: number;
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
}

interface TransaksiItem {
  id: number;
  nomorStruk: string;
  tanggal: string | Date;
  namaKasir?: string;
  subtotal: number;
  pajak: number;
  totalHarga: number;
  dibayar: number;
  kembalian: number;
  detailTransaksi: DetailItem[];
}

interface RiwayatTransaksiProps {
  initialTransactions: TransaksiItem[];
}

export default function RiwayatTransaksi({ initialTransactions }: RiwayatTransaksiProps) {
  const [transactions, setTransactions] = useState<TransaksiItem[]>(initialTransactions);
  const [filterDate, setFilterDate] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const handleDateChange = async (date: string) => {
    setFilterDate(date);
    setIsFiltering(true);
    try {
      const res = await getTransaksiHistory(date);
      if (res.success && res.data) {
        setTransactions(res.data as TransaksiItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleQuickFilter = (type: "ALL" | "TODAY") => {
    if (type === "ALL") {
      handleDateChange("");
    } else if (type === "TODAY") {
      const today = new Date().toISOString().split("T")[0];
      handleDateChange(today);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const totalOmset = transactions.reduce((acc, t) => acc + t.totalHarga, 0);
  const totalJumlahItem = transactions.reduce(
    (acc, t) => acc + t.detailTransaksi.reduce((dAcc, d) => dAcc + d.jumlah, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-stone-100 p-5 sm:p-7 rounded-3xl border border-amber-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Riwayat Penjualan Kasir
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg">
            Daftar lengkap transaksi penjualan coffee shop terurut dari waktu transaksi terbaru.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => handleQuickFilter("ALL")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all ${
              filterDate === ""
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-800"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleQuickFilter("TODAY")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all ${
              filterDate === new Date().toISOString().split("T")[0]
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-800"
            }`}
          >
            Hari Ini
          </button>

          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3.5 py-1.5 bg-stone-900/80 border border-stone-700 rounded-2xl text-xs font-bold text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-900 flex items-center justify-center font-extrabold text-xl border border-amber-200">
            #
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Transaksi</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-0.5">{transactions.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-900 flex items-center justify-center font-extrabold text-xl border border-emerald-200">
            Rp
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Omset Penjualan</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              Rp {totalOmset.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center font-extrabold text-xl border border-stone-200">
            ☕
          </div>
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Item Terjual</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-0.5">{totalJumlahItem} item</h3>
          </div>
        </div>
      </div>

      {/* Transaction Table / List */}
      {isFiltering ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-8 space-y-4 coffee-card-shadow">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 coffee-card-shadow">
          <Receipt className="w-12 h-12 text-stone-300 mx-auto stroke-[1.5]" />
          <p className="font-bold text-stone-800 text-base">Belum ada riwayat transaksi</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {filterDate
              ? "Tidak ada transaksi pada tanggal yang dipilih."
              : "Lakukan transaksi pada halaman Kasir untuk melihat riwayat di sini."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/90 coffee-card-shadow overflow-hidden divide-y divide-stone-100">
          {transactions.map((t) => {
            const isExpanded = expandedId === t.id;
            const dateStr = new Date(t.tanggal).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <div key={t.id} className="transition-colors hover:bg-stone-50/60">
                {/* Row Header */}
                <div
                  onClick={() => toggleExpand(t.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-sm font-mono">
                          #{t.nomorStruk.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          {t.detailTransaksi.length} Jenis Item
                        </span>
                        <span className="text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full">
                          Kasir: {t.namaKasir || "Kasir Cafe"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Harga</p>
                      <p className="font-extrabold text-amber-950 text-base sm:text-lg">
                        Rp {t.totalHarga.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceipt(t);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/10 active:scale-95 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        Struk
                      </button>
                      <button className="text-stone-400 hover:text-stone-700 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Item Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 pt-1 bg-stone-50/80 border-t border-dashed border-stone-200 text-xs">
                    <div className="max-w-xl space-y-3 pt-2">
                      <h4 className="font-extrabold text-stone-700 uppercase tracking-wider text-[11px]">
                        Rincian Item Pesanan:
                      </h4>

                      <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 p-3.5 space-y-2 shadow-xs">
                        {t.detailTransaksi.map((item) => (
                          <div
                            key={item.id}
                            className="pt-2 first:pt-0 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-stone-900">
                                {item.namaMenu}
                              </span>
                              <span className="text-stone-400 ml-2 font-medium">
                                ({item.jumlah}x @ Rp {item.hargaSatuan.toLocaleString("id-ID")})
                              </span>
                            </div>
                            <span className="font-extrabold text-stone-900">
                              Rp {item.subtotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial breakdown */}
                      <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 space-y-1.5 text-stone-600 shadow-xs">
                        <div className="flex justify-between font-medium">
                          <span>Subtotal Item</span>
                          <span>Rp {t.subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        {t.pajak > 0 && (
                          <div className="flex justify-between text-stone-500">
                            <span>Pajak Resto (10%)</span>
                            <span>Rp {t.pajak.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-stone-900 border-t border-stone-100 pt-1.5">
                          <span>Total Bill</span>
                          <span className="text-amber-950">
                            Rp {t.totalHarga.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 text-stone-500">
                          <span>Uang Tunai Dibayar</span>
                          <span>Rp {t.dibayar.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-700">
                          <span>Kembalian</span>
                          <span>Rp {t.kembalian.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Struk Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
