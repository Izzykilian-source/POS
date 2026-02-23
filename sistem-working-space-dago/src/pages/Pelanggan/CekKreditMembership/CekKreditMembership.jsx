import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, Progress, Button, Typography, Row, Col, Space, List, Spin, Divider, Alert
} from "antd";
import {
  CalendarOutlined, ClockCircleOutlined, CreditCardOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../../providers/AuthProvider";
import { getMemberData } from "../../../services/service";

const { Title, Text } = Typography;

const CekKreditMembership = () => {
  const { userProfile } = useContext(AuthContext);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMember = async () => {
      if (!userProfile?.id_user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // PERBAIKAN: Tidak perlu mengirim id_user, karena backend mengambilnya dari token
        const data = await getMemberData(); 

        if (!data?.datas || data.datas.length === 0) {
          setMember(null);
          setError(null);
          return;
        }

        // Ambil membership yang paling baru (jika ada lebih dari satu)
        const membership = data.datas[0];

        setMember({
          paketId: membership.id_paket_membership,
          membershipType: `${membership.nama_paket} (${membership.nama_kategori})`,
          startDate: new Date(membership.tanggal_mulai).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
          }),
          endDate: new Date(membership.tanggal_berakhir).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
          }),
          creditsRemaining: membership.sisa_credit,
          totalCredits: membership.total_credit,
          // PERBAIKAN: Langsung gunakan data riwayat dari API
          riwayat: membership.riwayat || [], 
        });
      } catch (error) {
        console.error("Gagal ambil data member:", error);
        setError("Tidak dapat memuat data membership Anda. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [userProfile]);

  const handlePerpanjang = () => {
    if (member && member.paketId) {
      navigate(`/daftar-member/${member.paketId}`);
    } else {
      console.error("ID Paket Membership tidak ditemukan!");
    }
  };

  if (loading) {
    return <Spin tip="Memuat data membership..." style={{ display: "block", margin: "50px auto" }} />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ maxWidth: 800, margin: "24px auto" }} />;
  }

  if (!member) {
    return (
      <Card style={{ maxWidth: 800, margin: "24px auto", textAlign: "center" }}>
        <Title level={4}>Anda Belum Memiliki Membership Aktif</Title>
        <Text type="secondary">Daftar membership sekarang untuk menikmati berbagai benefit eksklusif!</Text>
        <br />
        <Button type="primary" size="large" onClick={() => navigate('/membership')} style={{ marginTop: 24 }}>
          Lihat Paket Membership
        </Button>
      </Card>
    );
  }

  const creditsUsed = member.totalCredits - member.creditsRemaining;
  const persentase = member.totalCredits > 0 ? Math.round((creditsUsed / member.totalCredits) * 100) : 0;

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Hero Membership Info */}
        <Card
          bordered={false}
          style={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", background: "linear-gradient(135deg, #1890ff, #40a9ff)", color: "#fff" }}
          bodyStyle={{ padding: "24px" }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Text strong style={{ color: "#e6f7ff", fontSize: 14 }}>Status Membership</Text>
              <Title level={3} style={{ margin: "4px 0", color: "#fff" }}>{member.membershipType}</Title>
              <Text style={{ color: "#f0f5ff" }}>Berlaku {member.startDate} → {member.endDate}</Text>
              <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />
              <Text style={{ fontSize: 16, color: "#fff" }}>
                Sisa Kredit: <strong>{member.creditsRemaining}</strong> dari {member.totalCredits}
              </Text>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: "right" }}>
              <Button type="primary" size="large" shape="round" onClick={handlePerpanjang} style={{ backgroundColor: "#fff", color: "#1890ff", fontWeight: "bold", width: "100%", maxWidth: 200 }}>
                Perpanjang
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Quick Info Cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ textAlign: "center", borderRadius: "16px", backgroundColor: "#e6f7ff" }}>
              <CreditCardOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={3} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {member.creditsRemaining} / {member.totalCredits}
              </Title>
              <Text type="secondary">Sisa Kredit</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ textAlign: "center", borderRadius: "16px", backgroundColor: "#e6f7ff" }}>
              <CalendarOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={4} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {member.endDate}
              </Title>
              <Text type="secondary">Tanggal Berakhir</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ textAlign: "center", borderRadius: "16px", backgroundColor: "#e6f7ff" }}>
              <ClockCircleOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={3} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {persentase}%
              </Title>
              <Text type="secondary">Kredit Digunakan</Text>
            </Card>
          </Col>
        </Row>

        {/* Progress Bar */}
        <Card bordered={false} style={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }} bodyStyle={{ padding: "24px 24px 8px 24px" }}>
          <Progress percent={persentase} strokeColor="#1890ff" status="active" style={{ marginBottom: "8px" }} />
          <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
            {persentase}% dari kredit Anda sudah digunakan
          </Text>
        </Card>

        {/* Riwayat Penggunaan */}
        <Card bordered={false} title={<Title level={4} style={{ margin: 0 }}>Riwayat Penggunaan Kredit</Title>} style={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }}>
          {member.riwayat.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={member.riwayat}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ padding: "12px", borderRadius: "50%", backgroundColor: "#e6f7ff" }}>
                        <ClockCircleOutlined style={{ color: "#1890ff", fontSize: "20px" }} />
                      </div>
                    }
                    title={<Text strong>{item.deskripsi}</Text>}
                    description={<Text type="secondary">{item.tanggal}</Text>}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Text type="secondary" style={{ display: "block", textAlign: "center", padding: '20px 0' }}>
              Belum ada riwayat penggunaan kredit.
            </Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default CekKreditMembership;