"use client";

import { Printer, X, CheckCircle2, Coffee, QrCode, UserCheck } from "lucide-react";

export interface ReceiptDetailItem {
  id?: number;
  namaMenu: string;
  hargaSatuan: number;
  hargaAsli?: number;
  namaPromo?: string | null;
  jumlah: number;
  subtotal: number;
}

export interface ReceiptData {
  id?: number;
  nomorStruk: string;
  tanggal: Date | string;
  namaKasir?: string;
  jenisTransaksi?: string;
  namaKaryawan?: string;
  metodePembayaran?: string;
  subtotal: number;
  pajak: number;
  totalHarga: number;
  dibayar: number;
  kembalian: number;
  totalHargaAsli?: number;
  totalDiskon?: number;
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
    timeStyle: "medium",
  });

  const isKaryawan = receipt.jenisTransaksi === "karyawan";
  const strukHash = receipt.nomorStruk.slice(-8).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] coffee-card-shadow">
        {/* Modal Header (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                isKaryawan
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isKaryawan ? <UserCheck className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {isKaryawan ? "Pesan Karyawan Berhasil" : "Transaksi Berhasil"}
              </h3>
              <p className="text-[11px] text-stone-300">
                Struk Thermal Ready - #{strukHash}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk Body (80mm Thermal Receipt Layout) */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-stone-900/60 flex-1 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full bg-[#FAF8F5] p-5 shadow-2xl font-mono text-xs text-stone-900 space-y-3 relative border-t-4 border-amber-900/40 rounded-t-xl"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 10px), 96% 100%, 92% calc(100% - 10px), 88% 100%, 84% calc(100% - 10px), 80% 100%, 76% calc(100% - 10px), 72% 100%, 68% calc(100% - 10px), 64% 100%, 60% calc(100% - 10px), 56% 100%, 52% calc(100% - 10px), 48% 100%, 44% calc(100% - 10px), 40% 100%, 36% calc(100% - 10px), 32% 100%, 28% calc(100% - 10px), 24% 100%, 20% calc(100% - 10px), 16% 100%, 12% calc(100% - 10px), 8% 100%, 4% calc(100% - 10px), 0 100%)",
              paddingBottom: "2.5rem",
            }}
          >
            {/* Header Thermal Banner */}
            <div className="text-center pb-2 space-y-1">
              <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center mx-auto mb-1 font-sans shadow-sm no-print">
                <Coffee className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-widest text-stone-950 uppercase font-sans">
                KASIR COFFEE SHOP
              </h2>
              <p className="text-[10px] text-stone-600 font-sans">
                Jl. Kopi Harapan No. 88, Jakarta • Telp: 0812-3456-7890
              </p>

              {isKaryawan && (
                <div className="bg-amber-100/80 border border-amber-300 p-1.5 rounded-xl text-center mt-2 font-sans">
                  <p className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
                    *** STRUK FREE ORDER KARYAWAN ***
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Receipt Metadata */}
            <div className="text-[11px] space-y-1 text-stone-800 font-mono">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-stone-950">#{strukHash}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold">{receipt.namaKasir || "Kasir Cafe"}</span>
              </div>

              {isKaryawan ? (
                <div className="flex justify-between font-bold text-amber-950 bg-amber-200/50 px-1.5 py-0.5 rounded">
                  <span>Penerima:</span>
                  <span>{receipt.namaKaryawan || "Karyawan Store"}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="font-bold text-stone-950">{receipt.metodePembayaran || "TUNAI"}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Item Table */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex justify-between border-b border-stone-400 pb-1">
                <span>ITEM MENU</span>
                <span>SUBTOTAL</span>
              </div>

              {receipt.detailTransaksi.map((item, idx) => (
                <div key={idx} className="text-[11px] space-y-0.5">
                  <div className="font-bold text-stone-950 flex items-center justify-between">
                    <span>{item.namaMenu}</span>
                    {item.namaPromo && (
                      <span className="text-[9px] text-amber-900 bg-amber-200/70 px-1 rounded font-bold">
                        {item.namaPromo}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>
                      {item.jumlah} x Rp {item.hargaSatuan.toLocaleString("id-ID")}
                    </span>
                    <span className="font-bold text-stone-950">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Total breakdown */}
            <div className="text-[11px] space-y-1 text-stone-800">
              {isKaryawan ? (
                <div className="space-y-1 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Harga Asli:</span>
                    <span className="line-through">
                      Rp {(receipt.totalHargaAsli || receipt.subtotal).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-emerald-800 pt-1 border-t border-amber-200">
                    <span>TOTAL STRUK:</span>
                    <span>Rp 0 (FREE ORDER)</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {receipt.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {receipt.pajak > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Pajak Resto</span>
                      <span>Rp {receipt.pajak.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-stone-950 pt-1.5 border-t border-stone-400">
                    <span>TOTAL HARGA</span>
                    <span className="text-amber-950">
                      Rp {receipt.totalHarga.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Tunai (Dibayar)</span>
                    <span>Rp {receipt.dibayar.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Kembalian</span>
                    <span>Rp {receipt.kembalian.toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Barcode & Footer Thermal Graphic */}
            <div className="text-center pt-1 font-sans space-y-2">
              <div className="space-y-0.5">
                <div className="w-44 h-9 mx-auto bg-stone-900 text-white flex items-center justify-center rounded p-1 font-mono tracking-widest text-[9px] shadow-sm">
                  ||||| | |||| ||| |||||| ||| |||
                </div>
                <div className="text-[9px] font-mono text-stone-600">
                  TX-{strukHash}-2026
                </div>
              </div>

              <p className="font-bold text-stone-950 text-xs">
                {isKaryawan ? "Selamat Menikmati Jatah Konsumsi!" : "Terima kasih atas kunjungan Anda!"}
              </p>
              <p className="text-[10px] text-amber-950 italic font-medium">
                Selamat menikmati racikan kopi favorit Anda ☕
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions (Hidden on Print) */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
