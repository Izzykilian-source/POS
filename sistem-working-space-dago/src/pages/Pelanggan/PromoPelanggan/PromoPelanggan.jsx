import React, { useState, useEffect } from "react";
import { Card, Typography, Tag, Row, Col, Spin, message, Badge } from "antd";
import {
  GiftOutlined,
  ShoppingOutlined,
  TeamOutlined,
  SmileOutlined,
  CalendarOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { getActivePromos } from "../../../services/service";

const { Title, Paragraph } = Typography;

const iconMap = {
  GiftOutlined: <GiftOutlined style={{ fontSize: 46, color: "#1677ff" }} />,
  ShoppingOutlined: (
    <ShoppingOutlined style={{ fontSize: 46, color: "#52c41a" }} />
  ),
  TeamOutlined: <TeamOutlined style={{ fontSize: 46, color: "#fa8c16" }} />,
  SmileOutlined: <SmileOutlined style={{ fontSize: 46, color: "#eb2f96" }} />,
};

const PromoPelanggan = () => {
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        setIsLoading(true);
        const data = await getActivePromos();
        setPromos(data || []);
      } catch (error) {
        message.error("Gagal memuat data promo dari server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromos();
  }, []);

  return (
    <div style={{ padding: "50px 20px" }}>
      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2} style={{ color: "#1d39c4" }}>
          Hemat Lebih Banyak, Produktivitas Maksimal!
        </Title>
        <Paragraph
          style={{
            fontSize: 16,
            color: "#555",
            maxWidth: 700,
            margin: "0 auto",
          }}
        >
          Dapatkan penawaran spesial hanya bulan ini! Semua promo berlaku
          otomatis saat transaksi, tanpa perlu kode tambahan.
        </Paragraph>
      </div>

      {/* List Promo */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
        </div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#999" }}>
          <Paragraph>Tidak ada promo aktif saat ini.</Paragraph>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {promos.map((promo) => (
            <Badge.Ribbon
              key={promo.kode_promo}
              text={promo.highlight || "Promo Spesial"}
              color="red"
              style={{ fontSize: 12 }}
            >
              <Card
                bordered
                hoverable
                style={{
                  borderRadius: 14,
                  padding: "20px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                }}
              >
                <Row align="middle" gutter={24}>
                  {/* Icon */}
                  <Col xs={4} sm={3} md={2} style={{ textAlign: "center" }}>
                    {iconMap[promo.icon] ||
                      <GiftOutlined style={{ fontSize: 46, color: "#1677ff" }} />}
                  </Col>

                  {/* Konten Promo */}
                  <Col xs={20} sm={21} md={22}>
                    <Title level={4} style={{ marginBottom: 6 }}>
                      {promo.kode_promo}
                    </Title>
                    <Paragraph style={{ marginBottom: 10, color: "#555" }}>
                      {promo.deskripsi_promo}
                    </Paragraph>
                    <Tag
                      color="blue"
                      style={{
                        marginBottom: 8,
                        fontSize: 14,
                        padding: "4px 10px",
                      }}
                    >
                      <PercentageOutlined style={{ marginRight: 6 }} />
                      {promo.nilai_diskon}
                    </Tag>
                    <div style={{ fontSize: 13, color: "#888" }}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {promo.tanggal_mulai} – {promo.tanggal_selesai}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Badge.Ribbon>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoPelanggan;
