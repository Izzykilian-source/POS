// File baru: .../pages/admin/LaporanPembayaran.js

import React, { useState, useEffect } from 'react';
import { Card, Col, DatePicker, Row, Spin, Statistic, Typography, message, Empty } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPaymentSummary } from '../../../services/service'; // Sesuaikan path

const { Title, Text } = Typography;

const LaporanPembayaran = () => {
  const [loading, setLoading] = useState(true);
  // Default ke hari ini
  const [selectedDate, setSelectedDate] = useState(dayjs()); 
  const [summaryData, setSummaryData] = useState(null);

  // Fungsi untuk format mata uang
  const formatCurrency = (value) => {
    if (typeof value !== 'number') value = 0;
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // Fungsi untuk mengambil data
  const fetchData = async (date) => {
    setLoading(true);
    // Format tanggal ke YYYY-MM-DD untuk dikirim ke API
    const dateString = date.format('YYYY-MM-DD');
    
    try {
      const result = await getPaymentSummary(dateString);
      if (result.message === "OK") {
        setSummaryData(result.data);
      } else {
        throw new Error(result.error || "Gagal mengambil data");
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      message.error(error.message || "Gagal mengambil data ringkasan");
      setSummaryData(null); // Kosongkan data jika error
    } finally {
      setLoading(false);
    }
  };

  // 1. Panggil fetchData saat komponen dimuat
  // 2. Panggil fetchData lagi setiap 'selectedDate' berubah
  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // Handler saat tanggal di DatePicker berubah
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Helper untuk menghindari error jika data belum ada
  const tunaiData = summaryData?.Tunai || { jumlah_transaksi: 0, total_pendapatan: 0 };
  const nonTunaiData = summaryData?.['Non-Tunai'] || { jumlah_transaksi: 0, total_pendapatan: 0 };

  return (
    // Gunakan padding dari layout utama Anda
    <div style={{ padding: '24px' }}>
      <Title level={3}>Laporan Metode Pembayaran</Title>
      <Text type="secondary">
        Lihat ringkasan pendapatan berdasarkan metode pembayaran yang sudah 'Lunas'.
      </Text>

      {/* Filter Tanggal */}
      <div style={{ margin: '24px 0' }}>
        <Text strong style={{ marginRight: 8 }}>Pilih Tanggal Laporan:</Text>
        <DatePicker 
          onChange={handleDateChange} 
          value={selectedDate} 
          format="DD MMMM YYYY"
          allowClear={false}
          style={{ width: '250px' }}
        />
      </div>

      {/* Konten Laporan */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : !summaryData ? (
        <Empty description="Tidak ada data untuk tanggal ini" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {/* Card Tunai */}
            <Col xs={24} md={12}>
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid #3f8600' }}>
                <Statistic
                  title="Total Pendapatan (Tunai)"
                  value={formatCurrency(tunaiData.total_pendapatan)}
                  prefix={<DollarCircleOutlined />}
                  valueStyle={{ color: '#3f8600', fontSize: '1.75rem' }}
                />
                <Text type="secondary">{`dari ${tunaiData.jumlah_transaksi} transaksi`}</Text>
              </Card>
            </Col>

            {/* Card Non-Tunai */}
            <Col xs={24} md={12}>
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid #1890ff' }}>
                <Statistic
                  title="Total Pendapatan (Non-Tunai)"
                  value={formatCurrency(nonTunaiData.total_pendapatan)}
                  prefix={<CreditCardOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: '1.75rem' }}
                />
                <Text type="secondary">{`dari ${nonTunaiData.jumlah_transaksi} transaksi`}</Text>
              </Card>
            </Col>
          </Row>

          {/* Card Total Keseluruhan */}
          <Card style={{ marginTop: 24, background: '#fafafa', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
             <Statistic
                title={`Total Keseluruhan (${summaryData.tanggal_laporan})`}
                value={formatCurrency(summaryData.total_keseluruhan)}
                valueStyle={{ color: '#d46b08', fontSize: '2.5rem' }}
              />
              <Text type="secondary">
                {`Total ${tunaiData.jumlah_transaksi + nonTunaiData.jumlah_transaksi} transaksi lunas`}
              </Text>
          </Card>
        </>
      )}
    </div>
  );
};

export default LaporanPembayaran;