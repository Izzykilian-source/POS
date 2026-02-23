import React, { useState, useEffect } from "react";
import { Table, Input, Tag, Typography, Button, Spin, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { getProdukKasir } from "../../../services/service";

const { Title } = Typography;

const ProductKasir = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [categoryDrawer, setCategoryDrawer] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ambil data dari database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getProdukKasir();
        setData(res);
      } catch (error) {
        message.error("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Ambil kategori unik
  const categories = ["Semua Kategori", ...new Set(data.map((item) => item.category))];

  // Filter data berdasarkan search & kategori
  const filteredData = data.filter((item) => {
    const matchSearch = item.product.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "Semua Kategori" || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Custom dropdown filter
  const customFilterDropdown = (setSelectedKeys, selectedKeys, confirm, clearFilters, options) => (
    <div className="p-2 min-w-[160px]">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`px-3 py-2 cursor-pointer rounded-md transition ${
            selectedKeys.includes(opt.value) ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
          }`}
          onClick={() => {
            setSelectedKeys(selectedKeys.includes(opt.value) ? [] : [opt.value]);
            confirm();
          }}
        >
          {opt.text}
        </div>
      ))}
      <div className="flex justify-end gap-2 mt-2">
        <Button size="small" onClick={() => { clearFilters && clearFilters(); confirm(); }}>
          Reset
        </Button>
      </div>
    </div>
  );

  // Kolom tabel
  const columns = [
    { title: "No", render: (_, __, index) => index + 1, width: 60 },
    { title: "Product", dataIndex: "product", key: "product" },
    {
      title: "Merchant",
      dataIndex: "merchant",
      key: "merchant",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) =>
        customFilterDropdown(setSelectedKeys, selectedKeys, confirm, clearFilters, [
          ...new Set(data.map((item) => item.merchant))
        ].map((m) => ({ text: m, value: m }))),
      onFilter: (value, record) => record.merchant === value,
      filterIcon: () => <DownOutlined />,
    },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (val) => `Rp ${Number(val).toLocaleString()}`,
    },
    {
      title: "Ketersediaan",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "Active" ? <Tag color="blue">Active</Tag> : <Tag color="red">Inactive</Tag>,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) =>
        customFilterDropdown(setSelectedKeys, selectedKeys, confirm, clearFilters, [
          { text: "Active", value: "Active" },
          { text: "Inactive", value: "Inactive" },
        ]),
      onFilter: (value, record) => record.status === value,
      filterIcon: () => <DownOutlined />,
    },
    { title: "Updated At", dataIndex: "updated", key: "updated" },
  ];

  return (
    <div className="p-4 sm:p-6">
      <Title level={3} className="text-center sm:text-left text-base sm:text-xl">
        My Menu Management
      </Title>

      {/* Search & kategori */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:items-center">
        <Input.Search
          placeholder="Cari produk..."
          className="w-full sm:w-[400px]"
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          onClick={() => setCategoryDrawer(true)}
          className="w-full sm:w-auto"
        >
          {selectedCategory}
        </Button>
      </div>

      {/* TABLE WRAPPER RESPONSIVE */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin tip="Loading data..." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            rowKey="id_produk"
            bordered
            className="min-w-[600px] [&_.ant-table-thead>tr>th]:bg-gray-200"
          />
        </div>
      )}

      {/* Drawer (Bottom Sheet Category) */}
      <AnimatePresence>
        {categoryDrawer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCategoryDrawer(false)}
          >
            <motion.div
              className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-y-scroll hide-scrollbar">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={idx}
                    className={`text-center py-3 font-medium transition-all ${
                      selectedCategory === cat ? "text-black text-xl" : "text-gray-400 text-lg"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-between mt-4">
                <Button danger onClick={() => setCategoryDrawer(false)}>Cancel</Button>
                <Button type="primary" onClick={() => setCategoryDrawer(false)}>Apply</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductKasir;