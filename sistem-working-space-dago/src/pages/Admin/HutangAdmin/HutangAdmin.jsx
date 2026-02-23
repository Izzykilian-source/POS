// HutangAdmin.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Row,
  Col,
  Card,
  Statistic,
  Form,
  InputNumber,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  Tooltip,
  Divider,
  DatePicker,
  message,
  Space,
  Input,
  Spin,
  Alert,
  Popconfirm,
  Switch,
} from "antd";
import {
  DollarOutlined,
  TeamOutlined,
  CrownOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import locale from "antd/locale/id_ID";
import "dayjs/locale/id";

// --- IMPOR BARU UNTUK EXPORT ---
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Import service API
import {
  getRekapLive,
  addUtangTenant,
  getActiveTenants,
  getUtangLog,
  updateUtangLog,
  deleteUtangLog,
  getBagiHasilDetail, // <-- SERVICE BARU DIIMPOR
} from "../../../services/service"; // Sesuaikan path

dayjs.locale("id");
const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper formatRupiah
const formatRupiah = (amount = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0));

// Helper format Angka
const formatNumberInput = (v) =>
  v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parseNumberInput = (v) => (v ? v.replace(/\./g, "") : 0);


const HutangAdmin = () => {
  // --- STATE MANAGEMENT ---
  const [rekapData, setRekapData] = useState([]);
  const [tenantList, setTenantList] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // <-- STATE LOADING EXPORT BARU

  const [utangForm] = Form.useForm();
  const [utangModalVisible, setUtangModalVisible] = useState(false);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logData, setLogData] = useState([]);
  const [selectedTenantForLog, setSelectedTenantForLog] = useState(null);

  const [editUtangModalVisible, setEditUtangModalVisible] = useState(false);
  const [editUtangForm] = Form.useForm();
  const [editingUtangEntry, setEditingUtangEntry] = useState(null);

  // --- FUNGSI PENGAMBILAN DATA ---
  const fetchData = useCallback(async () => {
    // ... (Fungsi fetchData Anda tetap sama)
    if (!dateRange || dateRange.length !== 2) {
      message.warn("Silakan pilih rentang tanggal terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const [rekapResult, tenantsResult] = await Promise.all([
        getRekapLive(startDate, endDate),
        getActiveTenants()
      ]);

      const processedRekap = rekapResult.map(item => ({
        ...item,
        id: item.id_tenant,
        name: item.nama_tenant,
        totalSales: Number(item.totalSales) || 0,
        debt: Number(item.totalUtang) || 0,
        utangAwal: Number(item.utangAwal) || 0,
        utangMasukPeriode: Number(item.utangMasukPeriode) || 0,
      }));

      setRekapData(processedRekap);
      setTenantList(tenantsResult);
    } catch (error) {
      message.error(`Gagal mengambil data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ... (computeShares dan totals tetap sama) ...
  const computeShares = (tenantRekap) => {
    const total = Number(tenantRekap.totalSales) || 0;
    const ownerShare = Math.round(total * 0.3); // Asumsi 30%
    const rawTenantShare = total - ownerShare;
    const debt = Number(tenantRekap.debt) || 0;
    const netTenantShare = Math.max(0, rawTenantShare - debt);
    const remainingDebt = Math.max(0, debt - rawTenantShare);
    return { total, rawTenantShare, ownerShare, debt, netTenantShare, remainingDebt };
  };

  const totals = useMemo(() => {
    const totalGross = rekapData.reduce((s, t) => s + (Number(t.totalSales) || 0), 0);
    const totalTenantNetPayment = rekapData.reduce((s, t) => s + computeShares(t).netTenantShare, 0);
    const totalOwnerShare = rekapData.reduce((s, t) => s + computeShares(t).ownerShare, 0);
    return { totalGross, totalTenantNetPayment, totalOwnerShare };
  }, [rekapData]);


  // --- HANDLER AKSI ---

  // (handleAddUtang, handleOpenLog, handleOpenEditUtang, handleUpdateUtang, handleDeleteUtang tetap sama)
  const handleAddUtang = async (values) => {
    setSubmitLoading(true);
    try {
      const tanggal_utang = values.tanggal_utang.format('YYYY-MM-DD');
      await addUtangTenant(
        values.id_tenant,
        values.jumlah,
        values.deskripsi || "Utang manual dari admin",
        tanggal_utang
      );

      const tenantName = tenantList.find(t => t.id_tenant === values.id_tenant)?.nama_tenant || '';
      message.success(`Utang untuk ${tenantName} pada ${tanggal_utang} berhasil ditambahkan.`);
      utangForm.resetFields();
      setUtangModalVisible(false);
      await fetchData(); // Refresh tabel utama
    } catch (error) {
      message.error(`Gagal menambah utang: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenLog = async (tenant) => {
    setSelectedTenantForLog(tenant);
    setLogModalVisible(true);
    setLogLoading(true);
    setLogData([]);
    try {
      const logResult = await getUtangLog(tenant.id_tenant, null, null);
      setLogData(logResult);
    } catch (error) {
      message.error(`Gagal mengambil log utang: ${error.message}`);
    } finally {
      setLogLoading(false);
    }
  };

  const handleOpenEditUtang = (utangEntry) => {
    setEditingUtangEntry(utangEntry);
    editUtangForm.setFieldsValue({
      ...utangEntry,
      tanggal_utang: dayjs(utangEntry.tanggal_utang),
      status_lunas: utangEntry.status_lunas === 1,
    });
    setEditUtangModalVisible(true);
  };

  const handleUpdateUtang = async (values) => {
    setSubmitLoading(true);
    try {
      const updatedData = {
        ...values,
        tanggal_utang: values.tanggal_utang.format('YYYY-MM-DD'),
        status_lunas: values.status_lunas,
      };
      await updateUtangLog(editingUtangEntry.id_utang, updatedData);
      message.success("Entri utang berhasil diperbarui.");
      setEditUtangModalVisible(false);
      setEditingUtangEntry(null);

      await handleOpenLog(selectedTenantForLog);
      await fetchData();
    } catch (error) {
      message.error(`Gagal update utang: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUtang = async (id_utang) => {
    setLogLoading(true);
    try {
      await deleteUtangLog(id_utang);
      message.success("Entri utang berhasil dihapus.");
      await handleOpenLog(selectedTenantForLog);
      await fetchData();
    } catch (error) {
      message.error(`Gagal hapus utang: ${error.message}`);
    } finally {
      setLogLoading(false);
    }
  };

  // (Fungsi exportTenant (txt) tetap sama)
  const exportTenant = (t) => {
    // ... (fungsi .txt Anda tetap di sini)
    const s = computeShares(t);
    const periodLabel = `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`;
    const text = `LAPORAN BAGI HASIL - ${t.name
      }\nPeriode: ${periodLabel}\n
  Total Penjualan: ${formatRupiah(s.total)}
  Hak Owner (30%): ${formatRupiah(s.ownerShare)}
  Hak Tenant Murni (70%): ${formatRupiah(s.rawTenantShare)}
  Total Utang Periode: ${formatRupiah(s.debt)}
    (Utang Awal: ${formatRupiah(t.utangAwal)})
    (Utang Baru: ${formatRupiah(t.utangMasukPeriode)})
  Total Pembayaran Tenant (Net): ${formatRupiah(s.netTenantShare)}
  Sisa Utang (Periode Berikutnya): ${formatRupiah(s.remainingDebt)}
  `;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `laporan_bagihasil_${t.name.replace(/\s+/g, "_")}_${dateRange[0].format("YYYYMMDD")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- FUNGSI EXPORT EXCEL BARU (MENGGANTIKAN 'exportAll') ---
  // --- FUNGSI EXPORT EXCEL (MODIFIED) ---
  // --- FUNGSI EXPORT EXCEL (MODIFIED) ---
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // 1. Panggil API untuk data detail
      const exportData = await getBagiHasilDetail(startDate, endDate);

      const wb = new ExcelJS.Workbook();

      // Style untuk border
      const borderStyle = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };

      // 2. Loop data rekap untuk membuat sheet
      for (const tenant of rekapData) {
        const tenantName = tenant.name;
        const ws = wb.addWorksheet(tenantName.substring(0, 30));

        const summary = computeShares(tenant);
        const tenantDetails = exportData[tenantName];

        // --- A. BLOK RINGKASAN ---
        ws.addRow(["LAPORAN BAGI HASIL", tenantName]).font = { bold: true, size: 14 };
        ws.addRow(["Periode", `${startDate} s/d ${endDate}`]).font = { bold: true };
        ws.addRow([]);

        ws.addRow(["Total Penjualan (Gross)", summary.total]).font = { bold: true };
        ws.addRow(["Hak Tenant Murni (70%)", summary.rawTenantShare]);
        ws.addRow(["Total Utang", summary.debt * -1]);

        ws.addRow(["Total Pembayaran Tenant (Net)", summary.netTenantShare]).font = { bold: true, color: { argb: 'FF008000' } };
        ws.addRow([]);

        // Format Rupiah untuk blok ringkasan
        for (let i = 4; i <= 9; i++) {
          const cell = ws.getCell(`B${i}`);
          if (cell.value) {
            cell.numFmt = '"Rp"#,##0';
          }
        }

        // --- B. BLOK RINCIAN PENJUALAN (TABEL) ---
        let currentRow = ws.actualRowCount + 1;

        ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        // 1. UBAH HEADER: Tambahkan "Total Tax (Pajak)" setelah Discount
        const salesHeader = [
          "Tanggal",
          "Produk",
          "Jumlah Qty",
          "Total Penjualan (Gross)",
          "Total Discount",
          "Total Tax (Pajak)", // <--- KOLOM BARU
          "Total Penjualan (Nett)"
        ];

        ws.addRow(salesHeader).eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1890FF' } };
          cell.border = borderStyle;
          cell.alignment = { horizontal: 'center' };
        });

        if (tenantDetails?.sales.length > 0) {
          tenantDetails.sales.forEach(sale => {
            const gross = Number(sale.total_penjualan_gross) || 0;
            const discount = Number(sale.total_discount) || 0;

            // Ambil data pajak dari backend
            const tax = Number(sale.total_pajak) || 0;

            // --- PERBAIKAN DI SINI ---
            // Tambahkan pajak ke dalam perhitungan Nett
            const nett = gross - discount + tax;

            // 3. MASUKKAN DATA KE ROW: Tambahkan 'tax' di urutan ke-6
            ws.addRow([
              dayjs(sale.tanggal).toDate(),
              sale.nama_produk,
              sale.jumlah_qty,
              nett,
              discount,
              tax, // <--- DATA PAJAK DIMASUKKAN SINI
              gross
            ]).eachCell((cell, col) => {
              cell.border = borderStyle;

              // Format Tanggal (Kolom 1)
              if (col === 1) {
                cell.numFmt = 'DD/MM/YYYY';
                cell.alignment = { horizontal: 'center' };
              }
              // Format Angka/Rupiah (Kolom 4, 5, 6, 7)
              // Karena kolom bertambah satu, logika >= 4 tetap mencakup kolom Pajak
              if (col >= 4) {
                cell.numFmt = '#,##0';
                cell.alignment = { horizontal: 'right' };
              }
              // Format Qty (Kolom 3)
              if (col === 3) {
                cell.alignment = { horizontal: 'center' };
              }
            });
          });
        } else {
          ws.addRow(["Tidak ada data penjualan."]).getCell(1).font = { italic: true };
        }

        ws.addRow([]);

        // --- C. BLOK RINCIAN UTANG ---
        currentRow = ws.actualRowCount + 1;
        ws.getCell(`A${currentRow}`).font = { size: 11 };
        currentRow++;

        const debtHeader = ["Tanggal Utang", "Deskripsi", "Jumlah"];
        ws.addRow(debtHeader).eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4380D' } };
          cell.border = borderStyle;
          cell.alignment = { horizontal: 'center' };
        });

        if (tenantDetails?.debts.length > 0) {
          tenantDetails.debts.forEach(debt => {
            ws.addRow([
              dayjs(debt.tanggal_utang).toDate(),
              debt.deskripsi,
              debt.jumlah
            ]).eachCell((cell, col) => {
              cell.border = borderStyle;
              if (col === 1) {
                cell.numFmt = 'DD/MM/YYYY';
                cell.alignment = { horizontal: 'center' };
              }
              if (col === 3) cell.numFmt = '#,##0';
            });
          });
        } else {
          ws.addRow(["Tidak ada data utang."]).getCell(1).font = { italic: true };
        }

        // 4. ATUR LEBAR KOLOM: Tambahkan definisi lebar untuk kolom baru
        ws.columns = [
          { width: 15 }, // A Tanggal
          { width: 30 }, // B Produk
          { width: 12 }, // C Qty
          { width: 25 }, // D Gross
          { width: 20 }, // E Discount
          { width: 20 }, // F Tax (Kolom Baru)
          { width: 25 }, // G Nett
        ];
      }

      const buffer = await wb.xlsx.writeBuffer();
      const filename = `Laporan_Bagi_Hasil_${startDate}_sd_${endDate}.xlsx`;
      saveAs(new Blob([buffer]), filename);

      message.success("File Excel berhasil dibuat!");

    } catch (error) {
      console.error("Gagal export Excel:", error);
      message.error(`Gagal export Excel: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  // --- DEFINISI KOLOM TABEL (Sederhana) ---
  const columns = [
    // ... (Kolom tidak berubah)
    {
      title: "Tenant",
      dataIndex: "name",
      key: "name",
      render: (v) => <strong>{v}</strong>,
      fixed: "left",
      width: 150,
    },
    {
      title: "Penjualan Total",
      dataIndex: "totalSales",
      key: "totalSales",
      align: "right",
      render: (v) => <Tag color={"blue"}>{formatRupiah(v)}</Tag>,
      sorter: (a, b) => a.totalSales - b.totalSales,
      responsive: ["md"],
      width: 150,
    },
    {
      title: "Hak Owner (30%)",
      key: "ownerShare",
      align: "right",
      render: (_, record) => (
        <span style={{ color: "#722ed1", fontWeight: 700 }}>
          {formatRupiah(computeShares(record).ownerShare)}
        </span>
      ),
      responsive: ["md"],
      width: 150,
    },
    {
      title: "Hak Tenant (70%)",
      key: "tenantShare",
      align: "right",
      render: (_, record) => (
        <span style={{ color: "#389e0d", fontWeight: 700 }}>
          {formatRupiah(computeShares(record).rawTenantShare)}
        </span>
      ),
      responsive: ["md"],
      width: 160,
    },
    {
      title: "Total Utang",
      key: "debt",
      align: "right",
      render: (_, record) => {
        const s = computeShares(record);
        return s.debt > 0 ? (
          <Tooltip title={`Utang Awal: ${formatRupiah(record.utangAwal)} | Utang Baru: ${formatRupiah(record.utangMasukPeriode)}`}>
            <Tag color="orange">-{formatRupiah(s.debt)}</Tag>
          </Tooltip>
        ) : (
          <span>-</span>
        );
      },
      sorter: (a, b) => a.debt - b.debt,
      width: 130,
    },
    {
      title: "Pembayaran (Net)",
      key: "payouts",
      align: "right",
      width: 160,
      render: (_, record) => {
        const s = computeShares(record);
        return (
          <Tag
            color={s.netTenantShare > 0 ? "blue" : "default"}
            style={{ fontSize: 13, padding: "4px 8px", margin: 0 }}
          >
            {formatRupiah(s.netTenantShare)}
          </Tag>
        );
      },
      sorter: (a, b) => computeShares(a).netTenantShare - computeShares(b).netTenantShare,
    },
    {
      title: "Sisa Utang",
      key: "remainingDebt",
      align: "right",
      render: (_, record) => {
        const s = computeShares(record);
        return s.remainingDebt > 0 ? (
          <span style={{ color: "#d46b08", fontWeight: 700 }}>
            {formatRupiah(s.remainingDebt)}
          </span>
        ) : (
          <span>-</span>
        );
      },
      width: 120,
      responsive: ["lg"],
      sorter: (a, b) => computeShares(a).remainingDebt - computeShares(b).remainingDebt,
    },
    {
      title: "Aksi",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Lihat Log Utang">
            <Button
              size="small"
              icon={<BookOutlined />}
              onClick={() => handleOpenLog(record)}
            />
          </Tooltip>
          <Tooltip title="Export Laporan .txt">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => exportTenant(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- KOLOM UNTUK MODAL LOG UTANG ---
  const logColumns = [
    // ... (Kolom log tidak berubah)
    {
      title: "Tanggal",
      dataIndex: "tanggal_utang",
      key: "tanggal_utang",
      render: (t) => dayjs(t).format("DD MMM YYYY"),
      sorter: (a, b) => dayjs(a.tanggal_utang).unix() - dayjs(b.tanggal_utang).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      key: "jumlah",
      align: "right",
      render: (v) => formatRupiah(v),
      sorter: (a, b) => a.jumlah - b.jumlah,
    },
    {
      title: "Status",
      dataIndex: "status_lunas",
      key: "status_lunas",
      render: (lunas) => (
        lunas ? <Tag color="green">Lunas</Tag> : <Tag color="red">Belum Lunas</Tag>
      ),
      filters: [
        { text: 'Belum Lunas', value: 0 },
        { text: 'Lunas', value: 1 },
      ],
      onFilter: (value, record) => record.status_lunas === value,
      defaultFilteredValue: [0],
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Utang">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditUtang(record)} />
          </Tooltip>
          <Tooltip title="Hapus Utang">
            <Popconfirm
              title="Hapus entri utang ini?"
              description={`Yakin ingin menghapus utang ${formatRupiah(record.jumlah)}?`}
              onConfirm={() => handleDeleteUtang(record.id_utang)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <ConfigProvider locale={locale}>
      <Spin spinning={loading} tip="Memuat data...">
        <div style={{ padding: 16 }}>
          {/* Header & Global Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Admin — Laporan Bagi Hasil</h2>
                    <div style={{ color: "#6b7280" }}>
                      Laporan live pendapatan dan utang tenant.
                    </div>
                  </div>
                  <Space wrap>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => dates && setDateRange(dates)}
                      disabled={loading || exportLoading} // <-- Disable saat export
                      allowClear={false}
                    />
                    <Button
                      type="primary"
                      onClick={handleExportExcel} // <-- GANTI KE FUNGSI BARU
                      icon={<DownloadOutlined />}
                      disabled={rekapData.length === 0 || loading}
                      loading={exportLoading} // <-- TAMBAHKAN LOADING
                    >
                      Export Excel
                    </Button>
                  </Space>
                </div>
                <Divider style={{ margin: "16px 0" }} />
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Total Penjualan Kotor" value={formatRupiah(totals.totalGross)} prefix={<DollarOutlined />} />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic title="Total Hak Owner (30%)" value={formatRupiah(totals.totalOwnerShare)} prefix={<CrownOutlined />} />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic title="Total Pembayaran Tenant (Net)" value={formatRupiah(totals.totalTenantNetPayment)} prefix={<TeamOutlined />} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Table Rekap Pembayaran */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={`Rekap Bagi Hasil: ${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`}
                bodyStyle={{ padding: 0 }}
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setUtangModalVisible(true)}
                  >
                    Input Utang Baru
                  </Button>
                }
              >
                <Table
                  columns={columns}
                  dataSource={rekapData}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1200 }}
                  size="small"
                  loading={loading}
                  locale={{ emptyText: "Tidak ada data penjualan untuk rentang tanggal ini." }}
                />
              </Card>
            </Col>
          </Row>

          {/* Modal "Input Utang Baru" */}
          <Modal
            open={utangModalVisible}
            title="Input Utang Tenant Baru"
            onCancel={() => {
              setUtangModalVisible(false);
              utangForm.resetFields();
            }}
            footer={null}
            destroyOnClose
          >
            <Form form={utangForm} onFinish={handleAddUtang} layout="vertical" style={{ marginTop: 20 }}>
              <Form.Item
                name="id_tenant"
                label="Pilih Nama Tenant"
                rules={[{ required: true, message: "Pilih nama tenant" }]}
              >
                <Select
                  placeholder="Pilih nama tenant"
                  allowClear showSearch
                  loading={tenantList.length === 0}
                  filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
                  {tenantList.map((tenant) => (
                    <Option key={tenant.id_tenant} value={tenant.id_tenant}>
                      {tenant.nama_tenant}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="tanggal_utang"
                label="Tanggal Utang"
                rules={[{ required: true, message: "Pilih tanggal utang" }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="jumlah"
                label="Jumlah Utang (Rp)"
                rules={[{ required: true, message: "Jumlah tidak boleh kosong" }]}
                initialValue={0}
              >
                <InputNumber
                  style={{ width: "100%" }} min={0}
                  formatter={formatNumberInput} parser={parseNumberInput}
                  placeholder="Misalnya: 150.000"
                />
              </Form.Item>

              <Form.Item
                name="deskripsi"
                label="Deskripsi Utang"
                rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
              >
                <Input.TextArea rows={2} placeholder="Contoh: Kasbon, dll." />
              </Form.Item>

              <Form.Item style={{ marginTop: 20 }}>
                <Button type="primary" htmlType="submit" block icon={<PlusOutlined />} loading={submitLoading}>
                  Simpan Utang
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* --- MODAL Log Utang --- */}
          <Modal
            open={logModalVisible}
            title={`Log Utang untuk: ${selectedTenantForLog?.name}`}
            onCancel={() => {
              setLogModalVisible(false);
              setSelectedTenantForLog(null);
              setLogData([]);
            }}
            footer={null}
            width={800}
            destroyOnClose
          >
            <Spin spinning={logLoading}>
              <Alert
                message="Log Utang"
                description="Daftar ini berisi semua catatan utang untuk tenant ini (belum lunas dan sudah lunas) dari semua periode. Mengedit atau menghapus entri di sini akan memengaruhi perhitungan utang di tabel utama."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={logColumns}
                dataSource={logData}
                rowKey="id_utang"
                size="small"
                pagination={{ pageSize: 5 }}
                scroll={{ y: 300 }}
              />
            </Spin>
          </Modal>

          {/* --- MODAL Edit Entri Utang --- */}
          <Modal
            open={editUtangModalVisible}
            title="Edit Entri Utang"
            onCancel={() => setEditUtangModalVisible(false)}
            footer={null}
            destroyOnClose
          >
            {editingUtangEntry && (
              <Form
                form={editUtangForm}
                layout="vertical"
                onFinish={handleUpdateUtang}
                style={{ marginTop: 20 }}
              >
                <Form.Item name="tanggal_utang" label="Tanggal" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item name="jumlah" label="Jumlah (Rp)" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: "100%" }} min={0}
                    formatter={formatNumberInput} parser={parseNumberInput}
                  />
                </Form.Item>
                <Form.Item name="deskripsi" label="Deskripsi" rules={[{ required: true }]}>
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="status_lunas" label="Status" valuePropName="checked">
                  <Switch checkedChildren="Lunas" unCheckedChildren="Belum Lunas" />
                </Form.Item>
                <Form.Item style={{ marginTop: 20 }}>
                  <Button type="primary" htmlType="submit" block loading={submitLoading}>
                    Update Entri Utang
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Modal>

        </div>
      </Spin>
    </ConfigProvider>
  );
};

export default HutangAdmin;