import React, { useState, useEffect, useContext } from "react";
import {
    Form,
    Input,
    Button,
    Row,
    Col,
    Typography,
    Card,
    Upload,
    message,
    Spin,
    Alert,
    Steps,
    Divider,
    InputNumber,
} from "antd";
import {
    BankOutlined,
    AppstoreOutlined,
    HomeOutlined,
    MailOutlined,
    UserOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";

// Impor service yang relevan
import { registerVirtualOffice, getPaketVO } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";

const { Title, Text } = Typography;

const DaftarVO = () => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paket, setPaket] = useState(null);
    const [loadingPaket, setLoadingPaket] = useState(true);

    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useContext(AuthContext);

    // Ambil data paket dari API saat komponen dimuat
    useEffect(() => {
        const fetchPaket = async () => {
            try {
                const result = await getPaketVO();
                if (result.message === "OK") {
                    const foundPaket = result.datas.find(p => p.id_paket_vo == id);
                    if (foundPaket) {
                        setPaket(foundPaket);
                    } else {
                        message.error("Paket Virtual Office tidak ditemukan!");
                        navigate('/virtual-office');
                    }
                } else {
                    message.error("Gagal memuat data paket.");
                }
            } catch (error) {
                message.error("Gagal memuat detail paket.");
            } finally {
                setLoadingPaket(false);
            }
        };
        fetchPaket();
    }, [id, navigate]);

    // Fungsi untuk mengirim data pendaftaran ke backend
    const onFinish = async (values) => {
        setIsSubmitting(true);
        const dataPayload = new FormData();

        const docFile = values.dokumenPendukung[0]?.originFileObj;
        if (docFile) {
            dataPayload.append("dokumenPendukung", docFile);
        } else {
            message.error("Dokumen pendukung wajib diunggah.");
            setIsSubmitting(false);
            return;
        }

        // Menambahkan semua data form ke payload
        dataPayload.append("id_user", userProfile?.id_user || "");
        dataPayload.append("id_paket_vo", id);
        dataPayload.append("nama", values.namaPelanggan);
        dataPayload.append("jabatan", values.jabatan);
        dataPayload.append("nama_perusahaan_klien", values.namaPerusahaan);
        dataPayload.append("bidang_perusahaan", values.bidangUsaha);
        dataPayload.append("alamat_perusahaan", values.alamatPerusahaan);
        dataPayload.append("email_perusahaan", values.emailPerusahaan);
        dataPayload.append("alamat_domisili", values.alamatDomisili);
        dataPayload.append("nomor_telepon", values.nomorTelepon);
        // Tanggal mulai dan bukti pembayaran tidak lagi dikirim dari sini

        try {
            const res = await registerVirtualOffice(dataPayload);
            if (res.message === "OK") {
                message.success("Pendaftaran berhasil dikirim! Anda akan dialihkan untuk melihat status pendaftaran.");
                // Arahkan ke halaman status/riwayat setelah berhasil
                setTimeout(() => navigate("/cek-masa-vo"), 2000);
            } else {
                message.error(res.error || "Gagal mendaftar Virtual Office");
            }
        } catch (error) {
            console.error("Error daftar VO:", error);
            message.error("Terjadi kesalahan server saat pendaftaran.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingPaket) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spin size="large" tip="Memuat detail paket..." /></div>;
    }

    if (!paket) {
        return <div style={{ padding: '40px' }}><Alert type="error" message="Paket Tidak Ditemukan" description="Paket yang Anda cari tidak ada atau telah dihapus." showIcon /></div>;
    }

    return (
        <Row justify="center" style={{ padding: "24px", minHeight: "100vh", background: '#f0f2f5' }}>
            <Col xs={24} sm={22} md={20} lg={18} xl={14}>
                <Card style={{ borderRadius: "16px", boxShadow: "0 6px 18px rgba(0,0,0,0.08)", padding: "32px" }}>
                    <Title level={3} style={{ textAlign: "center", marginBottom: "8px", color: "#1e3a8a" }}>
                        Form Pendaftaran Virtual Office
                    </Title>
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '32px' }}>
                        Paket: <strong>{paket.nama_paket}</strong>
                    </Text>

                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Title level={5} style={{ color: "#2563eb", marginTop: "12px" }}>Data Perusahaan</Title>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="namaPerusahaan" label="Nama Perusahaan" rules={[{ required: true, message: "Masukkan nama perusahaan" }]}>
                                    <Input prefix={<BankOutlined style={{ color: "#2563eb" }} />} placeholder="Nama Perusahaan" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="bidangUsaha" label="Bidang Usaha" rules={[{ required: true, message: "Masukkan bidang usaha" }]}>
                                    <Input prefix={<AppstoreOutlined style={{ color: "#2563eb" }} />} placeholder="Bidang Usaha" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="alamatPerusahaan" label="Alamat Perusahaan" rules={[{ required: true, message: "Tambahkan alamat perusahaan" }]}>
                            <Input prefix={<HomeOutlined style={{ color: "#2563eb" }} />} placeholder="Alamat Perusahaan" />
                        </Form.Item>
                        <Form.Item name="emailPerusahaan" label="Email Perusahaan" rules={[{ type: "email", message: "Email tidak valid" }, { required: true, message: "Masukkan email perusahaan" }]}>
                            <Input prefix={<MailOutlined style={{ color: "#2563eb" }} />} placeholder="Email Perusahaan" />
                        </Form.Item>

                        <Divider />

                        <Title level={5} style={{ color: "#2563eb", marginTop: "24px" }}>Data Pimpinan</Title>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="namaPelanggan" label="Nama Pimpinan" rules={[{ required: true, message: "Masukkan nama" }]}>
                                    <Input prefix={<UserOutlined style={{ color: "#2563eb" }} />} placeholder="Nama Pimpinan atau Pemilik Usaha" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="jabatan" label="Jabatan" rules={[{ required: true, message: "Masukkan jabatan" }]}>
                                    <Input prefix={<TeamOutlined style={{ color: "#2563eb" }} />} placeholder="Jabatan" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="alamatDomisili" label="Alamat Domisili" rules={[{ required: true, message: "Tambahkan alamat domisili" }]}>
                            <Input prefix={<EnvironmentOutlined style={{ color: "#2563eb" }} />} placeholder="Alamat Domisili" />
                        </Form.Item>
                        <Form.Item
                            name="nomorTelepon"
                            label="Nomor Telepon"
                            rules={[
                                {
                                    required: true,
                                    message: "Masukkan nomor telepon",
                                },
                                {
                                    // Ini adalah regex untuk memastikan input HANYA terdiri dari angka (digits)
                                    pattern: /^\d+$/,
                                    message: "Nomor telepon hanya boleh berisi angka",
                                },
                                {
                                    // Opsional: Atur panjang minimum dan maksimum
                                    min: 10,
                                    message: "Nomor telepon minimal 10 digit",
                                },
                                {
                                    max: 15,
                                    message: "Nomor telepon maksimal 15 digit",
                                }
                            ]}
                        >
                            <Input
                                type="tel" // Membantu keyboard mobile
                                prefix={<PhoneOutlined style={{ color: "#2563eb" }} />}
                                placeholder="Contoh: 08123456789"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Divider />

                        <Form.Item
                            name="dokumenPendukung"
                            label="Upload Dokumen Pendukung (KTP/Akta Perusahaan)"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                            rules={[{ required: true, message: "Silakan upload dokumen pendukung" }]}
                        >
                            <Upload name="file" beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.png">
                                <Button icon={<UploadOutlined />}>Pilih File (PDF/JPG/PNG)</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item style={{ marginTop: '32px' }}>
                            <Button type="primary" htmlType="submit" block loading={isSubmitting} style={{ borderRadius: "10px", backgroundColor: "#2563eb", fontWeight: "bold", height: "45px" }}>
                                Kirim Pendaftaran
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default DaftarVO;
