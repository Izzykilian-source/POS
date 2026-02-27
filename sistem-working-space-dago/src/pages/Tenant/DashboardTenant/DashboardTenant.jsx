// src/pages/Tenant/DashboardTenant/DashboardTenant.jsx
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { Input, Modal, Button, Spin, message, Empty } from "antd";
import { useParams } from "react-router-dom";
import { getOrdersByTenant, updateOrderStatus } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";
import { AlertCircle, CheckCircle2, Clock, ChefHat } from "lucide-react"; // Opsional: Tambahkan icon agar lebih cantik

const { Search } = Input;
const useAuth = () => useContext(AuthContext);

// --- CONSTANTS ---
const STATUS_FILTERS = ["ALL", "Baru", "Diproses", "Selesai"];
const STATUS_MAP = {
    "ON PROSES": "Diproses",
    "FINISH": "Selesai",
};

// Penggunaan warna badge modern ala Tailwind
const BADGE_COLORS = {
    "Baru": "bg-red-50 text-red-700 ring-red-600/20",
    "Diproses": "bg-blue-50 text-blue-700 ring-blue-600/20",
    "Selesai": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    "Default": "bg-gray-50 text-gray-600 ring-gray-500/20"
};

// --- SUB-COMPONENTS ---
const OrderCard = ({ order, onClick }) => {
    const badgeStyle = BADGE_COLORS[order.status] || BADGE_COLORS.Default;

    return (
        <div
            onClick={() => onClick(order)}
            className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer flex justify-between items-center"
        >
            <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-800 uppercase tracking-wide">
                    {order.name}
                </span>
                <span className="text-xs font-medium text-gray-400">
                    ID: {order.code}
                </span>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${badgeStyle}`}>
                {order.status}
            </span>
        </div>
    );
};

// --- MAIN COMPONENT ---
const DashboardTenant = () => {
    const { id } = useParams();
    const isHistoryMode = !!id;

    const { userProfile, loading: authLoading, activeSession } = useAuth();
    const tenantId = userProfile?.detail?.id_tenant;
    const sesiId = isHistoryMode ? id : activeSession?.id_sesi;

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const audioRef = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/notification.mp3") : null);
    const knownOrderIds = useRef(new Set());

    // --- FETCH DATA LOGIC ---
    useEffect(() => {
        if (authLoading) return;

        if (!tenantId || !sesiId) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await getOrdersByTenant(tenantId, sesiId);
                const fetchedOrders = res.data?.datas || [];

                if (!isHistoryMode) {
                    const hasNew = fetchedOrders.some((o) => !knownOrderIds.current.has(o.id));
                    if (hasNew && knownOrderIds.current.size > 0) {
                        audioRef.current?.play().catch(console.warn);
                    }
                    fetchedOrders.forEach((o) => knownOrderIds.current.add(o.id));
                }

                setOrders(fetchedOrders);
            } catch (err) {
                console.error("Gagal memuat pesanan:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
        
        if (!isHistoryMode) {
            const polling = setInterval(fetchOrders, 15000);
            return () => clearInterval(polling);
        }
    }, [tenantId, sesiId, authLoading, isHistoryMode]);

    // --- FILTER & SEARCH LOGIC ---
    const filteredOrders = useMemo(() => {
        let result = orders;
        
        if (statusFilter !== "ALL") {
            result = result.filter(o => o.status === statusFilter);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o => 
                o.code?.toLowerCase().includes(query) || 
                o.name?.toLowerCase().includes(query)
            );
        }
        
        return result;
    }, [orders, statusFilter, searchQuery]);

    // --- HANDLERS ---
    const handleUpdateStatus = async (transaksiId, actionPayload) => {
        if (isHistoryMode || !tenantId) return;

        setIsUpdating(true);
        try {
            await updateOrderStatus(transaksiId, actionPayload, tenantId);
            const targetDbStatus = STATUS_MAP[actionPayload];

            // Optimistic UI Update
            const updatedOrders = orders.map((o) =>
                o.id === transaksiId ? { ...o, status: targetDbStatus } : o
            );
            setOrders(updatedOrders);
            setSelectedOrder((prev) => prev ? { ...prev, status: targetDbStatus } : null);

            message.success(`Status diperbarui menjadi ${targetDbStatus}`);
        } catch (err) {
            message.error("Gagal memperbarui status pesanan.");
        } finally {
            setIsUpdating(false);
        }
    };

    // --- RENDER HELPERS ---
    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen bg-gray-50">
                <Spin size="large" tip="Memuat Dashboard Tenant..." />
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen bg-gray-50 p-6">
                <Empty description={<span className="text-gray-500">Akun ini tidak terhubung dengan Tenant manapun.</span>} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                    {isHistoryMode ? `Arsip Sesi #${id}` : "Dashboard Dapur"}
                </h2>
                <p className="text-gray-500 mt-1">Kelola pesanan pelanggan Anda dengan mudah.</p>
            </div>

            {/* Session Warning */}
            {!sesiId && !isHistoryMode && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-amber-800 font-semibold text-sm">Menunggu Sesi Kasir</h4>
                        <p className="text-amber-700/80 text-sm mt-0.5">
                            Belum ada sesi kasir yang dibuka. Pesanan baru akan masuk ke sini otomatis setelah kasir memulai sesi.
                        </p>
                    </div>
                </div>
            )}

            {/* Controls: Search & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <Search
                    placeholder="Cari ID Order atau Nama..."
                    allowClear
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:max-w-xs custom-search-input"
                    size="large"
                />
                
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                statusFilter === status
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            {status === "ALL" ? "Semua Order" : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order List */}
            <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onClick={setSelectedOrder} />
                    ))
                ) : (
                    <div className="py-12 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                        <ChefHat className="w-12 h-12 text-gray-300 mb-3" />
                        <h3 className="text-gray-500 font-medium">Tidak ada pesanan</h3>
                        <p className="text-gray-400 text-sm mt-1">Pesanan yang sesuai filter akan muncul di sini.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                title={
                    <div className="flex flex-col gap-1 pt-1">
                        <span className="text-lg font-bold text-gray-800">Detail Pesanan</span>
                        <span className="text-sm font-normal text-gray-500">ID: {selectedOrder?.code}</span>
                    </div>
                }
                open={!!selectedOrder}
                footer={null}
                onCancel={() => setSelectedOrder(null)}
                width={500}
                className="rounded-2xl"
                destroyOnClose
            >
                {selectedOrder && (
                    <div className="mt-4">
                        {/* Customer Info */}
                        <div className="bg-gray-50 p-4 rounded-xl mb-4 text-sm space-y-2 border border-gray-100">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Pelanggan</span>
                                <span className="font-semibold text-gray-800 uppercase">{selectedOrder.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipe Pesanan</span>
                                <span className="font-medium text-gray-800">{selectedOrder.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Lokasi/Meja</span>
                                <span className="font-medium text-gray-800">{selectedOrder.place || '-'}</span>
                            </div>
                        </div>

                        {/* Items */}
                        <h4 className="font-semibold text-gray-800 mb-3">Daftar Menu</h4>
                        <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            {item.qty}x
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                                            {item.note && (
                                                <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-1.5 rounded-md inline-block">
                                                    Catatan: {item.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
                            {!isHistoryMode && selectedOrder.status === "Baru" && (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
                                    loading={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "ON PROSES")}
                                >
                                    Mulai Masak (Terima)
                                </Button>
                            )}

                            {!isHistoryMode && selectedOrder.status === "Diproses" && (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="w-full rounded-lg !bg-emerald-500 hover:!bg-emerald-600 border-none"
                                    loading={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "FINISH")}
                                >
                                    Tandai Selesai
                                </Button>
                            )}

                            {(isHistoryMode || selectedOrder.status === "Selesai") && (
                                <div className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-bold tracking-wide">PESANAN SELESAI</span>
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