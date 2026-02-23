import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ConfigProvider,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Progress,
  Table,
  Divider,
  Typography,
  Select,
  Tooltip,
  Empty,
  Tag,
  Button,
} from "antd";
import { message } from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { motion } from "framer-motion";
import {
  ArrowUpOutlined,
  ShopOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";

import { getOwnerFnB, getBagiHasilDetail } from "../../../services/service";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import html2canvas from "html2canvas-pro";

dayjs.locale("id");

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HOUR_LABELS_15 = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`
);
const buildDateRangeStrings = (start, end) => {
  const out = [];
  let it = start.startOf("day");
  const last = end.startOf("day");
  while (it.isBefore(last) || it.isSame(last, "day")) {
    out.push(it.format("YYYY-MM-DD"));
    it = it.add(1, "day");
  }
  return out;
};
const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .filter((o) => o.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

const maskExceptIndices = (arr, indices) => {
  const keep = new Set(indices);
  return arr.map((v, i) => (keep.has(i) ? v : null));
};

const FnBDashboard = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [selectedTenantIds, setSelectedTenantIds] = useState([]);
  const printRef = useRef(null);
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const trafficBarRef = useRef(null);
  const peakBarRef = useRef(null);

  const [totals, setTotals] = useState({
    total_fnb: 0,
    total_ws: 0,
    total_sales: 0,
    total_transactions: 0,
    avg_daily: 0,
    total_days: 0,
  });

  const [tenantInfo, setTenantInfo] = useState([]);
  const [dailyTenant, setDailyTenant] = useState({});
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [peakByHour, setPeakByHour] = useState([]);
  const [topItems, setTopItems] = useState({});
  const [unpopItems, setUnpopItems] = useState({});

  const [dailyTarget] = useState(1000000);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalPajak, setTotalPajak] = useState(0);

  const handleDownloadImage = async () => {
    try {
      const node = document.getElementById("capture-area-fnb");
      if (!node) {
        message.error("Area laporan khusus F&B tidak ditemukan.");
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `fnb-report-${dateRange[0].format(
        "YYYYMMDD"
      )}-${dateRange[1].format("YYYYMMDD")}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      message.error("Gagal membuat gambar laporan.");
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const start = dateRange[0].format("YYYY-MM-DD");
        const end = dateRange[1].format("YYYY-MM-DD");

        const resp = await getOwnerFnB(start, end);
        const d = resp?.datas || {};
        const t = d?.totals || {};

        setTotals({
          total_fnb: Number(t.total_fnb || 0),
          total_ws: Number(t.total_ws || 0),
          total_sales: Number(t.total_sales || 0), // Ini Grand Total dari Backend
          total_transactions: Number(t.total_transactions || 0),
          avg_daily: Number(t.avg_daily || 0),
          total_days: Number(t.total_days || 0),
        });

        setTotalDiscount(Number(t.total_discount || 0));
        setTotalPajak(Number(t.total_tax || 0));

        const tenants = Array.isArray(d?.tenant_info) ? d.tenant_info : [];
        setTenantInfo(tenants);

        setDailyTenant(d?.daily_selling_per_tenant || {});
        setVisitorsByHour(
          Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []
        );
        setPeakByHour(Array.isArray(d?.peak_by_hour) ? d.peak_by_hour : []);
        setTopItems(d?.top_fnb || {});
        setUnpopItems(d?.unpopular_fnb || {});
        setPaymentBreakdown(
          Array.isArray(d?.payment_breakdown) ? d.payment_breakdown : []
        );

        const tenantIds = new Set(tenants.map((t) => t.id));
        const currentFilterIsValid = selectedTenantIds.every((id) =>
          tenantIds.has(id)
        );

        if (!currentFilterIsValid) {
          setSelectedTenantIds([]);
        }
      } catch (e) {
        console.error(e);
        message.error("Gagal memuat data FnB Dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  // 1. Total Penjualan Bersih
  const globalGrandTotal = totals.total_sales || 0;
  const globalNetSales = Math.max(0, globalGrandTotal - totalPajak);

  // 2. Hitung Global Gross (Sum dari data harian tenant yang masih Gross)
  const globalGross = Object.values(dailyTenant).reduce((acc, day) => {
    return acc + Object.values(day).reduce((s, v) => s + v, 0);
  }, 0);

  // 3. Rasio Normalisasi (Gross -> Net)
  // Digunakan untuk mengubah data tenant (Gross) menjadi Net agar match dengan Total Penjualan Bersih
  const grossToNetRatio = globalGross > 0 ? globalNetSales / globalGross : 1;

  // 4. Rasio Pembayaran (Grand Total -> Net)
  // Digunakan untuk payment breakdown agar totalnya sama dengan Total Penjualan Bersih
  const grandToNetRatio =
    globalGrandTotal > 0 ? globalNetSales / globalGrandTotal : 1;

  // =====================================================================

  const displayTotals = useMemo(() => {
    let base = { ...totals };
    const totalDays = Math.max(1, base.total_days);

    if (selectedTenantIds.length > 0) {
      const selectedSet = new Set(selectedTenantIds);
      let newTotalGross = 0;

      for (const dayData of Object.values(dailyTenant)) {
        for (const tenantIdStr in dayData) {
          const tenantId = Number(tenantIdStr);
          if (selectedSet.has(tenantId)) {
            newTotalGross += dayData[tenantIdStr] || 0;
          }
        }
      }

      const newTotalNet = newTotalGross * grossToNetRatio;

      base.total_fnb = newTotalNet;
      base.total_sales = newTotalNet;
      base.avg_daily = Math.round(newTotalNet / totalDays);
    } else {
      base.total_sales = globalNetSales;
      base.avg_daily = Math.round(globalNetSales / totalDays);
    }

    return base;
  }, [totals, dailyTenant, selectedTenantIds, globalNetSales, grossToNetRatio]);

  const totalDays =
    displayTotals.total_days ||
    Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);

  const totalTarget = dailyTarget * totalDays;
  const pctAchieved = clamp(
    (Number(displayTotals.total_sales || 0) / Math.max(1, totalTarget)) * 100,
    0,
    999
  ).toFixed(1);

  const lineData = useMemo(() => {
    const days = buildDateRangeStrings(dateRange[0], dateRange[1]);
    const labels = days.map((d) => dayjs(d).format("D"));

    const tenantsToRender =
      selectedTenantIds.length === 0
        ? tenantInfo
        : tenantInfo.filter((t) => selectedTenantIds.includes(t.id));

    const datasets = tenantsToRender.map((tenant) => {
      const data = days.map((dayKey) => {
        const rawGross = Number(dailyTenant[dayKey]?.[tenant.id] || 0);
        return Math.round(rawGross * grossToNetRatio);
      });
      return {
        label: tenant.name,
        data: data,
        fill: false,
        borderColor: tenant.color,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    });

    return { labels, datasets };
  }, [dailyTenant, dateRange, tenantInfo, selectedTenantIds, grossToNetRatio]);

  const { doughnutData, tenantTotals } = useMemo(() => {
    if (!tenantInfo.length) {
      return { doughnutData: { labels: [], datasets: [] }, tenantTotals: [] };
    }

    const labels = tenantInfo.map((t) => t.name);
    const colors = tenantInfo.map((t) => t.color);

    const totalsCalc = tenantInfo.map((tenant) => {
      const totalGross = Object.values(dailyTenant).reduce((sum, dayData) => {
        return sum + (dayData[tenant.id] || 0);
      }, 0);
      return { ...tenant, total: Math.round(totalGross * grossToNetRatio) };
    });

    const data = totalsCalc.map((t) => t.total);
    const allZero = data.every((d) => d === 0);

    const doughnutData = {
      labels: labels,
      datasets: [
        {
          data: allZero ? data.map(() => 1) : data,
          backgroundColor: allZero ? data.map(() => "#E0E0E0") : colors,
          hoverOffset: 8,
        },
      ],
    };

    return { doughnutData, tenantTotals: totalsCalc };
  }, [dailyTenant, tenantInfo, grossToNetRatio]);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const exportData = await getBagiHasilDetail(startDate, endDate);
      const wb = new ExcelJS.Workbook();
      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const tenantsToExport =
        selectedTenantIds.length > 0
          ? tenantTotals.filter((t) => selectedTenantIds.includes(t.id))
          : tenantTotals;

      for (const tenant of tenantsToExport) {
        const tenantName = tenant.name;
        const sheetName = tenantName
          .substring(0, 30)
          .replace(/[:\/?*\[\]\\]/g, "");
        const ws = wb.addWorksheet(sheetName);
        const tenantDetails = exportData[tenantName];

        const totalSales = tenant.total;
        const ownerShare = totalSales * 0.3;
        const tenantShare = totalSales * 0.7;

        ws.addRow(["LAPORAN PENJUALAN F&B", tenantName]).font = {
          bold: true,
          size: 14,
        };
        ws.addRow(["Periode", `${startDate} s/d ${endDate}`]).font = {
          bold: true,
        };
        ws.addRow([]);

        ws.addRow(["Total Penjualan (Net)", totalSales]).font = { bold: true };
        ws.addRow(["Hak Tenant (70%)", tenantShare]);
        ws.addRow(["Hak Owner (30%)", ownerShare]);
        ws.addRow([]);

        for (let i = 4; i <= 6; i++) {
          const cell = ws.getCell(`B${i}`);
          if (cell.value) cell.numFmt = '"Rp"#,##0';
        }

        let currentRow = ws.actualRowCount + 1;
        ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        const salesHeader = [
          "Tanggal",
          "Produk",
          "Jumlah Qty",
          "Total Gross",
          "Discount",
          "Tax (Pajak)",
          "Net",
        ];
        ws.addRow(salesHeader).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1890FF" },
          };
          cell.border = borderStyle;
          cell.alignment = { horizontal: "center" };
        });

        if (
          tenantDetails &&
          tenantDetails.sales &&
          tenantDetails.sales.length > 0
        ) {
          tenantDetails.sales.forEach((sale) => {
            const gross = Number(sale.total_penjualan_gross) || 0;
            const discount = Number(sale.total_discount) || 0;
            const tax = Number(sale.total_pajak) || 0;
            const nett = gross - discount + tax; // Nett per item logic backend

            ws.addRow([
              dayjs(sale.tanggal).toDate(),
              sale.nama_produk,
              sale.jumlah_qty,
              gross,
              discount,
              tax,
              nett,
            ]).eachCell((cell, col) => {
              cell.border = borderStyle;
              if (col === 1) {
                cell.numFmt = "DD/MM/YYYY";
                cell.alignment = { horizontal: "center" };
              }
              if (col === 3) {
                cell.alignment = { horizontal: "center" };
              }
              if (col >= 4) {
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
              }
            });
          });
        } else {
          ws.addRow(["Tidak ada rincian transaksi."]).getCell(1).font = {
            italic: true,
          };
        }
        ws.columns = [
          { width: 15 },
          { width: 30 },
          { width: 12 },
          { width: 20 },
          { width: 15 },
          { width: 15 },
          { width: 25 },
        ];
      }

      const buffer = await wb.xlsx.writeBuffer();
      const filename = `Laporan_FNB_Net_${startDate}_sd_${endDate}.xlsx`;
      saveAs(new Blob([buffer]), filename);
      message.success("Laporan Excel Lengkap berhasil diunduh!");
    } catch (error) {
      console.error("Gagal export Excel:", error);
      message.error(`Gagal export Excel: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const visitorsMap = new Map(
    visitorsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const peakMap = new Map(
    peakByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const visitorsDataRaw = HOUR_LABELS_15.map(
    (_, idx) => visitorsMap.get(8 + idx) || 0
  );
  const peakDataRaw = HOUR_LABELS_15.map((_, idx) => peakMap.get(8 + idx) || 0);
  const topPeakIdx = useMemo(
    () => getTopNIndices(peakDataRaw, 3),
    [peakDataRaw]
  );
  const visitorsData = visitorsDataRaw;
  const peakData = useMemo(() => {
    if (!topPeakIdx.length) return peakDataRaw.map(() => null);
    return maskExceptIndices(peakDataRaw, topPeakIdx);
  }, [peakDataRaw, topPeakIdx]);

  const trafficBarData = {
    labels: HOUR_LABELS_15,
    datasets: [
      {
        label: "Total Pengunjung",
        data: visitorsData,
        backgroundColor: "#EF4444",
      },
    ],
  };
  const peakBarData = {
    labels: HOUR_LABELS_15,
    datasets: [
      {
        label: "Jumlah Menu Dipesan (Top 3)",
        data: peakData,
        backgroundColor: "#F59E0B",
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => Number.isFinite(ctx.parsed?.y),
        callbacks: {
          label: (ctx) =>
            `${
              ctx.dataset?.label ? ctx.dataset.label + ": " : ""
            }${formatRupiah(ctx.parsed?.y ?? 0)}`,
        },
      },
    },
  };
  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((s, v) => s + (v || 0), 0);
          if (!total) return "0%";
          const isDummy = ctx.dataset.data.every((v) => v === 1);
          if (isDummy) return "0%";
          return `${((value / total) * 100).toFixed(1)}%`;
        },
      },
    },
  };
  const vMaxVisitors = Math.max(0, ...visitorsData);
  const yMaxVisitors = Math.max(2, Math.ceil(vMaxVisitors));
  const trafficBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => Number.isFinite(ctx.parsed?.y),
        callbacks: {
          label: (ctx) => `Pengunjung: ${formatRupiah(ctx.parsed?.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: yMaxVisitors,
        title: { display: true, text: "Jumlah Pengunjung" },
        ticks: {
          callback: (v) => `${Math.trunc(v)}`,
          precision: 0,
          autoSkip: true,
        },
      },
      x: { title: { display: true, text: "Jam Operasional" } },
    },
  };
  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => ctx.raw != null,
        callbacks: {
          label: (ctx) => `Menu dipesan: ${formatRupiah(ctx.parsed?.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Jumlah Menu" },
        // --- TAMBAHKAN BAGIAN INI ---
        ticks: {
          stepSize: 1, // Memaksa garis grid naik setiap 1 angka (1, 2, 3...)
          precision: 0, // Menghilangkan desimal (misal 2.0 jadi 2)
        },
        // ----------------------------
      },
      x: {
        title: { display: true, text: "Jam Operasional" },
      },
    },
  };

  const withTenant = (rows, tenant) =>
    (Array.isArray(rows) ? rows : []).map((r, i) => ({
      ...r,
      tenant: tenant.name,
      tenantId: tenant.id,
      key: `${tenant.id}-${i}-${r.item}`,
      qty: Number(r.qty || 0),
      total: Number(r.total || 0),
    }));
  const allTopItems = useMemo(
    () =>
      tenantInfo.flatMap((tenant) => {
        const items = topItems[tenant.id] || [];
        return withTenant(items, tenant);
      }),
    [topItems, tenantInfo]
  );
  const allUnpopularItems = useMemo(
    () =>
      tenantInfo.flatMap((tenant) => {
        const items = unpopItems[tenant.id] || [];
        return withTenant(items, tenant);
      }),
    [unpopItems, tenantInfo]
  );
  const filteredTopItems = useMemo(() => {
    if (selectedTenantIds.length === 0) return allTopItems;
    const selectedSet = new Set(selectedTenantIds);
    return allTopItems.filter((r) => selectedSet.has(r.tenantId));
  }, [allTopItems, selectedTenantIds]);
  const filteredUnpopItems = useMemo(() => {
    if (selectedTenantIds.length === 0) return allUnpopularItems;
    const selectedSet = new Set(selectedTenantIds);
    return allUnpopularItems.filter((r) => selectedSet.has(r.tenantId));
  }, [allUnpopularItems, selectedTenantIds]);
  const top5 = useMemo(
    () =>
      [...filteredTopItems]
        .filter((r) => (r.total ?? 0) > 0 || (r.qty ?? 0) > 0)
        .sort((a, b) => b.total - a.total || b.qty - a.qty)
        .slice(0, 5),
    [filteredTopItems]
  );
  const unpopular5 = useMemo(
    () =>
      [...filteredUnpopItems]
        .sort((a, b) => a.qty - b.qty || a.total - b.total)
        .slice(0, 5),
    [filteredUnpopItems]
  );

  const topColumns = [
    {
      title: "Tenant",
      dataIndex: "tenant",
      key: "tenant",
      width: 120,
      hidden: selectedTenantIds.length > 0,
      render: (tenantName) => {
        const tenant = tenantInfo.find((t) => t.name === tenantName);
        return (
          <Tag
            color={tenant ? tenant.color : "gray"}
            style={{ marginRight: 0 }}
          >
            {tenantName}
          </Tag>
        );
      },
    },
    { title: "Item", dataIndex: "item", key: "item" },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      align: "center",
      width: 80,
      render: (v) => formatRupiah(v),
    },
    {
      title: "Total (Rp)",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 140,
      render: (t) => <b>Rp {formatRupiah(t)}</b>,
    },
  ].filter((col) => !col.hidden);

  const totalSales = displayTotals.total_sales || 0;
  const avgDaily = displayTotals.avg_daily || 0;
  const totalVisitors = totals.total_transactions || 0;
  const totalTransactions = totals.total_transactions || 0;
  const getDynamicTitle = () => {
    if (selectedTenantIds.length === 0)
      return { kpi: "Total Penjualan", line: "Daily Selling (per tenant)" };
    if (selectedTenantIds.length === 1) {
      const tenantName =
        tenantInfo.find((t) => t.id === selectedTenantIds[0])?.name || "";
      return {
        kpi: `Penjualan ${tenantName}`,
        line: `Daily Selling (${tenantName})`,
      };
    }
    return { kpi: "Penjualan (Filter)", line: "Daily Selling (Filter)" };
  };
  const dynamicTitle = getDynamicTitle();
  const isAllTenantsView = selectedTenantIds.length === 0;

  const paymentDoughnut = useMemo(() => {
    if (!paymentBreakdown || paymentBreakdown.length === 0)
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };

    const labels = paymentBreakdown.map((x) => x.method);

    // [SOLUSI] Kalikan total pembayaran dengan rasio (Net / GrandTotal)
    // Ini akan membuang porsi Pajak dari setiap metode pembayaran secara proporsional
    const values = paymentBreakdown.map((x) =>
      Math.round(x.total * grandToNetRatio)
    );

    const COLORS = ["#2563eb", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: COLORS.slice(0, values.length),
          hoverOffset: 8,
        },
      ],
    };
  }, [paymentBreakdown, grandToNetRatio]);

  const top5PerTenant = useMemo(() => {
    const sourceTenants =
      selectedTenantIds.length > 0
        ? tenantInfo.filter((t) => selectedTenantIds.includes(t.id))
        : tenantInfo;
    return sourceTenants.map((tenant) => {
      const items = (topItems[tenant.id] || [])
        .map((r, i) => ({
          ...r,
          qty: Number(r.qty || 0),
          total: Number(r.total || 0),
          tenantName: tenant.name,
        }))
        .filter((r) => r.total > 0 || r.qty > 0)
        .sort((a, b) => b.total - a.total || b.qty - a.qty)
        .slice(0, 5);
      return { tenant, items };
    });
  }, [topItems, tenantInfo, selectedTenantIds]);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header & controls */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 14 }}
          className="no-print"
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              F&B Dashboard
            </Title>
            <Text type="secondary">
              Dago Creative Hub &amp; Coffee Lab — Food &amp; Beverage
            </Text>
          </Col>
          <Col>
            <Space align="center" wrap>
              <Text type="secondary">Tenant:</Text>
              <Select
                mode="multiple"
                allowClear
                value={selectedTenantIds}
                onChange={setSelectedTenantIds}
                placeholder="Filter Tenant (Default: Semua)"
                style={{ minWidth: 200, width: "auto" }}
                loading={loading}
              >
                {tenantInfo.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
              <Text type="secondary">Rentang:</Text>
              <RangePicker
                value={dateRange}
                onChange={(vals) => {
                  if (!vals) return;
                  setDateRange([vals[0].startOf("day"), vals[1].endOf("day")]);
                }}
                format="DD-MM-YYYY"
              />
              <Select
                defaultValue="mtm"
                style={{ width: 120 }}
                onChange={(val) => {
                  if (val === "lw")
                    setDateRange([
                      dayjs().subtract(7, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ]);
                  else
                    setDateRange([
                      dayjs().startOf("month").startOf("day"),
                      dayjs().endOf("day"),
                    ]);
                }}
              >
                <Option value="mtm">Month to date</Option>
                <Option value="lw">Last 7d</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        {/* Nav Buttons */}
        <div className="flex justify-start gap-3 mb-6 no-print">
          <a
            href="/laporan"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Laporan
          </a>
          <a
            href="/fnbdashboard"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            FNB
          </a>
          <a
            href="/workingspace"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Working Space
          </a>{" "}
        </div>

        <div ref={printRef} style={{ backgroundColor: "#ffffff", padding: 1 }}>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card loading={loading}>
                  {/*Menampilkan Total Penjualan (Net) */}
                  <Statistic
                    title={
                      <Tooltip title="Total Transaksi (Grand Total) - Pajak">
                        {dynamicTitle.kpi} (Net)
                      </Tooltip>
                    }
                    value={`Rp ${formatRupiah(totalSales)}`}
                    prefix={<ShopOutlined />}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                      Target ({totalDays} hari): Rp{" "}
                      {formatRupiah(dailyTarget * totalDays)}
                    </Text>
                    <Progress
                      percent={Number(pctAchieved)}
                      status={pctAchieved >= 100 ? "success" : "active"}
                    />
                  </div>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card loading={loading}>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">Total Diskon</Text>
                    <div
                      style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}
                    >
                      Rp {formatRupiah(totalDiscount)}
                    </div>
                  </div>
                  <Divider style={{ margin: "6px 0" }} />
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">Total Pajak</Text>
                    <div
                      style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}
                    >
                      Rp {formatRupiah(totalPajak)}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title="Total Pengunjung"
                    value={formatRupiah(totalVisitors)}
                    prefix={<UsergroupAddOutlined />}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title="Jumlah Transaksi"
                    value={totalTransactions}
                    prefix={<FieldTimeOutlined />}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Charts Area */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={!isAllTenantsView ? 24 : 16}>
              <Card style={{ marginBottom: 16 }} loading={loading}>
                <Row gutter={[12, 12]}>
                  <Col
                    span={24}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {dynamicTitle.line}{" "}
                    </Title>
                    <Text type="secondary">
                      {dateRange[0].format("D MMM")} -{" "}
                      {dateRange[1].format("D MMM YYYY")}
                    </Text>
                  </Col>
                  <Col span={24}>
                    <div style={{ height: 300 }}>
                      <Line
                        ref={lineChartRef}
                        data={lineData}
                        options={{
                          ...commonOptions,
                          animation: false,
                          plugins: {
                            ...commonOptions.plugins,
                            legend: { display: lineData.datasets.length > 1 },
                          },
                          scales: {
                            x: {
                              ticks: { autoSkip: true },
                              title: { display: true, text: "Tanggal" },
                            },
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1,
                                precision: 0,
                                callback: (v) => `Rp ${formatRupiah(v)}`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
              <div style={{ display: isAllTenantsView ? "block" : "none" }}>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Row gutter={[12, 12]}>
                    <Col span={24}>
                      <Title level={5} style={{ marginTop: 0 }}>
                        F&B Visitor Traffic
                      </Title>
                      <Text type="secondary">
                        Akumulasi pengunjung selama periode {totalDays} hari.
                      </Text>
                      <div style={{ height: 300, marginTop: 10 }}>
                        <Bar
                          ref={trafficBarRef}
                          data={trafficBarData}
                          options={{ ...trafficBarOptions, animation: false }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24}>
                      <Title level={5} style={{ marginTop: 0 }}>
                        F&B Peak Ordering Hours
                      </Title>
                      <Text type="secondary">
                        Akumulasi pemesanan selama periode {totalDays} hari.
                      </Text>
                      <div style={{ height: 220 }}>
                        <Bar
                          ref={peakBarRef}
                          data={peakBarData}
                          options={{ ...peakBarOptions, animation: false }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div style={{ display: isAllTenantsView ? "block" : "none" }}>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Title level={5}>Metode Pembayaran (F&B)</Title>
                  <Text type="secondary">
                    Proporsi berdasarkan nilai penjualan bersih.
                  </Text>
                  <div style={{ height: 240, marginTop: 12 }}>
                    {paymentBreakdown.length === 0 ? (
                      <Empty description="Tidak ada transaksi lunas" />
                    ) : (
                      <Doughnut
                        data={paymentDoughnut}
                        options={{
                          maintainAspectRatio: false,
                          animation: false,
                          plugins: {
                            legend: { position: "bottom" },
                            datalabels: {
                              color: "#fff",
                              font: { weight: "bold" },
                              formatter: (value, ctx) => {
                                const total = ctx.dataset.data.reduce(
                                  (s, v) => s + v,
                                  0
                                );
                                if (!total) return "0%";
                                return ((value / total) * 100).toFixed(1) + "%";
                              },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                  <Divider />
                  {paymentBreakdown.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text>{p.method}</Text>
                      {/* [FIX 2] Tampilkan nilai metode pembayaran yang sudah di-adjust ke Net */}
                      <Text strong>
                        Rp {formatRupiah(p.total * grandToNetRatio)}
                      </Text>
                    </div>
                  ))}
                </Card>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Title level={5}>Kontribusi Tenant</Title>
                  <div style={{ height: 220 }}>
                    <Doughnut
                      ref={doughnutChartRef}
                      data={doughnutData}
                      options={{ ...doughnutOptions, animation: false }}
                    />
                  </div>
                  <Divider />
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {tenantTotals.map((tenant) => (
                      <div
                        key={tenant.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              background: tenant.color,
                              borderRadius: 2,
                              marginRight: 6,
                            }}
                          />
                          {tenant.name}
                        </Text>
                        <Text strong>Rp {formatRupiah(tenant.total)}</Text>
                      </div>
                    ))}
                  </Space>
                </Card>
                <Card style={{ marginBottom: 16 }}>
                  <Title level={5}>Target Progress</Title>
                  <Text type="secondary">
                    Total target: Rp {formatRupiah(totalTarget)}
                  </Text>
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={Number(pctAchieved)}
                      status={pctAchieved >= 100 ? "success" : "active"}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                      }}
                    >
                      <Text type="secondary">
                        Tercapai: Rp {formatRupiah(totalSales)}
                      </Text>
                      <Text type="secondary">
                        Sisa: Rp{" "}
                        {formatRupiah(Math.max(0, totalTarget - totalSales))}
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="no-print">
                <Title level={5}>Quick Actions</Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadImage}
                    style={{ width: "100%" }}
                  >
                    Cetak Gambar
                  </Button>
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    loading={exportLoading}
                    style={{ width: "100%" }}
                  >
                    Cetak Laporan (Excel)
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top 5 Menu" loading={loading}>
                <Table
                  columns={topColumns}
                  dataSource={top5}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: <Empty description="Tidak ada data" /> }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Unpopular Menu (Paling Jarang Dibeli)"
                loading={loading}
              >
                <Table
                  columns={topColumns}
                  dataSource={unpopular5}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: <Empty description="Tidak ada data" /> }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Hidden Capture Area (Also updated to use Net) */}
      <div
        id="capture-area-fnb"
        style={{
          position: "absolute",
          left: "-99999px",
          top: 0,
          width: "1200px",
          padding: "20px",
          background: "#fff",
        }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Penjualan (Net)"
                value={`Rp ${formatRupiah(totalSales)}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Pengunjung" value={totalVisitors} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Jumlah Transaksi" value={totalTransactions} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rata-rata Harian"
                value={`Rp ${formatRupiah(avgDaily)}`}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Metode Pembayaran (F&B)</Title>
              <div style={{ height: 240, marginTop: 12 }}>
                {paymentBreakdown.length === 0 ? (
                  <Empty description="Tidak ada transaksi lunas" />
                ) : (
                  <Doughnut
                    data={paymentDoughnut}
                    options={{ maintainAspectRatio: false, animation: false }}
                  />
                )}
              </div>
              <Divider />
              {paymentBreakdown.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>{p.method}</Text>
                  <Text strong>
                    Rp {formatRupiah(p.total * grandToNetRatio)}
                  </Text>
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Tenant</Title>
              <div style={{ height: 240 }}>
                <Doughnut
                  ref={doughnutChartRef}
                  data={doughnutData}
                  options={{ ...doughnutOptions, animation: false }}
                />
              </div>
              <Divider />
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                {tenantTotals.map((tenant) => (
                  <div
                    key={tenant.id}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          background: tenant.color,
                          borderRadius: 2,
                          marginRight: 6,
                        }}
                      />
                      {tenant.name}
                    </Text>
                    <Text strong>Rp {formatRupiah(tenant.total)}</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card>
              <Title level={5}>F&B Peak Ordering Hours</Title>
              <div style={{ height: 260 }}>
                <Bar
                  data={peakBarData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: "bottom" },
                      datalabels: {
                        anchor: "end",
                        align: "end",
                        offset: 4,
                        color: "#000",
                        font: { weight: "bold", size: 12 },
                        formatter: (v) => (v !== null ? v : ""),
                      },
                    },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Top 5 Menu" loading={loading}>
              <Table
                columns={topColumns}
                dataSource={top5}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
          {top5PerTenant.map(({ tenant, items }) => (
            <Col xs={24} lg={12} key={tenant.id}>
              <Card title={`Top 5 - ${tenant.name}`}>
                <Table
                  columns={topColumns.filter(
                    (col) => col.dataIndex !== "tenant"
                  )}
                  dataSource={items.map((item, i) => ({
                    ...item,
                    key: `${tenant.id}-${i}`,
                  }))}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: <Empty description="Tidak ada data" /> }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default FnBDashboard;
