import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button, Table, Tag, Modal, message, Spin, Descriptions } from "antd";
import { PrinterOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getTransaksiBySessionId } from "../../../services/service"; // Import service baru
import { formatRupiah } from "../../../utils/formatRupiah";
import { useAuth } from "../../../providers/AuthProvider";

// Gunakan OrderCard yang sama (bisa diextract jadi component terpisah, tapi disini saya copy simplenya)
const OrderCard = ({ order, onClick }) => (
    <div
        className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer mb-3"
        onClick={() => onClick(order)}
    >
        <div className="flex-1 min-w-0 mr-4">
            <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-base text-gray-800 truncate">
                    #{order.id} - {order.name}
                </div>
                <Tag color={order.status === 'Selesai' ? 'green' : 'orange'}>{order.status}</Tag>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>{dayjs(order.time).format("DD/MM/YY HH:mm")}</span>
                <span className="font-bold text-blue-600">{formatRupiah(order.price)}</span>
            </div>
        </div>
    </div>
);

const RiwayatSesiDetail = () => {
    const { id } = useParams(); // Ambil ID Sesi dari URL
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const sessionInfo = location.state?.sessionData || {}; // Data nama sesi dll dari halaman sebelumnya

    // Fetch Data saat halaman dibuka
    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (sessionId) => {
        setLoading(true);
        try {
            const result = await getTransaksiBySessionId(sessionId);
            // Mapping data agar sesuai struktur OrderCard (sama seperti di TransaksiKasir)
            const mappedOrders = result.datas?.map((o) => ({
                id: o.id,
                name: o.customer || "Guest",
                location: o.location || "-",
                status: o.status_pesanan || 'N/A',
                price: parseFloat(o.total) || 0,
                items: o.items || [],
                bookings: o.bookings || [],
                time: o.time,
                type: o.type,
                payment_status: o.payment_status,
                payment_method: o.payment_method,
                subtotal: parseFloat(o.subtotal) || 0,
                tax_nominal: parseFloat(o.tax_nominal) || 0,
                tax_percent: parseFloat(o.tax_percent) || 0,
                uang_diterima: parseFloat(o.uang_diterima) || 0,
                kembalian: parseFloat(o.kembalian) || 0,
            })) || [];
            setOrders(mappedOrders);
        } catch (err) {
            message.error("Gagal memuat detail sesi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIKA PRINT (Copy dari TransaksiKasir) ---
    const handlePrintReceipt = () => {
        if (!selectedOrder) return;
        setIsPrinting(true);

        const discountNominal = (selectedOrder.subtotal + selectedOrder.tax_nominal) - selectedOrder.price;
        const fixedDiscount = discountNominal > 0.01 ? discountNominal : 0;
        const namaKasir = userProfile?.detail?.nama || 'Admin'; // Nama kasir yg reprint

        const formattedFnbItems = (selectedOrder.items || []).map(item => ({
            name: item.product || 'Item F&B',
            qty: item.qty,
            price: item.price,
            note: item.note
        }));

        const formattedBookingItems = (selectedOrder.bookings || []).map(booking => {
             // Konversi duration (menit) ke jam jika perlu
             return {
                name: booking.room_name || 'Ruangan',
                price: booking.booked_price,
                bookingData: {
                    durasi_jam: (booking.duration || 0) / 60,
                    waktu_mulai_jam: dayjs(booking.start_time).hour(),
                }
            };
        });

        let printerPaymentMethod = selectedOrder.payment_method;
        if (printerPaymentMethod && printerPaymentMethod.toUpperCase() === 'TUNAI') {
            printerPaymentMethod = 'CASH';
        }

        const dataToPrint = {
            id: selectedOrder.id,
            time: selectedOrder.time,
            cashier: namaKasir + " (Reprint)", // Tandai sebagai reprint
            customer: selectedOrder.name,
            location: selectedOrder.location,
            items: formattedFnbItems,
            bookings: formattedBookingItems,
            subtotal: selectedOrder.subtotal,
            tax: selectedOrder.tax_nominal,
            discount: fixedDiscount,
            total: selectedOrder.price,
            paymentMethod: printerPaymentMethod,
            tunai: selectedOrder.uang_diterima || 0,
            kembali: selectedOrder.kembalian || 0
        };

        if (window.flutter_inappwebview) {
            window.flutter_inappwebview.callHandler('flutterPrintHandler', dataToPrint);
            message.info("Mencetak ulang struk...");
        } else {
            message.warning("Printer tidak terdeteksi (Mode Web). Cek console.");
            console.log("DATA PRINT:", dataToPrint);
        }

        setTimeout(() => setIsPrinting(false), 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header Navigasi */}
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Riwayat Sesi</h2>
                        <p className="text-sm text-gray-500">{sessionInfo.nama_sesi || `ID Sesi: ${id}`}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Total Transaksi</p>
                    <p className="text-xl font-bold text-blue-600">{orders.length}</p>
                </div>
            </div>

            {/* Content List */}
            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-10"><Spin size="large" tip="Memuat riwayat..." /></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Tidak ada transaksi di sesi ini.</div>
                ) : (
                    orders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onClick={(o) => { setSelectedOrder(o); setIsModalVisible(true); }} 
                        />
                    ))
                )}
            </div>

            {/* Modal Detail (Read Only + Print) */}
            <Modal
                title={`Detail Transaksi #${selectedOrder?.id}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>Tutup</Button>,
                    <Button 
                        key="print" 
                        type="primary" 
                        icon={<PrinterOutlined />} 
                        loading={isPrinting}
                        onClick={handlePrintReceipt}
                    >
                        Cetak Ulang
                    </Button>
                ]}
            >
                {selectedOrder && (
                    <div className="space-y-3">
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Customer">{selectedOrder.name}</Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag color="blue">{selectedOrder.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Pembayaran">{selectedOrder.payment_status} ({selectedOrder.payment_method})</Descriptions.Item>
                            <Descriptions.Item label="Total"><span className="font-bold">{formatRupiah(selectedOrder.price)}</span></Descriptions.Item>
                        </Descriptions>
                        
                        {/* Tampilkan item ringkas */}
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-bold text-gray-500 mb-2">ITEM:</p>
                            {selectedOrder.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm mb-1">
                                    <span>{item.product} x{item.qty}</span>
                                    <span>{formatRupiah(item.price * item.qty)}</span>
                                </div>
                            ))}
                            {selectedOrder.bookings.map((book, i) => (
                                <div key={i} className="flex justify-between text-sm mb-1 text-blue-600">
                                    <span>Booking: {book.room_name}</span>
                                    <span>{formatRupiah(book.booked_price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RiwayatSesiDetail;