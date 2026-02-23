import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Typography,
  Button,
  DatePicker,
  Modal,
  Row,
  Col,
  Empty,
  Tag,
  Divider,
  Space,
  Spin,
  Collapse,
  message,
  Alert
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  BankOutlined,
  InfoCircleOutlined, // Icon baru untuk info
  ClockCircleOutlined // Icon baru untuk waktu
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getRiwayatTransaksi, getRepaymentLink } from "../../../services/service";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

const RiwayatTransaksi = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // --- KONFIGURASI BATAS WAKTU (24 JAM) ---
  const PAYMENT_TIMEOUT_HOURS = 24;

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isRepaying, setIsRepaying] = useState(false);

  const [width] = useWindowSize();
  const isMobile = width < 768;

  // --- FUNGSI CEK KADALUARSA (VISUAL FRONTEND) ---
  const checkIsExpired = (transactionDate, status) => {
    if (status !== "Pending") return false;
    // Hitung waktu kadaluarsa: Waktu Transaksi + 24 Jam
    const expiredTime = dayjs(transactionDate).add(PAYMENT_TIMEOUT_HOURS, 'hours');
    // Cek apakah waktu sekarang sudah melewati waktu kadaluarsa
    return dayjs().isAfter(expiredTime);
  };

  // === FETCH DATA ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRiwayatTransaksi();
        if (res?.data) {
          const mapped = res.data.map((trx) => {
            const summaryItems = [
              ...(trx.bookings?.map((b) => `Booking Ruangan - ${b.nama_ruangan}`) || []),
              ...(trx.memberships?.map((m) => `Membership - ${m.nama_paket}`) || []),
              ...(trx.virtual_offices?.map((v) => `Virtual Office - ${v.nama_paket}`) || []),
              ...(trx.events?.map((e) => `Event - ${e.nama_event || e.nama_space}`) || []),
            ];

            return {
              id: trx.id_transaksi,
              tanggal: trx.tanggal_transaksi,
              total: trx.total_harga_final,
              status: trx.status_pembayaran === "Lunas" ? "Sukses"
                : trx.status_pembayaran === "Belum Lunas" ? "Pending"
                  : trx.status_pembayaran === "Menunggu Konfirmasi" ? "Menunggu Konfirmasi" // Status Baru
                    : "Gagal",

              details: {
                bookings: trx.bookings || [],
                memberships: trx.memberships || [],
                virtual_offices: trx.virtual_offices || [],
                events: trx.events || [],
              },
              items: summaryItems,
            };
          });

          setTransactions(mapped);
          setFilteredTransactions(mapped);
        }
      } catch (error) {
        console.error("Gagal ambil riwayat transaksi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- HANDLER PEMBAYARAN ULANG (REPAY) ---
  const handleRepay = async (transactionId) => {
    setIsRepaying(true);
    try {
      const res = await getRepaymentLink(transactionId);

      if (res.payment_url) {
        message.loading("Mengalihkan ke halaman pembayaran...", 2);
        setTimeout(() => {
          window.location.href = res.payment_url;
        }, 1000);
      } else {
        message.error("Gagal mendapatkan link pembayaran.");
        setIsRepaying(false);
      }
    } catch (error) {
      console.error("Repay error:", error);
      message.error(error.message || "Gagal memproses pembayaran.");
      setIsRepaying(false);
    }
  };

  const handleFilter = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    const [start, end] = dates;
    const filtered = transactions.filter((trx) => {
      const trxDate = dayjs(trx.tanggal);
      return (
        trxDate.isAfter(start.startOf("day")) &&
        trxDate.isBefore(end.endOf("day"))
      );
    });
    setFilteredTransactions(filtered);
  };

  const showDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  // --- UPDATE LOGIKA TAG STATUS ---
  const getStatusTag = (status, transactionDate) => {
    // Cek apakah expired secara visual
    if (checkIsExpired(transactionDate, status)) {
      return <Tag icon={<CloseCircleOutlined />} color="default">Kadaluarsa</Tag>;
    }

    switch (status) {
      case "Sukses":
        return <Tag icon={<CheckCircleOutlined />} color="success">Lunas</Tag>;
      case "Pending":
        return <Tag icon={<LoadingOutlined />} color="warning">Belum Lunas</Tag>;
      // TAMBAHKAN CASE INI
      case "Menunggu Konfirmasi":
        return <Tag icon={<ClockCircleOutlined />} color="processing">Menunggu Konfirmasi Admin</Tag>;
      case "Gagal":
        return <Tag icon={<CloseCircleOutlined />} color="error">Gagal</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Sedang memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            Riwayat Transaksi
          </Title>
          <Text type="secondary">
            Pantau semua riwayat pemesanan Anda di satu tempat.
          </Text>
        </div>

        {/* FILTER SECTION */}
        <Row gutter={[12, 12]} justify="start" align="middle">
          <Col xs={24} sm={18}>
            <RangePicker
              value={selectedDates}
              onChange={(dates) => {
                setSelectedDates(dates);
                handleFilter(dates);
              }}
              style={{ width: "100%", borderRadius: "8px" }}
              placeholder={["Tanggal mulai", "Tanggal akhir"]}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              onClick={() => {
                setSelectedDates([]);
                handleFilter([]);
              }}
              style={{ borderRadius: "8px" }}
            >
              Reset Filter
            </Button>
          </Col>
        </Row>

        {/* LIST TRANSAKSI UTAMA */}
        {filteredTransactions.length === 0 ? (
          <Empty
            description={<span>Tidak ada transaksi pada periode ini.</span>}
            style={{ marginTop: "40px", background: "#fff", padding: "40px", borderRadius: "12px" }}
          />
        ) : (
          <List
            dataSource={filteredTransactions}
            renderItem={(item) => {
              // Hitung status expired untuk item ini
              const isExpired = checkIsExpired(item.tanggal, item.status);

              return (
                <List.Item
                  actions={[
                    // --- TOMBOL BAYAR SEKARANG ---
                    // Syarat: Status Pending, Harga > 0, DAN BELUM EXPIRED
                    item.status === "Pending" && item.total > 0 && !isExpired && (
                      <Button
                        type="primary"
                        size={isMobile ? "small" : "middle"}
                        danger
                        icon={<BankOutlined />}
                        loading={isRepaying}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRepay(item.id);
                        }}
                      >
                        Bayar Sekarang
                      </Button>
                    ),
                    !isMobile && (
                      <Button type="link" onClick={() => showDetail(item)}>
                        Detail
                      </Button>
                    ),
                  ]}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: "12px",
                    padding: isMobile ? "12px" : "16px",
                    marginBottom: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    background: "#fff",
                    // Beri sedikit opacity jika expired supaya terlihat non-aktif
                    opacity: isExpired ? 0.7 : 1
                  }}
                  onClick={() => showDetail(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ backgroundColor: isExpired ? "#f5f5f5" : "#e6f7ff", padding: "12px", borderRadius: "50%" }}>
                        <FileTextOutlined style={{ color: isExpired ? "#999" : "#1890ff", fontSize: "20px" }} />
                      </div>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "flex-start" : "center",
                          justifyContent: "space-between",
                          gap: isMobile ? "8px" : "0",
                        }}
                      >
                        <Text strong style={{ fontSize: "16px", color: isExpired ? "#666" : "inherit" }}>
                          {dayjs(item.tanggal).format("DD MMMM YYYY")}
                        </Text>
                        {/* Panggil fungsi getStatusTag dengan parameter tanggal */}
                        {getStatusTag(item.status, item.tanggal)}
                      </div>
                    }
                    description={
                      <>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontSize: "14px", display: "block", marginTop: "8px" }}
                        >
                          {item.items.join(", ")}
                        </Text>
                        <Text
                          strong
                          style={{ fontSize: "15px", color: isExpired ? "#999" : "#1890ff", display: "block", marginTop: "4px" }}
                        >
                          <DollarCircleOutlined style={{ marginRight: "4px" }} />
                          Total: Rp {item.total.toLocaleString("id-ID")}
                        </Text>

                        {/* --- INFO TAMBAHAN JIKA PENDING --- */}
                        {item.status === "Pending" && !isExpired && (
                          <>
                            {/* Jika harga 0 (Menunggu Admin) */}
                            {item.total === 0 ? (
                              <Text type="warning" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                                * Menunggu konfirmasi harga dari Admin
                              </Text>
                            ) : (
                              /* Jika sudah ada harga, tampilkan peringatan 24 jam */
                              <Text style={{ fontSize: "12px", display: "block", marginTop: "4px", color: "#faad14" }}>
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
                                Batas pembayaran 1x24 jam sejak pemesanan.
                              </Text>
                            )}
                          </>
                        )}

                        {/* --- INFO JIKA SUDAH EXPIRED --- */}
                        {isExpired && (
                          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px", color: "#ff4d4f" }}>
                            <CloseCircleOutlined style={{ marginRight: 4 }} />
                            Batas waktu pembayaran telah habis. Pesanan dibatalkan otomatis.
                          </Text>
                        )}
                      </>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Space>

      {/* MODAL DETAIL TRANSAKSI */}
      <Modal
        title="Detail Transaksi"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)} style={{ borderRadius: "8px" }}>
            Tutup
          </Button>,

          // --- TOMBOL BAYAR DI MODAL (CEK EXPIRED JUGA) ---
          selectedTransaction?.status === "Pending" &&
          selectedTransaction?.total > 0 &&
          !checkIsExpired(selectedTransaction.tanggal, selectedTransaction.status) && (
            <Button
              key="pay"
              type="primary"
              danger
              loading={isRepaying}
              onClick={() => handleRepay(selectedTransaction.id)}
              style={{ borderRadius: "8px" }}
            >
              Bayar Sekarang
            </Button>
          )
        ]}
        width={isMobile ? "95%" : 520}
        centered
        bodyStyle={{ padding: "24px", background: "#f9fafb", borderRadius: "10px" }}
      >
        {selectedTransaction && (
          <Card bordered={false} style={{ background: "transparent", padding: 0 }} bodyStyle={{ padding: 0 }}>
            {/* ALERT INFO BATAS WAKTU DI DALAM MODAL */}
            {selectedTransaction.status === "Pending" && !checkIsExpired(selectedTransaction.tanggal, selectedTransaction.status) && selectedTransaction.total > 0 && (
              <Alert
                message="Segera Lakukan Pembayaran"
                description="Mohon selesaikan pembayaran Anda dalam waktu 1x24 jam untuk menghindari pembatalan otomatis oleh sistem."
                type="warning"
                showIcon
                icon={<ClockCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* ALERT JIKA SUDAH EXPIRED */}
            {checkIsExpired(selectedTransaction.tanggal, selectedTransaction.status) && (
              <Alert
                message="Pesanan Kadaluarsa"
                description="Maaf, batas waktu pembayaran untuk pesanan ini telah habis. Silakan buat pesanan baru."
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Row justify="space-between">
              <Col><Text strong>ID Transaksi:</Text></Col>
              <Col><Text>#{selectedTransaction.id}</Text></Col>
            </Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Col><Text strong>Tgl. Transaksi:</Text></Col>
              <Col><Text>{dayjs(selectedTransaction.tanggal).utc().format("DD MMM YYYY, HH:mm")}</Text></Col>
            </Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Col><Text strong>Total:</Text></Col>
              <Col><Text>Rp {selectedTransaction.total.toLocaleString("id-ID")}</Text></Col>
            </Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between" align="middle">
              <Col><Text strong>Status:</Text></Col>
              {/* Panggil fungsi getStatusTag */}
              <Col>{getStatusTag(selectedTransaction.status, selectedTransaction.tanggal)}</Col>
            </Row>

            {/* Alert Info jika Menunggu Admin */}
            {selectedTransaction.status === "Pending" && selectedTransaction.total === 0 && (
              <Alert
                message="Menunggu Admin"
                description="Admin sedang meninjau pengajuan Anda. Silakan cek kembali nanti untuk melakukan pembayaran."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <Divider style={{ margin: "12px 0" }} />

            <Title level={5} style={{ marginBottom: "16px" }}>
              Detail Item
            </Title>

            {/* === DETAIL BOOKING RUANGAN === */}
            {selectedTransaction.details.bookings.length > 0 && (() => {
              const groupedBookings = selectedTransaction.details.bookings.reduce((acc, curr) => {
                const dateKey = dayjs(curr.waktu_mulai).format("YYYY-MM-DD");
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(curr);
                return acc;
              }, {});

              return (
                <div style={{ marginBottom: "16px" }}>
                  <Text strong style={{ display: "block", marginBottom: "8px" }}>
                    Booking Ruangan
                  </Text>
                  <Collapse accordion bordered={false} style={{ background: "transparent" }}>
                    {Object.entries(groupedBookings).map(([date, bookings]) => (
                      <Panel
                        key={date}
                        header={<Text strong style={{ fontSize: "15px" }}>{dayjs(date).format("DD MMMM YYYY")}</Text>}
                        style={{ background: "#fff", borderRadius: "8px", marginBottom: "10px", overflow: "hidden" }}
                      >
                        <List
                          itemLayout="horizontal"
                          dataSource={bookings}
                          renderItem={(item, index) => (
                            <List.Item style={{ padding: "10px 0", borderBottom: index === bookings.length - 1 ? "none" : "1px solid #f0f0f0" }}
                              extra={
                                <img alt={item.nama_ruangan} src={`${baseUrl}/static/${item.gambar_ruangan}`} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: "6px", marginLeft: "10px" }} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x60?text=No+Img"; }} />
                              }
                            >
                              <List.Item.Meta title={<Text strong>{item.nama_ruangan}</Text>} description={<Text type="secondary" style={{ fontSize: "13px" }}><CalendarOutlined style={{ marginRight: "6px" }} />{dayjs(item.waktu_mulai).format("HH:mm")} - {dayjs(item.waktu_selesai).format("HH:mm")}</Text>} />
                            </List.Item>
                          )}
                        />
                      </Panel>
                    ))}
                  </Collapse>
                </div>
              );
            })()}

            {/* DETAIL MEMBERSHIP */}
            {selectedTransaction.details.memberships.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Paket Membership</Text>
                <List itemLayout="horizontal" dataSource={selectedTransaction.details.memberships} renderItem={(item) => (
                  <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", marginBottom: 8 }}>
                    <List.Item.Meta title={<Text>{item.nama_paket}</Text>} description={<Text type="secondary"><CalendarOutlined style={{ marginRight: "6px" }} />Aktif: {dayjs(item.tanggal_mulai).format("DD MMM YYYY")} - {dayjs(item.tanggal_berakhir).format("DD MMM YYYY")}</Text>} />
                  </List.Item>
                )}
                />
              </div>
            )}

            {/* DETAIL VIRTUAL OFFICE */}
            {selectedTransaction.details.virtual_offices.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Paket Virtual Office</Text>
                <List itemLayout="horizontal" dataSource={selectedTransaction.details.virtual_offices} renderItem={(item) => (
                  <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", marginBottom: 8 }}>
                    <List.Item.Meta title={<Text>{item.nama_paket} ({item.nama_perusahaan})</Text>} description={<Text type="secondary"><CalendarOutlined style={{ marginRight: "6px" }} />Aktif: {dayjs(item.tanggal_mulai).format("DD MMM YYYY")} - {dayjs(item.tanggal_berakhir).format("DD MMM YYYY")}</Text>} />
                  </List.Item>
                )}
                />
              </div>
            )}

            {/* DETAIL EVENT */}
            {selectedTransaction.details.events.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Booking Event</Text>
                <List itemLayout="horizontal" dataSource={selectedTransaction.details.events} renderItem={(item) => (
                  <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", marginBottom: 8 }} extra={item.gambar_ruangan ? (<img alt={item.nama_space} src={`${baseUrl}/static/${item.gambar_ruangan}`} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: "6px", marginLeft: "10px" }} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x60?text=No+Img"; }} />) : null}>
                    <List.Item.Meta title={<Text>{item.nama_event || "Booking Event"}</Text>} description={<Text type="secondary"><CalendarOutlined style={{ marginRight: "6px" }} />{item.nama_space} | {dayjs(item.waktu_mulai).format("DD MMM YYYY, HH:mm")} - {dayjs(item.waktu_selesai).format("HH:mm")}</Text>} />
                  </List.Item>
                )}
                />
              </div>
            )}
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default RiwayatTransaksi;