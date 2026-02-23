import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Tag, Space,
    Select, message, Popconfirm, Tooltip, Form, notification
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    UserOutlined, MailOutlined, SafetyOutlined, LockOutlined, CheckCircleOutlined
} from "@ant-design/icons";
import { getUsersAdmin, createUser, updateUser, deleteUser } from "../../../../services/service"; // SESUAIKAN PATH IMPORT

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const UserTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [form] = Form.useForm();
    const [pageSize, setPageSize] = useState(5);

    const [api, contextHolder] = notification.useNotification();

    // 🔔 Fungsi untuk tampilkan notifikasi kanan atas
    const showNotification = (type, title, description) => {
        api[type]({
            message: title,
            description: description,
            placement: "topRight",
            duration: 3,
            icon: type === "success" ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : undefined,
        });
    };

    // Ambil data dari database
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsersAdmin();
            if (res.status === 200) {
                const mappedData = res.data.datas.map(user => ({
                    key: user.id_user,
                    id: `U${String(user.id_user).padStart(3, '0')}`,
                    username: user.nama,
                    email: user.email,
                    role: user.role,
                }));
                setUsers(mappedData);
            } else {
                message.error("Gagal memuat data pengguna!");
            }
        } catch (error) {
            message.error("Terjadi kesalahan: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredData = users.filter(item =>
        item.username.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email.toLowerCase().includes(searchText.toLowerCase()) ||
        item.role.toLowerCase().includes(searchText.toLowerCase())
    );

    const roles = ["admin_dago", "admin_tenant", "kasir", "owner", "pelanggan"];

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            sorter: (a, b) => a.id.localeCompare(b.id)
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
            sorter: (a, b) => a.username.localeCompare(b.username),
            render: (text) => (
                <Space>
                    <UserOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (text) => (
                <Space>
                    <MailOutlined style={{ color: '#52c41a' }} />
                    {text}
                </Space>
            )
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            filters: roles.map(r => ({ text: r, value: r })),
            onFilter: (value, record) => record.role.indexOf(value) === 0,
            render: (role) => {
                const color = {
                    admin_dago: "red",
                    admin_tenant: "purple",
                    kasir: "blue",
                    owner: "orange"
                }[role] || "green";
                return (
                    <Tag color={color}>
                        <SafetyOutlined /> {role}
                    </Tag>
                );
            }
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit User">
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Delete User">
                        <Popconfirm
                            title="Yakin ingin menghapus user ini?"
                            onConfirm={() => handleDelete(record.key)}
                            okText="Ya"
                            cancelText="Tidak"
                        >
                            <Button type="link" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        },
    ];

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);
            try {
                let res;
                if (editingUser) {
                    const { password, ...updateValues } = values;
                    res = await updateUser(editingUser.key, updateValues);
                } else {
                    res = await createUser(values);
                }

                if (res.status === 200 || res.status === 201) {
                    showNotification(
                        "success",
                        editingUser ? "User Diperbarui" : "User Ditambahkan",
                        `Data pengguna berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.`
                    );
                    setOpen(false);
                    fetchUsers();
                } else {
                    showNotification("error", "Operasi Gagal", res.data.error || "Gagal memproses data.");
                }
            } catch (error) {
                showNotification("error", "Terjadi Kesalahan", error.message);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            nama: user.username,
            email: user.email,
            role: user.role,
        });
        setOpen(true);
    };

    const handleDelete = async (key) => {
        setLoading(true);
        try {
            const res = await deleteUser(key);
            if (res.status === 200) {
                showNotification("success", "User Dihapus", "Data pengguna berhasil dihapus.");
                fetchUsers();
            } else {
                showNotification("error", "Gagal Menghapus", res.data.error || "Terjadi kesalahan saat menghapus.");
            }
        } catch (error) {
            showNotification("error", "Terjadi Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setOpen(false);
        setEditingUser(null);
        form.resetFields();
    };

    const handleAdd = () => {
        setEditingUser(null);
        form.resetFields();
        setOpen(true);
    };

    return (
        <div style={{ padding: '24px' }}>
            {contextHolder}

            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1">
                    <Search
                        placeholder="Cari username, email, atau role..."
                        size="large"
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col flex="none">
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}>
                        Add New User
                    </Button>
                </Col>
                <Col flex="none">
                    <Space>
                        <Card size="small">
                            <Text strong>Total Users: </Text>
                            <Tag color="blue">{users.length}</Tag>
                        </Card>
                    </Space>
                </Col>
            </Row>

            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ["5", "10", "50", "100"],
                        showTotal: (total, range) =>
                            `Menampilkan ${range[0]}-${range[1]} dari ${total} pengguna`,
                        onShowSizeChange: (current, size) => setPageSize(size),
                    }}
                    loading={loading}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        {editingUser ? <EditOutlined /> : <PlusOutlined />}
                        {editingUser ? "Edit User" : "Add New User"}
                    </Space>
                }
                open={open}
                onCancel={handleCancel}
                onOk={handleOk}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" name="userForm">
                    <Form.Item
                        name="nama"
                        label="Username"
                        rules={[{ required: true, message: 'Username wajib diisi!' }]}
                    >
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Email wajib diisi!' },
                            { type: 'email', message: 'Format email tidak valid!' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>
                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Password wajib diisi!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Role wajib dipilih!' }]}
                    >
                        <Select placeholder="Pilih role pengguna">
                            {roles.map(role => (
                                <Option key={role} value={role}>
                                    {role}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserTab;

