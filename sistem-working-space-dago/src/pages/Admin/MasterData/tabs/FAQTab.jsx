import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, Typography, Tag, notification, InputNumber, Tooltip
} from "antd";
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined 
} from "@ant-design/icons";
import {
  getAdminFAQ, createFAQ, updateFAQ, deleteFAQ, updateFAQStatus
} from "../../../../services/service"; // Sesuaikan path

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FAQTab = () => {
  const [faqList, setFaqList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  
  // State untuk filter pencarian
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

  const fetchFAQ = async () => {
    setLoading(true);
    try {
      const res = await getAdminFAQ();
      // Asumsi backend mengembalikan { datas: [...] } seperti endpoint acara
      // Jika backend mengembalikan array langsung, sesuaikan: setFaqList(res || [])
      if (res && res.datas) {
        setFaqList(res.datas);
      } else if (Array.isArray(res)) {
        setFaqList(res);
      } else {
         setFaqList([]);
      }
    } catch (error) {
      openNotif("error", "Gagal Memuat Data", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQ();
  }, []);

  // Filter Data di sisi Client
  const filteredData = faqList.filter(item => 
    item.pertanyaan.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.jawaban && item.jawaban.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    // Default urutan: cari urutan terbesar + 1
    const maxUrutan = faqList.length > 0 ? Math.max(...faqList.map(i => i.urutan || 0)) : 0;
    form.setFieldsValue({ status: "Aktif", urutan: maxUrutan + 1 });
    setOpen(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      pertanyaan: record.pertanyaan,
      jawaban: record.jawaban,
      status: record.status,
      urutan: record.urutan,
    });
    setOpen(true);
  };

  const handleDelete = async (id_faq) => {
    try {
      setLoading(true);
      const res = await deleteFAQ(id_faq);
      if (res.status === 200) {
        openNotif("success", "FAQ Dihapus", "Data FAQ telah dihapus.");
        fetchFAQ();
      } else {
        openNotif("error", "Gagal Menghapus", "Terjadi kesalahan saat menghapus.");
      }
    } catch (error) {
      openNotif("error", "Kesalahan", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Status Change via Table Dropdown
  const handleQuickStatusChange = async (id, newStatus) => {
    try {
        const res = await updateFAQStatus(id, newStatus);
        if (res.status === 200) {
            openNotif("success", "Status Diperbarui", `Status diubah menjadi ${newStatus}`);
            // Update lokal state biar cepat tanpa fetch ulang
            setFaqList(prev => prev.map(item => item.id_faq === id ? {...item, status: newStatus} : item));
        }
    } catch (error) {
        openNotif("error", "Gagal", error.message);
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        setLoading(true);
        const payload = {
            pertanyaan: values.pertanyaan,
            jawaban: values.jawaban,
            status: values.status,
            urutan: values.urutan
        };

        const res = editingItem
          ? await updateFAQ(editingItem.id_faq, payload)
          : await createFAQ(payload);

        if (res.status === 200 || res.status === 201) {
          openNotif(
            "success",
            editingItem ? "FAQ Diperbarui" : "FAQ Ditambahkan",
            "Data berhasil disimpan."
          );
          setOpen(false);
          fetchFAQ();
        } else {
          openNotif("error", "Gagal", "Tidak dapat menyimpan data.");
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
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Pertanyaan",
      dataIndex: "pertanyaan",
      key: "pertanyaan",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Jawaban",
      dataIndex: "jawaban",
      key: "jawaban",
      width: 300,
      render: (text) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 300 }}>
          {text || <span style={{color: '#ccc', fontStyle: 'italic'}}>(Belum dijawab)</span>}
        </Text>
      ),
    },
    {
      title: "Urutan",
      dataIndex: "urutan",
      key: "urutan",
      width: 80,
      align: "center",
      sorter: (a, b) => a.urutan - b.urutan,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => {
        let color = "default";
        if (status === "Aktif") color = "green";
        if (status === "Menunggu") color = "gold";
        if (status === "Arsip") color = "red";

        return (
            <Select 
                defaultValue={status} 
                style={{ width: 120 }} 
                onChange={(val) => handleQuickStatusChange(record.id_faq, val)}
                status={status === 'Menunggu' ? 'warning' : ''}
            >
                <Option value="Aktif"><Tag color="green">Aktif</Tag></Option>
                <Option value="Menunggu"><Tag color="gold">Menunggu</Tag></Option>
                <Option value="Arsip"><Tag color="red">Arsip</Tag></Option>
            </Select>
        );
      },
    },
    {
      title: "Aksi",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Hapus FAQ ini?"
            description="Tindakan ini tidak dapat dibatalkan."
            onConfirm={() => handleDelete(record.id_faq)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      
      {/* Header & Filter */}
      <div className="flex justify-between items-center mb-4">
        <Input 
            placeholder="Cari pertanyaan..." 
            style={{ width: 300 }} 
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Tambah FAQ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id_faq"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingItem ? "Edit FAQ" : "Tambah FAQ"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        confirmLoading={loading}
        width={600}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Pertanyaan"
            name="pertanyaan"
            rules={[{ required: true, message: "Pertanyaan wajib diisi" }]}
          >
            <Input placeholder="Contoh: Apakah buka hari minggu?" />
          </Form.Item>

          <Form.Item
            label="Jawaban"
            name="jawaban"
            rules={[{ required: true, message: "Jawaban wajib diisi" }]}
          >
            <TextArea 
                rows={4} 
                placeholder="Tulis jawaban di sini..." 
                showCount 
                maxLength={500} 
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Status" name="status" initialValue="Aktif">
                <Select>
                  <Option value="Aktif">Aktif (Tampil di Web)</Option>
                  <Option value="Menunggu">Menunggu (Draft)</Option>
                  <Option value="Arsip">Arsip (Disembunyikan)</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label={
                    <span>
                        Urutan Tampil <Tooltip title="Semakin kecil angka, semakin atas posisinya"><InfoCircleOutlined /></Tooltip>
                    </span>
                } 
                name="urutan"
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FAQTab;