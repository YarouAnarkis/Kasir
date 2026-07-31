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

    const where: any = { isVoid: false };

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
    // SHEET 1: RINGKASAN PENJUALAN & COMPARISON
    // ----------------------------------------------------
    const summarySheet = workbook.addWorksheet("Ringkasan Total", {
      views: [{ showGridLines: true }],
    });

    // Title Header
    summarySheet.mergeCells("A1:F1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "LAPORAN RINGKASAN PENJUALAN & KONSUMSI KARYAWAN";
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2D1B10" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 35;

    // Filters Info
    summarySheet.getCell("A3").value = "Periode Laporan:";
    summarySheet.getCell("A3").font = { bold: true };
    summarySheet.getCell("B3").value = startDate
      ? `${startDate} s/d ${endDate || startDate}`
      : "Semua Tanggal";

    summarySheet.getCell("A4").value = "Tanggal Ditarik:";
    summarySheet.getCell("A4").font = { bold: true };
    summarySheet.getCell("B4").value = new Date().toLocaleString("id-ID");

    const summaryHeaderRow = summarySheet.getRow(6);
    summaryHeaderRow.values = [
      "Tanggal",
      "Jumlah Transaksi Pelanggan",
      "Total Omset Pelanggan (Rp)",
      "Jumlah Pesanan Karyawan",
      "Total Nilai Free Order (Rp)",
      "Total Hemat Promo (Rp)",
    ];
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.height = 25;

    summaryHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC25E00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Grouping by date
    const dailyMap: Record<
      string,
      {
        countCustomer: number;
        omsetCustomer: number;
        countKaryawan: number;
        nilaiKaryawan: number;
        totalPromo: number;
      }
    > = {};

    transactions.forEach((t) => {
      const dateKey = new Date(t.tanggal).toISOString().split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          countCustomer: 0,
          omsetCustomer: 0,
          countKaryawan: 0,
          nilaiKaryawan: 0,
          totalPromo: 0,
        };
      }

      if (t.jenisTransaksi === "karyawan") {
        dailyMap[dateKey].countKaryawan += 1;
        dailyMap[dateKey].nilaiKaryawan += t.totalHargaAsli || t.subtotal;
      } else {
        dailyMap[dateKey].countCustomer += 1;
        dailyMap[dateKey].omsetCustomer += t.totalHarga;
        dailyMap[dateKey].totalPromo += t.totalDiskon;
      }
    });

    let rowIndex = 7;
    let sumCustCount = 0;
    let sumCustOmset = 0;
    let sumEmpCount = 0;
    let sumEmpNilai = 0;
    let sumPromo = 0;

    Object.entries(dailyMap).forEach(([dateStr, data]) => {
      const row = summarySheet.getRow(rowIndex);
      row.values = [
        dateStr,
        data.countCustomer,
        data.omsetCustomer,
        data.countKaryawan,
        data.nilaiKaryawan,
        data.totalPromo,
      ];

      row.getCell(2).numFmt = "#,##0";
      row.getCell(3).numFmt = "Rp #,##0";
      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = "Rp #,##0";
      row.getCell(6).numFmt = "Rp #,##0";

      sumCustCount += data.countCustomer;
      sumCustOmset += data.omsetCustomer;
      sumEmpCount += data.countKaryawan;
      sumEmpNilai += data.nilaiKaryawan;
      sumPromo += data.totalPromo;

      rowIndex++;
    });

    // Grand Total
    const grandRow = summarySheet.getRow(rowIndex);
    grandRow.values = [
      "TOTAL KESELURUHAN",
      sumCustCount,
      sumCustOmset,
      sumEmpCount,
      sumEmpNilai,
      sumPromo,
    ];
    grandRow.font = { bold: true };
    grandRow.getCell(2).numFmt = "#,##0";
    grandRow.getCell(3).numFmt = "Rp #,##0";
    grandRow.getCell(4).numFmt = "#,##0";
    grandRow.getCell(5).numFmt = "Rp #,##0";
    grandRow.getCell(6).numFmt = "Rp #,##0";

    grandRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4EEE5" },
      };
    });

    summarySheet.columns.forEach((col) => {
      col.width = 26;
    });

    // ----------------------------------------------------
    // SHEET 2: PEMBELIAN PELANGGAN (REGULER)
    // ----------------------------------------------------
    const custSheet = workbook.addWorksheet("Pembelian Pelanggan", {
      views: [{ showGridLines: true }],
    });

    const custHeaderRow = custSheet.getRow(1);
    custHeaderRow.values = [
      "Tanggal",
      "Jam Pembelian",
      "No. Struk",
      "Kasir Penanggung Jawab",
      "Nama Menu Item",
      "Jumlah Qty",
      "Harga Asli (Rp)",
      "Promo Dipakai",
      "Harga Diskon (Rp)",
      "Subtotal Item (Rp)",
      "Total Struk (Rp)",
      "Metode Pembayaran",
    ];

    custHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    custHeaderRow.height = 26;
    custHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D1B10" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let custRowIdx = 2;

    transactions
      .filter((t) => t.jenisTransaksi !== "karyawan")
      .forEach((t) => {
        const dObj = new Date(t.tanggal);
        const dateStr = dObj.toLocaleDateString("id-ID");
        const timeStr = dObj.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const kasirNama = t.namaKasir || t.kasir?.nama || "Kasir Cafe";

        t.detailTransaksi.forEach((d) => {
          const row = custSheet.getRow(custRowIdx);
          row.values = [
            dateStr,
            timeStr,
            t.nomorStruk,
            kasirNama,
            d.namaMenu,
            d.jumlah,
            d.hargaAsli > 0 ? d.hargaAsli : d.hargaSatuan,
            d.namaPromo || "-",
            d.hargaSatuan,
            d.subtotal,
            t.totalHarga,
            t.metodePembayaran,
          ];

          row.getCell(6).numFmt = "#,##0";
          row.getCell(7).numFmt = "Rp #,##0";
          row.getCell(9).numFmt = "Rp #,##0";
          row.getCell(10).numFmt = "Rp #,##0";
          row.getCell(11).numFmt = "Rp #,##0";

          custRowIdx++;
        });
      });

    custSheet.columns.forEach((col, idx) => {
      if (idx === 0 || idx === 1) col.width = 16;
      else if (idx === 2) col.width = 24;
      else if (idx === 4) col.width = 28;
      else col.width = 18;
    });

    // ----------------------------------------------------
    // SHEET 3: PESANAN KARYAWAN (FREE ORDER)
    // ----------------------------------------------------
    const empSheet = workbook.addWorksheet("Pesanan Karyawan", {
      views: [{ showGridLines: true }],
    });

    const empHeaderRow = empSheet.getRow(1);
    empHeaderRow.values = [
      "Tanggal",
      "Jam Pembelian",
      "No. Struk",
      "Kasir Input",
      "Karyawan Penerima",
      "Nama Menu Item",
      "Jumlah Qty",
      "Harga Asli Item (Rp)",
      "Nilai Beban Konsumsi (Rp)",
      "Status",
    ];

    empHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    empHeaderRow.height = 26;
    empHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC25E00" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let empRowIdx = 2;

    transactions
      .filter((t) => t.jenisTransaksi === "karyawan")
      .forEach((t) => {
        const dObj = new Date(t.tanggal);
        const dateStr = dObj.toLocaleDateString("id-ID");
        const timeStr = dObj.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const kasirNama = t.namaKasir || t.kasir?.nama || "Kasir Cafe";
        const penerimaNama = t.namaKaryawan || t.karyawan?.nama || "Karyawan";

        t.detailTransaksi.forEach((d) => {
          const row = empSheet.getRow(empRowIdx);
          const itemNilai = d.hargaAsli > 0 ? d.hargaAsli * d.jumlah : d.hargaSatuan * d.jumlah;

          row.values = [
            dateStr,
            timeStr,
            t.nomorStruk,
            kasirNama,
            penerimaNama,
            d.namaMenu,
            d.jumlah,
            d.hargaAsli > 0 ? d.hargaAsli : d.hargaSatuan,
            itemNilai,
            "FREE ORDER (Gratis)",
          ];

          row.getCell(7).numFmt = "#,##0";
          row.getCell(8).numFmt = "Rp #,##0";
          row.getCell(9).numFmt = "Rp #,##0";

          empRowIdx++;
        });
      });

    empSheet.columns.forEach((col, idx) => {
      if (idx === 0 || idx === 1) col.width = 16;
      else if (idx === 2) col.width = 24;
      else if (idx === 4 || idx === 5) col.width = 26;
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
