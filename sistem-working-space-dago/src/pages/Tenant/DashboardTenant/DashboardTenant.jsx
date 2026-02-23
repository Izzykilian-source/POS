// src/pages/Tenant/DashboardTenant/DashboardTenant.jsx

import React, { useState, useEffect, useContext, useRef } from "react";
import { Input, Modal, Button, Spin, message } from "antd";
import { useParams } from "react-router-dom"; 
import { getOrdersByTenant, updateOrderStatus } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";

const { Search } = Input;
const useAuth = () => useContext(AuthContext);

const DashboardTenant = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Deteksi Mode (Live vs History)
    const { id } = useParams(); 
    const isHistoryMode = !!id; 

    const { userProfile, loading: authLoading, activeSession } = useAuth();
    
    const tenantId = userProfile?.detail?.id_tenant;
    
    // Tentukan Sesi ID yang dipakai (URL Priority > Active Session)
    // Jika tidak ada sesi aktif, sesiId bisa null/undefined
    const sesiId = isHistoryMode ? id : activeSession?.id_sesi;

    const notificationSound = useRef(null);
    const knownOrderIds = useRef(new Set());

    useEffect(() => {
        notificationSound.current = new Audio("/sounds/notification.mp3");
    }, []);

    useEffect(() => {
        // Cek Auth Loading & Tenant ID
        if (authLoading) return;

        if (!tenantId) {
            setLoading(false);
            return;
        }

        // PERUBAHAN: Jika tidak ada sesiId, kita TIDAK nge-fetch order, 
        // TAPI kita matikan loading biar dashboard muncul (walau kosong).
        if (!sesiId) {
            console.log("Tidak ada sesi aktif. Dashboard Tenant dalam mode standby.");
            setOrders([]); // Kosongkan order
            setLoading(false);
            return;
        }

        const fetchAndCheckOrders = async () => {
            try {
                // Pastikan getOrdersByTenant aman jika sesiId null (walaupun sudah dicek di atas)
                const res = await getOrdersByTenant(tenantId, sesiId);
                const fetchedOrders = res.data.datas || [];

                // Logic Notifikasi Suara (Hanya di Mode Live)
                if (!isHistoryMode) {
                    const hasNewOrder = fetchedOrders.some(
                        (order) => !knownOrderIds.current.has(order.id)
                    );

                    if (hasNewOrder && knownOrderIds.current.size > 0) {
                        notificationSound.current.play().catch((e) =>
                            console.error("Audio play failed:", e)
                        );
                    }

                    fetchedOrders.forEach((order) =>
                        knownOrderIds.current.add(order.id)
                    );
                }

                setOrders(fetchedOrders);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        // Logika Polling
        if (isHistoryMode) {
            fetchAndCheckOrders(); 
        } else {
            fetchAndCheckOrders();
            const intervalId = setInterval(fetchAndCheckOrders, 15000); 
            return () => clearInterval(intervalId);
        }

    }, [tenantId, sesiId, authLoading, isHistoryMode]); 

    useEffect(() => {
        setFilteredOrders(orders);
    }, [orders]);

    useEffect(() => {
        if (statusFilter === "ALL") {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter((o) => o.status === statusFilter);
            setFilteredOrders(filtered);
        }
    }, [statusFilter, orders]);

    const updateStatus = async (transaksiId, newStatusUi) => {
        if (isHistoryMode) return;

        if (!tenantId) {
            message.error("ID Tenant tidak ditemukan. Silakan login ulang.");
            return;
        }

        try {
            setIsUpdating(true);
            await updateOrderStatus(transaksiId, newStatusUi, tenantId);

            const dbStatusMap = {
                "ON PROSES": "Diproses",
                "FINISH": "Selesai",
            };
            const newDbStatus = dbStatusMap[newStatusUi];

            const updatedOrders = orders.map((order) =>
                order.id === transaksiId
                    ? { ...order, status: newDbStatus }
                    : order
            );

            setOrders(updatedOrders);
            setFilteredOrders(updatedOrders);

            setSelectedOrder((prev) =>
                prev ? { ...prev, status: newDbStatus } : prev
            );

            message.success(
                `Status pesanan #${selectedOrder.code} berhasil diperbarui!`
            );
        } catch (err) {
            console.error(err);
            message.error("Gagal memperbarui status. Silakan coba lagi.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSearch = (value) => {
        const lower = value.toLowerCase();
        const filtered = orders.filter(
            (order) =>
                order.code?.toLowerCase().includes(lower) ||
                order.name?.toLowerCase().includes(lower)
        );
        setFilteredOrders(filtered);
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" tip="Memuat Data Tenant..." />
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-3">Akses Ditolak</h2>
                <p className="text-gray-600">
                    Akun Anda tidak terhubung dengan Tenant manapun.
                </p>
            </div>
        );
    }

    // PERUBAHAN: Jangan return error screen jika !sesiId.
    // Biarkan dashboard muncul, tapi tampilkan info di bagian atas bahwa sesi belum mulai.

    return (
        <div className="p-6 overflow-y-auto flex-1">
            <h2 className="text-xl font-semibold mb-1">
                {isHistoryMode ? `Riwayat Pesanan Sesi #${id}` : "Dashboard Pesanan"}
            </h2>
            <p className="text-gray-600 mb-6">
                DagoEng Creative Hub & Coffee Lab
            </p>

            {/* INFO BAR jika tidak ada sesi aktif */}
            {!sesiId && !isHistoryMode && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <strong>Menunggu Sesi Kasir:</strong> Belum ada sesi kasir yang dibuka saat ini. Pesanan baru akan masuk otomatis saat sesi dibuka.
                    </div>
                </div>
            )}

            <div className="mb-6">
                <Search
                    placeholder="Search Order Code / Customer Name"
                    allowClear
                    className="w-full md:w-1/2"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                    Active Order ({filteredOrders.length})
                </h3>

                <div className="flex gap-2">
                    {["ALL", "Baru", "Diproses", "Selesai"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`
                                px-4 py-1 rounded-md border text-sm font-medium transition
                                ${
                                    statusFilter === status
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }
                            `}
                        >
                            {status === "ALL" ? "All" : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white shadow rounded-lg p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedOrder(order)}
                        >
                            <div>
                                <p className="font-bold uppercase">
                                    {order.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {order.code}
                                </p>
                            </div>

                            <span
                                className={`font-bold py-1 px-3 rounded-full text-xs ${
                                    order.status === "Baru"
                                        ? "bg-red-100 text-red-600"
                                        : order.status === "Diproses"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-600"
                                }`}
                            >
                                {order.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">Tidak ada pesanan aktif</p>
                        {!sesiId && <p className="text-xs text-gray-400 mt-1">(Sesi kasir belum dimulai)</p>}
                    </div>
                )}
            </div>

            <Modal
                title={`Detail Pesanan: ${selectedOrder?.code || ""}`}
                open={!!selectedOrder}
                footer={null}
                onCancel={() => setSelectedOrder(null)}
                width={600}
            >
                {selectedOrder && (
                    <div className="text-sm">
                        <p className="mb-1">
                            <b>Nomor Pesanan:</b> {selectedOrder.code}
                        </p>
                        <p className="mb-1">
                            <b>Nama Pelanggan:</b> {selectedOrder.name}
                        </p>
                        <p className="mb-1">
                            <b>Jenis Pesanan:</b> {selectedOrder.type}
                        </p>
                        <p className="mb-1">
                            <b>Tempat:</b> {selectedOrder.place}
                        </p>
                        <p className="mb-3">
                            <b>Total Harga:</b>{" "}
                            Rp
                            {selectedOrder.total.toLocaleString("id-ID")}
                        </p>
                        <hr className="my-3" />

                        <p className="font-semibold mb-2 text-md">
                            Rincian Pesanan:
                        </p>
                        <ul className="space-y-2 list-disc list-inside">
                            {selectedOrder.items.map((item, idx) => (
                                <li
                                    key={item.id_detail_order || idx}
                                    className="ml-2"
                                >
                                    <span className="font-medium">
                                        {item.name}
                                    </span>{" "}
                                    (Qty: {item.qty})<br />
                                    {item.note && (
                                        <span className="text-gray-600 text-xs italic">
                                            Catatan: {item.note}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 flex gap-3 justify-center">
                            {!isHistoryMode && selectedOrder.status === "Baru" && (
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        updateStatus(
                                            selectedOrder.id,
                                            "ON PROSES"
                                        )
                                    }
                                    loading={isUpdating}
                                >
                                    Terima Order
                                </Button>
                            )}

                            {!isHistoryMode && selectedOrder.status === "Diproses" && (
                                <Button
                                    type="primary"
                                    style={{
                                        backgroundColor: "#52c41a",
                                        borderColor: "#52c41a",
                                    }}
                                    onClick={() =>
                                        updateStatus(
                                            selectedOrder.id,
                                            "FINISH"
                                        )
                                    }
                                    loading={isUpdating}
                                >
                                    Tandai Selesai
                                </Button>
                            )}

                            {(isHistoryMode || selectedOrder.status === "Selesai") && (
                                <div className={`text-lg font-bold p-2 border-2 rounded ${
                                    selectedOrder.status === "Selesai" ? "text-green-600 border-green-600" : "text-gray-500 border-gray-500"
                                }`}>
                                    {selectedOrder.status === "Selesai" ? "✅ SELESAI" : `STATUS: ${selectedOrder.status}`}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DashboardTenant;