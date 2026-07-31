import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const kasirId = searchParams.get("kasirId");
    const jenisTransaksi = searchParams.get("jenisTransaksi"); // "all" | "regular" | "karyawan"

    const where: any = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      where.tanggal = { gte: start, lte: end };
    }

    if (kasirId && kasirId !== "all") {
      where.kasirId = Number(kasirId);
    }

    if (jenisTransaksi && jenisTransaksi !== "all") {
      where.jenisTransaksi = jenisTransaksi;
    }

    const transactions = await prisma.transaksi.findMany({
      where,
      include: {
        detailTransaksi: {
          include: {
            promo: true,
          },
        },
        kasir: {
          select: { nama: true, username: true },
        },
        karyawan: {
          select: { nama: true },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kasir Coffee Shop System";
    workbook.created = new Date();

    // ----------------------------------------------------
    // SHEET 1: RINGKASAN PENJUALAN
    // ----------------------------------------------------
    const summarySheet = workbook.addWorksheet("Ringkasan", {
      views: [{ showGridLines: true }],
    });

    // Title Block
    summarySheet.mergeCells("A1:E1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "LAPORAN RINGKASAN PENJUALAN COFFEE SHOP";
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2D1B10" }, // Dark Espresso
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 35;

    // Filter Info
    summarySheet.getCell("A3").value = "Tanggal Laporan:";
    summarySheet.getCell("A3").font = { bold: true };
    summarySheet.getCell("B3").value = startDate
      ? `${startDate} s/d ${endDate || startDate}`
      : "Semua Tanggal";

    summarySheet.getCell("A4").value = "Jenis Transaksi:";
    summarySheet.getCell("A4").font = { bold: true };
    summarySheet.getCell("B4").value =
      jenisTransaksi === "karyawan"
        ? "Transaksi Karyawan (Free Order)"
        : jenisTransaksi === "regular"
        ? "Transaksi Reguler Penjualan"
        : "Semua Jenis Transaksi";

    // Daily Sales Aggregation
    const dailyMap: Record<
      string,
      { totalPenjualan: number; jumlahTransaksi: number; totalDiskon: number }
    > = {};

    transactions.forEach((t) => {
      const dateKey = new Date(t.tanggal).toISOString().split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { totalPenjualan: 0, jumlahTransaksi: 0, totalDiskon: 0 };
      }
      dailyMap[dateKey].totalPenjualan += t.totalHarga;
      dailyMap[dateKey].jumlahTransaksi += 1;
      dailyMap[dateKey].totalDiskon += t.totalDiskon;
    });

    const summaryHeaderRow = summarySheet.getRow(6);
    summaryHeaderRow.values = [
      "Tanggal",
      "Total Transaksi",
      "Total Diskon / Promo (Rp)",
      "Total Penjualan Bersih (Rp)",
    ];
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.height = 24;

    summaryHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC25E00" }, // Amber Brand
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let rowIndex = 7;
    let grandTotalPenjualan = 0;
    let grandTotalTransaksi = 0;
    let grandTotalDiskon = 0;

    Object.entries(dailyMap).forEach(([dateStr, data]) => {
      const row = summarySheet.getRow(rowIndex);
      row.values = [
        dateStr,
        data.jumlahTransaksi,
        data.totalDiskon,
        data.totalPenjualan,
      ];

      row.getCell(2).numFmt = "#,##0";
      row.getCell(3).numFmt = "Rp #,##0";
      row.getCell(4).numFmt = "Rp #,##0";

      grandTotalPenjualan += data.totalPenjualan;
      grandTotalTransaksi += data.jumlahTransaksi;
      grandTotalDiskon += data.totalDiskon;

      rowIndex++;
    });

    // Grand Total Row
    const grandTotalRow = summarySheet.getRow(rowIndex);
    grandTotalRow.values = [
      "TOTAL KESELURUHAN",
      grandTotalTransaksi,
      grandTotalDiskon,
      grandTotalPenjualan,
    ];
    grandTotalRow.font = { bold: true };
    grandTotalRow.getCell(2).numFmt = "#,##0";
    grandTotalRow.getCell(3).numFmt = "Rp #,##0";
    grandTotalRow.getCell(4).numFmt = "Rp #,##0";

    grandTotalRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4EEE5" },
      };
    });

    // Auto fit columns
    summarySheet.columns.forEach((col) => {
      col.width = 25;
    });

    // ----------------------------------------------------
    // SHEET 2: DETAIL TRANSAKSI
    // ----------------------------------------------------
    const detailSheet = workbook.addWorksheet("Detail Transaksi", {
      views: [{ showGridLines: true }],
    });

    const detailHeaderRow = detailSheet.getRow(1);
    detailHeaderRow.values = [
      "Tanggal & Waktu",
      "No. Transaksi",
      "Kasir",
      "Jenis Transaksi",
      "Penerima (Karyawan)",
      "Nama Menu Item",
      "Jumlah",
      "Harga Asli (Rp)",
      "Promo Dipakai",
      "Harga Setelah Promo (Rp)",
      "Subtotal Item (Rp)",
      "Total Transaksi (Rp)",
    ];

    detailHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    detailHeaderRow.height = 26;

    detailHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D1B10" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let detailRowIdx = 2;

    transactions.forEach((t) => {
      const formattedDate = new Date(t.tanggal).toLocaleString("id-ID");
      const kasirNama = t.namaKasir || t.kasir?.nama || "Kasir Cafe";
      const jenisLabel = t.jenisTransaksi === "karyawan" ? "Pesan Karyawan (Free)" : "Reguler";
      const penerimaKaryawan = t.namaKaryawan || t.karyawan?.nama || "-";

      t.detailTransaksi.forEach((d) => {
        const dRow = detailSheet.getRow(detailRowIdx);
        dRow.values = [
          formattedDate,
          t.nomorStruk,
          kasirNama,
          jenisLabel,
          penerimaKaryawan,
          d.namaMenu,
          d.jumlah,
          d.hargaAsli > 0 ? d.hargaAsli : d.hargaSatuan,
          d.namaPromo || "-",
          d.hargaSatuan,
          d.subtotal,
          t.totalHarga,
        ];

        dRow.getCell(7).numFmt = "#,##0";
        dRow.getCell(8).numFmt = "Rp #,##0";
        dRow.getCell(10).numFmt = "Rp #,##0";
        dRow.getCell(11).numFmt = "Rp #,##0";
        dRow.getCell(12).numFmt = "Rp #,##0";

        if (t.jenisTransaksi === "karyawan") {
          dRow.getCell(4).font = { color: { argb: "FFC25E00" }, bold: true };
        }

        detailRowIdx++;
      });
    });

    detailSheet.columns.forEach((col, idx) => {
      if (idx === 0) col.width = 20;
      else if (idx === 1) col.width = 24;
      else if (idx === 5) col.width = 28;
      else col.width = 18;
    });

    // Write buffer & respond
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan_Penjualan_Kasir_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export excel error:", error);
    return NextResponse.json({ error: "Gagal mengeksport data Excel" }, { status: 500 });
  }
}
