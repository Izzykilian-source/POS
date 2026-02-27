// src/pages/Admin/MasterData/tabs/MasterLokasi.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Modal, Input, Select, message, Popconfirm, Tag, Tooltip, Empty } from "antd";
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    ReloadOutlined,
    EnvironmentOutlined 
} from "@ant-design/icons";

import { getLocations, addLocation, updateLocation, deleteLocation } from "/src/services/service";

const { Option } = Select;

const MasterLokasi = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // State Form
    const [formId, setFormId] = useState(null);
    const [formNama, setFormNama] = useState("");
    const [formStatus, setFormStatus] = useState("Active");

    // --- 1. Fetch Data ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getLocations();
            // Validasi agar tidak error map jika result null
            setData(Array.isArray(result) ? result : []); 
        } catch (error) {
            console.error(error);
            message.error("Gagal mengambil data lokasi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- 2. Handlers ---
    const handleOpenModal = (record = null) => {
        if (record) {
            setIsEditMode(true);
            setFormId(record.id_lokasi); 
            setFormNama(record.nama_lokasi);
            setFormStatus(record.status);
        } else {
            setIsEditMode(false);
            setFormId(null);
            setFormNama("");
            setFormStatus("Active");
        }
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formNama.trim()) {
            message.warning("Nama lokasi tidak boleh kosong.");
            return;
        }

        setSubmitLoading(true);
        const payload = { nama_lokasi: formNama, status: formStatus };

        try {
            if (isEditMode) {
                await updateLocation(formId, payload);
                message.success("Lokasi berhasil diperbarui!");
            } else {
                await addLocation(payload);
                message.success("Lokasi baru berhasil ditambahkan!");
            }
            setModalVisible(false);
            fetchData(); // Refresh tabel
        } catch (error) {
            console.error(error);
            message.error("Gagal menyimpan data.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteLocation(id);
            message.success("Lokasi berhasil dihapus.");
            fetchData();
        } catch (error) {
            console.error(error);
            message.error("Gagal menghapus lokasi.");
        }
    };

    // --- 3. Columns Table ---
    const columns = [
        {
            title: 'No',
            key: 'index',
            width: 70,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Nama Lokasi / Meja',
            dataIndex: 'nama_lokasi',
            key: 'nama_lokasi',
            render: (text) => (
                <span className="font-bold text-gray-700">{text}</span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            align: 'center',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'} className="px-3 py-1 rounded-full font-semibold">
                    {status === 'Active' ? 'TERSEDIA' : 'NON-AKTIF'}
                </Tag>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <div className="flex justify-center gap-2">
                    <Tooltip title="Edit">
                        <Button 
                            icon={<EditOutlined />} 
                            size="small" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleOpenModal(record)} 
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Hapus Lokasi"
                        description="Yakin ingin menghapus lokasi ini?"
                        onConfirm={() => handleDelete(record.id_lokasi)} 
                        okText="Ya, Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Hapus">
                            <Button 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                danger 
                                className="bg-red-50 border-red-200"
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 bg-gray-50 min-h-full rounded-xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-800 flex items-center gap-2 m-0">
                        <EnvironmentOutlined className="text-blue-600" />
                        Lokasi Tempat Duduk
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 mb-0">Kelola daftar meja dan area pemesanan.</p>
                </div>
                <div className="flex gap-2">
                     <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchData} 
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => handleOpenModal(null)}
                        className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 border-none"
                    >
                        Tambah Lokasi
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id_lokasi"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: <Empty description="Belum ada data lokasi" /> }}
                    className="custom-admin-table"
                />
            </div>

            {/* Modal Form */}
            <Modal
                title={isEditMode ? "Edit Lokasi" : "Tambah Lokasi Baru"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
                confirmLoading={submitLoading}
                okText="Simpan"
                cancelText="Batal"
                centered
            >
                <div className="flex flex-col gap-4 py-3">
                    <div>
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Nama Lokasi / Meja</label>
                        <Input 
                            placeholder="Contoh: Meja 05, Ruang Meeting A, Outdoor" 
                            value={formNama}
                            onChange={(e) => setFormNama(e.target.value)}
                            size="large"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Status Ketersediaan</label>
                        <Select 
                            value={formStatus} 
                            onChange={setFormStatus} 
                            className="w-full"
                            size="large"
                        >
                            <Option value="Active">Active (Bisa Dipilih Pelanggan)</Option>
                            <Option value="Inactive">Inactive (Disembunyikan)</Option>
                        </Select>
                        <p className="text-xs text-gray-400 mt-1">
                            *Jika "Inactive", lokasi ini tidak akan muncul di halaman pembayaran pelanggan.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MasterLokasi;