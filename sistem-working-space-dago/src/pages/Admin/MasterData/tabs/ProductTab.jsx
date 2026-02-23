import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Upload,
  InputNumber,
  Switch,
  Spin,
  notification, // <-- Ditambahkan
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShoppingOutlined,
  FileImageOutlined,
  UploadOutlined,
  CheckCircleOutlined, // <-- Ditambahkan
  CloseCircleOutlined, // <-- Ditambahkan
} from "@ant-design/icons";
import {
  getProduk,
  createProduk,
  updateProduk,
  deleteProduk,
  getKategoriTenant,
} from "../../../../services/service"; // Pastikan path benar

const { Text } = Typography;
const { Option } = Select;
const { Search, TextArea } = Input;

// Helper function to get base URL for images
const getImageUrl = (filename) => {
  if (!filename) return "/static/kopi.jpg"; // Fallback default
  const baseUrlWithoutApi = import.meta.env.VITE_BASE_URL?.replace('/api/v1', '') || '';
  return `${baseUrlWithoutApi}/static/${filename}`;
};

// Helper function di luar komponen
const uniqueValues = (arr, key) => {
  if (!arr) return [];
  const values = arr.map((item) => item?.[key]).filter(Boolean);
  return [...new Set(values)].sort().map((val) => ({
    text: val,
    value: val,
  }));
};


const ProductTab = () => {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({ status_ketersediaan: "Active", status_visibilitas: "Aktif" });
  const [fileFoto, setFileFoto] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); // <--- TAMBAHKAN IN
  const [kategoriList, setKategoriList] = useState([]);
  const [tenantList, setTenantList] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // --- TAMBAHAN: Inisialisasi Notifikasi ---
  const [api, contextHolder] = notification.useNotification();

  // --- TAMBAHAN: Fungsi Helper Notifikasi (dibuat stabil dengan useCallback) ---
  const openNotif = useCallback((type, title, desc) => {
    api[type]({
      message: title,
      description: desc,
      placement: "topRight",
      duration: 3,
      icon: type === "success" ? (
        <CheckCircleOutlined style={{ color: "#52c41a" }} />
      ) : type === "error" ? (
        <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
      ) : null,
    });
  }, [api]); // Dependensi hanya 'api'

  // Memoize filtered category list
  const filteredKategoriList = useMemo(() => {
    if (!formData.id_tenant || !kategoriList) return [];
    return kategoriList.filter((k) => k.id_tenant === formData.id_tenant);
  }, [formData.id_tenant, kategoriList]);


  // 🚀 Fetch data produk & kategori
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resProduk, resKategori] = await Promise.all([
        getProduk(),
        getKategoriTenant()
      ]);

      if (resProduk.status === 200 && resProduk.data.message === "OK") {
        const produk = resProduk.data.datas.map((item) => ({
          key: item.id_produk,
          ...item,
        }));
        setData(produk);
      } else {
        openNotif("error", "Gagal Memuat Produk", resProduk.data?.error || "Gagal mengambil data produk");
      }

      if (resKategori.status === 200 && resKategori.data.message === "OK") {
        const allKategori = resKategori.data.datas.map((item) => ({
          id: item.id_kategori,
          nama: item.nama_kategori,
          tenant: item.nama_tenant,
          id_tenant: item.id_tenant,
        }));
        setKategoriList(allKategori);

        const uniqueTenants = allKategori.reduce((acc, current) => {
          if (!acc.find((item) => item.id_tenant === current.id_tenant)) {
            acc.push({ id_tenant: current.id_tenant, nama_tenant: current.tenant });
          }
          return acc;
        }, []);
        setTenantList(uniqueTenants);
      } else {
        openNotif("error", "Gagal Memuat Kategori", resKategori.data?.error || "Gagal mengambil data kategori");
      }
    } catch (err) {
      console.error("Gagal fetch data:", err);
      openNotif("error", "Kesalahan", "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  }, [openNotif]); // Dependensi ke openNotif


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // 🔎 Memoize Filter pencarian global
  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lowerSearchText = searchText.toLowerCase();
    return data.filter(
      (item) =>
        item.nama_produk?.toLowerCase().includes(lowerSearchText) ||
        item.nama_kategori?.toLowerCase().includes(lowerSearchText) ||
        item.nama_tenant?.toLowerCase().includes(lowerSearchText)
    );
  }, [data, searchText]);

  // --- 🔽 Memoize FILTER OPTIONS untuk Kolom Table ---
  const uniqueNamaProdukFilters = useMemo(() => uniqueValues(data, "nama_produk"), [data]);
  const uniqueTenantFilters = useMemo(() => uniqueValues(data, "nama_tenant"), [data]);
  const uniqueKategoriFilters = useMemo(() => uniqueValues(data, "nama_kategori"), [data]);
  const statusKetersediaanFilters = useMemo(() => [
    { text: "Tersedia", value: "Active" },
    { text: "Habis", value: "Inactive" },
  ], []);
  const statusVisibilitasFilters = useMemo(() => [
    { text: "Ditampilkan", value: "Aktif" },
    { text: "Disembunyikan", value: "Nonaktif" },
  ], []);

  // ===================================================================
  // 		HANDLER FUNCTIONS
  // ===================================================================

  // --- Memoize Form Handler ---
  const handleChange = useCallback((field, value) => {
    setFormData(prevFormData => {
      const newFormData = { ...prevFormData, [field]: value };
      if (field === "id_tenant") {
        delete newFormData.id_kategori;
      }
      return newFormData;
    });

    if (validationErrors[field]) {
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // --- Memoize Cancel Handler ---
  const handleCancel = useCallback(() => {
    setOpen(false);
    setFormData({ status_ketersediaan: "Active", status_visibilitas: "Aktif" });
    setEditingProduct(null);
    setFileFoto(null);
    setPreviewImage(null);
    setValidationErrors({});
  }, []);

  // --- Memoize Delete Handler ---
  const handleDelete = useCallback(async (id_produk) => {
    setLoading(true);
    try {
      console.log("Deleting product ID:", id_produk);
      const res = await deleteProduk(id_produk);
      if (res.status === 200) {
        openNotif("success", "Produk Dihapus", "Data Produk berhasil dihapus!");
        setData(prevData => prevData.filter(item => item.id_produk !== id_produk));
      } else {
        const errorMsg = res.data?.error || res.data?.message || "Gagal menghapus produk";
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Error delete produk:", err);
      openNotif("error", "Gagal Menghapus", err.message || "Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  }, [openNotif]);

  // --- Memoize Edit Handler ---
  const handleEdit = useCallback((product) => {
    console.log("Editing product data:", product);
    const kategoriProduk = kategoriList.find((k) => k.id === product.id_kategori);
    const tenantId = kategoriProduk ? kategoriProduk.id_tenant : null;
    console.log("Found tenant ID for edit:", tenantId);

    setEditingProduct(product);
    setFormData({
      id_tenant: tenantId,
      id_kategori: product.id_kategori,
      nama_produk: product.nama_produk,
      deskripsi_produk: product.deskripsi_produk,
      harga: product.harga,
      status_ketersediaan: product.status_ketersediaan,
      status_visibilitas: product.status_visibilitas,
    });
    setFileFoto(null);
    setPreviewImage(product.foto_produk ? getImageUrl(product.foto_produk) : null);
    setValidationErrors({});
    setOpen(true);
  }, [kategoriList]);

  // --- Memoize Submit Handler (Create/Update) ---
  const handleAddProduct = useCallback(async () => {
    // Validasi Penuh
    const errors = {};
    if (!formData.id_tenant) errors.id_tenant = true;
    if (!formData.id_kategori) errors.id_kategori = true;
    if (!formData.nama_produk || formData.nama_produk.trim() === "") errors.nama_produk = true;
    if (formData.harga === null || formData.harga === undefined || formData.harga < 0) errors.harga = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      openNotif("warning", "Data Tidak Lengkap", "Harap isi semua bidang yang wajib diisi (ditandai *).");
      return;
    }

    setValidationErrors({});
    setSubmitLoading(true);
    try {
      const formPayload = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formPayload.append(key, formData[key] || '');
        }
      }
      formPayload.set("harga", formData.harga);
      formPayload.set("status_ketersediaan", formData.status_ketersediaan || "Active");
      formPayload.set("status_visibilitas", formData.status_visibilitas || "Aktif");


      if (fileFoto) {
        const isJpgOrPng = fileFoto.type === 'image/jpeg' || fileFoto.type === 'image/png';
        if (!isJpgOrPng) throw new Error('Hanya bisa upload file JPG/PNG!');
        const isLt2M = fileFoto.size / 1024 / 1024 < 2;
        if (!isLt2M) throw new Error('Gambar harus lebih kecil dari 2MB!');
        formPayload.append("foto_produk", fileFoto);
      }

      let res;
      if (editingProduct) {
        console.log("Updating product ID:", editingProduct.id_produk);
        res = await updateProduk(editingProduct.id_produk, formPayload);
        if (res.status === 200) {
          openNotif("success", "Update Berhasil", "Data Produk berhasil diperbarui!");
        } else {
          const errorMsg = res.data?.error || res.data?.message || "Gagal memperbarui produk";
          throw new Error(errorMsg);
        }
      } else {
        console.log("Creating new product");
        res = await createProduk(formPayload);
        if (res.status === 201) {
          openNotif("success", "Tambah Berhasil", "Data Produk baru berhasil ditambahkan!");
        } else {
          const errorMsg = res.data?.error || res.data?.message || "Gagal menambahkan produk baru";
          throw new Error(errorMsg);
        }
      }

      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save produk:", err);
      openNotif("error", "Gagal Menyimpan", err.message || "Gagal menyimpan produk");
    } finally {
      setSubmitLoading(false);
    }
  }, [formData, fileFoto, editingProduct, fetchData, handleCancel, openNotif]);

  // --- Memoize File Change Handler ---
  const handleFileChange = useCallback((info) => {
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      if (file) {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
          openNotif("error", "File Tidak Valid", "Hanya bisa upload file JPG/PNG!");
          setFileFoto(null);
          setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
          return;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          openNotif("error", "File Terlalu Besar", "Gambar harus lebih kecil dari 2MB!");
          setFileFoto(null);
          setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
          return;
        }
        setFileFoto(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFileFoto(null);
      setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
    }
  }, [editingProduct, openNotif]);


  // --- Memoize Definisi Kolom Tabel ---
  const columns = useMemo(() => [
    {
      title: "Nama Produk",
      dataIndex: "nama_produk",
      key: "nama_produk",
      sorter: (a, b) => a.nama_produk.localeCompare(b.nama_produk),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Cari Nama Produk`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small">Search</Button>
            <Button onClick={() => { clearFilters(); setSelectedKeys([]); confirm(); }} size="small">Reset</Button>
          </Space>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) => record.nama_produk?.toLowerCase().includes(value.toLowerCase()),
      render: (text) => (
        <Space>
          <ShoppingOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Kategori / Tenant",
      dataIndex: "nama_kategori",
      key: "kategori_info",
      filters: uniqueKategoriFilters,
      onFilter: (value, record) => record.nama_kategori === value,
      render: (_, record) => (
        <div>
          <Text strong>{record.nama_kategori || "-"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.nama_tenant || "N/A"}
          </Text>
        </div>
      ),
    },
    {
      title: "Harga",
      dataIndex: "harga",
      key: "harga",
      sorter: (a, b) => a.harga - b.harga,
      render: (harga) => `Rp ${Number(harga || 0).toLocaleString("id-ID")}`,
    },
    {
      title: "Status Ketersediaan",
      dataIndex: "status_ketersediaan",
      key: "status_ketersediaan",
      filters: statusKetersediaanFilters,
      onFilter: (value, record) => record.status_ketersediaan === value,
      render: (status) =>
        status === "Active" ? (
          <Text type="success">Tersedia</Text>
        ) : (
          <Text type="warning">Habis</Text>
        ),
    },
    {
      title: "Visibilitas Admin",
      dataIndex: "status_visibilitas",
      key: "status_visibilitas",
      filters: statusVisibilitasFilters,
      onFilter: (value, record) => record.status_visibilitas === value,
      render: (status) =>
        status === "Aktif" ? (
          <Text type="success">Ditampilkan</Text>
        ) : (
          <Text type="danger">Disembunyikan</Text>
        ),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi_produk",
      key: "deskripsi_produk",
      width: 200,
      ellipsis: true,
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || "-"}</Text>,
    },
    {
      title: "Foto",
      dataIndex: "foto_produk",
      key: "foto_produk",
      width: 80,
      render: (url) =>
        url ? (
          <img
            src={getImageUrl(url)}
            alt="produk"
            style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
            onError={(e) => { e.target.onerror = null; e.target.src = "/static/kopi.jpg" }}
          />
        ) : (
          <FileImageOutlined style={{ fontSize: '24px', color: '#ccc' }} />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Produk">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="Delete Produk">
            <Popconfirm
              title="Hapus Produk"
              description={`Yakin ingin menghapus "${record.nama_produk}"?`}
              onConfirm={() => handleDelete(record.id_produk)}
              okText="Ya"
              cancelText="Tidak"
              okButtonProps={{ danger: true, loading: loading }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} disabled={loading} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ],
    [uniqueKategoriFilters, statusKetersediaanFilters, statusVisibilitasFilters, loading, handleEdit, handleDelete]);


  // --- Render ---
  return (
    <Spin spinning={loading} tip="Memuat data produk...">
      <div style={{ padding: "24px" }}>
        {/* --- TAMBAHAN: Render Context Holder --- */}
        {contextHolder}

        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={10} lg={8}>
            <Search
              placeholder="Cari produk, kategori, tenant..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onSearch={value => {
                setSearchText(value);
                setCurrentPage(1); // <--- Reset ke halaman 1 saat search
              }}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1); // <--- Reset ke halaman 1 saat mengetik
              }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                handleCancel();
                setOpen(true);
              }}
              size="large"
              style={{
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              Tambah Produk Baru
            </Button>
            _ </Col>
        </Row>

        <Card style={{ borderRadius: "12px", overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              current: currentPage, // <--- Gunakan state
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              total: filteredData.length,
              showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} produk`,
              onChange: (page, newSize) => {
                // Update state halaman saat tombol diklik
                setCurrentPage(page);

                // Update pageSize jika user mengubah jumlah baris per halaman
                if (newSize !== pageSize) {
                  setPageSize(newSize);
                  setCurrentPage(1); // Opsional: reset ke hal 1 jika ukuran page berubah
                }
              },
              position: ["bottomRight"],
            }}
            loading={loading}
            scroll={{ x: 1300 }}
            rowKey="id_produk"
          />
        </Card>

        {/* Modal Form Produk */}
        <Modal
          title={
            <Space>
              {editingProduct ? <EditOutlined /> : <PlusOutlined />}
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </Space>
          }
          open={open}
          onCancel={handleCancel}
          onOk={handleAddProduct}
          confirmLoading={submitLoading}
          okText={editingProduct ? "Update" : "Simpan"}
          cancelText="Batal"
          width={800}
          destroyOnClose
          maskClosable={false}
        >
          <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Tenant <span style={{ color: 'red' }}>*</span></Text>
                <Select
                  placeholder="Pilih tenant"
                  value={formData.id_tenant}
                  onChange={(val) => handleChange("id_tenant", val)}
                  style={{ width: "100%" }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  status={validationErrors.id_tenant ? 'error' : ''}
                >
                  {tenantList.map((t) => (
                    <Option key={t.id_tenant} value={t.id_tenant}>
                      {t.nama_tenant}
                    </Option>
                  ))}
                </Select>
                {validationErrors.id_tenant && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                    Tenant wajib dipilih.
                  </Text>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Kategori <span style={{ color: 'red' }}>*</span></Text>
                <Select
                  placeholder="Pilih kategori (setelah pilih tenant)"
                  value={formData.id_kategori}
                  onChange={(val) => handleChange("id_kategori", val)}
                  style={{ width: "100%" }}
                  disabled={!formData.id_tenant || filteredKategoriList.length === 0}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent={!formData.id_tenant ? "Pilih tenant dulu" : "Tidak ada kategori untuk tenant ini"}
                  status={validationErrors.id_kategori ? 'error' : ''}
                >
                  {filteredKategoriList.map((k) => (
                    <Option key={k.id} value={k.id}>
                      t     {k.nama}
                    </Option>
                  ))}
                </Select>
                {validationErrors.id_kategori && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                    Kategori wajib dipilih.
                  </Text>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Nama Produk <span style={{ color: 'red' }}>*</span></Text>
                <Input
                  placeholder="Masukkan nama produk"
                  value={formData.nama_produk || ""}
                  onChange={(e) => handleChange("nama_produk", e.target.value)}
                  status={validationErrors.nama_produk ? 'error' : ''}
                />
                {validationErrors.nama_produk && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                    Nama produk wajib diisi.
                  </Text>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Harga <span style={{ color: 'red' }}>*</span></Text>
                <InputNumber
                  controls={false}
                  placeholder="Masukkan harga (angka saja)"
                  value={formData.harga === null || formData.harga === undefined ? null : formData.harga}
                  onChange={(val) => handleChange("harga", val)}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                  status={validationErrors.harga ? 'error' : ''}
                />
                {validationErrors.harga && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                    Harga wajib diisi (minimal 0).
                  </Text>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Status Ketersediaan (Tenant)</Text>
                <Switch
                  checked={formData.status_ketersediaan === "Active"}
                  onChange={(checked) =>
                    handleChange("status_ketersediaan", checked ? "Active" : "Inactive")
                  }
                  checkedChildren="Tersedia"
                  unCheckedChildren="Habis"
                  style={{ display: "block", marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>Visibilitas Produk (Admin)</Text>
                <Switch
                  checked={formData.status_visibilitas === "Aktif"}
                  onChange={(checked) =>
                    handleChange("status_visibilitas", checked ? "Aktif" : "Nonaktif")
                  }
                  checkedChildren="Ditampilkan"
                  unCheckedChildren="Disembunyikan"
                  style={{ display: "block", marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Deskripsi</Text>
                <TextArea
                  rows={6}
                  placeholder="Masukkan deskripsi produk (opsional)"
                  value={formData.deskripsi_produk || ""}
                  onChange={(e) => handleChange("deskripsi_produk", e.target.value)}
                />
              </div>

              <div>
                <Text strong>Foto Produk</Text>
                <Upload
                  listType="picture-card"
                  className="product-uploader"
                  showUploadList={false}
                  onChange={handleFileChange}
                  maxCount={1}
                  accept="image/png, image/jpeg"
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        display: 'block',
                      }}
                    />

                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload Foto</div>
                    </div>
                  )}
                </Upload>
                {previewImage && (
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setFileFoto(null);
                      setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
                    }}
                    style={{ marginTop: 8 }}
                  >
                    Hapus Foto
                  </Button>
                )}
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                  Klik area di atas untuk upload (JPG/PNG, Max 2MB).
                  {editingProduct && ' Kosongkan jika tidak ingin mengubah foto.'}
                </Text>
              </div>
            </Col>
          </Row>
        </Modal>

        {/* CSS untuk preview upload picture-card */}
        <style jsx global>{`
        .product-uploader .ant-upload.ant-upload-select-picture-card {
        width: 150px;
        height: 150px;
        margin-right: 8px;
        margin-bottom: 8px;
        }
        .product-uploader .ant-upload img {
        border-radius: 8px;
        object-fit: cover;
        }
        `}</style>
      </div>
    </Spin>
  );
};

export default ProductTab;