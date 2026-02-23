import React, { useEffect, useMemo, useState } from "react";
import {
  ConfigProvider,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Empty,
  DatePicker,
  Select,
  message,
  Button,
  Typography,
  Divider,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import html2canvas from "html2canvas-pro";
import {
  PrinterOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels"; // <-- Wajib ada untuk memunculkan teks di dalam chart
import { getDashboardSummary } from "../../../services/service";

dayjs.locale("id");

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Format Rupiah Standar Akuntansi
const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(Math.round(Number(n) || 0));

const Laporan = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [loading, setLoading] = useState(false);

  // --- STATE API ---
  const [totals, setTotals] = useState({
    total_sales: 0,
    total_tax: 0,
    total_transactions: 0,
    total_days: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [topFnb, setTopFnb] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [tenantContribution, setTenantContribution] = useState([]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const start = dateRange[0].format("YYYY-MM-DD");
        const end = dateRange[1].format("YYYY-MM-DD");
        const resp = await getDashboardSummary(start, end);

        const d = resp?.datas || {};
        setTotals({
          total_sales: Number(d?.totals?.total_sales || 0),
          total_tax: Number(d?.totals?.total_tax || 0),
          total_transactions: Number(d?.totals?.total_transactions || 0),
          total_days: Number(d?.totals?.total_days || 0),
        });
        setDailySales(Array.isArray(d?.daily_sales) ? d.daily_sales : []);
        setVisitorsByHour(Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []);
        setTopFnb(Array.isArray(d?.top_fnb) ? d.top_fnb : []);
        setPaymentBreakdown(Array.isArray(d?.payment_breakdown) ? d.payment_breakdown : []);
        setTenantContribution(Array.isArray(d?.tenant_contribution) ? d.tenant_contribution : []);
      } catch (e) {
        console.error(e);
        message.error("Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  // === METRIK PERHITUNGAN ===
  const totalPendapatanBersih = totals.total_sales - totals.total_tax;
  const netRatio = totals.total_sales > 0 ? totalPendapatanBersih / totals.total_sales : 1;
  const totalHari = totals.total_days || Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const rataRataHarian = totalPendapatanBersih / totalHari;
  const rataRataPerPesanan = totals.total_transactions > 0 ? totalPendapatanBersih / totals.total_transactions : 0;

  const netTenantContribution = useMemo(() => {
    return tenantContribution
      .filter((t) => !t.tenant.toLowerCase().includes("working space"))
      .map((t) => ({ ...t, nett: t.nett * netRatio }))
      .sort((a, b) => b.nett - a.nett);
  }, [tenantContribution, netRatio]);

  // === KONFIGURASI GRAFIK (BERKELAS & TERBACA JELAS) ===
  const chartFontColor = "#595959";
  const chartGridColor = "#f0f0f0";
  const primaryColor = "#1677ff"; 
  const palette = ["#1677ff", "#13c2c2", "#52c41a", "#faad14", "#722ed1", "#eb2f96"];

  // 1. Line Chart (Tren Penjualan)
  const lineLabels = useMemo(() => dailySales.map((d) => dayjs(d.tanggal).format("DD MMM")), [dailySales]);
  const fnbSeries = useMemo(() => dailySales.map((d) => Number(d.fnb || 0) * netRatio), [dailySales, netRatio]);

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Omzet Bersih",
        data: fnbSeries,
        fill: true,
        backgroundColor: "rgba(22, 119, 255, 0.08)",
        borderColor: primaryColor,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: primaryColor,
        pointBorderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false }, // Dimatikan untuk line chart agar tidak semrawut
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        padding: 12,
        titleFont: { size: 13, family: "Inter, sans-serif" },
        bodyFont: { size: 14, family: "Inter, sans-serif", weight: "bold" },
        callbacks: { label: (ctx) => `Rp ${formatRupiah(ctx.parsed.y)}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: chartGridColor, borderDash: [4, 4] },
        ticks: { 
            color: chartFontColor, 
            font: { weight: '500' },
            callback: (v) => v >= 1000000 ? `${v / 1000000} Jt` : v >= 1000 ? `${v / 1000} Rb` : v 
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: chartFontColor, font: { weight: '500' } },
        border: { display: false },
      },
    },
  };

  // 2. Bar Chart (Jam Sibuk)
  const hourLabels = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
  const hours = Array.from({ length: 15 }, (_, i) => 8 + i);
  const visitorsMap = new Map(visitorsByHour.map((r) => [Number(r.hour), Number(r.count)]));
  const visitorsData = hours.map((H) => visitorsMap.get(H) || 0);

  const barData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Total Pesanan",
        data: visitorsData,
        backgroundColor: primaryColor,
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 25 } // Ruang ekstra di atas grafik untuk label angka
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, // DIMUNCULKAN
        color: '#262626',
        anchor: 'end',
        align: 'top',
        offset: 2,
        font: { weight: 'bold', size: 11, family: "Inter, sans-serif" },
        formatter: (value) => (value > 0 ? value : "") // Hanya tampilkan jika > 0
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        padding: 12,
        callbacks: { label: (ctx) => `${ctx.parsed.y} Transaksi` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: chartGridColor, borderDash: [4, 4] },
        ticks: { color: chartFontColor, stepSize: 1 },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: chartFontColor },
        border: { display: false },
      },
    },
  };

  // 3. Doughnut Charts (Persentase)
  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "65%", // Agak tebal sedikit agar teks muat
    plugins: {
      legend: {
        position: "right",
        labels: { usePointStyle: true, boxWidth: 8, color: '#262626', font: { size: 12, weight: '500' } },
      },
      datalabels: {
        display: true, // DIMUNCULKAN
        color: '#ffffff', // Teks Putih
        font: { weight: 'bold', size: 12, family: "Inter, sans-serif" },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          if (!total) return "";
          const percentage = Math.round((value / total) * 100);
          // Sembunyikan label jika porsinya terlalu kecil (di bawah 5%) agar tidak bertumpuk
          return percentage >= 5 ? `${percentage}%` : ""; 
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%";
            return ` Rp ${formatRupiah(val)} (${percentage})`;
          },
        },
      },
    },
  };

  const paymentDoughnut = useMemo(() => {
    if (!paymentBreakdown || paymentBreakdown.length === 0) return { labels: [], datasets: [] };
    const sorted = [...paymentBreakdown].sort((a, b) => b.total - a.total);
    return {
      labels: sorted.map((x) => x.method),
      datasets: [{ data: sorted.map((x) => x.total * netRatio), backgroundColor: palette, borderWidth: 1, borderColor: '#fff' }],
    };
  }, [paymentBreakdown, netRatio]);

  const tenantDoughnut = useMemo(() => {
    if (!netTenantContribution || netTenantContribution.length === 0) return { labels: [], datasets: [] };
    return {
      labels: netTenantContribution.map((t) => t.tenant),
      datasets: [{ data: netTenantContribution.map((t) => t.nett), backgroundColor: palette, borderWidth: 1, borderColor: '#fff' }],
    };
  }, [netTenantContribution]);

  // === UTILITIES ===
  const handlePrint = async () => {
    const node = document.getElementById("executive-dashboard-print");
    if (!node) return;
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `Executive-Report-FNB-${dayjs().format("DDMMYY")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      message.error("Gagal mengekspor laporan.");
    }
  };

  return (
    <ConfigProvider locale={locale}>
      <div id="executive-dashboard-print" className="min-h-screen bg-[#f5f5f5] p-6 lg:p-8 font-sans">
        
        {/* HEADER KORPORAT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1f1f1f' }}>
              Executive Summary F&B
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Tinjauan performa operasional & finansial
            </Text>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white border border-[#d9d9d9] rounded flex items-center p-1">
              <RangePicker
                bordered={false}
                allowClear={false}
                value={dateRange}
                onChange={(vals) => setDateRange([vals[0].startOf("day"), vals[1].endOf("day")])}
                format="DD MMM YYYY"
                style={{ width: 240 }}
              />
              <Divider type="vertical" />
              <Select
                defaultValue="lw"
                bordered={false}
                style={{ width: 140 }}
                onChange={(val) => {
                  const end = dayjs().endOf("day");
                  let start = dayjs().startOf("day");
                  if (val === 'lw') start = dayjs().subtract(6, 'day').startOf('day');
                  if (val === 'mtm') start = dayjs().startOf('month');
                  setDateRange([start, end]);
                }}
                options={[
                  { value: "lw", label: "7 Hari Terakhir" },
                  { value: "mtm", label: "Bulan Ini" },
                ]}
              />
            </div>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Cetak
            </Button>
          </div>
        </div>

        {/* KEY PERFORMANCE INDICATORS (KPIs) */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px' }} bodyStyle={{ padding: '24px' }}>
              <Text style={{ color: '#8c8c8c', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>
                Net Revenue
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                Rp {formatRupiah(totalPendapatanBersih)}
              </Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px' }} bodyStyle={{ padding: '24px' }}>
              <Text style={{ color: '#8c8c8c', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>
                Transaction Volume
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                {formatRupiah(totals.total_transactions)} <span style={{ fontSize: '16px', color: '#8c8c8c', fontWeight: 'normal' }}>Struk</span>
              </Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px' }} bodyStyle={{ padding: '24px' }}>
              <Text style={{ color: '#8c8c8c', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>
                Average Order Value
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                Rp {formatRupiah(rataRataPerPesanan)}
              </Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px' }} bodyStyle={{ padding: '24px' }}>
              <Text style={{ color: '#8c8c8c', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>
                Daily Average
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#141414' }}>
                Rp {formatRupiah(rataRataHarian)}
              </Title>
            </Card>
          </Col>
        </Row>

        {/* GRAFIK UTAMA */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <LineChartOutlined style={{ fontSize: '18px', color: primaryColor, marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>Revenue Trend</span>
              </div>
              <div style={{ height: '300px' }}>
                <Line data={lineData} options={lineOptions} />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <PieChartOutlined style={{ fontSize: '18px', color: primaryColor, marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>Payment Distribution</span>
              </div>
              <div style={{ height: '260px' }}>
                {paymentBreakdown.length === 0 ? (
                  <Empty description="No data available" />
                ) : (
                  <Doughnut data={paymentDoughnut} options={doughnutOptions} />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={14}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <BarChartOutlined style={{ fontSize: '18px', color: primaryColor, marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>Operational Peak Hours</span>
              </div>
              <div style={{ height: '260px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <PieChartOutlined style={{ fontSize: '18px', color: primaryColor, marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>Tenant Contribution</span>
              </div>
              <div style={{ height: '260px' }}>
                {netTenantContribution.length === 0 ? (
                  <Empty description="No data available" />
                ) : (
                  <Doughnut data={tenantDoughnut} options={doughnutOptions} />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* TABEL DATA */}
        <Row>
          <Col span={24}>
            <Card bordered={false} loading={loading} style={{ borderRadius: '8px' }} bodyStyle={{ padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <TrophyOutlined style={{ fontSize: '18px', color: '#faad14', marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>Top Performing Items (Menu F&B)</span>
              </div>
              <Table
                columns={[
                  { 
                    title: "Item Name", 
                    dataIndex: "item", 
                    key: "item",
                    render: (text) => <span style={{ fontWeight: 500, color: '#1f1f1f' }}>{text}</span>
                  },
                  { 
                    title: "Tenant / Source", 
                    dataIndex: "tenant", 
                    key: "tenant",
                    width: '25%',
                    render: (text) => <span style={{ color: '#595959' }}>{text}</span>
                  },
                  {
                    title: "Qty Sold",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                    width: '15%',
                    render: (v) => formatRupiah(v),
                  },
                  {
                    title: "Total Revenue",
                    dataIndex: "total",
                    key: "total",
                    align: "right",
                    width: '20%',
                    render: (t) => <span style={{ fontWeight: 600, color: '#1f1f1f' }}>Rp {formatRupiah(t)}</span>,
                  },
                ]}
                dataSource={topFnb}
                rowKey={(r) => `${r.item}-${r.tenant || ""}`}
                pagination={false}
                locale={{ emptyText: <Empty description="No transactions recorded" /> }}
              />
            </Card>
          </Col>
        </Row>

      </div>
    </ConfigProvider>
  );
};

export default Laporan;