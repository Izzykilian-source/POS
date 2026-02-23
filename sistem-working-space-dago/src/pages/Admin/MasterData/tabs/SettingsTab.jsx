import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Form, Input, Space,
    Popconfirm, Typography, Row, Col, notification, Card, Tag, Switch, Spin
} from "antd";
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, 
    CheckCircleOutlined, CloseCircleOutlined, SettingOutlined, PercentageOutlined
} from "@ant-design/icons";
import {
    getSettings, createSetting, updateSetting, deleteSetting
} from "../../../../services/service"; // Sesuaikan path import

const { Text, Title } = Typography;
const { TextArea } = Input;

const SettingsTab = () => {
    const [settingsList, setSettingsList] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State untuk Switch Pajak Cepat
    const [isTaxActive, setIsTaxActive] = useState(false);
    const [taxLoading, setTaxLoading] = useState(false);

    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

    const [api, contextHolder] = notification.useNotification();

    const openNotif = (type, title, desc) => {
        api[type]({
            message: title,
            description: desc,
            placement: "topRight",
            duration: 3,
            icon: type === "success" ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
            ) : (
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            ),
        });
    };

    const fetchSettingsData = async () => {
        setLoading(true);
        try {
            const res = await getSettings();
            if (res.status === 200) {
                setSettingsList(res.data.datas);
                
                // --- Logika untuk membaca status Pajak untuk Switch ---
                const taxSetting = res.data.datas.find(item => item.key === 'PAJAK_FNB_PERSEN');
                if (taxSetting && parseFloat(taxSetting.value) > 0) {
                    setIsTaxActive(true);
                } else {
                    setIsTaxActive(false);
                }
                // ------------------------------------------------------
                
            } else {
                openNotif("error", "Gagal Memuat", "Gagal memuat konfigurasi settings.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettingsData();
    }, []);

    // Filter data di client-side
    const filteredData = settingsList.filter(item => 
        item.key.toLowerCase().includes(searchText.toLowerCase()) ||
        item.value.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
    );

    // --- FUNGSI BARU: Handle Switch Pajak ---
    const handleTaxToggle = async (checked) => {
        setTaxLoading(true);
        try {
            const newValue = checked ? "10.00" : "0.00";
            const desc = "Persentase Pajak untuk Transaksi F&B di POS Kasir";
            
            // Cek apakah key PAJAK_FNB_PERSEN sudah ada di database
            const isTaxExist = settingsList.some(item => item.key === 'PAJAK_FNB_PERSEN');
            
            let res;
            if (isTaxExist) {
                res = await updateSetting('PAJAK_FNB_PERSEN', { value: newValue, deskripsi: desc });
            } else {
                res = await createSetting({ key: 'PAJAK_FNB_PERSEN', value: newValue, deskripsi: desc });
            }

            if (res.status === 200 || res.status === 201) {
                setIsTaxActive(checked);
                openNotif("success", "Berhasil", `Pajak Kasir berhasil ${checked ? 'Diaktifkan (10%)' : 'Dinonaktifkan (0%)'}.`);
                fetchSettingsData(); // Refresh tabel di bawahnya
            } else {
                throw new Error("Gagal menyimpan ke server");
            }
        } catch (error) {
            openNotif("error", "Gagal", "Terjadi kesalahan saat mengubah status pajak.");
            setIsTaxActive(!checked); // Kembalikan posisi switch
        } finally {
            setTaxLoading(false);
        }
    };
    // ----------------------------------------

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue({
            key: record.key,
            value: record.value,
            deskripsi: record.deskripsi
        });
        setOpen(true);
    };

    const handleDelete = async (key) => {
        try {
            setLoading(true);
            const res = await deleteSetting(key);
            if (res.status === 200) {
                openNotif("success", "Berhasil", "Setting berhasil dihapus.");
                fetchSettingsData();
            } else {
                openNotif("error", "Gagal", res.data.message || "Gagal menghapus setting.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);
            try {
                let res;
                if (editingItem) {
                    res = await updateSetting(editingItem.key, {
                        value: values.value,
                        deskripsi: values.deskripsi
                    });
                } else {
                    res = await createSetting(values);
                }

                if (res.status === 200 || res.status === 201) {
                    openNotif(
                        "success", 
                        editingItem ? "Diperbarui" : "Ditambahkan",
                        editingItem ? "Setting berhasil diperbarui!" : "Setting baru berhasil dibuat!"
                    );
                    setOpen(false);
                    fetchSettingsData();
                } else {
                    openNotif("error", "Gagal", res.data.message || "Operasi gagal.");
                }
            } catch (error) {
                openNotif("error", "Kesalahan", error.message);
            } finally {
                setLoading(false);
            }
        });
    };

    const columns = [
        {
            title: "No",
            key: "no",
            render: (_, __, index) => index + 1,
            width: 60,
        },
        {
            title: "Key (Kunci)",
            dataIndex: "key",
            key: "key",
            width: 200,
            render: text => <Tag color="blue" style={{ fontSize: '14px', padding: '5px 10px' }}>{text}</Tag>,
            sorter: (a, b) => a.key.localeCompare(b.key),
        },
        {
            title: "Value (Nilai)",
            dataIndex: "value",
            key: "value",
            width: 250,
            render: text => <Text strong>{text}</Text>,
        },
        {
            title: "Deskripsi",
            dataIndex: "deskripsi",
            key: "deskripsi",
            render: text => <Text type="secondary">{text || "-"}</Text>,
        },
        {
            title: "Aksi",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="default" 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    {/* Cegah user menghapus key penting seperti pajak dari tombol ini */}
                    <Popconfirm
                        title="Hapus setting ini?"
                        description="Tindakan ini mungkin mempengaruhi fitur aplikasi."
                        onConfirm={() => handleDelete(record.key)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                        disabled={record.key === 'PAJAK_FNB_PERSEN'}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />} disabled={record.key === 'PAJAK_FNB_PERSEN'}>
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            {contextHolder}
            
            {/* KARTU PENGATURAN CEPAT (SHORTCUT) */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={12}>
                    <Spin spinning={taxLoading}>
                        <Card 
                            bordered={false} 
                            style={{ 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                                borderRadius: '12px',
                                borderLeft: `5px solid ${isTaxActive ? '#10b981' : '#d9d9d9'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '50%' }}>
                                        <PercentageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    </div>
                                    <div>
                                        <Title level={5} style={{ margin: 0 }}>Pajak Transaksi Kasir</Title>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                            Aktifkan untuk menambahkan pajak otomatis pada transaksi F&B.
                                        </Text>
                                    </div>
                                </div>
                                <Switch 
                                    checked={isTaxActive} 
                                    onChange={handleTaxToggle} 
                                    checkedChildren="AKTIF" 
                                    unCheckedChildren="MATI"
                                    style={{ backgroundColor: isTaxActive ? '#10b981' : undefined }}
                                />
                            </div>
                        </Card>
                    </Spin>
                </Col>
            </Row>

            {/* TABEL MANAJEMEN SETTINGS LENGKAP */}
            <Card title={<><SettingOutlined /> Manajemen System Settings</>} bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Input 
                            placeholder="Cari Setting..." 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }} 
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Tambah Setting
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="key"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={editingItem ? "Edit Setting" : "Tambah Setting Baru"}
                open={open}
                onCancel={() => setOpen(false)}
                onOk={handleOk}
                confirmLoading={loading}
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        label="Key (Kunci Unik)"
                        name="key"
                        rules={[
                            { required: true, message: "Key wajib diisi" },
                            { pattern: /^[A-Z0-9_]+$/, message: "Gunakan huruf kapital, angka, atau underscore (_)" }
                        ]}
                        tooltip="Digunakan oleh sistem code untuk mengidentifikasi setting. Contoh: PAJAK_PPN, HARGA_DEFAULT"
                    >
                        <Input 
                            placeholder="Cth: PAJAK_FNB_PERSEN" 
                            disabled={!!editingItem} 
                            style={{ textTransform: 'uppercase' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Value (Nilai)"
                        name="value"
                        rules={[{ required: true, message: "Value wajib diisi" }]}
                    >
                        <Input placeholder="Cth: 10 atau aktif" />
                    </Form.Item>

                    <Form.Item
                        label="Deskripsi"
                        name="deskripsi"
                    >
                        <TextArea rows={3} placeholder="Jelaskan fungsi setting ini..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SettingsTab;