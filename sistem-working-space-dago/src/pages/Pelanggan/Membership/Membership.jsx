import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Spin,
  Alert,
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import { Monitor, Coffee, DoorOpen } from "lucide-react";
import { getAllMemberships } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

// Ikon kategori
const categoryIcons = {
  "Space Monitor": <Monitor className="w-5 h-5" />,
  "Open Space": <Coffee className="w-5 h-5" />,
  "Room Meeting Besar": <DoorOpen className="w-5 h-5" />,
  "Room Meeting Kecil": <DoorOpen className="w-5 h-5" />,
};

// Komponen Kartu Paket
const HorizontalPackageCard = ({ item, navigate, categoryIcon }) => {
  const creditValue = item.quota
    .replace(" credit", "")
    .replace(" credits", "")
    .trim();
  const creditText = `${creditValue} Credits`;

  return (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: 24,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}
      bodyStyle={{ padding: "24px" }}
    >
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} md={16}>
          <div style={{ paddingRight: "16px" }}>
            <Space style={{ marginBottom: 8 }}>
              <Title
                level={3}
                style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}
              >
                {item.name}
              </Title>
              <Tag color="blue" style={{ fontWeight: 600 }}>
                {categoryIcon} {creditText}
              </Tag>
            </Space>
            <Divider style={{ margin: "12px 0", borderColor: "#d9d9d9" }} />
            <Row gutter={[16, 8]}>
              {item.features.slice(0, 6).map((feature, idx) => (
                <Col
                  xs={24}
                  sm={12}
                  key={idx}
                  style={{ display: "flex", alignItems: "flex-start" }}
                >
                  <Text style={{ fontSize: 13, flex: 1, color: "#595959" }}>
                    • {feature}
                  </Text>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* Kanan: Harga dan Tombol */}
        <Col
          xs={24}
          md={8}
          style={{
            textAlign: "center",
            borderLeft: "1px solid #d9d9d9",
            paddingLeft: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ paddingLeft: "16px" }}>
            <Text
              type="secondary"
              style={{ fontSize: 14, display: "block", marginBottom: 4 }}
            >
              Mulai Dari
            </Text>
            <Title
              level={2}
              style={{ margin: 0, fontWeight: 700, color: "#1890ff" }}
            >
              {item.price}
            </Title>
            <Text
              type="secondary"
              style={{ fontSize: 14, display: "block", marginBottom: 16 }}
            >
              {item.period}
            </Text>
            <Button
              type="primary"
              onClick={() => navigate(`/daftar-member/${item.id}`)}
              style={{ width: "100%", height: 40, fontWeight: 600 }}
            >
              Pilih Plan
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

const Membership = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAllMemberships();
        if (result.message === "OK") {
          const grouped = result.datas.reduce((acc, item) => {
            if (!acc[item.nama_kategori]) {
              acc[item.nama_kategori] = {
                title: item.nama_kategori,
                icon: categoryIcons[item.nama_kategori] || (
                  <Coffee className="w-5 h-5" />
                ),
                data: [],
              };
            }
            acc[item.nama_kategori].data.push({
              id: item.id_paket_membership,
              name: item.nama_paket,
              price: `Rp ${item.harga.toLocaleString("id-ID")}`,
              period: `/ ${item.durasi} hari`,
              quota: `${item.kuota} credit`,
              features: item.fitur_membership
                ? item.fitur_membership
                    .split(/\r?\n/)
                    .filter((f) => f.trim() !== "")
                : ["Fitur standar belum tersedia"],
            });
            return acc;
          }, {});
          const values = Object.values(grouped);
          setMemberships(values);
          if (values.length > 0) setActiveTab(values[0].title);
        } else {
          setError(result.error || "Gagal memuat data");
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter pencarian
  const filteredMemberships = memberships.map((section) => ({
    ...section,
    data: section.data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));

  // Ambil data kategori aktif
  const activeCategoryData = filteredMemberships.find(
    (section) => section.title === activeTab
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Pilih Paket Membership Anda 
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Dapatkan akses eksklusif dan fasilitas lengkap untuk produktivitas
          maksimal di Dago.
        </Text>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <Search
          placeholder="Cari paket membership..."
          allowClear
          onSearch={(value) => setSearchTerm(value)}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Kategori Responsif */}
      <div className="mb-8 w-full bg-gray-100 rounded-full py-3 px-4">
        {/* Desktop */}
        <div className="hidden sm:flex justify-center gap-3 overflow-x-auto min-w-max items-center scrollbar-hide">
          {filteredMemberships.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(section.title)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium whitespace-nowrap ${
                activeTab === section.title
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:text-blue-600"
              }`}
            >
              {section.icon}
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Mobile Grid */}
        <div className="grid grid-cols-2 gap-2 sm:hidden place-items-center">
          {filteredMemberships.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(section.title)}
              className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-full transition-all duration-300 text-sm ${
                activeTab === section.title
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-700 hover:text-blue-600"
              }`}
            >
              {section.icon}
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <Spin
          tip="Memuat data membership..."
          style={{ display: "block", margin: "50px 0", textAlign: "center" }}
        />
      )}
      {error && (
        <Alert
          type="error"
          message="Gagal Memuat Data"
          description={error}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Konten Kategori Aktif */}
      {!loading && !error && activeCategoryData && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <Title level={3} style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  marginRight: "8px",
                  fontSize: "28px",
                  color: "#1890ff",
                }}
              >
                {activeCategoryData.icon}
              </span>
              {activeCategoryData.title}
            </Title>
          </div>

          {activeCategoryData.data.length > 0 ? (
            activeCategoryData.data.map((item, i) => (
              <HorizontalPackageCard
                key={i}
                item={item}
                navigate={navigate}
                categoryIcon={activeCategoryData.icon}
              />
            ))
          ) : (
            <Alert
              message="Data tidak ditemukan"
              description="Belum ada paket membership di kategori ini."
              type="info"
              showIcon
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Membership;