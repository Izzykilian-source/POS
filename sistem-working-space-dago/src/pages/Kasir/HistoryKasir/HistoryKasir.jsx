// src/pages/Kasir/HistoryKasir/HistoryKasir.jsx
import React, { useState, useEffect } from 'react';
import { Table, Spin, Card, Input, Typography, Tag, message, Row, Col, Statistic, Button, Modal, Descriptions } from 'antd';
import { 
    SearchOutlined, 
    WalletOutlined, 
    DollarCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../providers/AuthProvider';
import { apiGetSessionHistory } from '../../../services/service';
import dayjs from 'dayjs';
import { formatRupiah } from '../../../utils/formatRupiah'; 

const { Title, Text } = Typography;

const HistoryKasir = () => {
    const { activeSession, isSessionLoading } = useAuth(); 
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [openBalance, setOpenBalance] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleViewDetail = (record) => {
        console.log('View Details for:', record);
        setSelectedRecord(record); 
        setIsDetailModalVisible(true); 
    };

    const handleCloseModal = () => {
        setIsDetailModalVisible(false);
        setSelectedRecord(null); 
    };

    useEffect(() => {
        if (isSessionLoading) {
            setLoading(true); 
            return;
        }
        if (!activeSession) {
            message.info("Tidak ada sesi kasir yang aktif.", 5);
            setLoading(false);
            setData([]); 
            setOpenBalance(0);
            setCurrentBalance(0);
            return;
        }
        const fetchDataForSession = async () => {
            setLoading(true);
            try {
                const res = await apiGetSessionHistory(); 
                if (res.message === "OK") {
                    setData(res.transactions.map((item, index) => ({
                        key: item.id_transaksi || index,
                        ...item
                    })));
                    setOpenBalance(res.open_balance || 0);
                    setCurrentBalance(res.current_balance || 0);
                } else {
                    message.error(res.error || "Gagal mengambil data riwayat sesi");
                }
            } catch (err) {
                console.error("Error fetching session history:", err);
                message.error(err.message || "Gagal terhubung ke server");
            } finally {
                setLoading(false);
            }
        };
        fetchDataForSession();
    }, [activeSession, isSessionLoading]); 

    // Logic Search Text
    const filteredData = data.filter(item => {
        const customer = item.nama_pelanggan?.toLowerCase() || '';
        const table = (item.room_items || item.lokasi_pemesanan || '').toLowerCase(); 
        const search = searchText.toLowerCase();
        return customer.includes(search) || table.includes(search);
    });
    
    // --- LOGIC UNTUK FILTER PAYMENT ---
    // Mengambil data unik dari metode pembayaran yang tersedia di table saat ini
    const paymentFilters = [
        ...new Set(data.map(item => item.metode_pembayaran).filter(Boolean))
    ].map(method => ({
        text: method,
        value: method,
    }));
    // ----------------------------------

    const columns = [
        {
            title: 'Datetime',
            dataIndex: 'tanggal_transaksi',
            key: 'tanggal_transaksi',
            render: (text) => dayjs(text).format('DD/MM HH:mm'), 
            sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
            width: 140,
        },
        {
            title: 'Name', 
            dataIndex: 'nama_pelanggan',
            key: 'nama_pelanggan',
            render: (text) => text || 'Guest',
        },
        {
            title: 'Payment', 
            dataIndex: 'metode_pembayaran',
            key: 'metode_pembayaran',
            render: (text) => text || 'N/A', 
            width: 120,
            // --- MENAMBAHKAN FILTER DROPDOWN ---
            filters: paymentFilters,
            onFilter: (value, record) => record.metode_pembayaran === value,
            // -----------------------------------
        },
        {
            title: 'Table', 
            dataIndex: 'room_items', 
            key: 'room_items',
            render: (text, record) => {
                const room = text && text !== '-' ? text : null;
                const location = record.lokasi_pemesanan;
                return room || location || '-'; 
            },
            width: 140,
        },
        {
            title: 'Subtotal', 
            dataIndex: 'subtotal', 
            key: 'subtotal',
            render: (text) => (text && text > 0) ? formatRupiah(text) : '-',
            width: 130,
        },
        {
            title: 'Tax', 
            dataIndex: 'pajak_nominal', 
            key: 'pajak_nominal',
            render: (text) => (text && text > 0) ? formatRupiah(text) : '-',
            width: 130,
        },
        {
            title: 'Total', 
            dataIndex: 'total_harga_final',
            key: 'total_harga_final',
            render: (text) => formatRupiah(text || 0),
            sorter: (a, b) => (a.total_harga_final || 0) - (b.total_harga_final || 0),
            width: 140,
        },
        {
            title: 'Detail', 
            key: 'action',
            align: 'center',
            fixed: 'right', 
            width: 80,
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                />
            ),
        },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <Card className="shadow-lg rounded-lg">
                <Row justify="space-between" align="top" gutter={[16, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={14}>
                        <Title level={4}>Riwayat Transaksi Sesi Ini</Title>
                        <Text type="secondary">
                            Hanya menampilkan transaksi yang dibuat dalam sesi kasir Anda saat ini.
                        </Text>
                        {activeSession && (
                            <Text strong style={{ display: 'block', marginTop: 8 }}>
                                Sesi Aktif: {activeSession.nama_sesi || `ID ${activeSession.id_sesi}`}
                            </Text>
                        )}
                        <Input
                            placeholder="Cari pelanggan atau meja..." 
                            prefix={<SearchOutlined />}
                            size="large"
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ marginTop: 16, maxWidth: '400px' }}
                        />
                    </Col>
                    <Col xs={24} lg={10}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12}>
                                <Card bordered={false} style={{ backgroundColor: '#f0f9ff' }} bodyStyle={{ padding: '16px' }}>
                                    <Statistic
                                        title="Open Balance"
                                        value={openBalance}
                                        precision={0}
                                        formatter={(val) => formatRupiah(val)}
                                        prefix={<WalletOutlined />}
                                        valueStyle={{ color: '#0369a1', fontSize: '1.25rem' }}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12}>
                                <Card bordered={false} style={{ backgroundColor: '#f0fdf4' }} bodyStyle={{ padding: '16px' }}>
                                    <Statistic
                                        title="Current Balance (Cash)"
                                        value={currentBalance}
                                        precision={0}
                                        formatter={(val) => formatRupiah(val)}
                                        prefix={<DollarCircleOutlined />}
                                        valueStyle={{ color: '#16a34a', fontSize: '1.25rem' }}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                            *Current Balance = Open Balance + Total Tunai (Cash) Sesi Ini.
                        </Text>
                    </Col>
                </Row>

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="key"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>

            {/* Modal Detail */}
            {selectedRecord && (
                <Modal
                    title={`Detail Transaksi #${selectedRecord.id_transaksi}`}
                    open={isDetailModalVisible}
                    onCancel={handleCloseModal}
                    footer={[ <Button key="close" type="primary" onClick={handleCloseModal}> Tutup </Button> ]}
                    width={600}
                >
                    <Descriptions bordered column={1} size="small" className="mt-4">
                        <Descriptions.Item label="Waktu Transaksi">
                            {dayjs(selectedRecord.tanggal_transaksi).format('DD MMMM YYYY, HH:mm:ss')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pelanggan">
                            {selectedRecord.nama_pelanggan || 'Guest'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Metode Bayar">
                            <Tag color={selectedRecord.metode_pembayaran === 'Tunai' ? 'green' : 'blue'}>
                                {selectedRecord.metode_pembayaran || 'N/A'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status Order">
                            <Tag>{selectedRecord.status_order || 'N/A'}</Tag>
                        </Descriptions.Item>
                        
                        <Descriptions.Item label="Meja/Ruangan">
                            {(selectedRecord.room_items && selectedRecord.room_items !== '-') 
                                ? selectedRecord.room_items 
                                : (selectedRecord.lokasi_pemesanan || '-')
                            }
                        </Descriptions.Item>

                        <Descriptions.Item label="Item F&B">
                            {selectedRecord.fnb_items && selectedRecord.fnb_items !== '-' ? (
                                <ul style={{ paddingLeft: 20, margin: 0, listStyleType: 'disc' }}>
                                    {selectedRecord.fnb_items.split(',').map((item, index) => (
                                        <li key={index}>{item.trim()}</li>
                                    ))}
                                </ul>
                            ) : '-'}
                        </Descriptions.Item>
                        
                        <Descriptions.Item label="Subtotal">
                            {(selectedRecord.subtotal && selectedRecord.subtotal > 0) 
                                ? formatRupiah(selectedRecord.subtotal) 
                                : '-'
                            }
                        </Descriptions.Item>
                        <Descriptions.Item label="Pajak">
                            {(selectedRecord.pajak_nominal && selectedRecord.pajak_nominal > 0)
                                ? formatRupiah(selectedRecord.pajak_nominal) 
                                : '-'
                            }
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Final">
                            <Text strong style={{fontSize: '1rem'}}>
                                {formatRupiah(selectedRecord.total_harga_final || 0)}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
};

export default HistoryKasir;