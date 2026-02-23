import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Select,
  Popconfirm,
  Tooltip,
  Form,
  notification,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  BookOutlined, // <-- Ikon baru untuk COA
} from "@ant-design/icons";
import {
  getKategoriTenant,
  createKategori,
  updateKategori,
  deleteKategori,
  getTenantsForDropdown,
  getCoaAdmin, // <-- IMPORT BARU: Untuk mengambil daftar COA
} from "../../../../services/service";

const { Text } = Typography;
const { Option } = Select;

const ProductKategoriTab = () => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tenantsForDropdown, setTenantsForDropdown] = useState([]);
  const [coaList, setCoaList] = useState([]); // <-- STATE BARU: Untuk dropdown COA
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // 🔔 Fungsi untuk menampilkan notifikasi kanan atas
  const showNotification = (type, title, description) => {
    api[type]({
      message: title,
      description: description,
      placement: "topRight",
      duration: 3,
      icon:
        type === "success" ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : undefined,
    });
  };

  // Ambil nilai unik dari data untuk filter tabel
  const uniqueValues = (arr, key) => {
    return [...new Set(arr.map((item) => item[key]).filter(Boolean))].map((val) => ({
      text: val,
      value: val,
    }));
  };

  // Fetch data kategori
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getKategoriTenant();
      if (res.status === 200 && res.data.message === "OK") {
        const kategori = res.data.datas.map((item, index) => ({
          key: item.id_kategori ?? index + 1,
          id_kategori: item.id_kategori,
          merchantId: item.id_tenant,
          nama_merchant: item.nama_tenant,
          nama_kategori: item.nama_kategori,
          id_coa: item.id_coa, // <-- AMBIL DATA BARU
          kode_akun: item.kode_akun, // <-- AMBIL DATA BARU
          nama_akun: item.nama_akun, // <-- AMBIL DATA BARU
        }));
        setData(kategori);
      } else {
        showNotification("error", "Gagal Memuat", "Tidak dapat memuat data kategori.");
      }
    } catch (err) {
      showNotification("error", "Kesalahan", err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenant untuk dropdown
  const fetchTenants = async () => {
    try {
      const res = await getTenantsForDropdown();
      if (res.status === 200 && res.data?.datas) {
        setTenantsForDropdown(res.data.datas);
      }
    } catch (err) {
      showNotification("error", "Kesalahan", "Gagal memuat data merchant.");
    }
  };

  // --- FUNGSI BARU: Fetch COA untuk dropdown ---
  const fetchCoa = async () => {
    try {
      const res = await getCoaAdmin();
      if (res.status === 200 && res.data?.datas) {
        // Anda bisa filter di sini jika perlu, misal hanya 'Pendapatan'
        // const filteredCoa = res.data.datas.filter(akun => akun.tipe_akun === 'Pendapatan');
        setCoaList(res.data.datas);
      }
    } catch (err) {
      showNotification("error", "Kesalahan", "Gagal memuat data Chart of Accounts.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchTenants();
    fetchCoa(); // <-- PANGGIL FUNGSI BARU
  }, []);

  // Kolom tabel
  const columns = [
    {
      title: "ID Kategori",
      dataIndex: "id_kategori",
      key: "id_kategori",
      width: 120,
      sorter: (a, b) => (Number(a.id_kategori) || 0) - (Number(b.id_kategori) || 0),
      render: (text) => text ?? "-",
    },
    {
      title: "Nama Merchant",
      dataIndex: "nama_merchant",
      key: "nama_merchant",
      filters: uniqueValues(data, "nama_merchant"),
      filterSearch: true,
      onFilter: (value, record) =>
        record.nama_merchant?.toLowerCase().includes(value.toLowerCase()) || false,
      render: (text) => (
        <Space>
          <ShopOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Nama Kategori",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      filters: uniqueValues(data, "nama_kategori"),
      filterSearch: true,
      onFilter: (value, record) =>
        record.nama_kategori?.toLowerCase().includes(value.toLowerCase()) || false,
      render: (text) => (
        <Space>
          <AppstoreOutlined style={{ color: "#52c41a" }} />
          <Text>{text || "-"}</Text>
        </Space>
      ),
    },
    // --- KOLOM BARU: AKUN COA ---
    {
      title: "Akun COA",
      dataIndex: "kode_akun",
      key: "coa",
      width: 250,
      render: (text, record) => (
        record.kode_akun ? (
          <Space>
            <BookOutlined style={{ color: "#faad14" }} />
            <Text>({record.kode_akun}) {record.nama_akun}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      filters: uniqueValues(data, "nama_akun"),
      filterSearch: true,
      onFilter: (value, record) =>
        record.nama_akun?.toLowerCase().includes(value.toLowerCase()) || false,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Kategori">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="Delete Kategori">
            <Popconfirm
              title="Hapus Kategori"
              description="Yakin ingin menghapus kategori ini?"
              onConfirm={() => handleDelete(record.id_kategori)}
              okText="Ya"
              cancelText="Tidak"
              disabled={loading}
            >
              <Button type="link" danger icon={<DeleteOutlined />} disabled={loading} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // CREATE / UPDATE kategori
// (File: src/pages/Admin/MasterData/tabs/ProductKategoriTab.jsx)
// ... (semua import dan kode lain tetap sama) ...

  // CREATE / UPDATE kategori
  const handleAddCategory = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // --- PERBAIKAN DI SINI ---
      // 1. Buat object payload-nya terlebih dahulu
      const payload = {
        nama_kategori: values.nama_kategori,
        id_tenant: values.merchantId,
        
        // 2. Gunakan "|| null"
        // Ini akan mengirim 'null' jika values.id_coa adalah 'undefined' (dari allowClear)
        // Jika ada nilainya (misal: 12), ia akan mengirim 12.
        id_coa: values.id_coa || null 
      };
      // --- SELESAI PERBAIKAN ---

      let res;
      if (editingCategory) {
        // 3. Kirim payload yang sudah diperbaiki
        res = await updateKategori(editingCategory.id_kategori, payload);
      } else {
        // 4. Kirim payload yang sudah diperbaiki
        res = await createKategori(payload);
      }

      if (res.status === 200 || res.status === 201) {
        showNotification(
          "success",
          editingCategory ? "Kategori Diperbarui" : "Kategori Ditambahkan",
          `Data kategori berhasil ${editingCategory ? "diperbarui" : "ditambahkan"}.`
        );
        await fetchData();
        handleCancel();
      } else {
        showNotification("error", "Operasi Gagal", res.data?.error || "Gagal menyimpan data kategori.");
      }
    } catch (err) {
      showNotification("error", "Validasi Gagal", "Harap isi semua bidang yang wajib diisi.");
    } finally {
      setLoading(false);
    }
  };

// ... (sisa file Anda tetap sama) ...
  // DELETE kategori
  const handleDelete = async (id_kategori) => {
    setLoading(true);
    try {
      const res = await deleteKategori(id_kategori);
      if (res.status === 200) {
        showNotification("success", "Kategori Dihapus", "Data kategori berhasil dihapus.");
        await fetchData();
      } else {
        showNotification("error", "Gagal Menghapus", res.data?.error || "Terjadi kesalahan saat menghapus kategori.");
      }
    } catch (err) {
      if (err.response?.data?.error?.includes("foreign key constraint fails")) {
        showNotification("error", "Kategori Digunakan", "Kategori masih digunakan oleh produk.");
      } else {
        showNotification("error", "Kesalahan", err.message || "Terjadi kesalahan saat menghapus kategori.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      merchantId: category.merchantId,
      nama_kategori: category.nama_kategori,
      id_coa: category.id_coa, // <-- SET NILAI id_coa SAAT EDIT
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}

      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1" />
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCategory(null);
              form.resetFields();
              setOpen(true);
            }}
            size="large"
          >
            Tambah Kategori Baru
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px" }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id_kategori ?? record.key}
          pagination={{
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["5", "10", "50", "100"],
            onChange: (page, newPageSize) => setPageSize(newPageSize),
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} item`,
          }}
          loading={loading}
          scroll={{ x: 1200 }} // <-- Perbesar scroll x karena ada kolom baru
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingCategory ? <EditOutlined /> : <PlusOutlined />}
            {editingCategory ? "Edit Category" : "Add New Category"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleAddCategory}
        confirmLoading={loading}
        okText={editingCategory ? "Update" : "Add"}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={
              <Text strong>
                Merchant <span style={{ color: "red" }}>*</span>
              </Text>
            }
            name="merchantId"
            rules={[{ required: true, message: "Silakan pilih merchant!" }]}
          >
            <Select
              placeholder="Pilih merchant"
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {tenantsForDropdown.map((tenant) => (
                <Option key={tenant.id_tenant} value={tenant.id_tenant}>
                  {tenant.nama_tenant}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <Text strong>
                Nama Kategori <span style={{ color: "red" }}>*</span>
              </Text>
            }
            name="nama_kategori"
            rules={[{ required: true, message: "Silakan masukkan nama kategori!" }]}
          >
            <Input placeholder="Masukkan nama kategori" />
          </Form.Item>

          {/* --- FORM ITEM BARU: DROPDOWN COA --- */}
          <Form.Item
            label={
              <Text strong>
                Akun COA (Opsional)
              </Text>
            }
            name="id_coa"
          >
            <Select
              placeholder="Pilih akun COA"
              style={{ width: "100%" }}
              showSearch
              allowClear // <-- Izinkan untuk dikosongkan
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {coaList.map((akun) => (
                <Option key={akun.id_coa} value={akun.id_coa}>
                  ({akun.kode_akun}) {akun.nama_akun}
                </Option>
              ))}
            </Select>
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default ProductKategoriTab;