// src/pages/Tenant/KelolaStok/KelolaStok.jsx

import React, { useMemo, useState, useEffect, useCallback, useContext } from "react";
import { Input, Table, Switch, message, Spin, Empty, Tag, Select } from "antd";
import { SearchOutlined, InboxOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getAllProductsForStock, updateProductAvailability } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";

const useAuth = () => useContext(AuthContext);

// --- HELPER FORMATTER ---
const formatRp = (num) => {
    if (typeof num !== "number") return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
};

const KelolaStok = () => {
    const { userProfile, loading: authLoading } = useAuth();
    const tenantId = userProfile?.detail?.id_tenant;
    const tenantName = userProfile?.detail?.nama_tenant || userProfile?.detail?.nama || "Mitra Dapur";

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    
    // --- STATE UNTUK FILTER DROPDOWN ---
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // --- FETCH DATA ---
    const fetchProducts = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const { status, data } = await getAllProductsForStock(tenantId);
            if (status === 200 && data) {
                const mappedProducts = data.map((p) => ({
                    key: p.id_produk,
                    id: p.id_produk,
                    product: p.product,
                    merchant: p.merchant,
                    category: p.category || "Uncategorized", // Jaga-jaga kalau kategori kosong
                    hpp: p.hpp || p.price,
                    price: p.price,
                    available: p.status === "Active",
                    updatedAt: p.updated,
                }));
                setProducts(mappedProducts);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            message.error("Gagal terhubung ke server saat memuat menu.");
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        if (!authLoading && tenantId) fetchProducts();
    }, [authLoading, tenantId, fetchProducts]);

    // --- MENGAMBIL DAFTAR KATEGORI UNIK DARI DATA ---
    const categoryOptions = useMemo(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        return [
            { value: "ALL", label: "Semua Kategori" },
            ...uniqueCategories.sort().map(cat => ({ value: cat, label: cat }))
        ];
    }, [products]);

    // --- HANDLERS ---
    const toggleAvailability = async (id, value) => {
        const originalProducts = [...products];

        setProducts((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, available: value, updatedAt: new Date().toISOString() } : p
            )
        );

        try {
            const { ok, message: msg } = await updateProductAvailability(id, value);
            if (!ok) {
                message.error("Gagal memperbarui status di server.");
                setProducts(originalProducts);
            } else {
                message.success(msg || "Status ketersediaan diperbarui.");
            }
        } catch (error) {
            message.error("Koneksi terputus. Perubahan dibatalkan.");
            setProducts(originalProducts);
        }
    };

    // --- FILTERING LOGIC (GABUNGAN SEARCH + DROPDOWN) ---
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            // 1. Filter Search (Nama & Kategori)
            const query = search.trim().toLowerCase();
            const matchSearch = !query || 
                p.product.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query);

            // 2. Filter Dropdown Kategori
            const matchCategory = filterCategory === "ALL" || p.category === filterCategory;

            // 3. Filter Dropdown Status Stok
            const matchStatus = filterStatus === "ALL" || 
                (filterStatus === "AVAILABLE" && p.available) || 
                (filterStatus === "EMPTY" && !p.available);

            // Tampilkan data jika lolos ketiga filter di atas
            return matchSearch && matchCategory && matchStatus;
        });
    }, [products, search, filterCategory, filterStatus]);

    // --- TABLE COLUMNS ---
    const columns = useMemo(() => [
        {
            title: "Menu Item",
            dataIndex: "product",
            key: "product",
            fixed: 'left', 
            width: 200,
            render: (text, record) => (
                <div className="flex flex-col min-w-[120px]">
                    <span className="font-bold text-gray-800 text-sm md:text-base line-clamp-2">{text}</span>
                    <span className="text-xs text-gray-500 font-medium mt-0.5 truncate">{record.merchant}</span>
                </div>
            ),
        },
        {
            title: "Kategori",
            dataIndex: "category",
            key: "category",
            width: 130,
            render: (category) => (
                <Tag className="rounded-md border-gray-200 text-gray-600 bg-gray-50 px-2 py-0.5 font-medium whitespace-nowrap">
                    {category}
                </Tag>
            ),
        },
        {
            title: "HPP",
            dataIndex: "hpp",
            key: "hpp",
            align: 'right',
            width: 120,
            render: (val) => <span className="text-gray-500 whitespace-nowrap text-sm">{formatRp(val)}</span>,
        },
        {
            title: "Harga Jual",
            dataIndex: "price",
            key: "price",
            align: 'right',
            width: 120,
            render: (val) => <span className="font-bold text-gray-800 whitespace-nowrap text-sm">{formatRp(val)}</span>,
        },
        {
            title: "Status Stok",
            dataIndex: "available",
            key: "available",
            width: 140,
            render: (isAvailable, record) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={isAvailable}
                        onChange={(checked) => toggleAvailability(record.id, checked)}
                        className={isAvailable ? "bg-emerald-500" : "bg-gray-300"}
                        size="small"
                    />
                    <span className={`text-[11px] md:text-xs font-bold uppercase tracking-wider ${isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {isAvailable ? "Tersedia" : "Habis"}
                    </span>
                </div>
            ),
        },
        {
            title: "Update Terakhir",
            dataIndex: "updatedAt",
            key: "updatedAt",
            align: 'right',
            width: 140,
            render: (date) => (
                <div className="flex flex-col text-right whitespace-nowrap">
                    <span className="text-xs md:text-sm text-gray-700 font-medium">
                        {dayjs(date).format("DD MMM YY")}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-400">
                        {dayjs(date).format("HH:mm")}
                    </span>
                </div>
            ),
        },
    ], [toggleAvailability]);

    // --- RENDER HELPERS ---
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Spin size="large" />
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
                <Empty description={<span className="text-gray-500">Akun tidak terhubung dengan Tenant manapun.</span>} />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-5 md:p-8 bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="max-w-[1200px] mx-auto w-full">
                
                {/* --- HEADER SECTION --- */}
                <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                        Manajemen Stok Menu
                    </h2>
                    <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">
                        Area Dapur: <span className="text-blue-600">{tenantName}</span>
                    </p>
                </div>
                
                {/* --- TOOLBAR (SEARCH & DROPDOWN FILTER) --- */}
                <div className="mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3">
                    {/* Search Bar */}
                    <Input
                        placeholder="Cari menu atau kategori..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        allowClear
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:flex-1 rounded-lg hover:border-blue-400 focus:border-blue-500 transition-all border-none bg-gray-50/50"
                        size="large"
                    />

                    <div className="w-full md:w-px h-px md:h-8 bg-gray-200"></div>

                    {/* Filter Dropdowns */}
                    <div className="flex w-full md:w-auto gap-3">
                        <Select
                            value={filterCategory}
                            onChange={setFilterCategory}
                            size="large"
                            className="w-full md:w-48 custom-select"
                            options={categoryOptions}
                            suffixIcon={<FilterOutlined />}
                        />
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            size="large"
                            className="w-full md:w-40 custom-select"
                            options={[
                                { value: "ALL", label: "Semua Status" },
                                { value: "AVAILABLE", label: "Tersedia" },
                                { value: "EMPTY", label: "Habis" },
                            ]}
                        />
                    </div>
                </div>

                {/* --- TABLE SECTION --- */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <Table
                        dataSource={filteredProducts}
                        columns={columns}
                        scroll={{ x: 800 }} 
                        loading={{
                            indicator: <Spin size="large" />,
                            spinning: loading
                        }}
                        pagination={{ 
                            pageSize: 10,
                            showSizeChanger: false,
                            className: "pr-4 mb-4"
                        }}
                        bordered={false}
                        size="middle"
                        className="custom-pro-table text-sm"
                        rowClassName="hover:bg-blue-50/50 transition-colors"
                        locale={{
                            emptyText: (
                                <div className="py-12 flex flex-col items-center justify-center">
                                    <InboxOutlined className="text-4xl md:text-5xl text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium text-sm md:text-base">Menu tidak ditemukan</p>
                                </div>
                            )
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default KelolaStok;