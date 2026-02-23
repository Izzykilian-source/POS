import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Space, notification,
    Popconfirm, Tooltip, InputNumber, DatePicker, TimePicker, Tag, Switch, Alert, Select
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getPromoAdmin, createPromo, updatePromo, deletePromo
} from "../../../../services/service";

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PromoTab = () => {
    const [open, setOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [searchText, setSearchText] = useState("");
    
    // ✅ Tambahkan default kategori_promo: "all"
    const [formData, setFormData] = useState({ 
        status_aktif: "inaktif", 
        syarat: "", 
        kategori_promo: "all" 
    });
    
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [filteredInfo, setFilteredInfo] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [api, contextHolder] = notification.useNotification();

    // --- Fungsi Notifikasi ---
    const showNotif = (type, title, desc) => {
        let icon = null;
        if (type === "success") icon = <CheckCircleOutlined style={{ color: "#52c41a" }} />;
        api[type]({
            message: title,
            description: desc,
            placement: "topRight",
            duration: 3,
            icon,
        });
    };

    // === Fetch data ===
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getPromoAdmin();
            if (res.status === 200 && res.data.message === "OK") {
                const promos = res.data.datas.map((item) => ({
                    key: item.id_promo,
                    ...item,
                }));
                setData(promos);
            }
        } catch (err) {
            console.error("Gagal fetch promo:", err);
            showNotif("error", "Gagal", "Gagal mengambil data promo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // === Search ===
    const filteredData = data.filter(
        (item) =>
            item.kode_promo?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.deskripsi_promo?.toLowerCase().includes(searchText.toLowerCase())
    );

    // === Kolom ===
    const getColumnSearchProps = (dataIndex, placeholder = "Cari...") => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={placeholder}
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
                    <Button
                        onClick={() => {
                            clearFilters();
                            confirm({ closeDropdown: true });
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
        ),
    });

    const columns = [
        { title: "ID", dataIndex: "id_promo", key: "id_promo", width: 65, sorter: (a, b) => a.id_promo - b.id_promo },
        {
            title: "Kode Promo",
            dataIndex: "kode_promo",
            key: "kode_promo",
            width: 150,
            render: (text) => <Text strong>{text}</Text>,
            ...getColumnSearchProps("kode_promo", "Cari kode promo..."),
        },
        // ✅ KOLOM BARU: KATEGORI
        {
            title: "Kategori",
            dataIndex: "kategori_promo",
            key: "kategori_promo",
            filters: [
                { text: "Ruangan", value: "room" },
                { text: "F&B", value: "fnb" },
                { text: "Semua", value: "all" },
            ],
            onFilter: (value, record) => record.kategori_promo === value,
            render: (cat) => {
                let color = "geekblue";
                let label = "SEMUA";
                if (cat === "room") { color = "blue"; label = "RUANGAN"; }
                if (cat === "fnb") { color = "orange"; label = "F&B"; }
                return <Tag color={color}>{label}</Tag>;
            }
        },
        {
            title: "Nilai Diskon",
            dataIndex: "nilai_diskon",
            key: "nilai_diskon",
            sorter: (a, b) => a.nilai_diskon - b.nilai_diskon,
            render: (val) =>
                Number(val).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }),
        },
        {
            title: "Syarat (JSON)",
            dataIndex: "syarat",
            key: "syarat",
            ellipsis: true,
            render: (syarat) => {
                if (!syarat) return "-";
                try {
                    const parsed = typeof syarat === 'string' ? JSON.parse(syarat) : syarat;
                    return <Text code style={{ fontSize: 11 }}>{JSON.stringify(parsed)}</Text>;
                } catch (e) {
                    return syarat;
                }
            }
        },
        {
            title: "Tanggal Berlaku",
            key: "tanggal",
            render: (_, record) =>
                `${dayjs(record.tanggal_mulai).format("DD/MM/YYYY")} - ${dayjs(
                    record.tanggal_selesai
                ).format("DD/MM/YYYY")}`,
            sorter: (a, b) => dayjs(a.tanggal_mulai).unix() - dayjs(b.tanggal_mulai).unix(),
        },
        {
            title: "Status",
            dataIndex: "status_aktif",
            key: "status_aktif",
            filters: [
                { text: "Aktif", value: "aktif" },
                { text: "Inaktif", value: "inaktif" },
            ],
            filteredValue: filteredInfo.status_aktif || null,
            onFilter: (value, record) => record.status_aktif === value,
            render: (status) => (
                <Tag color={status === "aktif" ? "green" : "red"}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Promo">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Promo">
                        <Popconfirm
                            title="Hapus Promo"
                            description="Yakin ingin menghapus promo ini?"
                            onConfirm={() => handleDelete(record.id_promo)}
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

    const handleTableChange = (pagination, filters) => {
        setFilteredInfo(filters);
    };

    const clearError = (field) => {
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        clearError(field);
    };

    const handleDateChange = (dates, dateStrings) => {
        setFormData({
            ...formData,
            tanggal_mulai: dateStrings[0],
            tanggal_selesai: dateStrings[1],
        });
        clearError("tanggal_mulai");
    };

    const handleTimeChange = (times, timeStrings) => {
        setFormData({
            ...formData,
            waktu_mulai: timeStrings[0] || null,
            waktu_selesai: timeStrings[1] || null,
        });
    };

    // === Helper: Validate JSON String ===
    const isValidJson = (str) => {
        if (!str) return true; // Kosong boleh (NULL)
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    // === CRUD ===
    const handleSave = async () => {
        const errors = {};
        if (!formData.kode_promo || formData.kode_promo.trim() === "") errors.kode_promo = true;
        if (!formData.nilai_diskon || formData.nilai_diskon <= 0) errors.nilai_diskon = true;
        if (!formData.tanggal_mulai) errors.tanggal_mulai = true;
        // ✅ Validasi Kategori
        if (!formData.kategori_promo) errors.kategori_promo = true;
        
        // Validasi JSON Syarat
        if (formData.syarat && !isValidJson(formData.syarat)) {
            errors.syarat = true;
            showNotif("error", "Format Salah", "Field Syarat harus dalam format JSON yang valid (contoh: {\"min_belanja\": 50000})");
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            if(!errors.syarat) showNotif("warning", "Validasi Gagal", "Harap isi semua bidang yang wajib diisi.");
            return;
        }

        setLoading(true);
        try {
            const payload = { 
                ...formData,
                syarat: formData.syarat ? formData.syarat : null
            };

            if (editingPromo) {
                const res = await updatePromo(editingPromo.id_promo, payload);
                if (res.status === 200) showNotif("success", "Promo Diperbarui", "Data promo berhasil diperbarui!");
            } else {
                const res = await createPromo(payload);
                if (res.status === 201) showNotif("success", "Promo Ditambahkan", "Data promo baru berhasil ditambahkan!");
            }
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save promo:", err);
            showNotif("error", "Gagal", "Terjadi kesalahan saat menyimpan promo.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_promo) => {
        setLoading(true);
        try {
            const res = await deletePromo(id_promo);
            if (res.status === 200) {
                showNotif("success", "Promo Dihapus", "Data promo berhasil dihapus!");
                await fetchData();
            } else {
                showNotif("error", "Gagal", res.data?.error || "Gagal menghapus promo");
            }
        } catch (err) {
            console.error("Error delete promo:", err);
            showNotif("error", "Gagal", "Terjadi kesalahan saat menghapus promo.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        
        let syaratString = "";
        if (promo.syarat) {
            try {
                syaratString = typeof promo.syarat === 'object' 
                    ? JSON.stringify(promo.syarat, null, 2) 
                    : promo.syarat;
            } catch (e) {
                syaratString = promo.syarat;
            }
        }

        // ✅ Pastikan kategori_promo terisi, fallback ke 'all' jika null
        setFormData({ 
            ...promo, 
            syarat: syaratString,
            kategori_promo: promo.kategori_promo || 'all' 
        });
        setValidationErrors({});
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        // ✅ Reset ke default value saat cancel
        setFormData({ status_aktif: "inaktif", syarat: "", kategori_promo: "all" });
        setEditingPromo(null);
        setValidationErrors({});
    };

    const handleAddClick = () => {
        setEditingPromo(null);
        // ✅ Reset ke default value saat add new
        setFormData({ status_aktif: "inaktif", syarat: "", kategori_promo: "all" });
        setValidationErrors({});
        setOpen(true);
    };

    const dateRangeValue =
        formData.tanggal_mulai && formData.tanggal_selesai
            ? [dayjs(formData.tanggal_mulai), dayjs(formData.tanggal_selesai)]
            : null;

    const timeRangeValue =
        formData.waktu_mulai && formData.waktu_selesai
            ? [dayjs(formData.waktu_mulai, "HH:mm:ss"), dayjs(formData.waktu_selesai, "HH:mm:ss")]
            : null;

    return (
        <div style={{ padding: "24px" }}>
            {contextHolder}
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1">
                    <Search
                        placeholder="Cari promo..."
                        allowClear
                        enterButton
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        size="large"
                    />
                </Col>
                <Col flex="none">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
                        Tambah Promo Baru
                    </Button>
                </Col>
            </Row>

            <Card style={{ borderRadius: "12px", overflowX: 'auto' }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "50", "100"],
                        onShowSizeChange: (c, size) => setPageSize(size),
                    }}
                    loading={loading}
                    scroll={{ x: 1000 }}
                    onChange={handleTableChange}
                    rowKey="key"
                />
            </Card>

            {/* === MODAL FORM === */}
            <Modal
                title={
                    <Space>
                        {editingPromo ? <EditOutlined /> : <PlusOutlined />}
                        {editingPromo ? "Edit Promo" : "Tambah Promo Baru"}
                    </Space>
                }
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                okText={editingPromo ? "Update" : "Simpan"}
                width={700}
                destroyOnClose
            >
                <div style={{ marginTop: "24px" }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>
                                    Kode Promo <span style={{ color: "red" }}>*</span>
                                </Text>
                                <Input
                                    placeholder="cth: SARAPANHEMAT"
                                    value={formData.kode_promo || ""}
                                    onChange={(e) => handleChange("kode_promo", e.target.value.toUpperCase())}
                                    style={{ marginTop: "8px" }}
                                    status={validationErrors.kode_promo ? 'error' : ''}
                                />
                                {validationErrors.kode_promo && (
                                    <Text type="danger" style={{ fontSize: 12 }}>Kode promo wajib diisi.</Text>
                                )}
                            </div>
                        </Col>
                        
                        {/* ✅ INPUT KATEGORI PROMO BARU */}
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>
                                    Kategori Promo <span style={{ color: "red" }}>*</span>
                                </Text>
                                <Select
                                    value={formData.kategori_promo}
                                    onChange={(val) => handleChange("kategori_promo", val)}
                                    style={{ marginTop: "8px", width: "100%" }}
                                    status={validationErrors.kategori_promo ? 'error' : ''}
                                >
                                    <Option value="all">Semua Transaksi</Option>
                                    <Option value="room">Khusus Ruangan</Option>
                                    <Option value="fnb">Khusus F&B</Option>
                                </Select>
                                {validationErrors.kategori_promo && (
                                    <Text type="danger" style={{ fontSize: 12 }}>Kategori wajib dipilih.</Text>
                                )}
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>
                                    Nilai Diskon (Rp) <span style={{ color: "red" }}>*</span>
                                </Text>
                                <InputNumber
                                    placeholder="cth: 5000"
                                    value={formData.nilai_diskon}
                                    onChange={(value) => handleChange("nilai_diskon", value)}
                                    style={{ marginTop: "8px", width: "100%" }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                    min={1}
                                    status={validationErrors.nilai_diskon ? 'error' : ''}
                                />
                                {validationErrors.nilai_diskon && (
                                    <Text type="danger" style={{ fontSize: 12 }}>Nilai diskon wajib diisi.</Text>
                                )}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>
                                    Tanggal Berlaku <span style={{ color: "red" }}>*</span>
                                </Text>
                                <RangePicker
                                    style={{ marginTop: "8px", width: "100%" }}
                                    onChange={handleDateChange}
                                    value={dateRangeValue}
                                    format="YYYY-MM-DD"
                                    status={validationErrors.tanggal_mulai ? 'error' : ''}
                                />
                                {validationErrors.tanggal_mulai && (
                                    <Text type="danger" style={{ fontSize: 12 }}>Tanggal berlaku wajib diisi.</Text>
                                )}
                            </div>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>Waktu Berlaku (Opsional)</Text>
                                <TimePicker.RangePicker
                                    style={{ marginTop: "8px", width: "100%" }}
                                    onChange={handleTimeChange}
                                    value={timeRangeValue}
                                    format="HH:mm:ss"
                                />
                            </div>
                        </Col>
                        {/* Space kosong agar rapi jika diperlukan, atau biarkan kosong */}
                    </Row>

                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Deskripsi</Text>
                        <TextArea
                            rows={2}
                            placeholder="Masukkan deskripsi singkat promo"
                            value={formData.deskripsi_promo || ""}
                            onChange={(e) => handleChange("deskripsi_promo", e.target.value)}
                            style={{ marginTop: "8px" }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <Space align="center" style={{ marginBottom: 8 }}>
                            <Text strong>Syarat & Ketentuan (Format JSON)</Text>
                            <Tooltip title='Contoh: {"min_transaction": 50000} atau {"min_durasi_jam": 3}. Kosongkan jika tidak ada.'>
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                        </Space>
                        <TextArea
                            rows={4}
                            placeholder='Contoh: {"min_durasi_jam": 3}'
                            value={formData.syarat || ""}
                            onChange={(e) => handleChange("syarat", e.target.value)}
                            style={{ fontFamily: 'monospace' }}
                            status={validationErrors.syarat ? 'error' : ''}
                        />
                        {validationErrors.syarat && (
                            <div style={{ marginTop: 4 }}>
                                <Text type="danger" style={{ fontSize: 12 }}>Format JSON tidak valid.</Text>
                            </div>
                        )}
                        <Alert 
                            message="Gunakan format JSON standar. Pastikan menggunakan tanda kutip dua." 
                            type="info" 
                            showIcon 
                            style={{ marginTop: 8, fontSize: 12 }} 
                        />
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <Text strong>Status <span style={{ color: "red" }}>*</span></Text>
                        <Switch
                            checkedChildren="Aktif"
                            unCheckedChildren="Inaktif"
                            checked={formData.status_aktif === "aktif"}
                            onChange={(checked) => handleChange("status_aktif", checked ? "aktif" : "inaktif")}
                            style={{ marginLeft: 16 }}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PromoTab;