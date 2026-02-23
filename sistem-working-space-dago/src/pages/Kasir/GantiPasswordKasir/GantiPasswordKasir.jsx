import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal } from 'antd';
import { LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../../../providers/AuthProvider'; // Import useAuth
import { changePassword } from '../../../services/service'; // Import service baru
import logo from '../../../assets/images/logo.png'; // Sesuaikan path ke logo Anda

const { Title, Text } = Typography;

const GantiPasswordKasir = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { userProfile, logout } = useAuth(); // Ambil fungsi logout

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 1. Hapus error lama (jika ada) setiap kali submit baru
      form.setFields([{ name: 'old_password', errors: [] }]);

      await changePassword(values.old_password, values.new_password);
      form.resetFields();
      setLoading(false);

      message.success('Password Berhasil Diubah!', 2);

      setTimeout(() => {
        logout();
      }, 2500); 

    } catch (error) {
      console.error("Error ganti password:", error);
      setLoading(false);
      
      // --- INI PERUBAHAN UTAMA ---
      // Cek apakah error spesifik dari backend ttg password lama
      if (error && error.msg && error.msg.toLowerCase().includes("invalid old password")) {
        
        // Tampilkan error di bawah field 'old_password'
        form.setFields([
          {
            name: 'old_password', // Nama field harus sama persis
            errors: ['Password lama yang Anda masukkan salah!'], // Pesan error
          },
        ]);
        
      } else {
        // Untuk error lain (misal server 500, network error),
        // kita tetap gunakan pop-up global
        message.error(error.msg || "Gagal mengubah password. Coba lagi nanti.");
      }
      // --- AKHIR PERUBAHAN ---
    }
  };

  return (
    // ... Sisa JSX Anda sudah benar ...
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Logo" className="w-24 h-24 mb-2" />
          <Title level={3}>Ganti Password</Title>
          <Text type="secondary">
            Selamat datang, {userProfile?.email || 'Kasir'}.
          </Text>
          <Text>Ini adalah login pertama Anda. Harap ganti password Anda.</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="old_password"
            label="Password Lama"
            rules={[{ required: true, message: 'Silakan masukkan password lama Anda!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password Lama"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Password Baru"
            rules={[{ required: true, message: 'Silakan masukkan password baru!' }]}
            hasFeedback
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Password Baru"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Konfirmasi Password Baru"
            dependencies={['new_password']}
            hasFeedback
            rules={[
              { required: true, message: 'Silakan isi konfirmasi password baru Anda!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Konfirmasi Password yang Anda masukkan tidak cocok!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Konfirmasi Password Baru"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Ganti Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default GantiPasswordKasir;