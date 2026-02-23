import React, { useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Divider,
  message,
  Typography,
  Space,
  Select,
} from "antd";
import {
  LineChartOutlined,
  PercentageOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalculatorOutlined,
  WalletOutlined,
  BankOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { apiGetLaporanPajakData } from "../../../services/service"; // <--- Pastikan path sesuai

dayjs.locale("id");

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

const LaporanPajak = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [loading, setLoading] = useState(false);

  // === Data dari backend ===
  const [totalPendapatanFnb, setTotalPendapatanFnb] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(null);

  // === Fetch data dari backend ===
  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) return;

    try {
      setLoading(true);
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const response = await apiGetLaporanPajakData(startDate, endDate);

      if (response.message === "OK") {
        setTotalPendapatanFnb(response.total_pendapatan_fnb || 0);
        setExpenses(response.pengeluaran_list || []);
        setPaidAmount(response.tax_payment_status?.paidAmount || 0);
        setPaymentDate(
          response.tax_payment_status?.paymentDate
            ? dayjs(response.tax_payment_status.paymentDate)
            : null
        );
        message.success("Data laporan pajak berhasil dimuat.");
      } else {
        message.error("Gagal memuat data laporan pajak.");
      }
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan saat memuat data laporan pajak.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === Perhitungan ===
  const totalPendapatanKotor = totalPendapatanFnb;
  const totalPengeluaran = expenses.reduce((sum, item) => sum + (item.jumlah || 0), 0);
  const persentasePajak = 0.1;
  const pajakFinal10Persen = totalPendapatanKotor * persentasePajak;
  const labaBersihAkhir =
    totalPendapatanKotor - pajakFinal10Persen - totalPengeluaran;

  const isTaxPaid = paidAmount >= pajakFinal10Persen && pajakFinal10Persen > 0;

  // === Export ke Excel ===
  const exportExcel = () => {
    if (typeof window.XLSX === "undefined") {
      message.error("Pustaka XLSX belum siap. Coba lagi sebentar lagi.");
      return;
    }

    const startDate = dateRange[0].format("DD MMM YYYY");
    const endDate = dateRange[1].format("DD MMM YYYY");

    const wsData = [
      ["LAPORAN LABA/RUGI & PAJAK"],
      ["Periode", `${startDate} - ${endDate}`],
      [],
      ["METRIK", "JUMLAH"],
      ["Pendapatan Kotor", totalPendapatanKotor],
      ["(-) Pajak Final 10% (Omzet)", pajakFinal10Persen],
      ["(-) Total Pengeluaran Operasional", totalPengeluaran],
      ["LABA BERSIH AKHIR", labaBersihAkhir],
      [],
      ["STATUS PAJAK"],
      ["Pajak Wajib Dibayar", pajakFinal10Persen],
      ["Jumlah Sudah Dibayar", paidAmount],
      [
        "Tanggal Pembayaran",
        paymentDate ? paymentDate.format("DD-MM-YYYY") : "-",
      ],
      ["Status", isTaxPaid ? "LUNAS" : "BELUM LUNAS"],
    ];

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 40 }, { wch: 25 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Laba_Rugi_Pajak");
    window.XLSX.writeFile(
      wb,
      `Laporan Laba Rugi DCH (${startDate} - ${endDate}).xlsx`
    );
  };

  // === Load pustaka XLSX sekali saja ===
  useEffect(() => {
    const scriptId = "xlsx-script";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0ea5e9",
          borderRadius: 12,
          colorTextHeading: "#0f172a",
        },
      }}
      locale={locale}
    >
      <div style={{ padding: 20 }}>
        {/* Header ala dashboard */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 12 }}
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Dashboard Laporan Pajak
            </Title>
            <Text type="secondary">Dago Creative Hub & Coffee Lab</Text>
          </Col>
          <Col>
            <Space align="center">
              <Text type="secondary">Rentang:</Text>
              <RangePicker
                value={dateRange}
                onChange={(vals) => {
                  if (vals && vals[0] && vals[1]) {
                    setDateRange([
                      vals[0].startOf("day"),
                      vals[1].endOf("day"),
                    ]);
                  }
                }}
                format="DD-MM-YYYY"
                allowClear={false}
                disabled={loading}
              />
              <Select
                defaultValue="mtm"
                style={{ width: 140 }}
                onChange={(val) =>
                  val === "lw"
                    ? setDateRange([dayjs().subtract(7, "day"), dayjs()])
                    : setDateRange([dayjs().startOf("month"), dayjs()])
                }
                options={[
                  { value: "mtm", label: "Month to date" },
                  { value: "lw", label: "Last 7d" },
                ]}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportExcel}
                size="middle"
                disabled={loading || typeof window.XLSX === "undefined"}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Quick links */}
        <div className="flex justify-start gap-2 mb-4">
          <a
            href="/laporan"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Laporan
          </a>
          <a
            href="/fnbdashboard"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            FNB
          </a>
          <a
            href="/workingspace"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Working Space
          </a>
          <a
            href="/laporanpajak"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-gray-100"
          >
            Pajak
          </a>
        </div>

        {/* Kartu Laporan Pajak */}
        <Card
          className="shadow-sm rounded-2xl border border-gray-100 mb-6"
          title="Laporan Laba/Rugi & Pajak"
        >
          <Divider orientation="left" className="!mt-0">
            Perhitungan Laba Rugi
          </Divider>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="Pendapatan Kotor (F&B)"
                  prefix={<LineChartOutlined />}
                  value={totalPendapatanKotor}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#0ea5e9", fontWeight: 700 }}
                  loading={loading}
                />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="(-) Pajak Final 10%"
                  prefix={<PercentageOutlined />}
                  value={pajakFinal10Persen}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#fb923c", fontWeight: 700 }}
                  loading={loading}
                />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="(-) Pengeluaran Operasional"
                  prefix={<WalletOutlined />}
                  value={totalPengeluaran}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#ef4444", fontWeight: 700 }}
                  loading={loading}
                />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition bg-gray-50">
                <Statistic
                  title="LABA BERSIH AKHIR"
                  prefix={<BankOutlined />}
                  value={labaBersihAkhir}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{
                    color: labaBersihAkhir >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 800,
                  }}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">Status Pembayaran Pajak</Divider>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} lg={8}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="Status PPh Final 10%"
                  prefix={
                    isTaxPaid ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                  value={isTaxPaid ? "LUNAS" : "BELUM LUNAS"}
                  valueStyle={{
                    color: isTaxPaid ? "#16a34a" : "#dc2626",
                    fontWeight: 700,
                  }}
                  suffix={
                    paymentDate ? ` (${paymentDate.format("DD MMM YYYY")})` : ""
                  }
                  loading={loading}
                />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="Pajak Wajib Dibayar"
                  prefix={<PercentageOutlined />}
                  value={pajakFinal10Persen}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#0ea5e9", fontWeight: 700 }}
                  loading={loading}
                />
              </Card>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Card className="shadow-none border border-gray-100 rounded-xl hover:shadow-md transition">
                <Statistic
                  title="Jumlah Sudah Dibayar"
                  prefix={<CalculatorOutlined />}
                  value={paidAmount}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#16a34a", fontWeight: 700 }}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>

          <Card className="mt-6 border border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">
              <FileTextOutlined className="mr-2" />
              Perhitungan mengasumsikan penggunaan PPh Final 10% dari Omzet
              Bruto. Data ditarik langsung dari backend (transaksi dan
              pengeluaran).
            </p>
          </Card>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default LaporanPajak;
