import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Button, Spin, Alert } from "antd";
import {
  InfoCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getEventSpaces } from "../../../services/service"; // <-- Import service Anda
import { formatRupiah } from "../../../utils/formatRupiah";

const { Title, Text, Paragraph } = Typography;
const baseUrl = import.meta.env.VITE_BASE_URL;

const EventSpaces = () => {
  const navigate = useNavigate();
  // State untuk menyimpan data, status loading, dan error
  const [eventSpaces, setEventSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect untuk mengambil data saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchEventSpaces = async () => {
      try {
        // Panggil service untuk mengambil data dari endpoint
        const data = await getEventSpaces();
        setEventSpaces(data);
      } catch (err) {
        setError("Gagal memuat data ruangan. Silakan coba lagi nanti.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventSpaces();
  }, []); // Array dependensi kosong agar hanya berjalan sekali

  // Fungsi untuk handle klik tombol "Pesan Sekarang"
  const handlePesanClick = (space) => {
    // Arahkan ke halaman booking dengan membawa data ruangan
    navigate(`/detail-event-spaces/${space.id_event_space}`, { state: space });
    console.log("Navigasi ke halaman booking untuk:", space.nama_event_space);
  };
  
  return (
    <div>
      {/* Hero Section (Tidak ada perubahan) */}
      <div
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
          }}
        ></div>
        <div style={{ position: "relative", maxWidth: "800px", padding: "0 20px" }}>
          <Title
            level={1}
            style={{
              fontWeight: 800,
              fontSize: "3.5rem",
              marginBottom: 20,
              color: "white",
            }}
          >
            Premium Event Space untuk Setiap Acara
          </Title>
          <Paragraph
            style={{
              fontSize: "18px",
              color: "#f0f0f0",
              marginBottom: 30,
            }}
          >
            Temukan ruang ideal untuk seminar, workshop, hingga perayaan perusahaan.
            Fleksibel, modern, dan siap mendukung acara Anda berjalan sukses.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            style={{ borderRadius: 8, padding: "0 32px", fontWeight: 600 }}
            onClick={() => {
              const el = document.getElementById("event-spaces-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Lihat Ruangan
          </Button>
        </div>
      </div>

      {/* Isi Konten */}
      <div
        id="event-spaces-section"
        style={{
          background: "#fafafa",
          padding: "100px 20px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Tampilkan spinner saat loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px', color: '#555' }}>Memuat data ruangan...</p>
            </div>
          )}

          {/* Tampilkan pesan error jika terjadi */}
          {error && (
            <Alert
              message="Terjadi Kesalahan"
              description={error}
              type="error"
              showIcon
            />
          )}

          {/* Tampilkan data jika tidak loading dan tidak ada error */}
          {!loading && !error && eventSpaces.map((room, idx) => {
             // Ubah string fitur menjadi array
             const fiturList = room.fitur_ruangan 
                ? room.fitur_ruangan.split(/\r?\n/).map(f => f.trim()).filter(Boolean)
                : [];
                
             return (
                <Row
                    key={room.id_event_space}
                    gutter={[48, 48]}
                    align="middle"
                    style={{
                    marginBottom: 100,
                    flexDirection: idx % 2 === 1 ? "row-reverse" : "row",
                    }}
                >
                    {/* Gambar */}
                    <Col xs={24} md={12}>
                    <img
                        src={`${baseUrl}/static/${room.gambar_ruangan}`} // <-- Gunakan path dari server
                        alt={room.nama_event_space}
                        style={{
                        width: "100%",
                        borderRadius: "16px",
                        objectFit: "cover",
                        height: 400,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                        }}
                    />
                    </Col>

                    {/* Konten */}
                    <Col xs={24} md={12}>
                    <div>
                        <Title level={3} style={{ fontWeight: 700 }}>
                        {room.nama_event_space}
                        </Title>

                        <Paragraph style={{ fontSize: 16, color: "#555" }}>
                        <InfoCircleOutlined style={{ marginRight: 6 }} />
                        {room.deskripsi_event_space}
                        </Paragraph>
                        
                        <div style={{ display: 'flex', gap: '24px', margin: '16px 0' }}>
                            <Text strong style={{ fontSize: 15 }}>
                                <TeamOutlined style={{ marginRight: 6 }} />
                                Kapasitas: {room.kapasitas} orang
                            </Text>
                            <Text strong style={{ fontSize: 15, color: '#1677ff' }}>
                                Harga Mulai: {formatRupiah(room.harga_paket)}
                            </Text>
                        </div>

                        <div style={{ marginTop: 20 }}>
                        <Text strong style={{ display: "block", marginBottom: 8 }}>
                            <AppstoreOutlined style={{ marginRight: 6 }} />
                            Fitur Utama
                        </Text>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            {fiturList.map((f, i) => (
                            <li
                                key={i}
                                style={{
                                marginBottom: 6,
                                fontSize: 14,
                                color: "#555",
                                }}
                            >
                                <CheckOutlined
                                style={{ color: "#1677ff", marginRight: 6 }}
                                />
                                {f}
                            </li>
                            ))}
                        </ul>
                        </div>

                        <Button
                        type="primary"
                        size="large"
                        style={{
                            borderRadius: "10px",
                            padding: "0 36px",
                            fontWeight: 600,
                            marginTop: 24,
                        }}
                        onClick={() => handlePesanClick(room)}
                        >
                        Pesan Sekarang
                        </Button>
                    </div>
                    </Col>
                </Row>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventSpaces;