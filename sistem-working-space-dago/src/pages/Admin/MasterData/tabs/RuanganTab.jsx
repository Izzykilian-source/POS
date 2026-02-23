import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Input, Typography, Row, Col, Card, Space,
  Select, Popconfirm, Tooltip, Upload, InputNumber, Switch,
  Tag, List, Divider, Image, Alert, notification
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined
} from "@ant-design/icons";
import {
  getRuangan, createRuangan, updateRuangan, deleteRuangan,
  getKategoriRuangan, getPaketHargaByRuangan,
  addPaketHarga, deletePaketHarga, updatePaketHarga
} from "../../../../services/service";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea, Search } = Input;

const initialFormData = {
  nama_ruangan: "",
  id_kategori_ruangan: null,
  harga_per_jam: 0,
  kapasitas: 1,
  deskripsi_ruangan: "",
  fitur_ruangan: "",
  status_ketersediaan: "Active",
};

const RuanganTab = () => {
  const [api, contextHolder] = notification.useNotification();
  const [data, setData] = useState([]);
  const [kategoriRuanganList, setKategoriRuanganList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fileGambar, setFileGambar] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [paketHargaList, setPaketHargaList] = useState([]);
  const [newPaket, setNewPaket] = useState({ durasi_jam: "", harga_paket: "" });
  const [editingPaket, setEditingPaket] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // === Fungsi Notifikasi Custom ===
  const showNotif = (type, title, desc) => {
    const icon =
      type === "success" ? (
        <CheckCircleOutlined style={{ color: "#52c41a" }} />
      ) : type === "error" ? (
        <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
      ) : (
        <WarningOutlined style={{ color: "#faad14" }} />
      );

    api.open({
      message: title,
      description: desc,
      icon,
      placement: "topRight",
      style: {
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      },
    });
  };

  // === Ambil Data dari Backend ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRuangan, resKategori] = await Promise.all([
        getRuangan(),
        getKategoriRuangan(),
      ]);
      if (resRuangan.status === 200) {
        setData(resRuangan.data.datas.map((item) => ({ ...item, key: item.id_ruangan })));
      }
      if (resKategori.status === 200) {
        setKategoriRuanganList(resKategori.data.datas);
      }
    } catch {
      showNotif("error", "Gagal mengambil data", "Terjadi kesalahan saat mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPaketHarga = async (id_ruangan) => {
    try {
      const res = await getPaketHargaByRuangan(id_ruangan);
      setPaketHargaList(res.data.datas || []);
    } catch {
      showNotif("error", "Gagal mengambil paket harga", "Terjadi kesalahan saat mengambil data paket harga.");
    }
  };

  // === Modal Tambah/Edit ===
  const handleOpenModal = (ruangan = null) => {
    if (ruangan) {
      setEditingRuangan(ruangan);
      setFormData(ruangan);
      fetchPaketHarga(ruangan.id_ruangan);
    } else {
      setEditingRuangan(null);
      setFormData(initialFormData);
    }
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingRuangan(null);
    setFormData(initialFormData);
    setFileGambar(null);
    setPaketHargaList([]);
    setNewPaket({ durasi_jam: "", harga_paket: "" });
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setValidationErrors({});
  };

  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleAddOrUpdateRuangan = async () => {
    const errors = {};
    if (!formData.nama_ruangan?.trim()) errors.nama_ruangan = true;
    if (!formData.id_kategori_ruangan) errors.id_kategori_ruangan = true;
    if (formData.harga_per_jam === null || formData.harga_per_jam === undefined)
      errors.harga_per_jam = true;
    if (!formData.kapasitas) errors.kapasitas = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotif("warning", "Validasi gagal", "Harap isi semua form wajib (ditandai *).");
      return;
    }

    setValidationErrors({});
    setLoading(true);

    const formPayload = new FormData();
    for (const key in formData) if (formData[key] !== null) formPayload.append(key, formData[key]);
    if (fileGambar) formPayload.append("gambar_ruangan", fileGambar);

    try {
      if (editingRuangan) {
        await updateRuangan(editingRuangan.id_ruangan, formPayload);
        showNotif("success", "Ruangan Diperbarui", "Data ruangan berhasil diperbarui.");
      } else {
        await createRuangan(formPayload);
        showNotif("success", "Ruangan Ditambahkan", "Ruangan baru berhasil ditambahkan!");
      }
      fetchData();
      handleCancel();
    } catch {
      showNotif("error", "Gagal Menyimpan", "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRuangan(id);
      showNotif("success", "Ruangan Dihapus", "Data ruangan berhasil dihapus.");
      fetchData();
    } catch {
      showNotif("error", "Gagal Menghapus", "Terjadi kesalahan saat menghapus ruangan.");
    }
  };

  // === Logika Paket Harga ===
  const handleSavePaket = async () => {
    if (!newPaket.durasi_jam || !newPaket.harga_paket) {
      return showNotif("warning", "Validasi Paket Gagal", "Durasi & harga wajib diisi!");
    }
    try {
      if (editingPaket) {
        await updatePaketHarga(editingPaket.id_paket, newPaket);
        showNotif("success", "Paket Diperbarui", "Paket harga berhasil diperbarui.");
      } else {
        await addPaketHarga({ ...newPaket, id_ruangan: editingRuangan.id_ruangan });
        showNotif("success", "Paket Ditambahkan", "Paket harga baru berhasil ditambahkan.");
      }
      fetchPaketHarga(editingRuangan.id_ruangan);
      setEditingPaket(null);
      setNewPaket({ durasi_jam: "", harga_paket: "" });
    } catch {
      showNotif("error", "Gagal Menyimpan Paket", "Terjadi kesalahan saat menyimpan paket harga.");
    }
  };

  const handleDeletePaket = async (id_paket) => {
    try {
      await deletePaketHarga(id_paket);
      showNotif("success", "Paket Dihapus", "Data paket harga berhasil dihapus.");
      fetchPaketHarga(editingRuangan.id_ruangan);
    } catch {
      showNotif("error", "Gagal Menghapus Paket", "Terjadi kesalahan saat menghapus paket harga.");
    }
  };

  const getColumnSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Cari ${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
            Cari
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
  });

  const columns = [
    {
      title: "Gambar",
      dataIndex: "gambar_ruangan",
      key: "gambar_ruangan",
      width: 100,
      render: (gambar) => (
        <Image
          width={60}
          src={
            gambar
              ? `${import.meta.env.VITE_BASE_URL}/static/${gambar}`
              : "https://via.placeholder.com/100?text=No+Image"
          }
        />
      ),
    },
    {
      title: "Nama Ruangan",
      dataIndex: "nama_ruangan",
      key: "nama_ruangan",
      ...getColumnSearchProps("nama_ruangan", "Nama Ruangan"),
    },
    {
      title: "Kategori",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      filters: kategoriRuanganList.map((k) => ({ text: k.nama_kategori, value: k.nama_kategori })),
      onFilter: (value, record) => record.nama_kategori === value,
    },
    {
      title: "Kapasitas",
      dataIndex: "kapasitas",
      key: "kapasitas",
      sorter: (a, b) => a.kapasitas - b.kapasitas,
      ...getColumnSearchProps("kapasitas", "Kapasitas"),
      render: (val) => `${val} org`,
    },
    {
      title: "Harga per Jam",
      dataIndex: "harga_per_jam",
      key: "harga_per_jam",
      sorter: (a, b) => a.harga_per_jam - b.harga_per_jam,
      render: (harga) =>
        harga > 0 ? `Rp ${harga.toLocaleString("id-ID")}` : <Tag>Gratis</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status_ketersediaan",
      key: "status_ketersediaan",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status_ketersediaan === value,
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Ruangan">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm title="Yakin hapus ruangan ini?" onConfirm={() => handleDelete(record.id_ruangan)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1">
          <Search
            placeholder="Cari nama atau kategori ruangan..."
            size="large"
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col flex="none">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} size="large">
            Tambah Ruangan Baru
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={data.filter(
            (item) =>
              item.nama_ruangan.toLowerCase().includes(searchText.toLowerCase()) ||
              item.nama_kategori.toLowerCase().includes(searchText.toLowerCase())
          )}
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            onShowSizeChange: (c, size) => setPageSize(size),
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* === MODAL TAMBAH/EDIT RUANGAN === */}
      <Modal
        title={<Title level={4}>{editingRuangan ? "Edit Ruangan" : "Tambah Ruangan Baru"}</Title>}
        open={open}
        onCancel={handleCancel}
        width={850} // Lebar yang cukup untuk 2 kolom
        destroyOnClose // Hancurkan form saat ditutup untuk mereset state internal
        footer={[
          <Button key="cancel" onClick={handleCancel}>Batal</Button>,
          <Button key="save" type="primary" onClick={handleAddOrUpdateRuangan} loading={loading}>
            Simpan
          </Button>,
        ]}
      >
        <Row gutter={24}>
          {/* === KOLOM KIRI === */}
          <Col span={12}>
            {/* Nama Ruangan */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Nama Ruangan <span style={{ color: 'red' }}>*</span></Text>
              <Input
                value={formData.nama_ruangan}
                onChange={(e) => handleChange("nama_ruangan", e.target.value)}
                status={validationErrors.nama_ruangan ? 'error' : ''}
              />
              {/* PESAN ERROR SPESIFIK */}
              {validationErrors.nama_ruangan && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                  Nama ruangan wajib diisi.
                </Text>
              )}
            </div>

            {/* Kategori Ruangan */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Kategori <span style={{ color: 'red' }}>*</span></Text>
              <Select
                placeholder="Pilih kategori"
                value={formData.id_kategori_ruangan}
                onChange={(value) => handleChange("id_kategori_ruangan", value)}
                style={{ width: "100%" }}
                status={validationErrors.id_kategori_ruangan ? 'error' : ''}
              >
                {kategoriRuanganList.map((kat) => (
                  <Option key={kat.id_kategori_ruangan} value={kat.id_kategori_ruangan}>
                    {kat.nama_kategori}
                  </Option>
                ))}
              </Select>
              {/* PESAN ERROR SPESIFIK */}
              {validationErrors.id_kategori_ruangan && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                  Kategori wajib dipilih.
                </Text>
              )}
            </div>

            <Row gutter={16}>
              {/* Harga per Jam */}
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Harga per Jam <span style={{ color: 'red' }}>*</span></Text>
                  <InputNumber
                    value={formData.harga_per_jam}
                    onChange={(value) => handleChange("harga_per_jam", value)}
                    style={{ width: "100%" }}
                    min={0}
                    formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/Rp\s?|(,*)/g, '')}
                    status={validationErrors.harga_per_jam ? 'error' : ''}
                  />
                  {/* PESAN ERROR SPESIFIK */}
                  {validationErrors.harga_per_jam && (
                    <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                      Harga wajib diisi.
                    </Text>
                  )}
                </div>
              </Col>
              {/* Kapasitas */}
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Kapasitas <span style={{ color: 'red' }}>*</span></Text>
                  <InputNumber
                    value={formData.kapasitas}
                    onChange={(value) => handleChange("kapasitas", value)}
                    style={{ width: "100%" }}
                    min={1}
                    addonAfter="Org"
                    status={validationErrors.kapasitas ? 'error' : ''}
                  />
                  {/* PESAN ERROR SPESIFIK */}
                  {validationErrors.kapasitas && (
                    <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                      Kapasitas wajib diisi.
                    </Text>
                  )}
                </div>
              </Col>
            </Row>

            {/* Status Ketersediaan */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Status Ketersediaan</Text>
              <br />
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                checked={formData.status_ketersediaan === "Active"}
                onChange={(checked) => handleChange("status_ketersediaan", checked ? "Active" : "Inactive")}
              />
            </div>

            {/* Upload Gambar */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Gambar Ruangan</Text>
              <Upload
                beforeUpload={(file) => {
                  setFileGambar(file); // Simpan file di state
                  setPreviewImage(URL.createObjectURL(file)); // Buat preview URL
                  return false; // Hentikan upload otomatis AntDesign
                }}
                onRemove={() => {
                  setFileGambar(null);
                  if (previewImage) {
                    URL.revokeObjectURL(previewImage); // Bersihkan memori
                  }
                  setPreviewImage(null); // Hapus preview URL
                }}
                fileList={fileGambar ? [fileGambar] : []}
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
              </Upload>
              
              {/* --- LOGIKA PREVIEW GAMBAR --- */}
              {previewImage ? (
                // 1. Prioritas: Tampilkan preview gambar BARU
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Preview gambar baru:</Text><br />
                  <Image width={100} src={previewImage} />
                </div>
              ) : editingRuangan && formData.gambar_ruangan ? (
                // 2. Fallback: Tampilkan gambar LAMA (saat edit)
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Gambar saat ini:</Text><br />
                  <Image
                    width={100}
                    src={`${import.meta.env.VITE_BASE_URL}/static/${formData.gambar_ruangan}`}
                  />
                </div>
              ) : null}
              {/* --- AKHIR LOGIKA PREVIEW --- */}
            </div>
          </Col>

          {/* === KOLOM KANAN === */}
          <Col span={12}>
            {/* Deskripsi */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Deskripsi Ruangan</Text>
              <TextArea
                rows={4}
                value={formData.deskripsi_ruangan}
                onChange={(e) => handleChange("deskripsi_ruangan", e.target.value)}
              />
            </div>

            {/* Fitur Ruangan */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Fitur Ruangan</Text>
              <TextArea
                rows={4}
                value={formData.fitur_ruangan}
                onChange={(e) => handleChange("fitur_ruangan", e.target.value)}
                placeholder="Satu fitur per baris (cth:&#10;Wifi Cepat&#10;AC&#10;Proyektor)"
              />
            </div>
            
            {/* --- LOGIKA PAKET HARGA (SESUAI PERMINTAAN) --- */}
            {editingRuangan ? (
              // TAMPILKAN JIKA SEDANG EDIT
              <>
                <Divider>Kelola Paket Harga (Opsional)</Divider>
                <List
                  dataSource={paketHargaList}
                  bordered
                  size="small"
                  style={{ marginBottom: 12, maxHeight: 150, overflowY: 'auto' }}
                  locale={{ emptyText: "Belum ada paket harga" }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" onClick={() => {
                          setEditingPaket(item);
                          setNewPaket({ durasi_jam: item.durasi_jam, harga_paket: item.harga_paket });
                        }}>Edit</Button>,
                        <Popconfirm title="Yakin hapus paket?" onConfirm={() => handleDeletePaket(item.id_paket)}>
                          <Button type="link" danger size="small">Hapus</Button>
                        </Popconfirm>
                      ]}
                    >
                      <Text>{item.durasi_jam} Jam - Rp {item.harga_paket.toLocaleString('id-ID')}</Text>
                    </List.Item>
                  )}
                />
                
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    placeholder="Durasi (Jam)"
                    value={newPaket.durasi_jam}
                    onChange={(val) => setNewPaket({ ...newPaket, durasi_jam: val })}
                    min={1}
                    style={{ width: '35%' }}
                  />
                  <InputNumber
                    placeholder="Harga Paket"
                    value={newPaket.harga_paket}
                    onChange={(val) => setNewPaket({ ...newPaket, harga_paket: val })}
                    min={0}
                    style={{ width: '45%' }}
                    formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/Rp\s?|(,*)/g, '')}
                  />
                  <Button type="primary" onClick={handleSavePaket}>
                    {editingPaket ? "Update" : "Add"}
                  </Button>
                </Space.Compact>
                {editingPaket && (
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => {
                      setEditingPaket(null);
                      setNewPaket({ durasi_jam: "", harga_paket: "" });
                    }}
                    style={{ display: 'block', marginTop: 8 }}
                  >
                    Batal Edit
                  </Button>
                )}
              </>
            ) : (
              // TAMPILKAN JIKA SEDANG TAMBAH BARU
              <>
                <Divider>Kelola Paket Harga</Divider>
                <Alert
                  message="Catatan"
                  description="Anda dapat menambahkan dan mengelola paket harga (misal: 2 jam, 4 jam) setelah ruangan ini berhasil dibuat dan disimpan."
                  type="info"
                  showIcon
                />
              </>
            )}
            {/* --- AKHIR LOGIKA PAKET HARGA --- */}
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default RuanganTab;

