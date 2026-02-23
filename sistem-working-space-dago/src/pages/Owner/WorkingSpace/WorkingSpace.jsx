import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ConfigProvider,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Tag,
  Divider,
  Typography,
  Table,
  Empty,
  Spin,
  Alert,
  Tooltip,
  message,
  Modal,
  Image,
  Select,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Line, Doughnut, Bar, Radar } from "react-chartjs-2";
import { getWorkingSpaceDashboardData } from "../../../services/service";
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
  RadialLinearScale,
  Filler,
} from "chart.js";
import { motion } from "framer-motion";
import {
  ArrowUpOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";
import html2canvas from "html2canvas-pro";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

dayjs.locale("id");

// (opsional) plugin datalabels jika tersedia
if (typeof window !== "undefined" && window.ChartDataLabels) {
  ChartJS.register(window.ChartDataLabels);
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  RadialLinearScale,
  Filler
);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const formatRupiah = (num) => {
  if (num === null || num === undefined || Number.isNaN(Number(num)))
    return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(Number(num)));
};

const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .filter((o) => o.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

const normalizeCategory = (name = "") => {
  const n = String(name).toLowerCase();
  if (n.includes("monitor")) return "Space Monitor";
  if (n.includes("open")) return "Open Space";
  if (n.includes("meeting")) return "Meeting Room";
  return "Lainnya";
};

const WEEK_COLORS = [
  { border: "rgba(37,99,235,1)", bg: "rgba(37,99,235,0.18)" },
  { border: "rgba(16,185,129,1)", bg: "rgba(16,185,129,0.18)" },
  { border: "rgba(245,158,11,1)", bg: "rgba(245,158,11,0.18)" },
  { border: "rgba(239,68,68,1)", bg: "rgba(239,68,68,0.18)" },
  { border: "rgba(99,102,241,1)", bg: "rgba(99,102,241,0.18)" },
];

const startOfIsoWeek = (d) => {
  const day = d.day();
  const diff = day === 0 ? -6 : 1 - day;
  return d.add(diff, "day").startOf("day");
};

const WorkingSpace = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topWs, setTopWs] = useState([]);

  const reportRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange[0].format("YYYY-MM-DD");
        const endDate = dateRange[1].format("YYYY-MM-DD");
        const res = await getWorkingSpaceDashboardData(startDate, endDate);
        const d = res?.datas ?? res ?? {};
        setDashboardData(d);

        const top = Array.isArray(d.top_ws)
          ? d.top_ws
          : Array.isArray(d.topSpaces)
          ? d.topSpaces
          : [];

        setTopWs(
          [...top].sort(
            (a, b) =>
              Number(b?.qty || 0) - Number(a?.qty || 0) ||
              Number(b?.total || 0) - Number(a?.total || 0)
          )
        );
      } catch (err) {
        console.error(err);
        setError(err?.message || "Gagal memuat data. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  // ===== Stats =====
  const stats = useMemo(
    () =>
      dashboardData?.stats || {
        totalRevenue: 0,
        totalDiscount: 0,
        totalBookings: 0,
        totalVisitors: 0,
      },
    [dashboardData]
  );

  // === RADAR (Booking Pattern by Day per Minggu) ===
  const { radarData, radarOptions } = useMemo(() => {
    const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const detailed = dashboardData?.bookingsByDateDetailed || {};
    const start = dateRange[0].clone().startOf("day");
    const end = dateRange[1].clone().startOf("day");

    const weeks = [];
    let cursor = startOfIsoWeek(start.clone());
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      weeks.push(cursor.clone());
      cursor = cursor.add(1, "week");
    }

    const breakdownByDate = {};
    Object.keys(detailed).forEach((dstr) => {
      breakdownByDate[dstr] = detailed[dstr];
    });

    const datasets = weeks.map((weekStart, idx) => {
      const points = Array.from({ length: 7 }, (_, wday) => {
        const d = weekStart.clone().add(wday, "day");
        if (d.isBefore(start) || d.isAfter(end)) return 0;
        const key = d.format("YYYY-MM-DD");
        return Number(breakdownByDate[key]?.total || 0);
      });

      const color = WEEK_COLORS[idx % WEEK_COLORS.length];
      const label = `Minggu ${idx + 1} (${weekStart.format("D MMM")}–${weekStart
        .clone()
        .add(6, "day")
        .format("D MMM")})`;

      return {
        label,
        data: points,
        borderColor: color.border,
        backgroundColor: color.bg,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.2,
      };
    });

    const dateIndexResolver = (datasetIndex, dataIndex) => {
      const weekStart = weeks[datasetIndex];
      return weekStart.clone().add(dataIndex, "day");
    };

    const maxVal = Math.max(0, ...datasets.flatMap((ds) => ds.data));

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "left",
          onClick: (e, legendItem, legend) => {
            const chart = legend.chart;
            const index = legendItem.datasetIndex;
            const meta = chart.getDatasetMeta(index);
            meta.hidden =
              meta.hidden === null ? !chart.data.datasets[index].hidden : null;

            const visibleData = chart.data.datasets
              .filter((ds, i) => !chart.getDatasetMeta(i).hidden)
              .flatMap((ds) => ds.data);
            const maxVisible = Math.max(0, ...visibleData);
            chart.options.scales.r.suggestedMax = Math.max(
              5,
              Math.ceil(maxVisible * 1.2)
            );
            chart.update();
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const it = items[0];
              const d = dateIndexResolver(it.datasetIndex, it.dataIndex);
              const hari = labels[it.dataIndex];
              return `${hari}, ${d.format("D/M")}`;
            },
            label: (it) => `Booking: ${it.parsed.r ?? it.parsed}`,
            afterLabel: (it) => {
              const d = dateIndexResolver(it.datasetIndex, it.dataIndex);
              const key = d.format("YYYY-MM-DD");
              const node = detailed[key];
              if (!node?.breakdown) return undefined;
              const lines = [];
              Object.entries(node.breakdown).forEach(([cat, durMap]) => {
                Object.entries(durMap)
                  .map(([dur, cnt]) => ({
                    cat,
                    dur: Number(dur),
                    cnt: Number(cnt),
                  }))
                  .sort((a, b) => b.cnt - a.cnt)
                  .forEach(({ cat, dur, cnt }) => {
                    lines.push(`${cat} (${dur} Jam): ${cnt}`);
                  });
              });
              return lines.length ? ["", ...lines] : undefined;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            backdropColor: "transparent",
            maxTicksLimit: 5,
          },
          pointLabels: { font: { size: 10 } },
          suggestedMax: Math.max(5, Math.ceil(maxVal * 1.2)),
        },
      },
    };

    return { radarData: { labels, datasets }, radarOptions: options };
  }, [dashboardData, dateRange]);

  const totalDays = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const avgDaily = Math.round((stats.totalRevenue || 0) / totalDays) || 0;

  // ===== Line: Daily Booking per Category =====
  const lineData = useMemo(() => {
    const daily = dashboardData?.dailyRevenue;
    if (!daily || !daily.datasets) return { labels: [], datasets: [] };

    const baseLabels = daily.labels || daily.labelsPretty || [];
    const n = baseLabels.length;
    const numericLabels = Array.from({ length: n }, (_, i) => String(i + 1));

    const meetingRoomData = (daily.datasets["Room Meeting Besar"] || []).map(
      (val, i) => (val || 0) + (daily.datasets["Room Meeting Kecil"]?.[i] || 0)
    );

    return {
      labels: numericLabels,
      datasets: [
        {
          label: "Open Space",
          data: daily.datasets["Open Space"] || [],
          fill: false,
          borderColor: "#2563eb",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Space Monitor",
          data: daily.datasets["Space Monitor"] || [],
          fill: false,
          borderColor: "#10B981",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Meeting Room",
          data: meetingRoomData,
          fill: false,
          borderColor: "#F59E0B",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [dashboardData]);

  // ===== Doughnut: Revenue Contribution =====
  const doughnutData = useMemo(() => {
    const contribution = dashboardData?.categoryContribution || [];
    if (!contribution.length) return { labels: [], datasets: [{ data: [] }] };

    const dataMap = contribution.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + (item.value || 0);
      return acc;
    }, {});
    const totalMeetingRoom =
      (dataMap["Room Meeting Besar"] || 0) +
      (dataMap["Room Meeting Kecil"] || 0);

    return {
      labels: ["Open Space", "Space Monitor", "Meeting Room"],
      datasets: [
        {
          data: [
            dataMap["Open Space"] || 0,
            dataMap["Space Monitor"] || 0,
            totalMeetingRoom,
          ],
          backgroundColor: ["#2563eb", "#10B981", "#F59E0B", "#EF4444"],
          hoverOffset: 8,
        },
      ],
    };
  }, [dashboardData]);

  const productDoughnutData = useMemo(() => {
    const pc = dashboardData?.productContribution || [];

    if (!pc.length)
      return {
        labels: [],
        datasets: [{ data: [] }],
      };

    return {
      labels: pc.map((p) => p.name),
      datasets: [
        {
          data: pc.map((p) => p.value),
          backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"],
          hoverOffset: 8,
        },
      ],
    };
  }, [dashboardData]);

  const productContribution = useMemo(() => {
    const list = dashboardData?.productContribution || [];
    const map = list.reduce((acc, item) => {
      acc[item.name] = Number(item.value || 0);
      return acc;
    }, {});
    return map;
  }, [dashboardData]);

  const totalOpenSpace = doughnutData.datasets?.[0]?.data?.[0] || 0;
  const totalSpaceMonitor = doughnutData.datasets?.[0]?.data?.[1] || 0;
  const totalMeetingRoom = doughnutData.datasets?.[0]?.data?.[2] || 0;

  // ===== Clustered Bar: Trafik Booking per Durasi =====
  const trafficByDurationClusteredData = useMemo(() => {
    const byCat = dashboardData?.packageByDurationByCategory;

    let fallbackByCat = null;
    if (!byCat && Array.isArray(dashboardData?.packageByDuration)) {
      const flat = dashboardData.packageByDuration;
      const grouped = {};
      flat.forEach((r) => {
        const cat = normalizeCategory(r?.category || r?.name || "");
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          durasi_jam: Number(r?.durasi_jam ?? 0),
          total_booking: Number(r?.total_booking ?? r?.total_user ?? 0),
        });
      });
      const anyKnown = ["Open Space", "Space Monitor", "Meeting Room"].some(
        (k) => grouped[k]?.length
      );
      if (anyKnown) fallbackByCat = grouped;
    }

    const source = byCat || fallbackByCat;
    const flat = dashboardData?.packageByDuration ?? [];

    const allDurations = source
      ? Array.from(
          new Set(
            Object.values(source)
              .flat()
              .map((r) => Number(r?.durasi_jam ?? 0))
          )
        ).sort((a, b) => a - b)
      : Array.from(new Set(flat.map((r) => Number(r?.durasi_jam ?? 0)))).sort(
          (a, b) => a - b
        );

    const labels = allDurations.map((d) => `${d} Jam`);
    const valFrom = (arr, dur) => {
      const hit = (arr || []).find((r) => Number(r?.durasi_jam || 0) === dur);
      return Number(hit?.total_booking ?? hit?.total_user ?? 0);
    };

    if (source) {
      const cats = ["Open Space", "Space Monitor", "Meeting Room"];
      const colors = ["#2563eb", "#10B981", "#F59E0B"];
      return {
        labels,
        datasets: cats.map((cat, idx) => ({
          label: cat,
          data: allDurations.map((d) => valFrom(source[cat], d)),
          backgroundColor: colors[idx],
          borderWidth: 1,
        })),
      };
    }

    const sorted = [...flat].sort(
      (a, b) => Number(a?.durasi_jam ?? 0) - Number(b?.durasi_jam ?? 0)
    );
    return {
      labels,
      datasets: [
        {
          label: "Semua Kategori",
          data: allDurations.map((d) => valFrom(sorted, d)),
          backgroundColor: "#2563eb",
          borderWidth: 1,
        },
      ],
    };
  }, [dashboardData]);

  // ===== Peak Hours (+ durasi per kategori di tooltip) =====
  const breakdownMap = useMemo(
    () => dashboardData?.hourlyBookingsByCategory || {},
    [dashboardData]
  );
  const durationBreakdownMap = useMemo(
    () => dashboardData?.hourlyBookingsByCategoryAndDuration || {},
    [dashboardData]
  );

  const rawHourlyMap = dashboardData?.hourlyBookings || {};
  const hourlyPairs = useMemo(
    () =>
      Object.entries(rawHourlyMap)
        .map(([h, v]) => [Number(h), Number(v) || 0])
        .filter(([h, v]) => h >= 8 && h <= 22 && v > 0)
        .sort((a, b) => a[0] - b[0]),
    [rawHourlyMap]
  );

  const hourLabels = useMemo(
    () => hourlyPairs.map(([h]) => dayjs().hour(h).minute(0).format("HH:mm")),
    [hourlyPairs]
  );
  const hourlyInRange = useMemo(
    () => hourlyPairs.map(([, v]) => v),
    [hourlyPairs]
  );

  const topHourIdx = useMemo(
    () => getTopNIndices(hourlyInRange, 3),
    [hourlyInRange]
  );
  const hourBg = useMemo(() => {
    const keep = new Set(topHourIdx);
    return hourlyInRange.map((_, i) => (keep.has(i) ? "#EF4444" : "#93C5FD"));
  }, [hourlyInRange, topHourIdx]);

  const peakHoursData = useMemo(
    () => ({
      labels: hourLabels,
      datasets: [
        {
          label: "Booking Mulai per Jam (08:00–22:00)",
          data: hourlyInRange,
          backgroundColor: hourBg,
        },
      ],
    }),
    [hourLabels, hourlyInRange, hourBg]
  );

  // ===== Chart Options =====
  const nonDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const idx = items?.[0]?.dataIndex ?? 0;
              return items?.[0]?.chart?.data?.labels?.[idx] ?? "";
            },
          },
        },
      },
      scales: {
        x: {
          type: "category",
          offset: false,
          title: { display: true, text: "Tanggal" },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index) {
              const label = this.getLabelForValue
                ? this.getLabelForValue(value)
                : this.chart?.data?.labels?.[index];
              return label ?? "";
            },
          },
        },
        y: {
          ticks: {
            callback: (v) => formatRupiah(v),
            stepSize: 1,
            autoSkip: true,
          },
        },
      },
    }),
    [dashboardData]
  );

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed || 0;
            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
            const pct = total === 0 ? 0 : ((value / total) * 100).toFixed(1);
            return `${ctx.label}: Rp ${formatRupiah(value)} (${pct}%)`;
          },
        },
      },
      datalabels: {
        formatter: (value, ctx) => {
          if (value === 0) return ""; // ⛔ jangan tampilkan label 0%
          const total = ctx.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          return ((value / total) * 100).toFixed(1) + "%";
        },
        color: "#fff",
        font: { weight: "bold", size: 14 },
      },
    },
  };

  const trafficClusterOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: { display: false },
    },
    datasets: {
      bar: {
        categoryPercentage: 1.0,
        barPercentage: 1.0,
      },
    },
    scales: {
      x: {
        stacked: false,
        title: { display: true, text: "Paket Durasi" },
      },
      y: {
        beginAtZero: true,
        stacked: false,
        title: { display: true, text: "Jumlah Booking" },
        ticks: {
          precision: 0,
          callback: (v) => Math.trunc(v),
        },
      },
    },
  };

  const peakHoursOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (items) => items?.[0]?.label ?? "",
          label: (ctx) => `Booking: ${Math.trunc(Number(ctx.parsed?.y ?? 0))}`,
          afterBody: (items) => {
            // HH dari label (format "HH:mm")
            const hh = Number((items?.[0]?.label || "00:00").split(":")[0]);

            // ringkas per kategori
            const byCat = breakdownMap?.[String(hh)];
            const catOrder = ["Open Space", "Space Monitor", "Meeting Room"];
            const catLines = byCat
              ? catOrder
                  .filter((k) => Number(byCat[k]) > 0)
                  .map((k) => `${k}: ${byCat[k]}`)
              : [];

            // rincian durasi per kategori
            const byDur = durationBreakdownMap?.[String(hh)];
            const durLines = [];
            if (byDur) {
              catOrder.forEach((cat) => {
                const durMap = byDur[cat] || {};
                const entries = Object.entries(durMap)
                  .map(([dur, cnt]) => ({ dur: Number(dur), cnt: Number(cnt) }))
                  .filter(({ cnt }) => cnt > 0)
                  .sort((a, b) => b.cnt - a.cnt || a.dur - b.dur);
                if (entries.length) {
                  durLines.push(
                    `• ${cat} (durasi):`,
                    ...entries.map(({ dur, cnt }) => `   - ${dur} jam: ${cnt}`)
                  );
                }
              });
            }

            const out = [];
            if (catLines.length) out.push("", ...catLines);
            if (durLines.length) out.push("", ...durLines);
            return out;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Jumlah Booking" },
        ticks: {
          precision: 0,
          autoSkip: true,
          autoSkipPadding: 10,
          callback: (v) => Math.trunc(v),
        },
      },
      x: { title: { display: true, text: "Jam Operasional" } },
    },
  };

  // ===== Capture to Image =====
  const handleCaptureImage = async () => {
    try {
      const node = document.getElementById("capture-area-ws");
      if (!node) {
        return message.error("Area cetak tidak ditemukan.");
      }

      await new Promise((r) => setTimeout(r, 600));

      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `WorkingSpace_Report_${dayjs().format(
        "YYYYMMDD_HHmm"
      )}.png`;
      link.click();
    } catch (e) {
      console.error(e);
      message.error("Gagal membuat gambar laporan.");
    }
  };

  return (
    <>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 20 }} ref={reportRef}>
          {/* Header */}
          <Row
            gutter={[16, 16]}
            justify="space-between"
            align="middle"
            style={{ marginBottom: 14 }}
          >
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                Working Space Dashboard
              </Title>
              <Text type="secondary">
                Dago Creative Hub &amp; Coffee Lab — Working Space
              </Text>
            </Col>
            <Col>
              <Space align="center">
                <Text type="secondary">Rentang:</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(vals) => {
                    if (!vals) return;
                    setDateRange([
                      vals[0].startOf("day"),
                      vals[1].endOf("day"),
                    ]);
                  }}
                  format="DD-MM-YYYY"
                />
                <Select
                  defaultValue="mtm"
                  style={{ width: 140 }}
                  options={[
                    { value: "mtm", label: "Month to date" },
                    { value: "lw", label: "Last 7d" },
                  ]}
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
                />
              </Space>
            </Col>
          </Row>

          {/* Quick Links */}
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
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Working Space
            </a>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Statistic Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* 1. TOTAL REVENUE */}
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <Spin spinning={loading}>
                    <Statistic
                      title="Total Pendapatan"
                      value={`${formatRupiah(stats.totalRevenue)}`}
                      prefix={<DollarCircleOutlined />}
                    />
                  </Spin>
                </Card>
              </motion.div>
            </Col>

            {/* 2. TOTAL DISCOUNT */}
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card>
                  <Spin spinning={loading}>
                    <Statistic
                      title="Total Diskon"
                      value={`${formatRupiah(stats.totalDiscount)}`}
                      prefix={<ArrowUpOutlined />}
                    />
                  </Spin>
                </Card>
              </motion.div>
            </Col>

            {/* 3. TOTAL VISITORS */}
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <Spin spinning={loading}>
                    <Statistic
                      title="Total Pengunjung"
                      value={formatRupiah(stats.totalVisitors)}
                      prefix={<UsergroupAddOutlined />}
                    />
                  </Spin>
                </Card>
              </motion.div>
            </Col>

            {/* 4. TOTAL BOOKINGS */}
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <Spin spinning={loading}>
                    <Statistic
                      title="Jumlah Booking"
                      value={stats.totalBookings}
                      prefix={<FieldTimeOutlined />}
                    />
                  </Spin>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 8]}>
            <Col xs={24} lg={16}>
              {/* DAILY BOOKING */}
              <Card style={{ marginBottom: 8 }}>
                <Spin spinning={loading}>
                  <Title level={5}>Daily Booking (per Space Category)</Title>
                  <div style={{ height: 300 }}>
                    <Line data={lineData} options={nonDoughnutOptions} />
                  </div>
                </Spin>
              </Card>

              {/* TRAFIK BOOKING PER DURASI */}
              <Card style={{ marginBottom: 8 }}>
                <Spin spinning={loading}>
                  <Title level={5}>Booking Traffic by Duration</Title>
                  <Text type="secondary">
                    Menampilkan jumlah booking per paket durasi dan kategori
                    space pada periode {totalDays} hari.
                  </Text>
                  <div style={{ height: 300, marginTop: 10 }}>
                    <Bar
                      data={trafficByDurationClusteredData}
                      options={trafficClusterOptions}
                    />
                  </div>
                </Spin>
              </Card>

              {/* PEAK HOURS */}
              <Card style={{ marginBottom: 8 }}>
                <Spin spinning={loading}>
                  <Title level={5}>Peak Booking Hours</Title>
                  <Text type="secondary">
                    Menampilkan jam berdasarkan mulai booking. Bar merah
                    merupakan top 3 jumlah booking tertinggi.
                  </Text>
                  <div style={{ height: 300, marginTop: 10 }}>
                    <Bar data={peakHoursData} options={peakHoursOptions} />
                  </div>
                </Spin>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              {/* KONTRIBUSI SPACE */}
              <Card style={{ marginBottom: 16 }}>
                <Spin spinning={loading}>
                  <Title level={5}>Kontribusi Space</Title>
                  <div style={{ height: 220 }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                  <Divider />
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>
                        <Tag color="#2563eb" /> Open Space
                      </Text>
                      <Text strong>{formatRupiah(totalOpenSpace)}</Text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>
                        <Tag color="#10B981" /> Space Monitor
                      </Text>
                      <Text strong>{formatRupiah(totalSpaceMonitor)}</Text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>
                        <Tag color="#F59E0B" /> Meeting Room
                      </Text>
                      <Text strong>{formatRupiah(totalMeetingRoom)}</Text>
                    </div>
                  </Space>
                </Spin>
              </Card>

              {/* KONTRIBUSI PRODUCT */}
              <Card style={{ marginBottom: 16 }}>
                <Title level={5}>Kontribusi Product</Title>

                <div style={{ height: 220, marginBottom: 16 }}>
                  {loading ? (
                    <Spin />
                  ) : (
                    <Doughnut
                      data={productDoughnutData}
                      options={doughnutOptions}
                    />
                  )}
                </div>

                <Divider />

                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {[
                    "Membership",
                    "Virtual Office",
                    "Private Office",
                    "Event Space",
                  ].map((label) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>{label}</Text>
                      <Text strong>
                        {formatRupiah(productContribution[label] || 0)}
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>

              {/* POPULAR SPACE */}
              <Card title="Popular Space" loading={loading}>
                <Table
                  columns={[
                    {
                      title: "Kategori (Durasi)",
                      dataIndex: "item",
                      width: 170,
                    },
                    {
                      title: "Jumlah Terjual",
                      dataIndex: "qty",
                      align: "right",
                      width: 70,
                    },
                    {
                      title: "Total Penjualan (Rp)",
                      dataIndex: "total",
                      align: "right",
                      width: 140,
                      render: (t) => ` ${formatRupiah(t)}`,
                    },
                  ]}
                  dataSource={topWs}
                  pagination={false}
                  size="small"
                  rowKey={(r) => `${r.item}-${r.qty}-${r.total}`}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card>
                <Title level={5} style={{ marginBottom: 8 }}>
                  Booking Pattern by Day
                </Title>
                <Text type="secondary">
                  Distribusi booking per hari (Senin - Minggu)
                </Text>
                <div style={{ height: 220 }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card>
                <Title level={5}>Quick Actions</Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Tooltip title="Mencetak tampilan dashboard saat ini ke gambar PNG">
                    <button
                      onClick={handleCaptureImage}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #e6e6e6",
                        cursor: "pointer",
                      }}
                    >
                      📄 Cetak Gambar
                    </button>
                  </Tooltip>
                  {/* <Tooltip title="Unduh seluruh data yang tampil ke Excel (multi-sheet)">
                    <button
                      onClick={handleExportExcel}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #e6e6e6",
                        cursor: "pointer",
                      }}
                    >
                      ⬇ Cetak Laporan (Excel)
                    </button>
                  </Tooltip> */}
                </Space>
              </Card>
            </Col>
          </Row>
        </div>

        {/* ===========================
    AREA CAPTURE — ONLY KPI + KONTRIBUSI + POPULAR
  =========================== */}
        <div
          id="capture-area-ws"
          style={{
            position: "absolute",
            left: "-99999px",
            top: 0,
            width: "1200px",
            padding: "20px",
            background: "#ffffff",
          }}
        >
          {/* ===== KPI SECTION ===== */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Pendapatan"
                  value={` ${formatRupiah(stats.totalRevenue)}`}
                />
              </Card>
            </Col>

            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Diskon"
                  value={` ${formatRupiah(stats.totalDiscount)}`}
                />
              </Card>
            </Col>

            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Pengunjung"
                  value={formatRupiah(stats.totalVisitors)}
                />
              </Card>
            </Col>

            <Col span={6}>
              <Card>
                <Statistic title="Jumlah Booking" value={stats.totalBookings} />
              </Card>
            </Col>
          </Row>

          {/* ===== KONTRIBUSI SPACE ===== */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card>
                <Title level={5}>Kontribusi Space</Title>

                <div style={{ height: 260 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>

                {/* ==== Pendapatan per kategori ===== */}
                <Divider />

                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {/* Open Space */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text>
                      <Tag color="#2563eb" /> Open Space
                    </Text>
                    <Text strong> {formatRupiah(totalOpenSpace)}</Text>
                  </div>

                  {/* Space Monitor */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text>
                      <Tag color="#10B981" /> Space Monitor
                    </Text>
                    <Text strong> {formatRupiah(totalSpaceMonitor)}</Text>
                  </div>

                  {/* Meeting Room */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text>
                      <Tag color="#F59E0B" /> Meeting Room
                    </Text>
                    <Text strong> {formatRupiah(totalMeetingRoom)}</Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* ===== KONTRIBUSI PRODUCT ===== */}
            <Col span={12}>
              <Card>
                <Title level={5}>Kontribusi Product</Title>

                <div style={{ height: 260 }}>
                  <Doughnut
                    data={productDoughnutData}
                    options={doughnutOptions}
                  />
                </div>

                <Divider />

                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {[
                    "Membership",
                    "Virtual Office",
                    "Private Office",
                    "Event Space",
                  ].map((label) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>{label}</Text>
                      <Text strong>
                        {formatRupiah(productContribution[label] || 0)}
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          {/* ===== POPULAR SPACE TABLE ===== */}
          <Card title="Popular Space">
            <Table
              columns={[
                { title: "Kategori (Durasi)", dataIndex: "item" },
                { title: "Qty", dataIndex: "qty", align: "right" },
                {
                  title: "Total Penjualan (Rp)",
                  dataIndex: "total",
                  align: "right",
                  render: (t) => ` ${formatRupiah(t)}`,
                },
              ]}
              dataSource={topWs}
              pagination={false}
              size="small"
              rowKey={(r) => `${r.item}-${r.qty}-${r.total}`}
            />
          </Card>
        </div>
      </ConfigProvider>
    </>
  );
};

export default WorkingSpace;
