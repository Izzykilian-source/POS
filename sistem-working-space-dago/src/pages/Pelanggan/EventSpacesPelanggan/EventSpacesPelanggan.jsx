import React, { useContext, useEffect, useState } from "react";
import {
  SearchOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  StarOutlined,
  CheckCircleOutlined,
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
  Divider,
  Spin,
  Tag,
} from "antd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import FeatureList from "../../../components/FeatureList";
import { getEventSpaces } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

const EventSpacesPelanggan = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventSpaces, setEventSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  // useEffect(() => {
  //   if (userProfile?.roles === "admin") {
  //     navigate("/dashboardadmin");
  //   } else if (userProfile?.roles === "kasir") {
  //     navigate("/mengelola-orderan_fb");
  //   }
  // }, [userProfile, navigate]);

  // Ambil data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEventSpaces();
        setEventSpaces(data);
      } catch (err) {
        console.error("Error ambil event spaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSpaces = eventSpaces.filter((space) =>
    space.nama_event_space.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Hero Section */}
        <div
          style={{
            marginBottom: "40px",
            background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
            padding: "60px 40px",
            borderRadius: "24px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(22, 119, 255, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              left: "-30px",
              width: "150px",
              height: "150px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Title
              level={1}
              style={{
                margin: 0,
                color: "white",
                fontSize: "48px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                textShadow: "0 2px 20px rgba(0,0,0,0.1)",
              }}
            >
              Event Spaces
            </Title>
            <Text
              style={{
                fontSize: "18px",
                color: "rgba(255, 255, 255, 0.95)",
                display: "block",
                marginTop: "16px",
                maxWidth: "700px",
                margin: "16px auto 0",
                lineHeight: "1.6",
                fontWeight: "400",
              }}
            >
              Temukan ruang acara terbaik untuk setiap momen spesialmu di Dago
              Creative Hub
            </Text>

            <div
              style={{
                marginTop: "32px",
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <StarOutlined /> Minimal 1/2 Hari
                </Text>
              </div>
              <div
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <FileTextOutlined /> Sistem Pengajuan
                </Text>
              </div>
              <div
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <InfoCircleOutlined /> Konfirmasi 1x24 Jam
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            border: "1px solid #bae0ff",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <InfoCircleOutlined style={{ fontSize: "24px", color: "white" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text
              strong
              style={{
                color: "#1677ff",
                display: "block",
                fontSize: "16px",
                marginBottom: "4px",
              }}
            >
              Cara Booking Event Space
            </Text>
            <Text
              style={{ fontSize: "14px", color: "#595959", lineHeight: "1.5" }}
            >
              Pilih ruangan → Isi form pengajuan → Admin review → Konfirmasi &
              pembayaran → Booking confirmed!
            </Text>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "40px" }}>
          <Search
            placeholder="Cari nama event space..."
            allowClear
            size="large"
            prefix={
              <SearchOutlined style={{ color: "#1677ff", fontSize: "18px" }} />
            }
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              borderRadius: "12px",
            }}
          />
        </div>

        {/* Cards Grid */}
        {filteredSpaces.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filteredSpaces.map((space) => (
              <Col xs={24} sm={12} lg={8} key={space.id_event_space}>
                <Card
                  hoverable
                  style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "none",
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: "white",
                  }}
                  bodyStyle={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(22, 119, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                  cover={
                    <div
                      style={{
                        position: "relative",
                        height: "240px",
                        overflow: "hidden",
                        background: "#f0f0f0",
                      }}
                    >
                      <img
                        alt={space.nama_event_space}
                        src={`${import.meta.env.VITE_BASE_URL}/static/${
                          space.gambar_ruangan
                        }`}
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "cover",
                          transition:
                            "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                      {/* Gradient Overlay */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "50%",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Tag */}
                      <div
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          background: "rgba(255, 255, 255, 0.95)",
                          padding: "8px 16px",
                          borderRadius: "24px",
                          backdropFilter: "blur(10px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Tag
                          color="blue"
                          style={{
                            margin: 0,
                            fontWeight: "600",
                            border: "none",
                            fontSize: "12px",
                          }}
                        >
                          <FileTextOutlined /> By Request
                        </Tag>
                      </div>
                    </div>
                  }
                >
                  {/* Title */}
                  <Title
                    level={4}
                    style={{
                      fontSize: "22px",
                      marginTop: "0",
                      marginBottom: "12px",
                      color: "#1a1a1a",
                      fontWeight: "700",
                      lineHeight: "1.3",
                    }}
                  >
                    {space.nama_event_space}
                  </Title>

                  <Divider style={{ margin: "16px 0" }} />

                  {/* Capacity & Location Info */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    {space.kapasitas_ruangan && (
                      <div
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          background: "#f0f5ff",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid #adc6ff",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "#1677ff",
                            display: "block",
                            marginBottom: "4px",
                            fontWeight: "600",
                          }}
                        >
                          <UserOutlined /> Kapasitas
                        </Text>
                        <Text
                          strong
                          style={{ fontSize: "16px", color: "#0958d9" }}
                        >
                          {space.kapasitas_ruangan} orang
                        </Text>
                      </div>
                    )}
                    {space.lokasi_ruangan && (
                      <div
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          background: "#f0f5ff",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid #adc6ff",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "#1677ff",
                            display: "block",
                            marginBottom: "4px",
                            fontWeight: "600",
                          }}
                        >
                          <EnvironmentOutlined /> Lokasi
                        </Text>
                        <Text
                          strong
                          style={{ fontSize: "14px", color: "#0958d9" }}
                        >
                          {space.lokasi_ruangan}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Info Booking */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)",
                      border: "1px solid #95de64",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "13px",
                        color: "#389e0d",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <CheckCircleOutlined style={{ fontSize: "16px" }} />
                      Minimal booking 1/2 hari (4-5 jam)
                    </Text>
                  </div>

                  {/* Facilities */}
                  <div style={{ marginBottom: "20px" }}>
                    <Text
                      strong
                      style={{
                        fontSize: "15px",
                        color: "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <StarOutlined
                        style={{ color: "#faad14", fontSize: "16px" }}
                      />
                      Fasilitas Lengkap
                    </Text>
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      {space.fitur_ruangan
                        ? space.fitur_ruangan
                            .split(/(?=🏢|📝|📍)/g)
                            .map((fitur, index) => (
                              <Text
                                key={index}
                                style={{
                                  display: "block",
                                  fontSize: "14px",
                                  lineHeight: "1.6",
                                  textAlign: "justify",
                                }}
                              >
                                {fitur.trim()}
                              </Text>
                            ))
                        : null}
                    </Space>
                  </div>

                  {/* Button */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<FileTextOutlined />}
                    onClick={() =>
                      navigate(`/detail-event-spaces/${space.id_event_space}`, {
                        state: space,
                      })
                    }
                    style={{
                      height: "50px",
                      borderRadius: "12px",
                      fontWeight: "600",
                      fontSize: "15px",
                      background:
                        "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(22, 119, 255, 0.3)",
                      transition: "all 0.3s ease",
                      marginTop: "auto",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 24px rgba(22, 119, 255, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(22, 119, 255, 0.3)";
                    }}
                  >
                    Ajukan Booking Sekarang
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          // Empty State
          <div
            style={{
              textAlign: "center",
              padding: "80px 40px",
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                margin: "0 auto 24px",
                background: "linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SearchOutlined style={{ fontSize: "56px", color: "#1677ff" }} />
            </div>
            <Title level={3} style={{ color: "#595959", marginBottom: "12px" }}>
              Event Space tidak ditemukan
            </Title>
            <Text style={{ color: "#8c8c8c", fontSize: "15px" }}>
              Coba gunakan kata kunci yang berbeda atau hapus filter pencarian
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSpacesPelanggan;