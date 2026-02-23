import React, { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  Table,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Alert,
  Tabs, // Impor Tabs
  message,
} from "antd";
import { DatabaseOutlined, DownloadOutlined, CoffeeOutlined, HomeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
// Impor service baru
import { getFnbSalesDetail, getNonFnbTransactions } from "../../../services/service";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

// Helper format Rupiah
const formatRupiah = (val) => {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val);
};

const TransaksiAdmin = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);

  // State untuk data (dipisah)
  const [fnbData, setFnbData] = useState([]);
  const [otherData, setOtherData] = useState([]);
  const [otherSummary, setOtherSummary] = useState({ totalTransaction: 0 });

  // State loading & UI
  const [loadingFnb, setLoadingFnb] = useState(true);
  const [loadingOther, setLoadingOther] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorFnb, setErrorFnb] = useState(null);
  const [errorOther, setErrorOther] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("fnb"); // Lacak tab aktif

  // Pagination
  const [paginationFnb, setPaginationFnb] = useState({ current: 1, pageSize: 10 });
  const [paginationOther, setPaginationOther] = useState({ current: 1, pageSize: 10 });

  // Efek untuk memuat data saat rentang tanggal berubah
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange || dateRange.length !== 2) return;

      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      // Reset
      setErrorFnb(null);
      setErrorOther(null);
      setLoadingFnb(true);
      setLoadingOther(true);

      // Panggil API F&B
      try {
        const responseFnb = await getFnbSalesDetail(startDate, endDate);
        setFnbData(responseFnb); // Ini adalah array
      } catch (err) {
        setErrorFnb(err.message || "Gagal memuat data F&B.");
        setFnbData([]);
      } finally {
        setLoadingFnb(false);
      }

      // Panggil API Non-F&B
      try {
        const responseOther = await getNonFnbTransactions(startDate, endDate);
        setOtherData(responseOther.transactions);
        setOtherSummary(responseOther.summary);
      } catch (err) {
        setErrorOther(err.message || "Gagal memuat data Ruangan & Lainnya.");
        setOtherData([]);
        setOtherSummary({ totalTransaction: 0 });
      } finally {
        setLoadingOther(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // --- KOLOM-KOLOM TABEL ---

  // Kolom untuk TAB 1 (F&B)
  const columnsFnb = [
    {
      title: "Datetime",
      dataIndex: "tanggal_transaksi",
      key: "datetime",
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
      defaultSortOrder: 'descend',
      width: 160,
    },
    { 
      title: "Nama Pemesan", 
      dataIndex: "nama_pelanggan", 
      key: "nama_pelanggan", 
      sorter: (a, b) => (a.nama_pelanggan || '').localeCompare(b.nama_pelanggan || ''), 
      width: 150, 
    },
    { title: "Merchant", dataIndex: "merchant", key: "merchant", sorter: (a, b) => a.merchant.localeCompare(b.merchant), width: 130, },
    { title: "Category Product", dataIndex: "category_product", key: "category_product", sorter: (a, b) => a.category_product.localeCompare(b.category_product), width: 150, },
    { title: "Product", dataIndex: "product", key: "product", sorter: (a, b) => a.product.localeCompare(b.product), width: 180, },
    { title: "Qty", dataIndex: "quantity", key: "quantity", align: 'right', sorter: (a, b) => a.quantity - b.quantity, width: 80, },
    { title: "Price", dataIndex: "price", key: "price", align: 'right', render: (val) => formatRupiah(val), sorter: (a, b) => a.price - b.price, width: 130, },
    { title: "Sub Total", dataIndex: "sub_total_item", key: "sub_total_item", align: 'right', render: (val) => formatRupiah(val), sorter: (a, b) => a.sub_total_item - b.sub_total_item, width: 130, },
    { title: "Tax (Pro-rata)", dataIndex: "tax_item", key: "tax_item", align: 'right', render: (val) => formatRupiah(val), sorter: (a, b) => a.tax_item - b.tax_item, width: 130, },
    { title: "Discount (Pro-rata)", dataIndex: "discount_item", key: "discount_item", align: 'right', render: (val) => formatRupiah(val), sorter: (a, b) => a.discount_item - b.discount_item, width: 140, },
    { title: "Total", dataIndex: "total_item", key: "total_item", align: 'right', render: (val) => formatRupiah(val), sorter: (a, b) => a.total_item - b.total_item, width: 140, fixed: 'right', },
    { title: "Note", dataIndex: "note", key: "note", width: 150, },
    { title: "Payment", dataIndex: "payment", key: "payment", sorter: (a, b) => (a.payment || '').localeCompare(b.payment || ''), width: 100, },
  ];

  // Kolom untuk TAB 2 (Ruangan & Lainnya)
  const columnsOther = [
    {
      title: "Datetime",
      dataIndex: "tanggal_transaksi",
      key: "datetime",
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
      defaultSortOrder: 'descend',
    },
    { title: "Nama", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Kategori / Detail", dataIndex: "category", key: "category" },
    {
      title: "Sub Total (Rp)",
      dataIndex: "subtotal",
      key: "subtotal",
      align: 'right',
      render: (val) => formatRupiah(val),
      sorter: (a, b) => a.subtotal - b.subtotal,
    },
    {
      title: "Diskon (Rp)",
      dataIndex: "discount",
      key: "discount",
      align: 'right',
      render: (val) => formatRupiah(val),
    },
    {
      title: "Total (Rp)",
      dataIndex: "total",
      key: "total",
      align: 'right',
      render: (val) => formatRupiah(val),
      sorter: (a, b) => a.total - b.total,
    },
  ];

  // Filter Data (dipisah)
  const filteredFnbData = useMemo(() =>
    fnbData.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.merchant?.toLowerCase().includes(searchLower) ||
        item.category_product?.toLowerCase().includes(searchLower) ||
        item.product?.toLowerCase().includes(searchLower) ||
        item.note?.toLowerCase().includes(searchLower) ||
        item.payment?.toLowerCase().includes(searchLower) ||
        item.nama_pelanggan?.toLowerCase().includes(searchLower)
      )
    }), [fnbData, searchTerm]
  );

  const filteredOtherData = useMemo(() =>
    otherData.filter((item) =>
      Object.values(item).some(
        (val) =>
          val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ), [otherData, searchTerm]
  );

  // Hitung Total F&B (karena summary-nya tidak ada)
  // Hitung Total F&B (karena summary-nya tidak ada)
  const fnbTotal = useMemo(() =>
    filteredFnbData.reduce((sum, item) => sum + (Number(item.total_item) || 0), 0),
    [filteredFnbData]
  );


  // --- FUNGSI EXPORT (DIPERBARUI) ---
  const handleExport = async () => {
    setExporting(true);
    message.info("Membuat file Excel...");

    try {
      const wb = new ExcelJS.Workbook();
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const borderStyle = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003A8C' } },
        border: borderStyle
      };

      // Tulis data berdasarkan tab yang aktif
      if (activeTabKey === 'fnb') {
        const ws = wb.addWorksheet("Detail Penjualan F&B");
        const header = columnsFnb.map(col => col.title);
        ws.addRow(header).eachCell(cell => cell.style = headerStyle);

        filteredFnbData.forEach(item => {
          const row = ws.addRow([
            dayjs(item.tanggal_transaksi).toDate(),
            item.nama_pelanggan,
            item.merchant,
            item.category_product,
            item.product,
            item.quantity,
            item.price,
            item.sub_total_item,
            item.tax_item,
            item.discount_item,
            item.total_item,
            item.note,
            item.payment
          ]);
          row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            if (colNumber === 1) cell.numFmt = 'dd/mm/yyyy hh:mm';
            if (colNumber >= 6 && colNumber <= 11) {
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'right' };
            }
          });
        });
        ws.columns = [
            { width: 20 }, // Datetime
            { width: 20 }, // Nama Pemesan (BARU)
            { width: 15 }, // Merchant
            { width: 20 }, // Category
            { width: 25 }, // Product
            { width: 10 }, // Qty
            { width: 15 }, // Price
            { width: 15 }, // Sub Total
            { width: 15 }, // Tax
            { width: 15 }, // Discount
            { width: 18 }, // Total
            { width: 20 }, // Note
            { width: 12 }  // Payment
        ];

      } else { // Tab 'other'
        const ws = wb.addWorksheet("Transaksi Ruangan & Lainnya");
        const header = columnsOther.map(col => col.title);
        ws.addRow(header).eachCell(cell => cell.style = headerStyle);

        filteredOtherData.forEach(item => {
          const row = ws.addRow([
            dayjs(item.tanggal_transaksi).toDate(),
            item.name,
            item.category,
            item.subtotal,
            item.discount,
            item.total,
          ]);
          row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            if (colNumber === 1) cell.numFmt = 'dd/mm/yyyy hh:mm';
            if (colNumber >= 4 && colNumber <= 6) {
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'right' };
            }
          });
        });
        ws.columns = [{ width: 20 }, { width: 30 }, { width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }];
      }

      const filename = `Laporan_Transaksi_${activeTabKey}_${startDate}_sd_${endDate}.xlsx`;
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), filename);
      message.success("File Excel berhasil dibuat!");

    } catch (err) {
      console.error("Gagal export Excel:", err);
      message.error("Gagal export Excel.");
    } finally {
      setExporting(false);
    }
  };

  // --- JSX ---
  return (
    <div style={{ height: "100vh", background: "#f5f5f5" }}>
      <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                History Transaksi (Lunas)
              </Title>
            </Col>
            <Col>
              <Space>
                <Text strong>Pilih Rentang Tanggal</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
                  format="YYYY-MM-DD"
                  disabled={loadingFnb || loadingOther || exporting}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Stats & Search/Export */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, padding: "0 8px" }}>
          <Col flex="1">
            <Space size="large">
              <Text strong style={{ fontSize: "18px" }}>
                Total {activeTabKey === 'fnb' ? 'F&B (Nett)' : 'Lainnya'}:
                <span style={{ color: "#2f54eb", fontWeight: 600, marginLeft: 8 }}>
                  {formatRupiah(activeTabKey === 'fnb' ? fnbTotal : otherSummary.totalTransaction)}
                </span>
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Cari..."
                allowClear
                onSearch={(value) => setSearchTerm(value)}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                style={{ borderRadius: "8px" }}
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={loadingFnb || loadingOther || (activeTabKey === 'fnb' ? filteredFnbData.length === 0 : filteredOtherData.length === 0)}
                loading={exporting}
              >
                Export Excel
              </Button>
            </Space>
          </Col>
        </Row>

        {/* --- TABS --- */}
        <Card>
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
            <Tabs.TabPane
              tab={
                <span>
                  <CoffeeOutlined /> Laporan Detail F&B
                </span>
              }
              key="fnb"
            >
              {errorFnb && <Alert message="Error" description={errorFnb} type="error" showIcon style={{ marginBottom: 16 }} />}
              <Spin spinning={loadingFnb}>
                <Table
                  columns={columnsFnb}
                  dataSource={filteredFnbData}
                  rowKey={(record) => `${record.id_transaksi}-${record.product}-${record.price}`} // Kunci unik
                  pagination={paginationFnb}
                  onChange={setPaginationFnb}
                  bordered
                  size="small"
                  scroll={{ x: 1800 }}
                />
              </Spin>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <HomeOutlined /> Transaksi Ruangan & Lainnya
                </span>
              }
              key="other"
            >
              {errorOther && <Alert message="Error" description={errorOther} type="error" showIcon style={{ marginBottom: 16 }} />}
              <Spin spinning={loadingOther}>
                <Table
                  columns={columnsOther}
                  dataSource={filteredOtherData}
                  rowKey="id_transaksi"
                  pagination={paginationOther}
                  onChange={setPaginationOther}
                  bordered
                  size="middle"
                />
              </Spin>
            </Tabs.TabPane>
          </Tabs>
        </Card>

      </div>
    </div>
  );
};

export default TransaksiAdmin;