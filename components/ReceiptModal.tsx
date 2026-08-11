"use client";

import { Printer, X, CheckCircle2, Coffee, QrCode, UserCheck, Send, Award, Phone } from "lucide-react";

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
  memberId?: number | null;
  namaPelanggan?: string | null;
  nomorHpPelanggan?: string | null;
  poinDiperoleh?: number;
  member?: {
    id: number;
    nama: string;
    nomorHp: string;
    poin: number;
    tipeMember: string;
  } | null;
  detailTransaksi: ReceiptDetailItem[];
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    const isKaryawan = receipt.jenisTransaksi === "karyawan";
    const strukHash = receipt.nomorStruk.slice(-8).toUpperCase();
    const formattedDate = new Date(receipt.tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    const itemsHtml = receipt.detailTransaksi
      .map(
        (item) => `
        <div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 11px;">
            <span style="word-break: break-word; padding-right: 4px;">${item.namaMenu}${item.namaPromo ? ` [${item.namaPromo}]` : ''}</span>
            <span style="white-space: nowrap;">Rp ${item.subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div style="font-size: 10px; font-weight: normal; color: #000; margin-top: 1px;">
            ${item.jumlah} x Rp ${item.hargaSatuan.toLocaleString("id-ID")}
          </div>
        </div>
      `
      )
      .join("");

    let customerOrMemberHtml = "";
    if (receipt.member || receipt.namaPelanggan) {
      const name = receipt.namaPelanggan || receipt.member?.nama || "";
      const tier = receipt.member?.tipeMember ? ` (${receipt.member.tipeMember})` : "";
      customerOrMemberHtml += `
        <div style="display: flex; justify-content: space-between;">
          <span>Pelanggan:</span>
          <span style="font-weight: bold;">${name}${tier}</span>
        </div>
      `;
      if (receipt.poinDiperoleh && receipt.poinDiperoleh > 0) {
        customerOrMemberHtml += `
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Poin Diperoleh:</span>
            <span>+${receipt.poinDiperoleh} Poin</span>
          </div>
        `;
      }
    }

    let paymentDetailsHtml = "";
    if (isKaryawan) {
      paymentDetailsHtml = `
        <div style="display: flex; justify-content: space-between;">
          <span>Total Harga Asli:</span>
          <span style="text-decoration: line-through;">Rp ${(receipt.totalHargaAsli || receipt.subtotal).toLocaleString("id-ID")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 900; margin-top: 3px;">
          <span>TOTAL:</span>
          <span>Rp 0 (FREE ORDER)</span>
        </div>
      `;
    } else {
      paymentDetailsHtml = `
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>Rp ${receipt.subtotal.toLocaleString("id-ID")}</span>
        </div>
        ${
          receipt.pajak > 0
            ? `<div style="display: flex; justify-content: space-between;">
                <span>Pajak Resto:</span>
                <span>Rp ${receipt.pajak.toLocaleString("id-ID")}</span>
               </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 900; margin-top: 3px; border-top: 1px dashed #000; padding-top: 3px;">
          <span>TOTAL HARGA:</span>
          <span>Rp ${receipt.totalHarga.toLocaleString("id-ID")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>Dibayar (Tunai):</span>
          <span>Rp ${receipt.dibayar.toLocaleString("id-ID")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
          <span>Kembalian:</span>
          <span>Rp ${receipt.kembalian.toLocaleString("id-ID")}</span>
        </div>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Struk - #${strukHash}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0mm;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    html, body {
      width: 100% !important;
      max-width: 58mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 10.5px !important;
      font-weight: 600 !important;
      line-height: 1.35 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-container {
      width: 100% !important;
      max-width: 58mm !important;
      padding: 4px 4px 10px 4px !important;
      margin: 0 auto !important;
    }
    .divider {
      border-top: 1px dashed #000 !important;
      margin: 5px 0 !important;
      width: 100% !important;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div style="text-align: center; margin-bottom: 4px;">
      <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">KASIR COFFEE SHOP</h2>
      <p style="font-size: 9.5px; font-weight: normal; margin-top: 2px;">Jl. Kopi Harapan No. 88, Jakarta</p>
      <p style="font-size: 9.5px; font-weight: normal;">Telp: 0812-3456-7890</p>
      ${isKaryawan ? `<div style="border: 1px solid #000; padding: 2px; margin-top: 4px; font-size: 10px; font-weight: bold;">*** STRUK FREE ORDER KARYAWAN ***</div>` : ""}
    </div>

    <div class="divider"></div>

    <div style="font-size: 10.5px; line-height: 1.35;">
      <div style="display: flex; justify-content: space-between;">
        <span>No. Struk:</span>
        <span style="font-weight: bold;">#${strukHash}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Waktu:</span>
        <span>${formattedDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Kasir:</span>
        <span style="font-weight: bold;">${receipt.namaKasir || "Kasir Cafe"}</span>
      </div>
      ${isKaryawan ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Penerima:</span>
          <span style="font-weight: bold;">${receipt.namaKaryawan || "Karyawan Store"}</span>
        </div>
      ` : `
        <div style="display: flex; justify-content: space-between;">
          <span>Metode Bayar:</span>
          <span style="font-weight: bold;">${receipt.metodePembayaran || "TUNAI"}</span>
        </div>
      `}
      ${customerOrMemberHtml}
    </div>

    <div class="divider"></div>

    <div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 4px;">
        <span>ITEM MENU</span>
        <span>SUBTOTAL</span>
      </div>
      ${itemsHtml}
    </div>

    <div class="divider"></div>

    <div style="font-size: 10.5px; line-height: 1.35;">
      ${paymentDetailsHtml}
    </div>

    <div class="divider"></div>

    <div style="text-align: center; margin-top: 6px;">
      <p style="font-size: 10.5px; font-weight: bold;">
        ${isKaryawan ? "Selamat Menikmati Jatah Konsumsi!" : "Terima kasih atas kunjungan Anda!"}
      </p>
      <p style="font-size: 9.5px; font-style: italic; margin-top: 2px;">
        Selamat menikmati racikan kopi favorit Anda
      </p>
    </div>
  </div>
</body>
</html>`;

    let iframe = document.getElementById("print-iframe-58mm") as HTMLIFrameElement | null;
    if (iframe) {
      document.body.removeChild(iframe);
    }
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe-58mm";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 250);
  };



  const formattedDate = new Date(receipt.tanggal).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const isKaryawan = receipt.jenisTransaksi === "karyawan";
  const strukHash = receipt.nomorStruk.slice(-8).toUpperCase();

  const getWaPhone = () => {
    const rawHp = receipt.nomorHpPelanggan || (receipt.member ? receipt.member.nomorHp : "");
    if (!rawHp) return "";
    const cleanHp = rawHp.replace(/\D/g, "");
    return cleanHp.startsWith("0") ? `62${cleanHp.slice(1)}` : cleanHp;
  };

  const targetWaPhone = getWaPhone();

  const handleSendWhatsApp = () => {
    const phone = targetWaPhone;

    const dateStr = new Date(receipt.tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const itemsText = receipt.detailTransaksi
      .map(
        (item) =>
          `• ${item.jumlah}x ${item.namaMenu} @ Rp ${item.hargaSatuan.toLocaleString("id-ID")} = Rp ${item.subtotal.toLocaleString("id-ID")}`
      )
      .join("\n");

    let msg = `☕ *STRUK PEMBELIAN - KASIR COFFEE SHOP*\n`;
    msg += `----------------------------------------\n`;
    msg += `No. Struk: #${strukHash}\n`;
    msg += `Waktu: ${dateStr}\n`;
    msg += `Kasir: ${receipt.namaKasir || "Kasir Cafe"}\n`;
    if (isKaryawan) {
      msg += `Penerima: ${receipt.namaKaryawan || "Karyawan Store"} (FREE ORDER)\n`;
    } else {
      msg += `Pelanggan: ${receipt.namaPelanggan || (receipt.member ? receipt.member.nama : "Pelanggan General")}\n`;
      msg += `Metode Bayar: ${receipt.metodePembayaran || "TUNAI"}\n`;
    }
    msg += `----------------------------------------\n`;
    msg += `*Rincian Pesanan:*\n${itemsText}\n`;
    msg += `----------------------------------------\n`;
    msg += `Subtotal: Rp ${receipt.subtotal.toLocaleString("id-ID")}\n`;
    if (receipt.pajak > 0) {
      msg += `Pajak Resto: Rp ${receipt.pajak.toLocaleString("id-ID")}\n`;
    }
    msg += `*TOTAL BAYAR: Rp ${receipt.totalHarga.toLocaleString("id-ID")}*\n`;
    if (!isKaryawan) {
      msg += `Dibayar: Rp ${receipt.dibayar.toLocaleString("id-ID")}\n`;
      msg += `Kembalian: Rp ${receipt.kembalian.toLocaleString("id-ID")}\n`;
    }
    if (receipt.poinDiperoleh && receipt.poinDiperoleh > 0) {
      msg += `----------------------------------------\n`;
      msg += `🎁 *Poin Diperoleh: +${receipt.poinDiperoleh} Poin*\n`;
      if (receipt.member) {
        msg += `Total Poin Member (${receipt.member.tipeMember}): ${receipt.member.poin} Poin\n`;
      }
    }
    msg += `----------------------------------------\n`;
    msg += `Terima kasih telah berkunjung di Kasir Coffee Shop! ☕\n`;
    msg += `_Simpan pesan ini sebagai bukti transaksi resmi._`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case "PLATINUM":
        return { label: "💎 PLATINUM", style: "bg-cyan-100 text-cyan-900 border-cyan-300" };
      case "GOLD":
        return { label: "🥇 GOLD", style: "bg-amber-100 text-amber-900 border-amber-300" };
      case "SILVER":
        return { label: "🥈 SILVER", style: "bg-slate-200 text-slate-900 border-slate-300" };
      default:
        return { label: "🏆 BRONZE", style: "bg-orange-100 text-orange-900 border-orange-300" };
    }
  };

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
                Struk Thermal & WhatsApp - #{strukHash}
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
            className="w-full bg-[#FAF8F5] p-4 sm:p-5 shadow-2xl font-mono text-xs text-stone-900 space-y-2.5 relative border-t-4 border-amber-900/40 rounded-t-xl pb-10"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 10px), 96% 100%, 92% calc(100% - 10px), 88% 100%, 84% calc(100% - 10px), 80% 100%, 76% calc(100% - 10px), 72% 100%, 68% calc(100% - 10px), 64% 100%, 60% calc(100% - 10px), 56% 100%, 52% calc(100% - 10px), 48% 100%, 44% calc(100% - 10px), 40% 100%, 36% calc(100% - 10px), 32% 100%, 28% calc(100% - 10px), 24% 100%, 20% calc(100% - 10px), 16% 100%, 12% calc(100% - 10px), 8% 100%, 4% calc(100% - 10px), 0 100%)",
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

              {receipt.member || receipt.namaPelanggan ? (
                <div className="bg-amber-100/70 p-2 rounded-xl border border-amber-300 space-y-1 mt-1 font-sans">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                    <span>👤 {receipt.namaPelanggan || receipt.member?.nama}</span>
                    {receipt.member && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-black ${getTierBadge(receipt.member.tipeMember).style}`}>
                        {getTierBadge(receipt.member.tipeMember).label}
                      </span>
                    )}
                  </div>
                  {receipt.poinDiperoleh && receipt.poinDiperoleh > 0 ? (
                    <div className="text-[10px] font-bold text-emerald-800 flex justify-between pt-0.5 border-t border-amber-200">
                      <span>Poin Diperoleh:</span>
                      <span>+{receipt.poinDiperoleh} Poin</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

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

            {/* Footer Thermal Message */}
            <div className="text-center pt-1 font-sans space-y-1">
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
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-2.5 no-print">
          <div className="flex gap-2">
            <button
              onClick={handleSendWhatsApp}
              disabled={!targetWaPhone}
              className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                targetWaPhone
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
              title={targetWaPhone ? `Kirim ke WA (${targetWaPhone})` : "Nomor WhatsApp pelanggan belum terdaftar"}
            >
              <Send className="w-4 h-4" />
              <span>{targetWaPhone ? "Kirim Struk WA" : "Kirim WA (No HP -)"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-950 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak Struk</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
