// src/pages/Kasir/TransaksiKasir/TransaksiKasir.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Button,
    Table,
    Tag,
    Select,
    Input,
    Modal,
    message,
    Spin,
    Card,
    Descriptions,
    Progress
} from "antd";
import { PlusOutlined, EditOutlined, PrinterOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Pie } from "@ant-design/charts";
import {
    getDataTransaksiKasir,
    getTransaksiBySessionId,
    updatePaymentStatus,
    updateBatalStatus
} from "../../../services/service.js";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { formatRupiah } from "../../../utils/formatRupiah";
import { useAuth } from "../../../providers/AuthProvider";
import logoDago from "../../../assets/images/logo.png"; // Pastikan path logo benar

const { Option } = Select;

const CHART_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
];

const OrderCard = ({ order, getStatusColor, getDisplayStatus, getPaymentStatusColor, onClick }) => (
    <div
        className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
        onClick={() => onClick(order)}
    >
        <div className="flex-1 min-w-0 mr-4">
            <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-base text-gray-800 tracking-wide truncate">
                    {order.name} {order.location && order.location !== '-' ? `(${order.location})` : ''}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Tag color={getStatusColor(order.status)} className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm">
                        {getDisplayStatus(order.status).toUpperCase()}
                    </Tag>
                    <Tag color={getPaymentStatusColor(order.payment_status)} className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm">
                        {order.payment_status.toUpperCase()}
                    </Tag>
                    <Tag color={order.type === 'Booking' ? 'purple' : 'cyan'} className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm border-none">
                        {order.type}
                    </Tag>
                </div>
            </div>
            <p className="text-xs text-gray-400">{dayjs(order.time).format("DD/MM/YY HH:mm")}</p>
        </div>
    </div>
);

const TransaksiKasir = () => {
    const { id } = useParams();
    const isHistoryMode = !!id;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterPayment, setFilterPayment] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const notificationSound = useRef(null);
    const knownTransactionIds = useRef(new Set());

    const { activeSession, isSessionLoading, userProfile } = useAuth();
    const namaKasirLogin = userProfile?.detail?.nama || userProfile?.email || 'Kasir';

    useEffect(() => {
        notificationSound.current = new Audio("/sounds/notification.mp3");
    }, []);

    // --- Fetch Data ---
    const fetchAndCheckOrders = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            let result;
            if (isHistoryMode) {
                result = await getTransaksiBySessionId(id);
            } else {
                result = await getDataTransaksiKasir();
            }

            if (result.message !== "OK") {
                throw new Error(result.error || "Gagal mengambil data transaksi");
            }

            const fetchedOrders = result.datas?.map((o) => {
                const isBooking = o.type === 'Booking';
                let orderLocation = o.location || "-";

                if (isBooking && o.bookings && o.bookings.length > 0) {
                    orderLocation = o.bookings.map(b => b.room_name).join(', ');
                }

                return {
                    id: o.id,
                    name: o.customer || "Guest",
                    location: orderLocation,
                    status: o.status_pesanan || 'N/A',
                    price: parseFloat(o.total) || 0,
                    items: o.items || [],
                    bookings: (o.bookings || []).map(b => ({
                        ...b,
                        booked_price: parseFloat(b.booked_price || 0)
                    })),
                    time: o.time || new Date().toISOString(),
                    type: o.type || 'N/A',
                    payment_status: o.payment_status || 'N/A',
                    payment_method: o.payment_method || '-',

                    subtotal: parseFloat(o.subtotal) || 0,
                    tax_nominal: parseFloat(o.tax_nominal) || 0,
                    tax_percent: parseFloat(o.tax_percent) || 0,
                    uang_diterima: parseFloat(o.uang_diterima) || 0,
                    kembalian: parseFloat(o.kembalian) || 0,

                    // --- DATA VOUCHER ---
                    vouchers: o.vouchers || [] // Ambil data voucher dari API
                    // --------------------
                };
            }) || [];

            if (!isHistoryMode) {
                const currentIds = new Set(fetchedOrders.map(o => o.id));
                const hasNewOrder = fetchedOrders.some(
                    (order) => !knownTransactionIds.current.has(order.id)
                );
                if (hasNewOrder && knownTransactionIds.current.size > 0 && notificationSound.current) {
                    notificationSound.current.play().catch((e) => console.error("Audio play failed:", e));
                }
                knownTransactionIds.current = currentIds;
            }

            setOrders(fetchedOrders);

        } catch (err) {
            console.error("Fetch error:", err);
            if (isInitialLoad) {
                message.error(`Gagal memuat data: ${err.message}`);
            }
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [id, isHistoryMode]);

    useEffect(() => {
        let intervalId = null;

        if (isHistoryMode) {
            fetchAndCheckOrders(true);
        } else {
            if (isSessionLoading) {
                setLoading(true);
                return;
            }
            if (activeSession) {
                fetchAndCheckOrders(true);
                intervalId = setInterval(() => fetchAndCheckOrders(false), 15000);
            } else {
                setLoading(false);
                setOrders([]);
                knownTransactionIds.current.clear();
            }
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeSession, isSessionLoading, fetchAndCheckOrders, isHistoryMode]);

    const getStatusColor = (status) => {
        switch (status) {
            case "Baru": return "blue";
            case "Diproses": return "orange";
            case "Sebagian Diproses": return "orange";
            case "Selesai": return "green";
            case "Batal": return "red";
            default: return "default";
        }
    };
    const getPaymentStatusColor = (paymentStatus) => {
        switch (paymentStatus) {
            case "Lunas": return "green";
            case "Belum Lunas": return "red";
            case "Disimpan": return "geekblue";
            case "Dibatalkan": return "red";
            default: return "default";
        }
    };
    const getDisplayStatus = (status) => status || 'N/A';

    // --- Logic Filter & Summary (Sama seperti sebelumnya) ---
    // ...
    // Saya sarankan ubah nama variabel dari 'filteredOrders' menjadi 'filteredOrders' agar lebih akurat
    const filteredOrders = useMemo(() => orders
        // HAPUS BARIS FILTER BOOKING DISINI
        .filter((order) => {
            // Logika filter dropdown
            if (filterStatus !== "all") {
                if (filterStatus === "Diproses") {
                    if (order.status !== "Diproses" && order.status !== "Sebagian Diproses") return false;
                } else if (order.status !== filterStatus) return false;
            }

            if (filterType !== "all") {
                const typeMap = {
                    dinein: "Dine In",
                    takeaway: "Takeaway",
                    pickup: "Pick Up",
                    booking: "Booking" // Tambahkan mapping ini
                };

                // Handle khusus jika filterType bukan Booking tapi ordernya Booking
                if (order.type === 'Booking' && filterType !== 'booking') {
                    // Jika user ingin filter Dine In, maka Booking jangan muncul
                    // Kecuali Anda ingin Booking muncul di 'all' saja
                    if (filterType !== 'all') return false;
                } else {
                    if (order.type.toLowerCase() !== typeMap[filterType]?.toLowerCase()) return false;
                }
            }

            if (filterPayment !== "all") {
                if (order.payment_status !== filterPayment) return false;
            }

            if (searchText) {
                const searchLower = searchText.toLowerCase();
                // ... (logika search tetap sama)
                const itemMatch = order.items?.some(item => item.product?.toLowerCase().includes(searchLower));
                // Tambahkan pencarian berdasarkan nama ruangan juga jika perlu
                const bookingMatch = order.bookings?.some(b => b.room_name?.toLowerCase().includes(searchLower));

                return (
                    order.name?.toLowerCase().includes(searchLower) ||
                    order.location?.toLowerCase().includes(searchLower) ||
                    order.id?.toString().includes(searchLower) ||
                    itemMatch ||
                    bookingMatch // Tambahkan ini
                );
            }
            return true;
        }), [orders, filterStatus, filterType, filterPayment, searchText]);

    const totalSales = useMemo(() =>
        filteredOrders
            .filter(order => order.payment_status === 'Lunas')
            .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
        , [filteredOrders]);

    const productSummary = useMemo(() => filteredOrders
        .filter(order => order.payment_status === 'Lunas')
        .reduce((acc, order) => {
            order.items?.forEach((item) => {
                const productName = item.product || 'Unknown Product';
                if (!acc[productName]) acc[productName] = { qty: 0, total: 0 };
                acc[productName].qty += (item.qty || 0);
                acc[productName].total += (item.price || 0) * (item.qty || 0);
            });
            return acc;
        }, {})
        , [filteredOrders]);

    const topProducts = useMemo(() => Object.entries(productSummary)
        .map(([product, data], index) => ({
            key: index + 1,
            item: product,
            qty: data.qty,
            total: formatRupiah(data.total),
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        , [productSummary]);

    const tenantSummary = useMemo(() => {
        const summary = filteredOrders
            .filter(order => order.payment_status === 'Lunas')
            .reduce((acc, order) => {
                order.items?.forEach((item) => {
                    const tenantName = item.tenant_name || 'Lainnya';
                    if (!acc[tenantName]) acc[tenantName] = 0;
                    acc[tenantName] += (item.price || 0) * (item.qty || 0);
                });
                return acc;
            }, {});

        return Object.entries(summary).map(([tenantName, total]) => ({
            type: tenantName,
            value: total,
        }));
    }, [filteredOrders]);

    const totalTenantSales = useMemo(() =>
        tenantSummary.reduce((sum, item) => sum + item.value, 0)
        , [tenantSummary]);

    const pieConfig = {
        data: tenantSummary,
        angleField: 'value',
        colorField: 'type',
        color: CHART_COLORS,
        radius: 0.85,
        innerRadius: 0.6,
        label: { type: 'inner', offset: '-50%', content: '{value}', style: { textAlign: 'center', fontSize: 12, fill: '#fff' } },
        legend: false,
        tooltip: false,
        interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
        animation: { appear: { animation: 'wave-in', duration: 500 } },
    };

    // --- Handler Modal ---
    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const handleCloseDetail = () => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedOrder(null), 300);
    };

    const handleMarkAsPaid = async () => {
        if (isHistoryMode) return;
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return;
        setIsUpdating(true);
        try {
            await updatePaymentStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Lunas.`);
            handleCloseDetail();
            await fetchAndCheckOrders(false);
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkAsBatal = async () => {
        if (isHistoryMode) return;
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return;
        setIsUpdating(true);
        try {
            await updateBatalStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Dibatalkan.`);
            handleCloseDetail();
            await fetchAndCheckOrders(false);
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleContinueOrder = () => {
        if (isHistoryMode) return;
        if (!selectedOrder || selectedOrder.payment_status !== 'Disimpan') return;
        handleCloseDetail();
        navigate('/orderkasir', { state: { savedOrderId: selectedOrder.id } });
    };

    // --- FITUR CETAK ULANG ---
    const handlePrintReceipt = () => {
        if (!selectedOrder) return;

        console.log("Tombol Cetak Struk diklik...");
        setIsPrinting(true);

        // Hitung Diskon Manual
        const discountNominal = (selectedOrder.subtotal + selectedOrder.tax_nominal) - selectedOrder.price;
        const fixedDiscount = discountNominal > 0.01 ? discountNominal : 0;

        // Format F&B Items
        const formattedFnbItems = (selectedOrder.items || []).map(item => ({
            name: item.product || 'Item F&B',
            qty: item.qty,
            price: item.price,
            note: item.note
        }));

        // Format Booking Items
        const formattedBookingItems = (selectedOrder.bookings || []).map(booking => {
            const startTime = dayjs(booking.start_time);
            const durationHours = (booking.duration || 0) / 60;

            return {
                name: booking.room_name || 'Ruangan',
                price: booking.booked_price,
                bookingData: {
                    durasi_jam: durationHours,
                    waktu_mulai_jam: startTime.hour(),
                }
            };
        });

        // Format Voucher (AMBIL DARI DATA DB YANG SUDAH DI-FETCH)
        const formattedVouchers = (selectedOrder.vouchers || []).map(v => ({
            profile: v.profile, // ex: shop-2h
            code: v.code        // ex: s25kjr9f
        }));

        let printerPaymentMethod = selectedOrder.payment_method;
        if (printerPaymentMethod && printerPaymentMethod.toUpperCase() === 'TUNAI') {
            printerPaymentMethod = 'CASH';
        }

        const dataToPrint = {
            id: selectedOrder.id,
            time: selectedOrder.time,
            cashier: namaKasirLogin + (isHistoryMode ? " (Arsip)" : ""),
            customer: selectedOrder.name,
            location: selectedOrder.location,
            items: formattedFnbItems,
            bookings: formattedBookingItems,
            vouchers: formattedVouchers, // Kirim Voucher ke Flutter

            subtotal: selectedOrder.subtotal,
            tax: selectedOrder.tax_nominal,
            discount: fixedDiscount,
            total: selectedOrder.price,
            paymentMethod: printerPaymentMethod,
            tunai: selectedOrder.uang_diterima || 0,
            kembali: selectedOrder.kembalian || 0
        };

        if (window.flutter_inappwebview) {
            console.log("Mengirim data ke printer:", dataToPrint);
            window.flutter_inappwebview.callHandler('flutterPrintHandler', dataToPrint);
            message.info("Mencetak struk...");
        } else {
            message.error("Printer tidak ditemukan (Mode Web).");
            console.log("Data Print:", dataToPrint);
        }

        setTimeout(() => {
            setIsPrinting(false);
        }, 2000);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* LEFT PANEL */}
            <div className="flex-1 bg-white p-5 overflow-y-auto rounded-r-3xl shadow-inner custom-scrollbar">
                {/* Header & Search ... (Sama) */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        {isHistoryMode && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                type="text"
                                onClick={() => navigate('/kasir/buka-sesi')}
                                className="mr-2"
                            />
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {isHistoryMode ? `Riwayat Sesi #${id}` : "Welcome"}
                            </h2>
                            <p className="text-sm text-gray-500">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>
                </div>
                <div className="pb-3">
                    <Input.Search placeholder="Cari ID, nama customer, lokasi/ruangan, atau produk..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="rounded-lg" allowClear />
                </div>

                {/* Filters ... (Sama) */}
                <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Select value={filterStatus} onChange={setFilterStatus} className="w-full md:w-auto md:min-w-[180px]">
                            <Option value="all">Semua Status Order</Option>
                            <Option value="Baru">Baru</Option>
                            <Option value="Diproses">Diproses</Option>
                            <Option value="Selesai">Selesai</Option>
                            <Option value="Batal">Batal</Option>
                            <Option value="Sebagian Diproses">Sebagian Diproses</Option>
                        </Select>
                        <Select value={filterType} onChange={setFilterType} className="w-full md:w-auto md:min-w-[180px]">
                            <Option value="all">Semua Tipe Order F&B</Option>
                            <Option value="dinein">Dine In</Option>
                            <Option value="takeaway">Takeaway</Option>
                            <Option value="pickup">Pick Up</Option>
                            <Option value="booking">Booking Ruangan</Option>
                        </Select>
                        <Select value={filterPayment} onChange={setFilterPayment} className="w-full md:w-auto md:min-w-[180px]">
                            <Option value="all">Semua Status Bayar</Option>
                            <Option value="Lunas">Lunas</Option>
                            <Option value="Belum Lunas">Belum Lunas</Option>
                            <Option value="Disimpan">Disimpan</Option>
                            <Option value="Dibatalkan">Dibatalkan</Option>
                        </Select>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/buatorderkasir')}
                        className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        disabled={isHistoryMode}
                    >
                        Order Baru
                    </Button>
                </div>

                {/* Order List */}
                <h3 className="font-semibold mb-2 text-gray-700">Transaksi F&B ({filteredOrders.length})</h3>
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center py-16"><Spin tip="Memuat transaksi..." size="large" /></div>
                    ) : orders.length === 0 && !loading ? (
                        <div className="text-center py-8 text-gray-400">{activeSession ? "Tidak ada transaksi pada sesi ini." : "Tidak ada sesi kasir yang aktif."}</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Tidak ada transaksi F&B yang cocok dengan filter.</div>
                    ) : (
                        filteredOrders.map((order) => (
                            <OrderCard key={order.id} order={order} getStatusColor={getStatusColor} getDisplayStatus={getDisplayStatus} getPaymentStatusColor={getPaymentStatusColor} onClick={handleOrderClick} />
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL (Summary) ... (Sama) */}
            <div className="w-80 bg-gray-50 p-5 flex flex-col gap-4 h-full overflow-hidden border-l border-gray-200">
                <div className="flex justify-between bg-white rounded-xl p-4 shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Penjualan</h3>
                        <p className="text-xs text-gray-400 mt-1">Status: Lunas</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{formatRupiah(totalSales)}</p>
                    </div>
                </div>

                <Card title="Sales per Tenant" size="small" className="shadow-sm flex-shrink-0 rounded-xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-[280px]"><Spin /></div>
                    ) : tenantSummary.length > 0 ? (
                        <div className="flex flex-col pb-2">
                            <div style={{ position: 'relative', height: 200 }}>
                                <Pie {...pieConfig} height={200} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <img src="/img/logo_dago.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            </div>
                            {/* Legend ... (Sama) */}
                            <div className="mt-2 px-1">
                                <div className="space-y-2">
                                    {tenantSummary.map((item, index) => {
                                        const percentage = totalTenantSales > 0 ? (item.value / totalTenantSales) * 100 : 0;
                                        const color = CHART_COLORS[index % CHART_COLORS.length];
                                        return (
                                            <div key={item.type} className="flex flex-col space-y-0.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center">
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, marginRight: 6 }}></div>
                                                        <span className="font-medium text-gray-700 truncate max-w-[120px]" title={item.type}>{item.type}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-800">{percentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress percent={percentage} showInfo={false} strokeColor={color} trailColor="#f3f4f6" size="small" style={{ margin: 0, height: 4 }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-[280px] text-gray-400">Tidak ada data.</div>
                    )}
                </Card>

                <div className="bg-white rounded-xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="p-3 border-b flex-shrink-0">
                        <h3 className="text-sm font-semibold text-gray-700">Top Produk (Lunas)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        <Table size="small" pagination={false} columns={[{ title: "Produk", dataIndex: "item", key: "item", ellipsis: true, render: (text) => <span className="text-xs">{text}</span> }, { title: "Qty", dataIndex: "qty", key: "qty", width: 40, align: 'center', render: (text) => <span className="text-xs">{text}</span> }, { title: "Total", dataIndex: "total", key: "total", width: 85, align: 'right', render: (text) => <span className="text-xs font-medium">{text}</span> }]} dataSource={topProducts} />
                    </div>
                </div>
            </div>

            {/* Modal Detail */}
            <Modal
                title={<span className="text-lg font-semibold text-gray-800">Detail Order #{selectedOrder?.id || ""} - {selectedOrder?.name || ""}</span>}
                open={isModalVisible}
                onCancel={handleCloseDetail}
                width={500}
                className="rounded-xl"
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleCloseDetail}>Tutup</Button>,
                    !isHistoryMode && selectedOrder?.payment_status === "Disimpan" && (
                        <Button key="continue" type="primary" icon={<EditOutlined />} onClick={handleContinueOrder} loading={isUpdating} disabled={isUpdating}>Lanjutkan Order</Button>
                    ),
                    !isHistoryMode && selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button key="pay" type="primary" loading={isUpdating} onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700 border-green-600 text-white">Tandai Lunas</Button>
                    ),
                    !isHistoryMode && selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button key="cancel" type="primary" danger loading={isUpdating} onClick={handleMarkAsBatal}>Tandai Batal</Button>
                    ),
                    selectedOrder?.payment_status !== "Disimpan" && (
                        <Button key="print" type="primary" icon={<PrinterOutlined />} loading={isPrinting} onClick={handlePrintReceipt} className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white">
                            {isPrinting ? "Mencetak..." : (isHistoryMode ? "Cetak Ulang" : "Cetak Struk")}
                        </Button>
                    )
                ]}
            >
                {selectedOrder && (
                    <div className="space-y-3 text-gray-700 pt-4">
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Status Pesanan"><Tag color={getStatusColor(selectedOrder.status)}>{getDisplayStatus(selectedOrder.status).toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Status Bayar"><Tag color={getPaymentStatusColor(selectedOrder.payment_status)}>{selectedOrder.payment_status.toUpperCase()}</Tag></Descriptions.Item>
                            {selectedOrder.payment_method && selectedOrder.payment_method !== '-' && <Descriptions.Item label="Metode Bayar">{selectedOrder.payment_method}</Descriptions.Item>}
                            <Descriptions.Item label="Tipe">{selectedOrder.type}</Descriptions.Item>
                            <Descriptions.Item label="Lokasi/Ruangan">{selectedOrder.location}</Descriptions.Item>
                            <Descriptions.Item label="Waktu Order">{dayjs(selectedOrder.time).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
                        </Descriptions>

                        {selectedOrder.items && selectedOrder.items.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <h4 className="font-semibold mb-2 text-gray-800">Item Pesanan F&B ({selectedOrder.items.length}):</h4>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={item.id_detail || i} className="flex justify-between text-sm">
                                            <span className="flex-1 mr-2">{item.product || 'Produk tidak diketahui'} x{item.qty || 0} {item.note && <i className="text-gray-500 block text-xs"> ({item.note})</i>}</span>
                                            <span className="font-medium whitespace-nowrap">{formatRupiah((item.price || 0) * (item.qty || 0))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedOrder.bookings && selectedOrder.bookings.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <h4 className="font-semibold mb-2 text-gray-800">Detail Booking Ruangan ({selectedOrder.bookings.length}):</h4>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {selectedOrder.bookings.map((booking, i) => (
                                        <div key={booking.id_booking || i} className="text-sm mb-2">
                                            <div className="flex justify-between font-medium"><span className="flex-1 mr-2">{booking.room_name}</span></div>
                                            <ul className="text-xs text-gray-600 pl-4" style={{ listStyleType: 'disc' }}>
                                                <li>Kategori: {booking.room_category}</li>
                                                <li>Mulai: {dayjs(booking.start_time).format("DD MMM YYYY, HH:mm")}</li>
                                                <li>Selesai: {dayjs(booking.end_time).format("DD MMM YYYY, HH:mm")}</li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 border-t pt-3">
                            <h4 className="font-semibold mb-2 text-gray-800">Rincian Pembayaran:</h4>
                            <Descriptions bordered size="small" column={1}>
                                <Descriptions.Item label="Subtotal">{formatRupiah(selectedOrder.subtotal)}</Descriptions.Item>
                                {selectedOrder.tax_nominal > 0 && <Descriptions.Item label={`Pajak (${selectedOrder.tax_percent}%)`}>{formatRupiah(selectedOrder.tax_nominal)}</Descriptions.Item>}
                                {(() => {
                                    const discount = (selectedOrder.subtotal + selectedOrder.tax_nominal) - selectedOrder.price;
                                    if (discount > 0.01) return <Descriptions.Item label="Diskon" span={1}><span className="text-red-600">-{formatRupiah(discount)}</span></Descriptions.Item>;
                                    return null;
                                })()}
                                <Descriptions.Item label={<span className="font-bold text-blue-700">Total</span>} span={1}><span className="font-bold text-blue-700 text-lg">{formatRupiah(selectedOrder.price || 0)}</span></Descriptions.Item>
                                {selectedOrder.payment_method === 'Tunai' && selectedOrder.uang_diterima > 0 && (
                                    <>
                                        <Descriptions.Item label="Uang Diterima">{formatRupiah(selectedOrder.uang_diterima)}</Descriptions.Item>
                                        <Descriptions.Item label="Kembalian"><span className="font-bold text-green-600">{formatRupiah(selectedOrder.kembalian)}</span></Descriptions.Item>
                                    </>
                                )}
                            </Descriptions>
                        </div>

                        {/* Tampilkan Voucher jika ada (Opsional untuk ditampilkan di Modal juga) */}
                        {selectedOrder.vouchers && selectedOrder.vouchers.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <h4 className="font-semibold mb-2 text-gray-800">Voucher WiFi:</h4>
                                {selectedOrder.vouchers.map((v, i) => (
                                    <div key={i} className="bg-blue-50 p-2 rounded text-xs mb-1 border border-blue-100">
                                        <p><strong>Profile:</strong> {v.profile}</p>
                                        <p><strong>Code:</strong> {v.code}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TransaksiKasir;