"use client";

import {
  TrendingUp,
  Clock,
  DollarSign,
  ShoppingBag,
  Award,
  CreditCard,
  QrCode,
  UserCheck,
  Calendar,
  Sparkles,
  BarChart2,
  PieChart
} from "lucide-react";

export interface DashboardData {
  totalHariIni: number;
  jumlahTransaksiHariIni: number;
  totalSemuaTransaksi: number;
  hourlyPeak: { hour: string; count: number; omset: number }[];
  weeklyTrend: { date: string; dateLabel: string; omset: number; count: number }[];
  paymentBreakdown: { totalTunai: number; totalQris: number; totalFree: number };
  topItems: { nama: string; totalQty: number; totalOmset: number }[];
}

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const {
    totalHariIni,
    jumlahTransaksiHariIni,
    totalSemuaTransaksi,
    hourlyPeak = [],
    weeklyTrend = [],
    paymentBreakdown = { totalTunai: 0, totalQris: 0, totalFree: 0 },
    topItems = [],
  } = initialData;

  // Max value for hourly peak scale
  const maxHourlyCount = Math.max(...hourlyPeak.map((h) => h.count), 1);

  // Max value for weekly trend scale
  const maxWeeklyOmset = Math.max(...weeklyTrend.map((w) => w.omset), 1);

  const totalPaymentSum =
    paymentBreakdown.totalTunai +
    paymentBreakdown.totalQris +
    paymentBreakdown.totalFree;

  const tunaiPercent = totalPaymentSum > 0 ? Math.round((paymentBreakdown.totalTunai / totalPaymentSum) * 100) : 0;
  const qrisPercent = totalPaymentSum > 0 ? Math.round((paymentBreakdown.totalQris / totalPaymentSum) * 100) : 0;
  const freePercent = totalPaymentSum > 0 ? Math.round((paymentBreakdown.totalFree / totalPaymentSum) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl text-white shadow-xl border border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Visual Analytics & Peak Hours</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            Dashboard Performa Kedai Kopi
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Analisa grafik jam tersibuk (*Peak Hours*), tren omset 7 hari, dan 5 menu terlaris (*Best Seller*).
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Omset Hari Ini
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
              Rp {totalHariIni.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Transaksi Hari Ini
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
              {jumlahTransaksiHariIni} Transaksi
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4 coffee-card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Total Struk (7 Hari)
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
              {totalSemuaTransaksi} Struk
            </span>
          </div>
        </div>
      </div>

      {/* Feature 1: Peak Hours Hourly Bar Chart */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-4 coffee-card-shadow">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Analisis Operasional Jam Tersibuk
            </span>
            <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2 mt-1">
              <Clock className="w-5 h-5 text-amber-700" />
              Grafik Jam Tersibuk Pelanggan (*Peak Hours*)
            </h2>
          </div>

          <div className="text-xs font-bold text-stone-500 hidden sm:block">
            Skala 07:00 - 23:00 WIB
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-48 flex items-end gap-1.5 sm:gap-2.5 px-2">
            {hourlyPeak.map((h, idx) => {
              const heightPercent = maxHourlyCount > 0 ? Math.round((h.count / maxHourlyCount) * 100) : 0;
              const isPeak = h.count === maxHourlyCount && h.count > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-amber-400 text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {h.hour} • {h.count} Trx (Rp {h.omset.toLocaleString("id-ID")})
                  </div>

                  {/* Count Label */}
                  {h.count > 0 && (
                    <span className="text-[10px] font-black font-mono text-stone-700 mb-0.5">
                      {h.count}
                    </span>
                  )}

                  {/* Bar Visual */}
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isPeak
                        ? "bg-gradient-to-t from-amber-700 via-amber-600 to-amber-500 shadow-md ring-2 ring-amber-400/50"
                        : h.count > 0
                        ? "bg-gradient-to-t from-stone-800 to-stone-600 group-hover:from-amber-700 group-hover:to-amber-600"
                        : "bg-stone-100"
                    }`}
                  />

                  {/* Hour Label */}
                  <span className="text-[9px] sm:text-[10px] font-bold text-stone-500 font-mono rotate-[-45deg] sm:rotate-0 mt-1">
                    {h.hour.split(":")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Trend Line Chart & Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Revenue Trend (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-4 coffee-card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-700" />
                Tren Omset Penjualan (7 Hari Terakhir)
              </h2>
            </div>

            <div className="pt-6 pb-2">
              <div className="h-44 flex items-end gap-3 px-2">
                {weeklyTrend.map((w, idx) => {
                  const heightPercent = maxWeeklyOmset > 0 ? Math.round((w.omset / maxWeeklyOmset) * 100) : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20">
                        {w.dateLabel}: Rp {w.omset.toLocaleString("id-ID")} ({w.count} Trx)
                      </div>

                      <span className="text-[9px] font-bold text-stone-500 font-mono">
                        {w.omset > 0 ? `${Math.round(w.omset / 1000)}k` : "0"}
                      </span>

                      <div
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        className="w-full rounded-t-xl bg-gradient-to-t from-stone-900 via-amber-900 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-500 transition-all duration-300 shadow-sm"
                      />

                      <span className="text-[10px] font-extrabold text-stone-600">
                        {w.dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-4 coffee-card-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <PieChart className="w-5 h-5 text-amber-700" />
              Proporsi Metode Pembayaran
            </h2>

            <div className="space-y-4 pt-3">
              {/* Progress Tunai */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <CreditCard className="w-4 h-4 text-amber-700" /> Tunai
                  </span>
                  <span className="font-mono text-stone-900">
                    Rp {paymentBreakdown.totalTunai.toLocaleString("id-ID")} ({tunaiPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${tunaiPercent}%` }}
                    className="h-full bg-amber-700 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Progress QRIS */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <QrCode className="w-4 h-4 text-emerald-600" /> QRIS / E-Wallet
                  </span>
                  <span className="font-mono text-stone-900">
                    Rp {paymentBreakdown.totalQris.toLocaleString("id-ID")} ({qrisPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${qrisPercent}%` }}
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Progress Free Order */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <UserCheck className="w-4 h-4 text-amber-900" /> Pesan Karyawan (Free)
                  </span>
                  <span className="font-mono text-stone-900">
                    Rp {paymentBreakdown.totalFree.toLocaleString("id-ID")} ({freePercent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${freePercent}%` }}
                    className="h-full bg-amber-900 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Best Sellers List */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-4 coffee-card-shadow">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Award className="w-5 h-5 text-amber-700" />
          5 Menu Terlaris (*Top 5 Best Sellers*)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topItems.length === 0 ? (
            <div className="col-span-full py-8 text-center text-stone-400 text-xs">
              Belum ada data penjualan menu terlaris.
            </div>
          ) : (
            topItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-amber-400 font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-amber-900 font-mono">
                      {item.totalQty} Terjual
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-stone-900 mt-2 line-clamp-2">
                    {item.nama}
                  </h4>
                </div>

                <div className="text-[11px] font-bold text-stone-500 pt-2 border-t border-stone-200">
                  Omset: <span className="text-stone-900 font-mono">Rp {item.totalOmset.toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
