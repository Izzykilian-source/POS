/* eslint-disable no-unused-vars */
// src/pages/Kasir/BuatOrderKasir/BuatOrderKasir.jsx
import { Button, Form, Input, Radio, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "../../../providers/AuthProvider";

const BuatOrderKasir = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { userProfile, activeSession } = useAuth();
    
    // Watch nilai orderType untuk menampilkan/menyembunyikan input meja
    const orderType = Form.useWatch("orderType", form);

    // Ambil identitas kasir
    const cashierName = userProfile?.detail?.nama || userProfile?.email || "Kasir";

    const onFinish = (values) => {
        // VALIDASI KRITIS: Pastikan Sesi Kasir Benar-benar Aktif
        if (!activeSession?.id_sesi) {
            console.error("Missing Session ID!");
            message.error("Gagal membuat order: Sesi kasir belum dibuka atau tidak ditemukan!");
            return;
        }

        console.log("Navigating to OrderKasir with Session:", activeSession.id_sesi);

        // Navigasi ke halaman utama menu dengan membawa data awal dan ID SESI
        navigate('/orderkasir', {
            state: {
                orderType: values.orderType,
                customerName: values.customerName || "Guest",
                room: values.room || (values.orderType !== 'dinein' ? "Takeaway" : null),
                // PENTING: Meneruskan ID Sesi agar pesanan tersimpan di sesi yang benar
                id_sesi: activeSession.id_sesi 
            }
        });
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <Card
                title={
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Buat Order Baru</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            ID Sesi: {activeSession?.id_sesi || "Tidak Ada"}
                        </span>
                    </div>
                }
                style={{ width: "100%", maxWidth: 450 }}
                className="shadow-xl rounded-2xl"
            >
                <div className="flex items-center gap-2 text-gray-500 mb-6 border-b pb-4">
                    <UserOutlined />
                    <span className="font-medium">{cashierName}</span>
                    <span className="mx-2">|</span>
                    <span>{dayjs().format("DD MMM YYYY HH:mm")}</span>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ orderType: "dinein" }}
                    requiredMark={false}
                >
                    <Form.Item
                        label={<span className="font-semibold">Tipe Order</span>}
                        name="orderType"
                        rules={[{ required: true, message: "Pilih tipe order!" }]}
                    >
                        <Radio.Group className="w-full" buttonStyle="solid">
                            <Radio.Button value="dinein" className="w-1/3 text-center">Dine In</Radio.Button>
                            <Radio.Button value="takeaway" className="w-1/3 text-center">Takeaway</Radio.Button>
                            <Radio.Button value="pickup" className="w-1/3 text-center">Pick Up</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-semibold">Nama Pelanggan</span>}
                        name="customerName"
                    >
                        <Input size="large" placeholder="Masukkan nama pelanggan (opsional)" />
                    </Form.Item>

                    {orderType === "dinein" && (
                        <Form.Item
                            label={<span className="font-semibold">Nomor Meja / Ruangan</span>}
                            name="room"
                            rules={[{ required: true, message: "Nomor meja wajib untuk Dine In!" }]}
                        >
                            <Input size="large" placeholder="Contoh: Meja 05 / VIP 1" />
                        </Form.Item>
                    )}

                    <div className="mt-8">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            icon={<ArrowRightOutlined />}
                            className="h-12 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700"
                        >
                            Buka Menu Pemesanan
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default BuatOrderKasir;