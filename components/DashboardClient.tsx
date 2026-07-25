"use client";

import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  BarChart3,
  Sparkles,
  Coffee
} from "lucide-react";

export interface DashboardData {
  totalHariIni: number;
  jumlahTransaksiHariIni: number;
  totalSemuaTransaksi: number;
  topItems: {
    nama: string;
    terjual: number;
    totalPendapatan: number;
  }[];
  salesChart: {
    date: string;
    displayDate: string;
    total: number;
  }[];
}

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const data = initialData;

  const maxChartValue = data?.salesChart
    ? Math.max(...data.salesChart.map((item) => item.total), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-stone-100 p-5 sm:p-7 rounded-3xl border border-amber-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Dashboard Ringkasan Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg">
            Ringkasan omset harian, tren pendapatan, dan pemeringkatan menu terlaris cafe Anda.
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-amber-800/40">
          <div className="absolute right-2 -bottom-2 opacity-10 text-white pointer-events-none">
            <DollarSign className="w-32 h-32" />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300/90">
            Penjualan Hari Ini
          </p>
          <h3 className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
            Rp {data?.totalHariIni.toLocaleString("id-ID") || 0}
          </h3>
          <p className="text-xs text-amber-200/80 mt-3 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Total pendapatan bersih masuk hari ini
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
                Transaksi Hari Ini
              </p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-1 tracking-tight">
                {data?.jumlahTransaksiHariIni || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-950 border border-amber-200 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-4 font-medium">
            Pelanggan yang sudah bertransaksi hari ini
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
                Total Semua Transaksi
              </p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-1 tracking-tight">
                {data?.totalSemuaTransaksi || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-4 font-medium">
            Akumulasi seluruh transaksi di sistem
          </p>
        </div>
      </div>

      {/* Charts & Top Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 7-Day Sales Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-700" />
                Grafik Penjualan 7 Hari Terakhir
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                Tren pendapatan harian coffee shop Anda.
              </p>
            </div>
          </div>

          {/* Custom Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-60 flex items-end gap-3 sm:gap-6 justify-between px-2 border-b border-stone-200">
              {data?.salesChart.map((item, idx) => {
                const heightPercent =
                  maxChartValue > 0
                    ? Math.max((item.total / maxChartValue) * 100, 4)
                    : 4;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none mb-1">
                      Rp {item.total.toLocaleString("id-ID")}
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-amber-950 to-amber-800 group-hover:from-amber-800 group-hover:to-amber-600 rounded-t-xl transition-all duration-300 relative shadow-sm"
                    ></div>

                    {/* X-axis label */}
                    <span className="text-[11px] font-bold text-stone-500 group-hover:text-stone-900 text-center leading-tight">
                      {item.displayDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 5 Best Selling Items */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 coffee-card-shadow space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Top 5 Menu Terlaris
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Menu favorit dengan kuantitas penjualan tertinggi.
            </p>
          </div>

          {!data?.topItems || data.topItems.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs font-medium">
              Belum ada data penjualan menu.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topItems.map((item, index) => (
                <div
                  key={index}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                        index === 0
                          ? "bg-amber-500 text-white shadow-amber-500/20"
                          : index === 1
                          ? "bg-stone-300 text-stone-800"
                          : index === 2
                          ? "bg-amber-200 text-amber-950"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                        {item.nama}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        Pendapatan: Rp {item.totalPendapatan.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="bg-amber-100/80 text-amber-950 border border-amber-200 font-extrabold text-xs px-3 py-1 rounded-full inline-block">
                      {item.terjual} terjual
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
