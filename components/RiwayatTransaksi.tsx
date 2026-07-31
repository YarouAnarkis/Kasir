"use client";

import { useState, useTransition } from "react";
import { getTransaksiHistory, voidTransaksiAction } from "@/app/actions/transaksiActions";
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
  Sparkles,
  FileSpreadsheet,
  UserCheck,
  Ban,
  AlertCircle,
  CheckCircle,
  Filter,
  X
} from "lucide-react";

interface DetailItem {
  id: number;
  namaMenu: string;
  hargaSatuan: number;
  hargaAsli?: number;
  namaPromo?: string | null;
  jumlah: number;
  subtotal: number;
}

export interface TransaksiItem {
  id: number;
  nomorStruk: string;
  tanggal: string | Date;
  namaKasir?: string;
  jenisTransaksi?: string;
  namaKaryawan?: string;
  metodePembayaran?: string;
  subtotal: number;
  totalHargaAsli?: number;
  totalDiskon?: number;
  pajak: number;
  totalHarga: number;
  dibayar: number;
  kembalian: number;
  isVoid?: boolean;
  voidReason?: string | null;
  voidBy?: string | null;
  detailTransaksi: DetailItem[];
}

interface RiwayatTransaksiProps {
  initialTransactions: TransaksiItem[];
  userRole?: string;
}

export default function RiwayatTransaksi({
  initialTransactions,
  userRole = "karyawan",
}: RiwayatTransaksiProps) {
  const [transactions, setTransactions] = useState<TransaksiItem[]>(initialTransactions);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Void Modal State
  const [voidModalTx, setVoidModalTx] = useState<TransaksiItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const isCanExportAndVoid = userRole === "admin" || userRole === "super_admin";

  const handleApplyFilter = async (date: string, jenis: string) => {
    setFilterDate(date);
    setFilterJenis(jenis);
    setIsFiltering(true);
    try {
      const res = await getTransaksiHistory(date, undefined, jenis);
      if (res.success && res.data) {
        setTransactions(res.data as TransaksiItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleQuickFilter = (type: "ALL" | "TODAY" | "KARYAWAN") => {
    if (type === "ALL") {
      handleApplyFilter("", "all");
    } else if (type === "TODAY") {
      const today = new Date().toISOString().split("T")[0];
      handleApplyFilter(today, filterJenis);
    } else if (type === "KARYAWAN") {
      handleApplyFilter(filterDate, "karyawan");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExportExcel = () => {
    const queryParams = new URLSearchParams();
    if (filterDate) queryParams.set("startDate", filterDate);
    if (filterJenis && filterJenis !== "all") queryParams.set("jenisTransaksi", filterJenis);

    window.open(`/api/export-excel?${queryParams.toString()}`, "_blank");
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalTx) return;
    setErrorMsg("");
    setSuccessMsg("");

    if (!voidReason.trim()) {
      setErrorMsg("Alasan pembatalan (Void) wajib diisi!");
      return;
    }

    startTransition(async () => {
      const res = await voidTransaksiAction(voidModalTx.id, voidReason);
      if (res.success && res.data) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === voidModalTx.id ? { ...t, isVoid: true, voidReason, voidBy: res.data.voidBy } : t))
        );
        setSuccessMsg(`Transaksi #${voidModalTx.nomorStruk.slice(-8)} berhasil dibatalkan (Void).`);
        setVoidModalTx(null);
        setVoidReason("");
      } else {
        setErrorMsg(res.error || "Gagal membatalkan transaksi");
      }
    });
  };

  const totalOmset = transactions
    .filter((t) => !t.isVoid)
    .reduce((acc, t) => acc + t.totalHarga, 0);

  const totalJumlahItem = transactions
    .filter((t) => !t.isVoid)
    .reduce(
      (acc, t) => acc + t.detailTransaksi.reduce((dAcc, d) => dAcc + d.jumlah, 0),
      0
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Summary Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Transaksi POS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Catatan Penjualan & Konsumsi
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Pantau rincian transaksi kasir, transaksi karyawan, serta cetak ulang struk.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isCanExportAndVoid && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border border-emerald-500/40"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export ke Excel (.xlsx)</span>
            </button>
          )}
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Total Omset Terfilter
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-950 font-mono">
              Rp {totalOmset.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Total Struk Transaksi
            </span>
            <span className="text-lg sm:text-xl font-black text-stone-900 font-mono">
              {transactions.length} Struk
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Total Item Terjual
            </span>
            <span className="text-lg sm:text-xl font-black text-stone-900 font-mono">
              {totalJumlahItem} Qty
            </span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3 coffee-card-shadow">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => handleApplyFilter(e.target.value, filterJenis)}
                className="px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-800 font-bold focus:outline-none focus:border-amber-600"
              />
            </div>

            <select
              value={filterJenis}
              onChange={(e) => handleApplyFilter(filterDate, e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-800 font-bold focus:outline-none focus:border-amber-600"
            >
              <option value="all">Semua Jenis Transaksi</option>
              <option value="regular">Penjualan Reguler</option>
              <option value="karyawan">Transaksi Karyawan (Free)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFilter("TODAY")}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("KARYAWAN")}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Pesan Karyawan
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("ALL")}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden coffee-card-shadow">
        {isFiltering ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-bold text-stone-500">Memuat riwayat transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-extrabold text-stone-800">Belum Ada Transaksi</h3>
            <p className="text-xs text-stone-500">Tidak ada riwayat transaksi pada filter yang dipilih.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {transactions.map((t) => {
              const isExpanded = expandedId === t.id;
              const formattedDate = new Date(t.tanggal).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              const isKaryawan = t.jenisTransaksi === "karyawan";

              return (
                <div
                  key={t.id}
                  className={`transition-colors ${t.isVoid ? "bg-red-50/40" : "hover:bg-amber-50/30"}`}
                >
                  {/* Collapsed Row */}
                  <div
                    onClick={() => toggleExpand(t.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border ${
                          t.isVoid
                            ? "bg-red-100 text-red-700 border-red-200"
                            : isKaryawan
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-stone-100 text-stone-800 border-stone-200"
                        }`}
                      >
                        {t.isVoid ? <Ban className="w-5 h-5" /> : isKaryawan ? <UserCheck className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-stone-900 font-mono">
                            #{t.nomorStruk.slice(-8).toUpperCase()}
                          </span>

                          {t.isVoid ? (
                            <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full">
                              VOID (DIBATALKAN)
                            </span>
                          ) : isKaryawan ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                              PESAN KARYAWAN (FREE)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                              REGULER ({t.metodePembayaran})
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>Kasir: <strong>{t.namaKasir || "Kasir Cafe"}</strong></span>
                          {isKaryawan && (
                            <>
                              <span>•</span>
                              <span>Penerima: <strong>{t.namaKaryawan || "Karyawan"}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <div className={`text-base font-black font-mono ${t.isVoid ? "line-through text-stone-400" : "text-amber-950"}`}>
                          Rp {t.totalHarga.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {t.detailTransaksi.length} jenis item ({t.detailTransaksi.reduce((a, b) => a + b.jumlah, 0)} Qty)
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Box */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 bg-stone-50/80 border-t border-stone-100 space-y-4 animate-in fade-in duration-150">
                      {t.isVoid && (
                        <div className="p-3 bg-red-100/70 border border-red-200 rounded-2xl text-xs text-red-900 space-y-0.5">
                          <p className="font-extrabold flex items-center gap-1">
                            <Ban className="w-4 h-4 text-red-700" /> Transaksi Dibatalkan (Void)
                          </p>
                          <p>Oleh: <strong>{t.voidBy}</strong> | Alasan: <em>"{t.voidReason}"</em></p>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-2">
                        <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                          Rincian Item Pesanan:
                        </h4>

                        <div className="divide-y divide-stone-100 text-xs">
                          {t.detailTransaksi.map((d) => (
                            <div key={d.id} className="py-2 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-stone-900">{d.namaMenu}</span>
                                {d.namaPromo && (
                                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                    {d.namaPromo}
                                  </span>
                                )}
                                <div className="text-[11px] text-stone-500">
                                  {d.jumlah}x @ Rp {d.hargaSatuan.toLocaleString("id-ID")}
                                </div>
                              </div>
                              <span className="font-bold font-mono text-stone-900">
                                Rp {d.subtotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(t as ReceiptData)}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-amber-400" />
                          <span>Cetak Ulang Struk</span>
                        </button>

                        {isCanExportAndVoid && !t.isVoid && (
                          <button
                            type="button"
                            onClick={() => setVoidModalTx(t)}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Void Transaksi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Confirm Void */}
      {voidModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-red-900 to-stone-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-red-300" />
                <div>
                  <h3 className="font-extrabold text-base">Void / Batalkan Transaksi</h3>
                  <p className="text-[11px] text-red-200">
                    Struk #{voidModalTx.nomorStruk.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoidModalTx(null)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              <p className="text-xs text-stone-600 font-medium">
                Membatalkan transaksi ini akan menandainya sebagai <strong>VOID</strong> di seluruh laporan keuangan dan statistik penjualan.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Alasan Pembatalan (Wajib):
                </label>
                <textarea
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Pesanan salah diinput / Pembayaran pelanggan dibatalkan"
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setVoidModalTx(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Memproses Void..." : "Konfirmasi Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
