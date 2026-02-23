import React, { useEffect, useState, useRef } from "react";
import {
  SearchOutlined,
  CoffeeOutlined,
  SafetyOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
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
import { getAllMemberships } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

// Icon kategori
const categoryIcons = {
  "Open Space": <CoffeeOutlined />,
  "Space Monitor": <SafetyOutlined />,
  "Room Meeting Kecil": <UserOutlined />,
  "Room Meeting Besar": <UserOutlined />,
  "Room Meeting": <UserOutlined />,
};

// Komponen kartu horizontal (versi baru)
const HorizontalPackageCard = ({ item, navigate, categoryIcon }) => {
  const creditValue = item.quota.replace(" credit", "").replace(" credits", "").trim();
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
        {/* Kiri: Nama Paket dan Fitur */}
        <Col xs={24} md={16}>
          <div style={{ paddingRight: "16px" }}>
            <Space style={{ marginBottom: 8 }}>
              <Title level={3} style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
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
            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
              Mulai Dari
            </Text>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1890ff" }}>
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
              onClick={() => navigate("/login")}
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

const InformasiWS = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Space Monitor");
  const navigate = useNavigate();
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAllMemberships();
        if (result.message === "OK") {
          const grouped = result.datas.reduce((acc, item) => {
            let kategori = item.nama_kategori;

            // Pisahkan Room Meeting berdasarkan nama paket
            if (kategori === "Room Meeting") {
              if (/besar/i.test(item.nama_paket)) {
                kategori = "Room Meeting Besar";
              } else if (/kecil/i.test(item.nama_paket)) {
                kategori = "Room Meeting Kecil";
              }
            }

            if (!acc[kategori]) {
              acc[kategori] = {
                title: kategori,
                icon: categoryIcons[kategori] || <CoffeeOutlined />,
                data: [],
              };
            }

            acc[kategori].data.push({
              id: item.id_paket_membership,
              name: item.nama_paket,
              price: `Rp ${item.harga.toLocaleString("id-ID")}`,
              period: `/ ${item.durasi} hari`,
              quota: `${item.kuota} credit`,
              features: item.fitur_membership
                ? item.fitur_membership.split(/\r?\n/).filter((f) => f.trim() !== "")
                : ["Fitur standar belum tersedia"],
            });
            return acc;
          }, {});

          setMemberships(Object.values(grouped));
          const firstCategory = Object.keys(grouped)[0];
          if (firstCategory) setActiveTab(firstCategory);
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

  const filteredMemberships = memberships
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0);

  const scrollToCategory = (category) => {
    setActiveTab(category);
    if (sectionRefs.current[category]) {
      sectionRefs.current[category].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh" }}>
      {/* HERO SECTION (tetap dari versi lama) */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <a
          href="https://maps.app.goo.gl/8BBT7ANUzscVDSJo8"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#e6f4ff",
            color: "#1677ff",
            padding: "10px 18px",
            borderRadius: "20px",
            fontWeight: 500,
            marginBottom: 20,
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          <EnvironmentOutlined style={{ marginRight: 6 }} />
          Membership Workspace Location
        </a>
        <Title
          level={1}
          style={{
            fontSize: "clamp(2.2rem, 4vw, 3.8rem)",
            fontWeight: 800,
            marginBottom: 20,
            color: "#111",
          }}
        >
          Pilih <span style={{ color: "#1677ff" }}>Membership</span> yang Tepat
          untuk Tim Anda
        </Title>
        <Text
          type="secondary"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.3rem)",
            maxWidth: 800,
            display: "block",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Maksimalkan produktivitas tim dengan workspace yang fleksibel dan
          modern. Kami menyediakan solusi lengkap untuk kebutuhan kerja masa kini.
        </Text>
      </div>

      {/* Konten Membership */}
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <Search
            placeholder="Cari paket membership..."
            allowClear
            prefix={<SearchOutlined />}
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Tabs kategori */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            borderBottom: "1px solid #d9d9d9",
            marginBottom: "32px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          {filteredMemberships.map((section) => (
            <div
              key={section.title}
              onClick={() => scrollToCategory(section.title)}
              style={{
                cursor: "pointer",
                paddingBottom: "12px",
                borderBottom:
                  activeTab === section.title
                    ? "2px solid #1890ff"
                    : "2px solid transparent",
                color: activeTab === section.title ? "#1890ff" : "#333",
                fontWeight: activeTab === section.title ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "18px" }}>{section.icon}</span>
              {section.title} ({section.data.length})
            </div>
          ))}
        </div>

        {/* Loading & Error */}
        {loading && <Spin tip="Memuat data membership..." style={{ display: "block", margin: "50px 0", textAlign: "center" }} />}
        {error && <Alert type="error" message="Gagal Memuat Data" description={error} showIcon style={{ marginBottom: 24 }} />}

        {!loading && !error && filteredMemberships.length > 0 && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {filteredMemberships.map((section, idx) => (
              <div key={idx} ref={(el) => (sectionRefs.current[section.title] = el)}>
                <div style={{ marginBottom: "24px" }}>
                  <Title level={3} style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "8px", fontSize: "28px", color: "#1890ff" }}>
                      {section.icon}
                    </span>
                    {section.title}
                  </Title>
                </div>
                <div style={{ marginBottom: "40px" }}>
                  {section.data.map((item, i) => (
                    <HorizontalPackageCard
                      key={i}
                      item={item}
                      navigate={navigate}
                      categoryIcon={section.icon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default InformasiWS;