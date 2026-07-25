"use client";

import { Printer, X, CheckCircle2, Coffee, QrCode } from "lucide-react";

export interface ReceiptDetailItem {
  id?: number;
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
  subtotal: number;
}

export interface ReceiptData {
  id?: number;
  nomorStruk: string;
  tanggal: Date | string;
  namaKasir?: string;
  metodePembayaran?: string;
  subtotal: number;
  pajak: number;
  totalHarga: number;
  dibayar: number;
  kembalian: number;
  detailTransaksi: ReceiptDetailItem[];
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.tanggal).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] coffee-card-shadow">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Transaksi Berhasil</h3>
              <p className="text-[11px] text-stone-300">Struk Penjualan Siap Dicetak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk Body */}
        <div className="p-6 overflow-y-auto bg-stone-100/70 flex-1">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-md font-mono text-xs text-stone-800 space-y-4 relative"
          >
            {/* Tear-off Effect Top */}
            <div className="text-center border-b border-dashed border-stone-300 pb-4 space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-900 text-amber-100 flex items-center justify-center mx-auto mb-2 shadow-sm font-sans">
                <Coffee className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold tracking-widest text-stone-900 uppercase font-sans">
                KASIR COFFEE SHOP
              </h2>
              <p className="text-[11px] text-stone-500 font-sans">
                Jl. Kopi Harapan No. 88, Jakarta
              </p>
              <p className="text-[10px] text-stone-400 font-sans">
                Telp: 0812-3456-7890 • IG: @kasircoffeeshop
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="text-[11px] space-y-1 text-stone-600 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-stone-900">
                  #{receipt.nomorStruk.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold text-stone-900">{receipt.namaKasir || "Kasir Cafe"}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold text-stone-900">{receipt.metodePembayaran || "TUNAI"}</span>
              </div>
            </div>

            {/* Item Table */}
            <div className="border-b border-dashed border-stone-300 pb-3 space-y-2">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider grid grid-cols-12 gap-1 pb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Subtotal</span>
              </div>
              {receipt.detailTransaksi.map((item, idx) => (
                <div key={idx} className="text-[11px] space-y-0.5">
                  <div className="font-bold text-stone-900">{item.namaMenu}</div>
                  <div className="grid grid-cols-12 gap-1 text-stone-500">
                    <span className="col-span-6 text-[10px]">
                      @ Rp {item.hargaSatuan.toLocaleString("id-ID")}
                    </span>
                    <span className="col-span-2 text-center">{item.jumlah}x</span>
                    <span className="col-span-4 text-right font-semibold text-stone-800">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="text-[11px] space-y-1 text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {receipt.subtotal.toLocaleString("id-ID")}</span>
              </div>
              {receipt.pajak > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Pajak Resto (10%)</span>
                  <span>Rp {receipt.pajak.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-stone-900 pt-1.5 border-t border-stone-200">
                <span>TOTAL HARGA</span>
                <span className="text-amber-950">
                  Rp {receipt.totalHarga.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Tunai (Dibayar)</span>
                <span>Rp {receipt.dibayar.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Kembalian</span>
                <span>Rp {receipt.kembalian.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* QR & Footer */}
            <div className="text-center pt-3 border-t border-dashed border-stone-300 font-sans text-xs text-stone-500 space-y-2">
              <div className="w-16 h-16 mx-auto bg-stone-100 p-1 rounded-xl border border-stone-200 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-stone-800 stroke-[1.5]" />
              </div>
              <p className="font-semibold text-stone-800 text-[11px]">
                Terima kasih atas kunjungan Anda!
              </p>
              <p className="text-[10px] italic text-amber-900 font-medium">
                Selamat menikmati kopi pilihan Anda ☕
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-200 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
