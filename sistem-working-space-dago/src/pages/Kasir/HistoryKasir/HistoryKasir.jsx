// src/pages/Kasir/HistoryKasir/HistoryKasir.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin, Card, Input, Typography, Tag, message, Row, Col, Statistic, Button, Modal, Descriptions, Divider } from 'antd';
import { 
    SearchOutlined, 
    WalletOutlined, 
    DollarCircleOutlined,
    CreditCardOutlined,
    AccountBookOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    UserOutlined
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
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleViewDetail = (record) => {
        setSelectedRecord(record); 
        setIsDetailModalVisible(true); 
    };

    const handleCloseModal = () => {
        setIsDetailModalVisible(false);
        setTimeout(() => setSelectedRecord(null), 300); 
    };

    useEffect(() => {
        if (isSessionLoading) {
            setLoading(true); 
            return;
        }
        if (!activeSession) {
            message.info("Tidak ada sesi kasir yang aktif.");
            setLoading(false);
            setData([]); 
            setOpenBalance(0);
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

    // --- LOGIC PERHITUNGAN REPORT ---
    const { totalTunai, totalNonTunai } = useMemo(() => {
        let tunai = 0;
        let nonTunai = 0;

        data.forEach(item => {
            const amount = parseFloat(item.total_harga_final) || 0;
            const method = (item.metode_pembayaran || '').toLowerCase();

            if (method) {
                if (method === 'tunai' || method === 'cash') {
                    tunai += amount;
                } else {
                    nonTunai += amount;
                }
            }
        });

        return { totalTunai: tunai, totalNonTunai: nonTunai };
    }, [data]);

    const calculatedCurrentBalance = openBalance + totalTunai + totalNonTunai;

    // --- LOGIC PENCARIAN & FILTER ---
    const filteredData = data.filter(item => {
        const customer = item.nama_pelanggan?.toLowerCase() || '';
        const table = (item.room_items || item.lokasi_pemesanan || '').toLowerCase(); 
        const search = searchText.toLowerCase();
        return customer.includes(search) || table.includes(search);
    });
    
    const paymentFilters = [
        ...new Set(data.map(item => item.metode_pembayaran).filter(Boolean))
    ].map(method => ({ text: method, value: method }));

    // --- KONFIGURASI TABEL ---
    const columns = [
        {
            title: 'Waktu',
            dataIndex: 'tanggal_transaksi',
            key: 'tanggal_transaksi',
            render: (text) => (
                <div className="flex flex-col">
                    <Text className="font-medium text-gray-700">{dayjs(text).format('HH:mm')}</Text>
                    <Text type="secondary" className="text-xs">{dayjs(text).format('DD MMM YYYY')}</Text>
                </div>
            ), 
            sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
            width: 120,
        },
        {
            title: 'Pelanggan', 
            dataIndex: 'nama_pelanggan',
            key: 'nama_pelanggan',
            render: (text) => <Text className="font-medium">{text || 'Guest'}</Text>,
        },
        {
            title: 'Pembayaran', 
            dataIndex: 'metode_pembayaran',
            key: 'metode_pembayaran',
            render: (text) => (
                <Tag color={text?.toLowerCase() === 'tunai' || text?.toLowerCase() === 'cash' ? 'green' : 'blue'} className="rounded-md px-2 py-1">
                    {text || 'N/A'}
                </Tag>
            ), 
            width: 130,
            filters: paymentFilters,
            onFilter: (value, record) => record.metode_pembayaran === value,
        },
        {
            title: 'Meja/Ruangan', 
            dataIndex: 'room_items', 
            key: 'room_items',
            render: (text, record) => {
                const room = text && text !== '-' ? text : null;
                const location = record.lokasi_pemesanan;
                return <Text type="secondary">{room || location || '-'}</Text>; 
            },
            width: 150,
        },
        {
            title: 'Subtotal', 
            dataIndex: 'subtotal', 
            key: 'subtotal',
            align: 'right', // Standar akuntansi rata kanan
            render: (text) => <Text type="secondary">{(text && text > 0) ? formatRupiah(text) : '-'}</Text>,
            width: 130,
        },
        {
            title: 'Pajak', 
            dataIndex: 'pajak_nominal', 
            key: 'pajak_nominal',
            align: 'right', // Standar akuntansi rata kanan
            render: (text) => <Text type="secondary">{(text && text > 0) ? formatRupiah(text) : '-'}</Text>,
            width: 120,
        },
        {
            title: 'Total', 
            dataIndex: 'total_harga_final',
            key: 'total_harga_final',
            align: 'right', // Standar akuntansi rata kanan
            render: (text) => <Text strong className="text-blue-600">{formatRupiah(text || 0)}</Text>,
            sorter: (a, b) => (a.total_harga_final || 0) - (b.total_harga_final || 0),
            width: 140,
        },
        {
            title: 'Aksi', 
            key: 'action',
            align: 'center',
            fixed: 'right', 
            width: 80,
            render: (_, record) => (
                <Button
                    type="text"
                    className="text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                />
            ),
        },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* Header Area */}
            <div className="mb-6">
                <Title level={3} className="!mb-1 text-gray-800">Riwayat Transaksi Sesi</Title>
                <Text type="secondary" className="text-sm">
                    Ringkasan seluruh transaksi finansial pada sesi kasir Anda saat ini.
                </Text>
                {activeSession && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium">
                        <ClockCircleOutlined /> Sesi Aktif: {activeSession.nama_sesi || `ID ${activeSession.id_sesi}`}
                    </div>
                )}
            </div>

            {/* Statistik Report Area */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100 h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title={<span className="text-gray-500 font-medium">Open Balance</span>}
                            value={openBalance}
                            precision={0}
                            formatter={(val) => formatRupiah(val)}
                            prefix={<div className="p-2 bg-sky-50 text-sky-600 rounded-lg mr-2"><WalletOutlined /></div>}
                            valueStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.25rem' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100 h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title={<span className="text-gray-500 font-medium">Total Tunai</span>}
                            value={totalTunai}
                            precision={0}
                            formatter={(val) => formatRupiah(val)}
                            prefix={<div className="p-2 bg-green-50 text-green-600 rounded-lg mr-2"><DollarCircleOutlined /></div>}
                            valueStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.25rem' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100 h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title={<span className="text-gray-500 font-medium">Total Non Tunai</span>}
                            value={totalNonTunai}
                            precision={0}
                            formatter={(val) => formatRupiah(val)}
                            prefix={<div className="p-2 bg-amber-50 text-amber-600 rounded-lg mr-2"><CreditCardOutlined /></div>}
                            valueStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.25rem' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100 h-full hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-50 to-white">
                        <Statistic
                            title={<span className="text-indigo-600 font-semibold">Current Balance</span>}
                            value={calculatedCurrentBalance}
                            precision={0}
                            formatter={(val) => formatRupiah(val)}
                            prefix={<div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg mr-2"><AccountBookOutlined /></div>}
                            valueStyle={{ color: '#4338ca', fontWeight: 'bold', fontSize: '1.5rem' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Area */}
            <Card className="shadow-sm rounded-xl border border-gray-100" bodyStyle={{ padding: 0 }}>
                {/* Toolbar di atas Tabel */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
                    <Text strong className="text-gray-700">Daftar Transaksi</Text>
                    <Input
                        placeholder="Cari pelanggan atau meja..." 
                        prefix={<SearchOutlined className="text-gray-400" />}
                        size="middle"
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        className="w-full md:w-72 rounded-lg"
                    />
                </div>

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="key"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 1000 }} // Memberi ruang gulir horizontal yang aman
                        className="custom-table-header"
                    />
                </Spin>
            </Card>

            {/* Modal Detail Transaksi */}
            {selectedRecord && (
                <Modal
                    title={<div className="flex items-center gap-2"><Text strong className="text-lg text-gray-800">Detail Transaksi</Text> <Tag color="blue" className="ml-2 border-none bg-blue-50 text-blue-600">#{selectedRecord.id_transaksi}</Tag></div>}
                    open={isDetailModalVisible}
                    onCancel={handleCloseModal}
                    footer={[ 
                        <Button key="close" type="primary" className="rounded-lg bg-gray-800 hover:bg-gray-700 border-none" onClick={handleCloseModal}>
                            Tutup Detail
                        </Button> 
                    ]}
                    width={600}
                    centered
                    className="rounded-2xl"
                    closeIcon={<div className="bg-gray-100 text-gray-500 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-gray-200 transition-colors">✕</div>}
                >
                    <div className="mt-4">
                        {/* Info Pelanggan & Waktu Singkat */}
                        <div className="flex justify-between items-start mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">Pelanggan</Text>
                                <div className="flex items-center gap-2">
                                    <UserOutlined className="text-gray-400" />
                                    <Text strong className="text-gray-800 text-base">{selectedRecord.nama_pelanggan || 'Guest'}</Text>
                                </div>
                            </div>
                            <div className="text-right">
                                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">Waktu</Text>
                                <Text className="text-gray-700 font-medium">{dayjs(selectedRecord.tanggal_transaksi).format('DD MMM YYYY, HH:mm')}</Text>
                            </div>
                        </div>

                        <Descriptions column={1} size="small" labelStyle={{ color: '#6b7280', width: '140px' }} contentStyle={{ fontWeight: 500, color: '#1f2937' }}>
                            <Descriptions.Item label="Status Order">
                                <Tag className="rounded-md m-0">{selectedRecord.status_order || 'N/A'}</Tag>
                            </Descriptions.Item>
                            
                            <Descriptions.Item label="Metode Bayar">
                                <Tag color={selectedRecord.metode_pembayaran?.toLowerCase() === 'tunai' || selectedRecord.metode_pembayaran?.toLowerCase() === 'cash' ? 'green' : 'blue'} className="rounded-md m-0">
                                    {selectedRecord.metode_pembayaran || 'N/A'}
                                </Tag>
                            </Descriptions.Item>
                            
                            <Descriptions.Item label="Meja/Ruangan">
                                {(selectedRecord.room_items && selectedRecord.room_items !== '-') 
                                    ? selectedRecord.room_items 
                                    : (selectedRecord.lokasi_pemesanan || '-')
                                }
                            </Descriptions.Item>

                            <Descriptions.Item label="Rincian Item">
                                {selectedRecord.fnb_items && selectedRecord.fnb_items !== '-' ? (
                                    <ul className="pl-4 m-0 list-disc text-gray-600 font-normal">
                                        {selectedRecord.fnb_items.split(',').map((item, index) => (
                                            <li key={index} className="mb-1">{item.trim()}</li>
                                        ))}
                                    </ul>
                                ) : <Text type="secondary">-</Text>}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider className="my-4" dashed />

                        {/* Ringkasan Finansial */}
                        <div className="w-full sm:w-2/3 ml-auto space-y-2">
                            <div className="flex justify-between items-center text-gray-500">
                                <Text type="secondary">Subtotal</Text>
                                <Text>{(selectedRecord.subtotal && selectedRecord.subtotal > 0) ? formatRupiah(selectedRecord.subtotal) : '-'}</Text>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                                <Text type="secondary">Pajak</Text>
                                <Text>{(selectedRecord.pajak_nominal && selectedRecord.pajak_nominal > 0) ? formatRupiah(selectedRecord.pajak_nominal) : '-'}</Text>
                            </div>
                            
                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg mt-3 border border-blue-100">
                                <Text strong className="text-blue-800">Total Pembayaran</Text>
                                <Text strong className="text-blue-700 text-lg">
                                    {formatRupiah(selectedRecord.total_harga_final || 0)}
                                </Text>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default HistoryKasir;