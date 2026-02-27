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
  Progress,
} from "antd";
import {
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";
import { getExpenses, getBagiHasilReport } from "../../../services/service";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const { RangePicker } = DatePicker;

// =============================
// Utility
// =============================
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// =============================
// Component
// =============================
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

  // =============================
  // Fetch Data
  // =============================
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
        const key = item.kategori?.toUpperCase();
        if (!acc[key]) {
          acc[key] = {
            name: item.kategori,
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
      message.error("Gagal memuat data laporan.");
      setLaporanData([]);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  // =============================
  // Perhitungan
  // =============================
  const totalPenjualanKotor = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.grandTotal) || 0),
    0
  );

  const totalDiskon = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.discount) || 0),
    0
  );

  const totalPajak = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.tax) || 0),
    0
  );

  const totalPenjualanBersih = totalPenjualanKotor - totalPajak;

  const totalHakTenant = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.tenantShare) || 0),
    0
  );

  const totalHakOwner = laporanData.reduce(
    (sum, item) => sum + (parseFloat(item.ownerShare) || 0),
    0
  );

  const totalPengeluaran = expenseData.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  const labaBersih = totalHakOwner - totalPengeluaran;

  // =============================
  // Advanced Metrics (Tambahan)
  // =============================
  const profitMargin =
    totalHakOwner > 0
      ? (labaBersih / totalHakOwner) * 100
      : 0;

  const expenseRatio =
    totalHakOwner > 0
      ? (totalPengeluaran / totalHakOwner) * 100
      : 0;

  // =============================
  // Export Excel
  // =============================
  const exportAll = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Financial Report");

    sheet.addRow(["Financial Performance Report"]);
    sheet.addRow([
      `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format(
        "DD/MM/YYYY"
      )}`,
    ]);
    sheet.addRow([]);

    sheet.addRow([
      "Tenant",
      "Net Revenue",
      "Tenant Share",
      "Owner Share",
    ]);

    laporanData.forEach((x) => {
      const netRevenue =
        (parseFloat(x.grandTotal) || 0) - (parseFloat(x.tax) || 0);

      sheet.addRow([
        x.tenant,
        netRevenue,
        x.tenantShare,
        x.ownerShare,
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Financial_Report_${dateRange[0].format("DDMMYY")}.xlsx`
    );
  };

  // =============================
  // Table Columns
  // =============================
  const columns = [
    {
      title: "Tenant",
      dataIndex: "tenant",
      key: "tenant",
      render: (text) => (
        <span style={{ fontWeight: 600 }}>{text}</span>
      ),
    },
    {
      title: "Net Revenue (Excl. Tax)",
      key: "netRevenue",
      render: (_, record) => {
        const grandTotal = parseFloat(record.grandTotal) || 0;
        const tax = parseFloat(record.tax) || 0;
        const netRevenue = grandTotal - tax;

        return (
          <span style={{ fontWeight: 600 }}>
            {formatRupiah(netRevenue)}
          </span>
        );
      },
      align: "right",
    },
    {
      title: "Tenant Share",
      dataIndex: "tenantShare",
      key: "tenantShare",
      render: (amount) => formatRupiah(amount),
      align: "right",
    },
    {
      title: "Owner Share",
      dataIndex: "ownerShare",
      key: "ownerShare",
      render: (amount) => formatRupiah(amount),
      align: "right",
    },
  ];

  return (
    <ConfigProvider locale={locale}>
      <div style={{ background: "#f4f5f7", minHeight: "100vh", padding: 40 }}>

        {/* HEADER */}
        <Card bordered={false} style={{ borderRadius: 16, marginBottom: 40 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>
                Financial Performance Report
              </h1>
              <span style={{ color: "#8c8c8c" }}>
                Dago Creative Hub & Coffee Lab
              </span>
            </Col>
            <Col>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD MMM YYYY"
                allowClear={false}
                size="large"
              />
            </Col>
          </Row>
        </Card>

        {/* KPI */}
        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          <Col xs={24} md={12} lg={8}>
            <Card bordered={false} style={{ borderRadius: 16 }}>
              <Statistic
                title="Gross Revenue"
                value={totalPenjualanKotor}
                formatter={(v) => formatRupiah(v)}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Card bordered={false} style={{ borderRadius: 16 }}>
              <Statistic
                title="Net Revenue"
                value={totalPenjualanBersih}
                formatter={(v) => formatRupiah(v)}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Card bordered={false} style={{ borderRadius: 16 }}>
              <Statistic
                title="Owner Share"
                value={totalHakOwner}
                formatter={(v) => formatRupiah(v)}
              />
            </Card>
          </Col>
        </Row>

        {/* TABLE */}
        <Card bordered={false} style={{ borderRadius: 16, marginBottom: 40 }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontWeight: 600 }}>
              Revenue Breakdown
            </h2>

            <Button type="primary" onClick={exportAll}>
              <DownloadOutlined /> Export
            </Button>
          </Row>

          <Table
            loading={loading}
            columns={columns}
            dataSource={laporanData}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* PROFITABILITY SUMMARY */}
        <Card bordered={false} style={{ borderRadius: 16, marginBottom: 40 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <h2 style={{ fontWeight: 600, fontSize: 18 }}>
                Profitability Summary
              </h2>
            </Col>
            <Col>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 13,
                  background: labaBersih >= 0 ? "#f6ffed" : "#fff2f0",
                  color: labaBersih >= 0 ? "#237804" : "#a8071a",
                }}
              >
                {labaBersih >= 0 ? "PROFIT" : "LOSS"}
              </span>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Statistic
                title="Net Result"
                value={Math.abs(labaBersih)}
                formatter={(v) => formatRupiah(v)}
                valueStyle={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: labaBersih >= 0 ? "#237804" : "#a8071a",
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* ADVANCED METRICS */}
        <Card bordered={false} style={{ borderRadius: 16 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Statistic
                title="Profit Margin"
                value={profitMargin.toFixed(2)}
                suffix="%"
              />
              <Progress percent={Math.abs(profitMargin)} showInfo={false} />
            </Col>

            <Col xs={24} md={12}>
              <Statistic
                title="Expense Ratio"
                value={expenseRatio.toFixed(2)}
                suffix="%"
              />
              <Progress percent={expenseRatio} showInfo={false} />
            </Col>
          </Row>
        </Card>

      </div>
    </ConfigProvider>
  );
};

export default BagiHasil;