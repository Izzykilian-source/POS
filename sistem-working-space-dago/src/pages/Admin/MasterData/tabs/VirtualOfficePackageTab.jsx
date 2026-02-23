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
    message,
    Popconfirm,
    Tooltip,
    InputNumber,
    Tag,
    Switch,
    notification
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    SolutionOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import {
    getPaketVOadmin,
    createPaketVO,
    updatePaketVO,
    deletePaketVO,
} from "../../../../services/service";

const { Text } = Typography;
const { Search, TextArea } = Input;

const VirtualOfficePackageTab = () => {
    const [api, contextHolder] = notification.useNotification();
    const [open, setOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({ status: "Active" });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
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
            const res = await getPaketVOadmin();
            if (res.status === 200 && res.data.message === "OK") {
                const paket = res.data.datas.map((item) => ({
                    key: item.id_paket_vo,
                    ...item,
                }));
                setData(paket);
            }
        } catch (err) {
            console.error("Gagal fetch paket VO:", err);
            showNotif("error", "Gagal", "Gagal mengambil data paket virtual office");
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
            title: "ID Paket",
            dataIndex: "id_paket_vo",
            key: "id_paket_vo",
            width: 100,
            ...getColumnSearchProps("id_paket_vo", "ID Paket"),
        },
        {
            title: "Nama Paket",
            dataIndex: "nama_paket",
            key: "nama_paket",
            render: (text) => (
                <Space>
                    <SolutionOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
            ...getColumnSearchProps("nama_paket", "Nama Paket"),
        },
        {
            title: "Harga",
            dataIndex: "harga",
            key: "harga",
            render: (text) => `Rp ${new Intl.NumberFormat("id-ID").format(text || 0)}`,
            sorter: (a, b) => a.harga - b.harga,
            ...getColumnSearchProps("harga", "Harga"),
        },
        {
            title: "Durasi (Hari)",
            dataIndex: "durasi",
            key: "durasi",
            sorter: (a, b) => a.durasi - b.durasi,
            ...getColumnSearchProps("durasi", "Durasi"),
        },
        {
            title: "Benefit Meeting Room",
            dataIndex: "benefit_jam_meeting_room_per_bulan",
            key: "benefit_jam_meeting_room_per_bulan",
            render: (text) => `${text || 0} jam/bulan`,
            sorter: (a, b) =>
                a.benefit_jam_meeting_room_per_bulan -
                b.benefit_jam_meeting_room_per_bulan,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "Active" ? "green" : "red"}>
                    {status ? status.toUpperCase() : "INACTIVE"}
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
                    <Tooltip title="Edit Paket">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            style={{ color: "#1890ff" }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Paket">
                        <Popconfirm
                            title="Delete Paket"
                            description="Yakin ingin menghapus paket ini?"
                            onConfirm={() => handleDelete(record.id_paket_vo)}
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
        if (!formData.nama_paket?.trim()) errors.nama_paket = true;
        if (formData.harga == null || formData.harga < 0) errors.harga = true;
        if (formData.durasi == null || formData.durasi <= 0) errors.durasi = true;

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            showNotif("warning", "Validasi Gagal", "Harap isi semua bidang wajib diisi!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nama_paket: formData.nama_paket,
                harga: formData.harga,
                durasi: formData.durasi,
                benefit_jam_meeting_room_per_bulan:
                    formData.benefit_jam_meeting_room_per_bulan || 0,
                benefit_jam_working_space_per_bulan:
                    formData.benefit_jam_working_space_per_bulan || 0,
                deskripsi_layanan: formData.deskripsi_layanan || null,
                status: formData.status,
            };

            if (editingPackage) {
                const res = await updatePaketVO(editingPackage.id_paket_vo, payload);
                if (res.status === 200)
                    showNotif("success", "Paket Diperbarui", "Data paket berhasil diperbarui!");
            } else {
                const res = await createPaketVO(payload);
                if (res.status === 201)
                    showNotif("success", "Paket Ditambahkan", "Data paket berhasil ditambahkan!");
            }

            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save paket VO:", err);
            showNotif("error", "Gagal", "Terjadi kesalahan saat menyimpan data.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_paket_vo) => {
        setLoading(true);
        try {
            const res = await deletePaketVO(id_paket_vo);
            if (res.status === 200) {
                showNotif("success", "Paket Dihapus", "Data paket berhasil dihapus!");
                await fetchData();
            } else {
                showNotif("error", "Gagal", res.data?.error || "Gagal menghapus paket.");
            }
        } catch (err) {
            console.error("Error delete paket:", err);
            showNotif("error", "Gagal", "Terjadi kesalahan saat menghapus data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingPackage(null);
        setFormData({ status: "Active" });
        setValidationErrors({});
        setOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setFormData({ ...pkg });
        setValidationErrors({});
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ status: "Active" });
        setEditingPackage(null);
        setValidationErrors({});
    };

    return (
        <div style={{ padding: "24px" }}>
            {contextHolder}

            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="auto">
                    <Search
                        placeholder="Cari nama paket..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                        Tambah Paket VO Baru
                    </Button>
                </Col>
            </Row>

            <Card style={{ borderRadius: "12px", overflowX: "auto" }}>
                <Table
                    columns={columns}
                    dataSource={data.filter((item) =>
                        item.nama_paket.toLowerCase().includes(searchText.toLowerCase())
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
                        {editingPackage ? <EditOutlined /> : <PlusOutlined />}{" "}
                        {editingPackage ? "Edit Paket Virtual Office" : "Tambah Paket Virtual Office"}
                    </Space>
                }
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                okText={editingPackage ? "Update" : "Tambah"}
                destroyOnClose
            >
                <div style={{ marginTop: "24px" }}>
                    <Text strong>Nama Paket <span style={{ color: "red" }}>*</span></Text>
                    <Input
                        placeholder="Contoh: Paket 6 Bulan"
                        value={formData.nama_paket || ""}
                        onChange={(e) => handleChange("nama_paket", e.target.value)}
                        style={{ marginTop: "8px" }}
                        status={validationErrors.nama_paket ? "error" : ""}
                    />
                    {validationErrors.nama_paket && (
                        <Text type="danger" style={{ fontSize: 12 }}>Nama paket wajib diisi.</Text>
                    )}
                </div>

                <div style={{ marginTop: "16px" }}>
                    <Text strong>Harga (Rp) <span style={{ color: "red" }}>*</span></Text>
                    <InputNumber
                        placeholder="Contoh: 1750000"
                        value={formData.harga}
                        onChange={(value) => handleChange("harga", value)}
                        style={{ marginTop: "8px", width: "100%" }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        min={0}
                        status={validationErrors.harga ? "error" : ""}
                    />
                    {validationErrors.harga && (
                        <Text type="danger" style={{ fontSize: 12 }}>Harga wajib diisi (minimal 0).</Text>
                    )}
                </div>

                <div style={{ marginTop: "16px" }}>
                    <Text strong>Durasi (Hari) <span style={{ color: "red" }}>*</span></Text>
                    <InputNumber
                        placeholder="Contoh: 180"
                        value={formData.durasi}
                        onChange={(value) => handleChange("durasi", value)}
                        style={{ marginTop: "8px", width: "100%" }}
                        min={1}
                        status={validationErrors.durasi ? "error" : ""}
                    />
                    {validationErrors.durasi && (
                        <Text type="danger" style={{ fontSize: 12 }}>Durasi wajib diisi (minimal 1 hari).</Text>
                    )}
                </div>

                <div style={{ marginTop: "16px" }}>
                    <Text strong>Benefit Jam Meeting Room per Bulan</Text>
                    <InputNumber
                        placeholder="Contoh: 4"
                        value={formData.benefit_jam_meeting_room_per_bulan}
                        onChange={(value) =>
                            handleChange("benefit_jam_meeting_room_per_bulan", value)
                        }
                        style={{ marginTop: "8px", width: "100%" }}
                        min={0}
                    />
                </div>

                <div style={{ marginTop: "16px" }}>
                    <Text strong>Benefit Jam Working Space per Bulan</Text>
                    <InputNumber
                        placeholder="Contoh: 8"
                        value={formData.benefit_jam_working_space_per_bulan}
                        onChange={(value) =>
                            handleChange("benefit_jam_working_space_per_bulan", value)
                        }
                        style={{ marginTop: "8px", width: "100%" }}
                        min={0}
                    />
                </div>

                <div style={{ marginTop: "16px" }}>
                    <Text strong>Deskripsi Layanan</Text>
                    <TextArea
                        rows={3}
                        placeholder="Masukkan deskripsi layanan (opsional)"
                        value={formData.deskripsi_layanan || ""}
                        onChange={(e) =>
                            handleChange("deskripsi_layanan", e.target.value)
                        }
                        style={{ marginTop: "8px" }}
                    />
                </div>

                <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <Text strong>Status Paket</Text>
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

export default VirtualOfficePackageTab;
