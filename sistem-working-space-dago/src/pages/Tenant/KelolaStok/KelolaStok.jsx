
import React, { useMemo, useState, useEffect, useCallback, useContext } from "react";
import { Input, Table, Switch, message, Spin } from "antd";
import {
  getAllProductsForStock,
  updateProductAvailability,
} from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";

const useAuth = () => useContext(AuthContext);
const { Search } = Input;

// Format Rupiah
const formatRp = (num) => {
  if (typeof num !== "number") return num;
  return "Rp " + num.toLocaleString("id-ID");
};

const KelolaStok = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const tenantId = userProfile?.detail?.id_tenant;

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil data produk berdasarkan tenant
  const fetchProducts = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { status, data } = await getAllProductsForStock(tenantId);
      if (status === 200 && data) {
        const mappedProducts = data.map((p) => ({
          id: p.id_produk,
          product: p.product,
          merchant: p.merchant,
          category: p.category,
          hpp: p.hpp || p.price,
          price: p.price,
          available: p.status === "Active",
          updatedAt: new Date(p.updated),
        }));
        setProducts(mappedProducts);
      } else {
        message.error("Gagal mengambil data produk.");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Terjadi kesalahan koneksi saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // 🔹 Ambil data ketika user login sudah selesai dimuat
  useEffect(() => {
    if (!authLoading && tenantId) fetchProducts();
  }, [authLoading, tenantId, fetchProducts]);

  // 🔹 Update status ketersediaan
  const toggleAvailability = async (id, value) => {
    const originalProducts = [...products];

    // Update UI duluan
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, available: value, updatedAt: new Date() } : p
      )
    );

    try {
      const { ok, message: msg } = await updateProductAvailability(id, value);
      if (!ok) {
        message.error("Gagal memperbarui status ketersediaan di server.");
        setProducts(originalProducts);
      } else {
        message.success(msg || "Status ketersediaan berhasil diperbarui.");
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      message.error("Gagal koneksi ke server, perubahan dibatalkan.");
      setProducts(originalProducts);
    }
  };

  // 🔹 Pencarian produk
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.product.toLowerCase().includes(q) ||
        p.merchant.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  // 🔹 Kolom tabel
  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 60,
      render: (_, __, idx) => <div className="font-medium">{idx + 1}</div>,
    },
    {
      title: "Product",
      dataIndex: "product",
      key: "product",
      render: (text) => <div className="font-semibold">{text}</div>,
    },
    {
      title: "Merchant",
      dataIndex: "merchant",
      key: "merchant",
      render: (m) => <div className="text-sm text-gray-600">{m}</div>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (c) => <div className="text-sm text-gray-600">{c}</div>,
    },
    {
      title: "HPP",
      dataIndex: "hpp",
      key: "hpp",
      width: 120,
      render: (v) => <div className="font-medium">{formatRp(v)}</div>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (v) => <div className="font-medium">{formatRp(v)}</div>,
    },
    {
      title: "Ketersediaan",
      dataIndex: "available",
      key: "available",
      width: 120,
      render: (v, record) => (
        <Switch
          checked={v}
          disabled={loading}
          onChange={(checked) => toggleAvailability(record.id, checked)}
        />
      ),
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (d) => (
        <div className="text-sm text-gray-600">
          {new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          <br />
          <span className="text-xs text-gray-400">
            {new Date(d).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
  ];

  // 🔹 Jika user masih loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Memuat akun tenant..." />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto flex-1">
      <div className="max-w-full">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">My Menu Management</h2>
          <div className="mt-3">
            <Search
              placeholder="Search"
              allowClear
              size="large"
              onSearch={(v) => setSearch(v)}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 520 }}
            />
          </div>
        </div>

        <Spin spinning={loading} tip="Memuat data...">
          <Table
            dataSource={filtered}
            columns={columns}
            pagination={false}
            bordered={false}
            rowClassName={() => "bg-transparent"}
          />
        </Spin>
      </div>
    </div>
  );
};

export default KelolaStok;
