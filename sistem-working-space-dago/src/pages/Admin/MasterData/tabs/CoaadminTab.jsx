import React, { useState, useEffect, useRef } from "react";
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
  notification,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getCoaAdmin,
  createCoaAdmin,
  updateCoaAdmin,
  deleteCoaAdmin,
} from "../../../../services/service"; // Sesuaikan path jika perlu

const { Text } = Typography;
const { Search, TextArea } = Input;

const CoaadminTab = () => {
  const [api, contextHolder] = notification.useNotification();
  const [open, setOpen] = useState(false);
  const [editingAkun, setEditingAkun] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(10); // Default ke 10
  const [validationErrors, setValidationErrors] = useState({});
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // === Notifikasi ===
  const showNotif = (type, title, description) => {
    api.open({
      message: (
        <Space>
          {type === "success" && <CheckCircleOutlined style={{ color: "#52c41a" }} />}
          {type === "error" && <DeleteOutlined style={{ color: "#ff4d4f" }} />}
          {type === "warning" && <ExclamationCircleOutlined style={{ color: "#faad14" }} />}
          <span>{title}</span>
        </Space>
      ),
      description: description,
      placement: "topRight",
      duration: 3,
      style: { borderRadius: 10, padding: 10 },
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCoaAdmin();
      if (res.status === 200 && res.data.message === "OK") {
        const akun = res.data.datas.map((item) => ({
          key: item.id_coa,
          ...item,
        }));
        setData(akun);
      }
    } catch (err) {
      console.error("Gagal fetch COA:", err);
      showNotif("error", "Gagal", "Gagal mengambil data Chart of Accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getColumnSearchProps = (dataIndex, displayName) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Cari ${displayName}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Cari
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? <Text mark>{text}</Text> : text,
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const columns = [
    {
      title: "ID Akun",
      dataIndex: "id_coa",
      key: "id_coa",
      width: 100,
      ...getColumnSearchProps("id_coa", "ID Akun"),
      sorter: (a, b) => a.id_coa - b.id_coa,
    },
    {
      title: "Kode Akun",
      dataIndex: "kode_akun",
      key: "kode_akun",
      width: 150,
      render: (text) => (
        <Space>
          <SolutionOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
      ...getColumnSearchProps("kode_akun", "Kode Akun"),
      sorter: (a, b) => a.kode_akun.localeCompare(b.kode_akun),
    },
    {
      title: "Nama Akun",
      dataIndex: "nama_akun",
      key: "nama_akun",
      ...getColumnSearchProps("nama_akun", "Nama Akun"),
      sorter: (a, b) => a.nama_akun.localeCompare(b.nama_akun),
    },
    {
      title: "Tipe Akun",
      dataIndex: "tipe_akun",
      key: "tipe_akun",
      width: 150,
      ...getColumnSearchProps("tipe_akun", "Tipe Akun"),
      sorter: (a, b) => a.tipe_akun.localeCompare(b.tipe_akun),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ...getColumnSearchProps("deskripsi", "Deskripsi"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Akun">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="Delete Akun">
            <Popconfirm
              title="Delete Akun"
              description="Yakin ingin menghapus akun ini?"
              onConfirm={() => handleDelete(record.id_coa)}
              okText="Yes"
              cancelText="No"
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
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    const errors = {};
    if (!formData.kode_akun?.trim()) errors.kode_akun = true;
    if (!formData.nama_akun?.trim()) errors.nama_akun = true;
    if (!formData.tipe_akun?.trim()) errors.tipe_akun = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotif("warning", "Validasi Gagal", "Harap isi semua bidang wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        kode_akun: formData.kode_akun,
        nama_akun: formData.nama_akun,
        tipe_akun: formData.tipe_akun,
        deskripsi: formData.deskripsi || null,
      };

      if (editingAkun) {
        const res = await updateCoaAdmin(editingAkun.id_coa, payload);
        if (res.status === 200)
          showNotif("success", "Akun Diperbarui", "Data akun berhasil diperbarui!");
      } else {
        const res = await createCoaAdmin(payload);
        if (res.status === 201)
          showNotif("success", "Akun Ditambahkan", "Data akun berhasil ditambahkan!");
      }

      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save COA:", err);
      showNotif("error", "Gagal", "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_coa) => {
    setLoading(true);
    try {
      const res = await deleteCoaAdmin(id_coa);
      if (res.status === 200) {
        showNotif("success", "Akun Dihapus", "Data akun berhasil dihapus!");
        await fetchData();
      } else {
        showNotif("error", "Gagal", res.data?.error || "Gagal menghapus akun.");
      }
    } catch (err) {
      console.error("Error delete akun:", err);
      showNotif("error", "Gagal", "Terjadi kesalahan saat menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAkun(null);
    setFormData({});
    setValidationErrors({});
    setOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingAkun(pkg);
    setFormData({ ...pkg });
    setValidationErrors({});
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({});
    setEditingAkun(null);
    setValidationErrors({});
  };

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}

      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Search
            placeholder="Cari nama akun, kode, atau tipe..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            Tambah Akun COA Baru
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px", overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={data.filter((item) =>
            (item.nama_akun.toLowerCase().includes(searchText.toLowerCase()) ||
             item.kode_akun.toLowerCase().includes(searchText.toLowerCase()) ||
             item.tipe_akun.toLowerCase().includes(searchText.toLowerCase()))
          )}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "50", "100"],
            onShowSizeChange: (_, size) => setPageSize(size),
          }}
          loading={loading}
          scroll={{ x: 1000 }}
          rowKey="key"
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingAkun ? <EditOutlined /> : <PlusOutlined />}{" "}
            {editingAkun ? "Edit Akun COA" : "Tambah Akun COA"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
        okText={editingAkun ? "Update" : "Tambah"}
        destroyOnClose
      >
        <div style={{ marginTop: "24px" }}>
          <Text strong>Kode Akun <span style={{ color: "red" }}>*</span></Text>
          <Input
            placeholder="Contoh: 4-100"
            value={formData.kode_akun || ""}
            onChange={(e) => handleChange("kode_akun", e.target.value)}
            style={{ marginTop: "8px" }}
            status={validationErrors.kode_akun ? "error" : ""}
          />
          {validationErrors.kode_akun && (
            <Text type="danger" style={{ fontSize: 12 }}>Kode akun wajib diisi.</Text>
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <Text strong>Nama Akun <span style={{ color: "red" }}>*</span></Text>
          <Input
            placeholder="Contoh: Pendapatan F&B"
            value={formData.nama_akun || ""}
            onChange={(e) => handleChange("nama_akun", e.target.value)}
            style={{ marginTop: "8px" }}
            status={validationErrors.nama_akun ? "error" : ""}
          />
          {validationErrors.nama_akun && (
            <Text type="danger" style={{ fontSize: 12 }}>Nama akun wajib diisi.</Text>
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <Text strong>Tipe Akun <span style={{ color: "red" }}>*</span></Text>
          <Input
            placeholder="Contoh: Pendapatan, Beban, Aset"
            value={formData.tipe_akun || ""}
            onChange={(e) => handleChange("tipe_akun", e.target.value)}
            style={{ marginTop: "8px" }}
            status={validationErrors.tipe_akun ? "error" : ""}
          />
          {validationErrors.tipe_akun && (
            <Text type="danger" style={{ fontSize: 12 }}>Tipe akun wajib diisi.</Text>
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <Text strong>Deskripsi</Text>
          <TextArea
            rows={3}
            placeholder="Masukkan deskripsi (opsional)"
            value={formData.deskripsi || ""}
            onChange={(e) =>
              handleChange("deskripsi", e.target.value)
            }
            style={{ marginTop: "8px" }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CoaadminTab;