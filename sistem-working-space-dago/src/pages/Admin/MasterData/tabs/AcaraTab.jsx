import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Form, Input, DatePicker, TimePicker, Space,
    message, Popconfirm, Upload, Image, Typography, Tag, Row, Col, Switch, notification
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import {
    getAdminAcara, createAcara, updateAcara, deleteAcara, updateAcaraStatus
} from "../../../../services/service";
import moment from "moment";

const { Text } = Typography;
const { TextArea } = Input;
const API_URL = import.meta.env.VITE_BASE_URL;

const normFile = (e) => Array.isArray(e) ? e : e && e.fileList;

const AcaraTab = () => {
    const [acaraList, setAcaraList] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        judul: "",
        lokasi: "",
        harga: "",
        tags: "",
        tanggal: null,
    });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingAcara, setEditingAcara] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

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

    const fetchAcara = async () => {
        setLoading(true);
        try {
            const res = await getAdminAcara();
            if (res.status === 200) {
                const data = res.data.datas.map(item => ({
                    ...item,
                    tags: Array.isArray(item.tags) ? item.tags.join(", ") : item.tags || "",
                }));
                setAcaraList(data);
                setFilteredData(data);
            } else {
                openNotif("error", "Gagal Memuat Data", "Gagal memuat data acara dari server.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcara();
    }, []);

    useEffect(() => {
        let filtered = acaraList.filter(item =>
            (!filters.judul || item.judul_acara.toLowerCase().includes(filters.judul.toLowerCase())) &&
            (!filters.lokasi || item.lokasi.toLowerCase().includes(filters.lokasi.toLowerCase())) &&
            (!filters.harga || (item.harga || "").toLowerCase().includes(filters.harga.toLowerCase())) &&
            (!filters.tags || (item.tags || "").toLowerCase().includes(filters.tags.toLowerCase())) &&
            (!filters.tanggal || moment(item.tanggal_acara).isSame(filters.tanggal, "day"))
        );
        setFilteredData(filtered);
    }, [filters, acaraList]);

    const handleStatusChange = async (checked, id_acara) => {
        const newStatus = checked ? "aktif" : "inaktif";
        setUpdatingStatusId(id_acara);
        try {
            const res = await updateAcaraStatus(id_acara, newStatus);
            if (res.status === 200) {
                openNotif("success", "Status Diperbarui", `Status acara berhasil diubah menjadi ${newStatus.toUpperCase()}`);
                setAcaraList(prev =>
                    prev.map(item => item.id_acara === id_acara ? { ...item, status_acara: newStatus } : item)
                );
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleAdd = () => {
        setEditingAcara(null);
        form.resetFields();
        setFileList([]);
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditingAcara(record);
        form.setFieldsValue({
            judul_acara: record.judul_acara,
            tanggal_acara: record.tanggal_acara ? moment(record.tanggal_acara) : null,
            waktu_mulai: record.waktu_mulai ? moment(record.waktu_mulai, "HH:mm:ss") : null,
            waktu_selesai: record.waktu_selesai ? moment(record.waktu_selesai, "HH:mm:ss") : null,
            lokasi: record.lokasi,
            harga: record.harga,
            deskripsi: record.deskripsi,
            tags: record.tags,
        });
        if (record.gambar_url && record.gambar_url !== "default_event.jpg") {
            setFileList([{
                uid: "-1",
                name: record.gambar_url,
                status: "done",
                url: `${API_URL}/static/${record.gambar_url}`,
            }]);
        }
        setOpen(true);
    };

    const handleDelete = async (id_acara) => {
        try {
            setLoading(true);
            const res = await deleteAcara(id_acara);
            if (res.status === 200) {
                openNotif("success", "Acara Dihapus", "Data acara telah dihapus.");
                fetchAcara();
            } else {
                openNotif("error", "Gagal Menghapus", "Tidak dapat menghapus data acara.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            const formData = new FormData();
            formData.append("judul_acara", values.judul_acara);
            formData.append("tanggal_acara", values.tanggal_acara.format("YYYY-MM-DD"));
            formData.append("waktu_mulai", values.waktu_mulai.format("HH:mm"));
            formData.append("waktu_selesai", values.waktu_selesai.format("HH:mm"));
            formData.append("lokasi", values.lokasi || "");
            formData.append("harga", values.harga || "Gratis");
            formData.append("deskripsi", values.deskripsi || "");
            formData.append("tags", values.tags || "");
            if (values.gambar_url && values.gambar_url[0]?.originFileObj) {
                formData.append("gambar_url", values.gambar_url[0].originFileObj);
            }

            try {
                setLoading(true);
                const res = editingAcara
                    ? await updateAcara(editingAcara.id_acara, formData)
                    : await createAcara(formData);

                if (res.status === 200 || res.status === 201) {
                    openNotif(
                        "success",
                        editingAcara ? "Acara Diperbarui" : "Acara Ditambahkan",
                        editingAcara
                            ? "Data acara berhasil diperbarui!"
                            : "Data acara berhasil ditambahkan!"
                    );
                    setOpen(false);
                    fetchAcara();
                } else {
                    openNotif("error", "Operasi Gagal", "Tidak dapat menyimpan data acara.");
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
            title: "Gambar",
            dataIndex: "gambar_url",
            key: "gambar_url",
            width: 100,
            render: (text) =>
                text && text !== "default_event.jpg" ? (
                    <Image
                        src={`${import.meta.env.VITE_BASE_URL}/static/${text}`}
                        alt="gambar acara"
                        width={60}
                        height={60}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        preview={{ mask: "Klik untuk lihat" }}
                    />
                ) : (
                    <Image
                        src="/default-event.jpg"
                        alt="default"
                        width={60}
                        height={60}
                        style={{ objectFit: "cover", borderRadius: 8, opacity: 0.6 }}
                    />
                ),
        },
        {
            title: "Judul Acara",
            dataIndex: "judul_acara",
            key: "judul_acara",
            filterDropdown: () => (
                <Input
                    placeholder="Cari Judul"
                    value={filters.judul}
                    onChange={e => setFilters({ ...filters, judul: e.target.value })}
                    allowClear
                    style={{ width: 150 }}
                />
            ),
            onFilter: () => true,
            render: text => <Text strong>{text}</Text>,
        },
        {
            title: "Tanggal",
            dataIndex: "tanggal_acara",
            key: "tanggal_acara",
            width: 150,
            filterDropdown: () => (
                <DatePicker
                    placeholder="Pilih tanggal"
                    onChange={date => setFilters({ ...filters, tanggal: date })}
                    allowClear
                />
            ),
            render: text => text ? moment(text).format("DD MMM YYYY") : "-",
        },
        {
            title: "Lokasi",
            dataIndex: "lokasi",
            key: "lokasi",
            filterDropdown: () => (
                <Input
                    placeholder="Cari Lokasi"
                    value={filters.lokasi}
                    onChange={e => setFilters({ ...filters, lokasi: e.target.value })}
                    allowClear
                />
            ),
        },
        {
            title: "Harga",
            dataIndex: "harga",
            key: "harga",
            width: 120,
            filterDropdown: () => (
                <Input
                    placeholder="Cari Harga"
                    value={filters.harga}
                    onChange={e => setFilters({ ...filters, harga: e.target.value })}
                    allowClear
                />
            ),
        },
        {
            title: "Tags",
            dataIndex: "tags",
            key: "tags",
            filterDropdown: () => (
                <Input
                    placeholder="Cari Tag"
                    value={filters.tags}
                    onChange={e => setFilters({ ...filters, tags: e.target.value })}
                    allowClear
                />
            ),
            render: tagsString => (
                <Space size={[0, 8]} wrap>
                    {tagsString?.split(",").map(tag => (
                        <Tag key={tag.trim()}>{tag.trim()}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status_acara",
            key: "status_acara",
            width: 120,
            render: (text, record) => (
                <Switch
                    checkedChildren="Aktif"
                    unCheckedChildren="Inaktif"
                    checked={text === "aktif"}
                    onChange={checked => handleStatusChange(checked, record.id_acara)}
                    loading={updatingStatusId === record.id_acara}
                />
            ),
        },
        {
            title: "Aksi",
            key: "actions",
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Popconfirm
                        title="Hapus acara ini?"
                        onConfirm={() => handleDelete(record.id_acara)}
                        okText="Ya"
                        cancelText="Tidak"
                    >
                        <Button danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {contextHolder}
            <div className="flex justify-end mb-3">
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Tambah Acara</Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="id_acara"
                loading={loading}
                scroll={{ x: 1300 }}
            />

            <Modal
                title={editingAcara ? "Edit Acara" : "Tambah Acara"}
                open={open}
                onCancel={() => setOpen(false)}
                onOk={handleOk}
                confirmLoading={loading}
                width={700}
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        label="Judul Acara"
                        name="judul_acara"
                        rules={[
                            { required: true, message: "Judul acara wajib diisi" },
                            { min: 3, message: "Judul acara minimal 3 karakter." },
                        ]}
                    >
                        <Input placeholder="Masukkan judul acara" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Tanggal"
                                name="tanggal_acara"
                                rules={[{ required: true, message: "Tanggal wajib diisi." }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Waktu Mulai"
                                name="waktu_mulai"
                                rules={[{ required: true, message: "Waktu mulai wajib diisi." }]}
                            >
                                <TimePicker style={{ width: "100%" }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Waktu Selesai"
                                name="waktu_selesai"
                                rules={[{ required: true, message: "Waktu selesai wajib diisi." }]}
                            >
                                <TimePicker style={{ width: "100%" }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Lokasi" name="lokasi">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Harga" name="harga" initialValue="Gratis">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Deskripsi" name="deskripsi">
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item label="Tags" name="tags" tooltip="Pisahkan dengan koma">
                        <Input placeholder="cth: Teknologi, Bisnis" />
                    </Form.Item>

                    <Form.Item
                        label="Gambar"
                        name="gambar_url"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                    >
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            fileList={fileList}
                            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                            accept="image/*"
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AcaraTab;
