import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Button, Spin, message, Modal, Row, Col, Typography, Tag, Empty, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'; // Import ClockCircleOutlined
import { getVORequests, approveVORequest, rejectVORequest } from '../../../services/service';
import dayjs from "dayjs";

const { Title, Text } = Typography;

const VirtualOfficeApproval = () => {
    // --- PERBAIKAN: Sesuaikan state dengan kategori baru ---
    const [requests, setRequests] = useState({
        pending: [],
        waiting_payment: [], // Kategori baru
        active: [],
        rejected: [],
        expired: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getVORequests();
            if (res.message === "OK") {
                setRequests(res.datas);
            }
        } catch (err) {
            message.error("Gagal memuat data permintaan.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (action, clientId) => {
        // ... (Fungsi ini sudah benar, tidak perlu diubah)
        try {
            if (action === 'approve') {
                await approveVORequest(clientId);
                message.success("Permintaan disetujui! Menunggu pembayaran user."); // Pesan diubah
            } else {
                await rejectVORequest(clientId);
                message.success("Permintaan berhasil ditolak!");
            }
            setSelectedRequest(null);
            fetchData(); // Muat ulang data
        } catch (err) {
            message.error("Gagal memproses permintaan.");
        }
    };

    const renderCard = (req) => (
        <Col xs={24} md={12} lg={8} key={req.id_client_vo}>
            <Card hoverable onClick={() => setSelectedRequest(req)}>
                <Card.Meta
                    title={req.nama_perusahaan_klien}
                    description={`Oleh: ${req.nama_user}`}
                />
                <div style={{ marginTop: 16 }}>
                    <Text strong>{req.nama_paket}</Text><br />
                    {/* --- PERBAIKAN: Gunakan tanggal_pengajuan --- */}
                    {/* Tampilkan tgl mulai HANYA jika sudah 'Aktif'/'Kadaluarsa' */}
                    {(req.status_client_vo === 'Aktif' || req.status_client_vo === 'Kadaluarsa') ? (
                        <Text type="secondary">Aktif: {dayjs(req.tanggal_mulai).format("DD MMM YYYY")}</Text>
                    ) : (
                        <Text type="secondary">Diajukan: {dayjs(req.tanggal_pengajuan).format("DD MMM YYYY")}</Text>
                    )}
                </div>
            </Card>
        </Col>
    );

    // --- PERBAIKAN: Tambahkan tab 'Menunggu Pembayaran' ---
    const tabItems = [
        { key: 'pending', label: `Pending (${requests.pending.length})`, children: <Row gutter={[16, 16]}>{requests.pending.map(renderCard)}</Row> },
        { key: 'waiting_payment', label: `Menunggu Pembayaran (${requests.waiting_payment.length})`, children: <Row gutter={[16, 16]}>{requests.waiting_payment.map(renderCard)}</Row> },
        { key: 'active', label: `Aktif (${requests.active.length})`, children: <Row gutter={[16, 16]}>{requests.active.map(renderCard)}</Row> },
        { key: 'rejected', label: `Ditolak (${requests.rejected.length})`, children: <Row gutter={[16, 16]}>{requests.rejected.map(renderCard)}</Row> },
        { key: 'expired', label: `Kadaluarsa (${requests.expired.length})`, children: <Row gutter={[16, 16]}>{requests.expired.map(renderCard)}</Row> },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Persetujuan Virtual Office</Title>
            {loading ? <Spin /> : <Tabs defaultActiveKey="pending" items={tabItems} />}

            <Modal
                title="Detail Permintaan Virtual Office"
                open={!!selectedRequest}
                onCancel={() => setSelectedRequest(null)}
                footer={
                    // --- PERBAIKAN: Cek status 'Menunggu Persetujuan' ---
                    selectedRequest?.status_client_vo === 'Menunggu Persetujuan' ? [
                        <Button key="reject" danger onClick={() => handleAction('reject', selectedRequest.id_client_vo)} icon={<CloseCircleOutlined />}>Tolak</Button>,
                        <Button key="approve" type="primary" onClick={() => handleAction('approve', selectedRequest.id_client_vo)} icon={<CheckCircleOutlined />}>Setujui Pendaftaran</Button>,
                    ] : null
                }
            >
                {selectedRequest && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <p><strong>Nama Perusahaan:</strong> {selectedRequest.nama_perusahaan_klien}</p>
                        <p><strong>Nama Klien:</strong> {selectedRequest.nama_user}</p>
                        <p><strong>Paket:</strong> {selectedRequest.nama_paket}</p>

                        {/* --- PERBAIKAN: Tampilkan tanggal secara dinamis --- */}
                        <p><strong>Tanggal Pengajuan:</strong> {dayjs(selectedRequest.tanggal_pengajuan).format("DD MMMM YYYY")}</p>

                        {(selectedRequest.status_client_vo === 'Aktif' || selectedRequest.status_client_vo === 'Kadaluarsa') && (
                            <>
                                <p><strong>Tanggal Mulai:</strong> {dayjs(selectedRequest.tanggal_mulai).format("DD MMMM YYYY")}</p>
                                <p><strong>Tanggal Berakhir:</strong> {dayjs(selectedRequest.tanggal_berakhir).format("DD MMMM YYYY")}</p>
                            </>
                        )}

                        <p><strong>Status:</strong> <Tag
                            color={
                                selectedRequest.status_client_vo === 'Menunggu Persetujuan' ? 'blue' :
                                    selectedRequest.status_client_vo === 'Menunggu Pembayaran' ? 'gold' :
                                        selectedRequest.status_client_vo === 'Aktif' ? 'green' :
                                            selectedRequest.status_client_vo === 'Ditolak' ? 'red' : 'default'
                            }
                            icon={
                                selectedRequest.status_client_vo === 'Menunggu Persetujuan' ? <ClockCircleOutlined /> :
                                    selectedRequest.status_client_vo === 'Menunggu Pembayaran' ? <ClockCircleOutlined /> : null
                            }
                        >
                            {selectedRequest.status_client_vo}
                        </Tag></p>

                        {/* TODO: Tambahkan link untuk melihat dokumen (selectedRequest.doc_path) */}
                        {selectedRequest.doc_path && (
                            <p><strong>Dokumen:</strong>
                                <a
                                    href={`${import.meta.env.VITE_BASE_URL}/uploads/vo_documents/${selectedRequest.doc_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Lihat Dokumen
                                </a>
                            </p>
                        )}
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default VirtualOfficeApproval;