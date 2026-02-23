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
  message,
  Popconfirm,
  Tooltip,
  InputNumber,
  Tag,
  Upload,
  Image,
  Switch,
  notification,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getEventSpacesAdmin,
  createEventSpace,
  updateEventSpace,
  deleteEventSpace,
} from "../../../../services/service";

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL.replace("/api/v1", "")}/static/`;

const EventSpacesTab = () => {
  const [open, setOpen] = useState(false);
  const [editingEventSpace, setEditingEventSpace] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({ status_ketersediaan: "Active" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [fileList, setFileList] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [api, contextHolder] = notification.useNotification();

  const showNotif = (type, title, desc) => {
    let icon;
    switch (type) {
      case "success":
        icon = <CheckCircleOutlined style={{ color: "#52c41a" }} />;
        break;
      case "error":
        icon = <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
        break;
      case "warning":
        icon = <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
        break;
      default:
        icon = null;
    }

    api.open({
      message: title,
      description: desc,
      icon,
      placement: "topRight",
      duration: 3,
      style: {
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        background: "#fff",
      },
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEventSpacesAdmin();
      if (res.status === 200 && res.data.message === "OK") {
        const eventSpaces = res.data.datas.map((item) => ({
          ...item,
          key: item.id_event_space,
        }));
        setData(eventSpaces);
      }
    } catch (err) {
      console.error("Gagal fetch event spaces:", err);
      showNotif("error", "Gagal Mengambil Data", "Tidak dapat memuat data event space dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) =>
    item.nama_event_space.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatRupiah = (number) => {
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const columns = [
    {
      title: "Gambar",
      dataIndex: "gambar_ruangan",
      key: "gambar_ruangan",
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
      dataIndex: "id_event_space",
      key: "id_event_space",
      width: 80,
      sorter: (a, b) => a.id_event_space - b.id_event_space,
    },
    {
      title: "Nama Event Space",
      dataIndex: "nama_event_space",
      key: "nama_event_space",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Cari nama..."
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Cari
            </Button>
            <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <FilterOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record.nama_event_space.toString().toLowerCase().includes(value.toLowerCase()),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Harga Paket",
      dataIndex: "harga_paket",
      key: "harga_paket",
      sorter: (a, b) => a.harga_paket - b.harga_paket,
      render: (text) => formatRupiah(text),
    },
    {
      title: "Kapasitas",
      dataIndex: "kapasitas",
      key: "kapasitas",
      sorter: (a, b) => a.kapasitas - b.kapasitas,
      render: (text) => (text ? `${text} orang` : "-"),
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
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Event Space">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Event Space">
            <Popconfirm
              title="Hapus Event Space"
              description="Yakin ingin menghapus data ini?"
              onConfirm={() => handleDelete(record.id_event_space)}
              okText="Ya"
              cancelText="Tidak"
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
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const handleSave = async () => {
    const errors = {};
    if (!formData.nama_event_space?.trim()) errors.nama_event_space = true;
    if (!formData.harga_paket || formData.harga_paket <= 0) errors.harga_paket = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotif("warning", "Validasi Gagal", "Harap isi semua bidang yang wajib diisi (ditandai *).");
      return;
    }

    setValidationErrors({});
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formDataToSend.append("gambar_ruangan", fileList[0].originFileObj);
    } else if (editingEventSpace?.gambar_ruangan) {
      formDataToSend.append("gambar_ruangan_existing", editingEventSpace.gambar_ruangan);
    }

    try {
      if (editingEventSpace) {
        const res = await updateEventSpace(editingEventSpace.id_event_space, formDataToSend);
        if (res.status === 200) {
          showNotif("success", "Event Space Diperbarui", "Data event space berhasil diperbarui.");
        }
      } else {
        const res = await createEventSpace(formDataToSend);
        if (res.status === 201) {
          showNotif("success", "Event Space Ditambahkan", "Data event space baru berhasil ditambahkan.");
        }
      }
      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save:", err);
      showNotif("error", "Gagal Menyimpan", "Terjadi kesalahan pada server saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_event_space) => {
    setLoading(true);
    try {
      const res = await deleteEventSpace(id_event_space);
      if (res.status === 200) {
        showNotif("success", "Event Space Dihapus", "Data event space berhasil dihapus.");
        await fetchData();
      } else {
        showNotif("error", "Gagal Menghapus", res.data?.error || "Terjadi kesalahan saat menghapus data.");
      }
    } catch (err) {
      console.error("Error delete:", err);
      showNotif("error", "Error", "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingEventSpace(record);
    setFormData(record);
    setFileList(
      record.gambar_ruangan
        ? [
            {
              uid: "-1",
              name: record.gambar_ruangan,
              status: "done",
              url: `${UPLOAD_URL}${record.gambar_ruangan}`,
            },
          ]
        : []
    );
    setValidationErrors({});
    setOpen(true);
  };

  const handleAdd = () => {
    setEditingEventSpace(null);
    setFormData({ status_ketersediaan: "Active" });
    setFileList([]);
    setValidationErrors({});
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({ status_ketersediaan: "Active" });
    setEditingEventSpace(null);
    setFileList([]);
    setValidationErrors({});
  };

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}

      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1">
          <Search
            placeholder="Cari event space..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col flex="none">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            Tambahkan Event Space
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px", overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "50", "100"],
            onShowSizeChange: (current, size) => setPageSize(size),
          }}
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingEventSpace ? <EditOutlined /> : <PlusOutlined />}
            {editingEventSpace ? "Edit Event Space" : "Tambah Event Space"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
        okText={editingEventSpace ? "Update" : "Simpan"}
        width={600}
        destroyOnClose
      >
        <div style={{ marginTop: 24 }}>
          <Text strong>
            Nama Event Space <span style={{ color: "red" }}>*</span>
          </Text>
          <Input
            placeholder="Cth: Aula Serbaguna"
            value={formData.nama_event_space || ""}
            onChange={(e) => handleChange("nama_event_space", e.target.value)}
            style={{ marginTop: 8 }}
            status={validationErrors.nama_event_space ? "error" : ""}
          />
          {validationErrors.nama_event_space && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: "block" }}>
              Nama event space wajib diisi.
            </Text>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Text strong>Deskripsi</Text>
          <TextArea
            rows={3}
            placeholder="Masukkan deskripsi singkat"
            value={formData.deskripsi_event_space || ""}
            onChange={(e) => handleChange("deskripsi_event_space", e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginTop: 16 }}>
              <Text strong>
                Harga Paket (Rp) <span style={{ color: "red" }}>*</span>
              </Text>
              <InputNumber
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Cth: 1500000"
                value={formData.harga_paket}
                onChange={(value) => handleChange("harga_paket", value)}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                min={1}
                status={validationErrors.harga_paket ? "error" : ""}
              />
              {validationErrors.harga_paket && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: "block" }}>
                  Harga wajib diisi (minimal 1).
                </Text>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginTop: 16 }}>
              <Text strong>Kapasitas (Orang)</Text>
              <InputNumber
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Cth: 50"
                value={formData.kapasitas}
                min={1}
                onChange={(value) => handleChange("kapasitas", value)}
              />
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Text strong>Gambar Ruangan</Text>
          <Upload
            listType="picture"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/png, image/jpeg"
          >
            <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
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
          <Text strong>Status Ketersediaan</Text>
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            checked={formData.status_ketersediaan === "Active"}
            onChange={(checked) =>
              handleChange("status_ketersediaan", checked ? "Active" : "Inactive")
            }
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Text strong>Fitur Ruangan</Text>
          <TextArea
            rows={3}
            placeholder="Cth: free wifi, proyektor, sound system"
            value={formData.fitur_ruangan || ""}
            onChange={(e) => handleChange("fitur_ruangan", e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EventSpacesTab;
