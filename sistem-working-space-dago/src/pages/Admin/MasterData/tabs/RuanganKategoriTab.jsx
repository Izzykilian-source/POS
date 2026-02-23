import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Input, Typography, Row, Col, Card, Space, Popconfirm, Tooltip,
  Switch, Tag, Upload, Image, notification,
  Select // <-- IMPORT BARU
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UploadOutlined, AppstoreOutlined, CheckCircleOutlined, ExclamationCircleFilled, 
  CloseCircleFilled, BookOutlined // <-- IMPORT BARU
} from "@ant-design/icons";
import {
  getKategoriRuangan, createKategoriRuangan, updateKategoriRuangan, deleteKategoriRuangan,
  getCoaAdmin // <-- IMPORT BARU
} from "../../../../services/service";

const { Text } = Typography;
const { Search, TextArea } = Input;
const { Option } = Select; // <-- DEFINISI BARU

// --- Gunakan URL dinamis ---
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL.replace('/api/v1', '')}/static/`;

const RuanganKategoriTab = () => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({ status: 'Active' });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [fileList, setFileList] = useState([]);
  const [validationError, setValidationError] = useState(null);
  
  const [coaList, setCoaList] = useState([]); // <-- STATE BARU: Untuk dropdown COA

  // 🔔 Notification system
  const [api, contextHolder] = notification.useNotification();

  const openNotification = (type, message, description) => {
    const icons = {
      success: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      error: <CloseCircleFilled style={{ color: "#ff4d4f" }} />,
      warning: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
    };

    api.open({
      message,
      description,
      icon: icons[type],
      placement: "topRight",
      duration: 3,
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getKategoriRuangan();
      if (res.status === 200 && res.data.message === "OK") {
        const kategori = res.data.datas.map((item) => ({
          key: item.id_kategori_ruangan,
          ...item, // Ini sudah termasuk id_coa, kode_akun, nama_akun dari API
        }));
        setData(kategori);
      }
    } catch (err) {
      console.error("Gagal fetch kategori ruangan:", err);
      openNotification("error", "Gagal Memuat Data", "Gagal mengambil data kategori ruangan.");
    } finally {
      setLoading(false);
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
      openNotification("error", "Kesalahan", "Gagal memuat data Chart of Accounts.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchCoa(); // <-- PANGGIL FUNGSI BARU
  }, []);

  const filteredData = data.filter(
    (item) =>
      item.nama_kategori.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
  );

  const uniqueFilters = (field) =>
    [...new Set(data.map((item) => item[field]).filter(Boolean))].map((value) => ({
      text: value,
      value,
    }));

  const columns = [
    {
      title: "Gambar",
      dataIndex: "gambar_kategori_ruangan",
      key: "gambar_kategori_ruangan",
      width: 120,
      render: (filename) =>
        filename ? (
          <Image
            width={80}
            src={`${UPLOAD_URL}${filename}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/80?text=Error";
            }}
          />
        ) : (
          <Text type="secondary">No Image</Text>
        ),
    },
    {
      title: "ID",
      dataIndex: "id_kategori_ruangan",
      key: "id_kategori_ruangan",
      width: 80,
      sorter: (a, b) => a.id_kategori_ruangan - b.id_kategori_ruangan,
    },
    {
      title: "Nama Kategori",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      filters: uniqueFilters("nama_kategori"),
      onFilter: (value, record) =>
        record.nama_kategori && record.nama_kategori.indexOf(value) === 0,
      render: (text) => (
        <Space>
          <AppstoreOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.nama_kategori.localeCompare(b.nama_kategori),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ellipsis: true,
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
      filters: uniqueFilters("nama_akun"),
      filterSearch: true,
      onFilter: (value, record) =>
        record.nama_akun?.toLowerCase().includes(value.toLowerCase()) || false,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Kategori">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Kategori">
            <Popconfirm
              title="Yakin ingin menghapus kategori ini?"
              description="Menghapus kategori dapat mempengaruhi ruangan terkait."
              onConfirm={() =>
                handleDelete(record.id_kategori_ruangan)
              }
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === "nama_kategori" && value.trim() !== "") {
      setValidationError(null);
    }
  };

  const handleSave = async () => {
    if (!formData.nama_kategori || formData.nama_kategori.trim() === "") {
      setValidationError("Nama Kategori wajib diisi.");
      openNotification("warning", "Validasi Gagal", "Harap isi nama kategori terlebih dahulu.");
      return;
    }

    setValidationError(null);
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      // --- MODIFIKASI: Pastikan id_coa dikirim sebagai 'null' jika tidak ada ---
      if (key === 'id_coa') {
         formDataToSend.append(key, formData[key] ? formData[key] : 'null');
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formDataToSend.append("gambar_kategori_ruangan", fileList[0].originFileObj);
    }

    try {
      if (editingCategory) {
        const res = await updateKategoriRuangan(
          editingCategory.id_kategori_ruangan,
          formDataToSend
        );
        if (res.status === 200) {
          openNotification("success", "Kategori Diperbarui", "Data kategori berhasil diperbarui.");
        }
      } else {
        const res = await createKategoriRuangan(formDataToSend);
        if (res.status === 201) {
          openNotification("success", "Kategori Ditambahkan", "Data kategori baru berhasil ditambahkan.");
        }
      }
      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save kategori ruangan:", err);
      const errorMsg = err.response?.data?.error || "Gagal menyimpan kategori";
      openNotification("error", "Gagal Menyimpan", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_kategori) => {
    try {
      const res = await deleteKategoriRuangan(id_kategori);
      if (res.status === 200) {
        openNotification("success", "Kategori Dihapus", "Data kategori berhasil dihapus.");
        fetchData();
      }
    } catch (err) {
      console.error("Gagal menghapus kategori:", err);
      const errorMsg = err.response?.data?.error || "Gagal menghapus kategori";
      openNotification("error", "Gagal Menghapus", errorMsg);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ status: "Active" });
    setFileList([]);
    setValidationError(null);
    setOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    // formData sudah termasuk id_coa dari fetch
    setFormData(record); 
    if (record.gambar_kategori_ruangan) {
      setFileList([
        {
          uid: "-1",
          name: record.gambar_kategori_ruangan,
          status: "done",
          url: `${UPLOAD_URL}${record.gambar_kategori_ruangan}`,
        },
      ]);
    } else {
      setFileList([]);
    }
    setValidationError(null);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({ status: "Active" });
    setEditingCategory(null);
    setFileList([]);
    setValidationError(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <Row
        gutter={[16, 16]}
        align="middle"
        justify="space-between"
        style={{ marginBottom: 24 }}
      >
        <Col flex="1">
          <Search
            placeholder="Cari kategori ruangan..."
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
        </Col>
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            Tambah Kategori
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px", overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            onShowSizeChange: (c, size) => setPageSize(size),
          }}
          scroll={{ x: 1200 }} // <-- Perbesar scroll x
        />
      </Card>

      <Modal
        title={editingCategory ? "Edit Kategori Ruangan" : "Tambah Kategori Ruangan"}
        open={open}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
        destroyOnClose
      >
        <div style={{ marginTop: 24 }}>
          <Text strong>
            Nama Kategori <span style={{ color: "red" }}>*</span>
          </Text>
          <Input
            value={formData.nama_kategori || ""}
            onChange={(e) => handleChange("nama_kategori", e.target.value)}
            style={{ marginTop: 8 }}
            status={validationError ? "error" : ""}
          />
          {validationError && (
            <Text
              type="danger"
              style={{ fontSize: 12, marginTop: 2, display: "block" }}
            >
              {validationError}
            </Text>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <Text strong>Deskripsi</Text>
          <TextArea
            rows={3}
            value={formData.deskripsi || ""}
            onChange={(e) => handleChange("deskripsi", e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        {/* --- FORM ITEM BARU: DROPDOWN COA --- */}
        <div style={{ marginTop: 16 }}>
          <Text strong>Akun COA (Opsional)</Text>
          <Select
            placeholder="Pilih akun COA"
            value={formData.id_coa} // <-- Bind ke formData.id_coa
            onChange={(value) => handleChange("id_coa", value)} // <-- Gunakan handleChange
            style={{ width: "100%", marginTop: 8 }}
            showSearch
            allowClear
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
        </div>


        <div style={{ marginTop: 16 }}>
          <Text strong>Gambar Kategori</Text>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={() => false}
            maxCount={1}
            style={{ marginTop: 8 }}
            accept="image/png, image/jpeg"
          >
            {fileList.length < 1 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginTop: 4 }}
          >
            (JPG/PNG, Max 2MB).
          </Text>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Text strong>Status</Text>
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            checked={formData.status === "Active"}
            onChange={(checked) =>
              handleChange("status", checked ? "Active" : "Inactive")
            }
          />
        </div>
      </Modal>
    </div>
  );
};

export default RuanganKategoriTab;