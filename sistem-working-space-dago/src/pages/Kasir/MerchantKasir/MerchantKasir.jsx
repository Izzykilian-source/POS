import React, { useState, useEffect } from "react";
import { Button, Tag, Spin, Alert, Input } from "antd";
import { getMerchantOrders } from "../../../services/service"; 

const MerchantKasir = () => {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 


  // Ambil data dari backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error setiap kali fetch
        const response = await getMerchantOrders(); // Panggil service Anda
        
        // Pastikan respons memiliki format yang diharapkan
        if (response && Array.isArray(response)) {
             setOrders(response);
        } else {
            // Jika format tidak sesuai, set pesanan menjadi array kosong
            console.warn("Format data tidak sesuai, respons:", response);
            setOrders([]);
        }

      } catch (err) {
        setError(err.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []); // Dependensi kosong agar hanya berjalan sekali saat komponen dimuat

  // Perubahan: Logika filter diupdate untuk menyertakan pencarian
  const filteredOrders = orders
    .filter((o) => filter === "All" || o.status === filter) // 1. Filter berdasarkan status (tab)
    .filter((o) => // 2. Filter lagi berdasarkan pencarian
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h3 className="text-base font-semibold text-center sm:text-left">
          Active Order ({filteredOrders.length})
        </h3>
        <div className="flex overflow-x-auto no-scrollbar justify-center sm:justify-end gap-2">
          {["All", "Waiting", "In Progress", "Finish"].map((tab) => (
            <Button
              key={tab}
              type={filter === tab ? "primary" : "default"}
              onClick={() => setFilter(tab)}
              className="rounded-full text-sm sm:text-base whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto sm:mx-0 mb-4 w-full">
        {/* Perubahan: Tambahkan value dan onChange pada Input.Search */}
        <Input.Search 
            placeholder="Cari berdasarkan nama atau kode..." 
            allowClear 
            className="w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-100 rounded-2xl px-4 sm:px-6 py-4 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              {/* Info Kiri */}
              <div className="mb-3 sm:mb-0">
                <p className="font-bold text-base break-words">{order.name}</p>
                <p className="text-xs text-gray-500">{order.code}</p>
                {order.fnb_type && (
                  <div className="mt-2 flex flex-wrap gap-1 text-xs">
                    <Tag color={ order.fnb_type === "Dine In" ? "green" : order.fnb_type === "Takeaway" ? "orange" : "blue" }>
                      {order.fnb_type}
                    </Tag>
                    <Tag color="geekblue">0s</Tag>
                  </div>
                )}
              </div>
              {/* Status Button */}
              <div className="flex justify-end w-full sm:w-auto">
                <Button
                  type="primary"
                  className={`rounded-md font-bold w-full sm:w-auto text-sm sm:text-base ${
                    order.status === "Finish"
                      ? "bg-green-500 border-none hover:bg-green-600"
                      : order.status === "In Progress"
                      ? "bg-blue-500 border-none hover:bg-blue-600"
                      : "bg-yellow-500 border-none hover:bg-yellow-600"
                  }`}
                >
                  {order.status.toUpperCase()}
                </Button>
              </div>
            </div>
          ))
        ) : (
            <div className="text-center text-gray-500 p-8">
                Tidak ada pesanan yang cocok.
            </div>
        )}
      </div>
    </div>
  );
};

export default MerchantKasir;