import React, { useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  message,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  CrownOutlined,
  LineChartOutlined,
  WalletOutlined,
  AccountBookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined,
  SolutionOutlined,
  BulbOutlined,
  ShoppingOutlined,
  MinusCircleOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";
// Pastikan path import ini sesuai dengan struktur project Anda
import { getExpenses, getBagiHasilReport } from "../../../services/service"; 
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const { RangePicker } = DatePicker;

// Format Rupiah
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// Utility function untuk ikon pengeluaran
const getExpenseIcon = (key) => {
  const normalizedKey = key ? key.toUpperCase() : "";
  switch (normalizedKey) {
    case "WIFI": return <WifiOutlined className="text-xl text-blue-500" />;
    case "GAJI": return <SolutionOutlined className="text-xl text-orange-500" />;
    case "LISTRIK": return <BulbOutlined className="text-xl text-yellow-500" />;
    case "AIR": return <BulbOutlined className="text-xl text-blue-300" />;
    case "OFFICE": return <ShoppingOutlined className="text-xl text-green-500" />;
    case "MAINTENANCE": return <ToolOutlined className="text-xl text-red-500" />;
    case "KEBERSIHAN": return <ShoppingOutlined className="text-xl text-purple-500" />;
    default: return <MinusCircleOutlined className="text-xl text-gray-500" />;
  }
};

const BagiHasil = () => {
  dayjs.locale("id");
  const today = dayjs();

  const [dateRange, setDateRange] = useState([
    today.startOf("month"),
    today.endOf("month"),
  ]);
  const [laporanData, setLaporanData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load script ExcelJS jika belum ada (Fallback legacy)
  useEffect(() => {
    const scriptId = "xlsx-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const fetchAllReportData = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) {
      message.warning("Silakan pilih periode laporan yang valid.");
      return;
    }

    setLoading(true);
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");

    try {
      const [laporanResult, expensesResult] = await Promise.all([
        getBagiHasilReport(startDate, endDate),
        getExpenses(startDate, endDate),
      ]);

      setLaporanData(laporanResult);

      const groupedExpenses = expensesResult.reduce((acc, item) => {
        const key = item.kategori.toUpperCase();
        if (!acc[key]) {
          acc[key] = {
            name: `📊 ${item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)}`,
            key: key,
            amount: 0,
          };
        }
        acc[key].amount += item.jumlah;
        return acc;
      }, {});
      setExpenseData(Object.values(groupedExpenses));
    } catch (error) {
      console.error(error);
      message.error("Gagal memuat data laporan. Pastikan server aktif.");
      setLaporanData([]);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  // ============================================================
  // PERBAIKAN LOGIKA PERHITUNGAN (SESUAI REQUEST)
  // ============================================================

  // 1. Total Kotor: Seluruh transaksi (Grand Total / Uang Masuk)
  // Mengambil dari field 'grandTotal' yang dikirim backend
  const totalPenjualanKotor = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.grandTotal) || 0),
    0
  );

  // 2. Total Diskon: Diskon keseluruhan
  const totalDiskon = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.discount) || 0),
    0
  );

  // 3. Total Pajak: Jumlah pajak (FNB)
  const totalPajak = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.tax) || 0),
    0
  );

  // 4. Total Bersih: Seluruh transaksi - Pajak
  const totalPenjualanBersih = totalPenjualanKotor - totalPajak;

  // --- Perhitungan Hak & Profit ---

  // Total Hak Tenant
  const totalHakTenant = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.tenantShare) || 0),
    0
  );

  // Total Hak Owner
  const totalHakOwner = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.ownerShare) || 0),
    0
  );

  // Total Pengeluaran
  const totalPengeluaran = expenseData.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  // Profit / Rugi (Net Profit)
  const labaBersih = totalHakOwner - totalPengeluaran;

  // ============================================================
  // EXPORT EXCEL (DIPERBARUI FIELDNYA)
  // ============================================================
  const exportAll = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Keuangan", {
      views: [{ state: "frozen", ySplit: 4 }],
    });

    const border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const headerStyle = {
      font: { bold: true, name: "Times New Roman" },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4A460" } },
      border,
    };

    const tableHeaderStyle = {
      font: { bold: true, name: "Times New Roman" },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E5E5" } },
      border,
    };

    const totalRowStyle = {
      font: { bold: true, name: "Times New Roman" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCD9B6" } },
      border,
    };

    const Rp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;

    // Header Title
    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = "Laporan Bagi Hasil & Profitabilitas";
    sheet.getCell("A1").style = headerStyle;
    sheet.getCell("A1").font = { bold: true, size: 16, name: "Times New Roman" };

    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `${dateRange[0].format("DD/MM/YYYY")} s/d ${dateRange[1].format("DD/MM/YYYY")}`;
    sheet.getCell("A2").style = headerStyle;
    sheet.getCell("A2").font = { bold: true, size: 13, name: "Times New Roman" };

    sheet.addRow([]);

    // Table Headers
    const tableHeader = [
      "Tenant / Sumber",
      "Subtotal",
      "Pajak",
      "Diskon",
      "Total Kotor (Grand Total)",
      "Share Tenant",
      "Share Owner",
      "Tipe"
    ];

    const headerRow = sheet.addRow(tableHeader);
    headerRow.eachCell((cell) => Object.assign(cell, tableHeaderStyle));

    // Data Rows
    laporanData.forEach((x) => {
      const r = sheet.addRow([
        x.tenant,
        Rp(x.subtotal),
        Rp(x.tax),
        Rp(x.discount),
        Rp(x.grandTotal), // Menggunakan grandTotal
        Rp(x.tenantShare),
        Rp(x.ownerShare),
        x.isInternal ? "Internal" : "Mitra F&B"
      ]);

      r.eachCell((c) => {
        c.border = border;
        c.font = { name: "Times New Roman", size: 12 };
      });
    });

    // Total Row
    const totalRow = sheet.addRow([
      "GRAND TOTAL",
      Rp(laporanData.reduce((s, x) => s + (parseFloat(x.subtotal) || 0), 0)),
      Rp(totalPajak),
      Rp(totalDiskon),
      Rp(totalPenjualanKotor),
      Rp(totalHakTenant),
      Rp(totalHakOwner),
      "-"
    ]);

    totalRow.eachCell((c) => Object.assign(c, totalRowStyle));

    // Auto width
    sheet.columns = [
        { width: 30 }, { width: 20 }, { width: 18 }, { width: 18 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Laporan_Keuangan_${dateRange[0].format("DDMMYY")}.xlsx`);
  };

  // Kolom Tabel (Data Mapping)
  // Kolom Tabel (Data Mapping)
  const columns = [
    {
      title: "Nama Tenant",
      dataIndex: "tenant",
      key: "tenant",
      render: (text, record) => (
        <span
          className={
            record.isInternal ? "font-semibold text-purple-600" : "font-medium"
          }
        >
          {text}
        </span>
      ),
    },
    {
      // JUDUL DIPERJELAS: Menandakan ini bukan Total Kotor (Gross)
      title: "Pendapatan Bersih (Excl. Tax)",
      
      // Gunakan key custom karena kita melakukan perhitungan manual, bukan langsung ambil dataIndex
      key: "netRevenue",
      
      render: (_, record) => {
        // LOGIKA UTAMA: Grand Total (Uang Masuk) dikurangi Pajak
        const grandTotal = parseFloat(record.grandTotal) || 0;
        const tax = parseFloat(record.tax) || 0;
        const netRevenue = grandTotal - tax;

        return (
          <span className="font-semibold text-gray-800">
            {formatRupiah(netRevenue)}
          </span>
        );
      },
      align: "right",
    },
    {
      title: "Hak Tenant (70%)",
      dataIndex: "tenantShare",
      key: "tenantShare",
      render: (amount) => (
        <span className="font-semibold text-green-600">
          {formatRupiah(amount)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Hak Owner",
      dataIndex: "ownerShare",
      key: "ownerShare",
      render: (amount) => (
        <span className="font-semibold text-purple-600">
          {formatRupiah(amount)}
        </span>
      ),
      align: "right",
    },
  ];


  // RENDER UI (TIDAK ADA PERUBAHAN STRUKTUR VISUAL)
  return (
    <ConfigProvider locale={locale}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  Laporan Bagi Hasil & Profit Dashboard
                </h1>
                <p className="text-gray-600 font-medium">
                  Dago Creative Hub & Coffee Lab
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <CrownOutlined className="mr-2" />
                  Welcome, Owner
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Pilih Periode:
                </label>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD MMMM YYYY"
                  className="shadow-sm"
                  size="large"
                  allowClear={false}
                />
              </div>
            </div>
          </div>

          {/* =====  KPI ===== */}
          <Row gutter={[16, 16]} className="mb-6 mt-4">
            {/* Total Penjualan Kotor (BIRU) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-blue-500 rounded-xl">
                <Statistic
                  title="Total Penjualan Kotor"
                  value={totalPenjualanKotor}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <LineChartOutlined className="text-xl text-blue-600" />
                    </div>
                  }
                  valueStyle={{
                    color: "#1677ff",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>

            {/* Total Penjualan Bersih (HIJAU) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-green-500 rounded-xl">
                <Statistic
                  title="Total Penjualan Bersih"
                  value={totalPenjualanBersih}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <WalletOutlined className="text-xl text-green-600" />
                    </div>
                  }
                  valueStyle={{
                    color: "#52c41a",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>

            {/* Total Diskon (MERAH) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-red-500 rounded-xl">
                <Statistic
                  title="Total Diskon"
                  value={totalDiskon}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-2">
                      <CloseCircleOutlined className="text-xl text-red-600" />
                    </div>
                  }
                  valueStyle={{
                    color: "#cf1322",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>

            {/* Total Hak Tenant (KUNING) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-yellow-500 rounded-xl">
                <Statistic
                  title="Total Hak Tenant"
                  value={totalHakTenant}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                      <WalletOutlined className="text-xl text-yellow-600" />
                    </div>
                  }
                  valueStyle={{
                    color: "#d4b106",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>

            {/* Total Hak Owner (HITAM) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-black rounded-xl">
                <Statistic
                  title="Total Hak Owner"
                  value={totalHakOwner}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      <AccountBookOutlined className="text-xl text-black" />
                    </div>
                  }
                  valueStyle={{
                    color: "#000000",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>

            {/* Total Pajak (MERAH) */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-md border-l-4 border-red-500 rounded-xl">
                <Statistic
                  title="Total Pajak"
                  value={totalPajak}
                  formatter={(v) => formatRupiah(v)}
                  prefix={
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-2">
                      <AccountBookOutlined className="text-xl text-red-600" />
                    </div>
                  }
                  valueStyle={{
                    color: "#cf1322",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card className="shadow-lg rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-2">
              <h2 className="text-xl font-bold text-gray-800">
                Rincian Pendapatan per Tenant
              </h2>
              <Button icon={<DownloadOutlined />} onClick={exportAll}>
                Export
              </Button>
            </div>
            <Table
              loading={loading}
              columns={columns}
              dataSource={laporanData}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              className="custom-owner-table"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="bg-gradient-to-r from-blue-50 to-purple-50 font-bold">
                    <Table.Summary.Cell
                      index={0}
                      className="font-bold text-gray-800"
                    >
                      TOTAL
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span className="font-bold text-blue-600 text-base">
                        {formatRupiah(totalPenjualanKotor)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <span className="font-bold text-green-600 text-base">
                        {formatRupiah(totalHakTenant)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <span className="font-bold text-purple-600 text-base">
                        {formatRupiah(totalHakOwner)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Row gutter={[32, 40]} style={{ marginTop: "30px" }}>
            <Col xs={24} lg={12}>
              <Card className="shadow-lg rounded-xl h-full" loading={loading}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Pengeluaran Operasional
                </h2>
                <div className="space-y-3">
                  {expenseData.length > 0 ? (
                    expenseData.map((expense, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-600 flex items-center gap-3">
                          {getExpenseIcon(expense.key)}
                          <span>{expense.name.replace("📊 ", "")}</span>
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                          {formatRupiah(expense.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      Tidak ada data pengeluaran.
                    </div>
                  )}
                  <Divider />
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-base font-bold text-red-600">
                      TOTAL PENGELUARAN
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {formatRupiah(totalPengeluaran)}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                className={`shadow-lg rounded-xl mt-6 lg:mt-0 border-t-4 ${
                  labaBersih >= 0 ? "border-green-500" : "border-red-500"
                } h-full`}
                loading={loading}
              >
                {/* Judul Besar Dinamis */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Ringkasan
                  {labaBersih >= 0
                    ? " Profitability"
                    : " Negative Profitability"}{" "}
                  ({labaBersih >= 0 ? "Untung" : "Rugi"})
                </h2>

                <div className="space-y-4">
                  {/* Total Hak Owner */}
                  <Row justify="space-between" align="middle">
                    <Col>
                      <span className="text-gray-600 font-medium">
                        Total Hak Owner
                      </span>
                    </Col>
                    <Col>
                      <span className="font-semibold text-purple-600 text-lg">
                        {formatRupiah(totalHakOwner)}
                      </span>
                    </Col>
                  </Row>

                  {/* Total Pengeluaran */}
                  <Row justify="space-between" align="middle">
                    <Col>
                      <span className="text-gray-600 font-medium">
                        Total Pengeluaran Bulanan
                      </span>
                    </Col>
                    <Col>
                      <span className="font-semibold text-red-500 text-lg">
                        {formatRupiah(totalPengeluaran)}
                      </span>
                    </Col>
                  </Row>

                  <Divider className="my-2" />

                  {/* Hasil Akhir Profit / Rugi */}
                  <div className="text-center mt-4">
                    <Statistic
                      title={
                        <span className="text-lg font-bold text-gray-700">
                          {labaBersih >= 0 ? "PROFIT" : "RUGI"}
                        </span>
                      }
                      value={
                        labaBersih >= 0 ? labaBersih : -Math.abs(labaBersih)
                      }
                      formatter={(value) => formatRupiah(value)}
                      valueStyle={{
                        color: labaBersih >= 0 ? "#3f8600" : "#cf1322",
                        fontWeight: "bold",
                        fontSize: "2rem",
                      }}
                      prefix={
                        labaBersih >= 0 ? (
                          <CheckCircleOutlined className="text-green-600 mr-2" />
                        ) : (
                          <CloseCircleOutlined className="text-red-600 mr-2" />
                        )
                      }
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
      <style>{`
        .custom-owner-table .ant-table-thead > tr > th { background-color: #f0f5ff; color: #1677ff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .ant-statistic-title { font-size: 1rem !important; margin-bottom: 8px !important; }
        .ant-statistic-content { font-size: 2rem !important; }
        .ant-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </ConfigProvider>
  );
};

export default BagiHasil;