import React from 'react';
import { Modal, Typography, Spin, Image, Descriptions, Alert, Button, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

// Placeholder untuk gambar QRIS, ganti dengan QRIS asli Anda
const QRIS_IMAGE_URL = "../../public/img/WhatsApp Image 2025-10-08 at 09.02.45.jpeg";

const PaymentConfirmationModal = ({ open, details, onConfirm, onCancel }) => {
  const [timer, setTimer] = useState(600); // 10 menit dalam detik

  useEffect(() => {
    if (open) {
      setTimer(600); // Reset timer setiap modal dibuka
      const interval = setInterval(() => {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval); // Cleanup interval
    }
  }, [open]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (!details) return null;

  return (
    <Modal
      open={open}
      title={<Title level={4} style={{ margin: 0 }}>Konfirmasi Pembayaran</Title>}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Batal
        </Button>,
        <Button key="submit" type="primary" icon={<CheckCircleOutlined />} onClick={onConfirm}>
          Cek Status Pembayaran
        </Button>,
      ]}
      width={450}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Image
          src={QRIS_IMAGE_URL}
          alt="QRIS Payment Code"
          width={250}
          preview={false}
          placeholder={<Spin />}
        />
        <Alert
          message="Pindai QR Code untuk menyelesaikan pembayaran"
          type="info"
          showIcon
          style={{ marginTop: '16px', textAlign: 'left' }}
        />
        <Tag icon={<ClockCircleOutlined />} color="warning" style={{ marginTop: '16px', fontSize: '16px', padding: '8px 12px' }}>
          Bayar dalam: {formatTime(timer)}
        </Tag>
      </div>

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID Transaksi">{details.id_transaksi}</Descriptions.Item>
        <Descriptions.Item label="Paket Membership">{details.nama_paket}</Descriptions.Item>
        <Descriptions.Item label="Total Pembayaran">
          <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
            Rp {details.harga.toLocaleString('id-ID')}
          </Text>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default PaymentConfirmationModal;