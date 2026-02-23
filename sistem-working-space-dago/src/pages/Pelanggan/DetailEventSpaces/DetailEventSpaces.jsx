import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Button,
  Carousel,
  Row,
  Col,
  Divider,
  message,
  Modal,
  Spin,
  Form,
  Input,
  InputNumber,
  Alert,
  Card,
  TimePicker,
} from "antd";
import { DayPicker } from "react-day-picker";
import { CheckCircleOutlined } from "@ant-design/icons";
import "react-day-picker/dist/style.css";
import { AuthContext } from "../../../providers/AuthProvider";
import { jwtStorage } from "../../../utils/jwtStorage";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;

const getEventSpaceById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/event-spaces/${id}`);
  if (!res.ok) throw new Error("Gagal memuat data ruangan.");
  return res.json();
};

const createBooking = async (data, token) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/eventspaces/bookingEvent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let result = {};
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Response bukan JSON: ${text}`);
  }

  if (!res.ok) throw new Error(result.message || "Gagal menyimpan booking.");
  return { ...result, data };
};

const DetailEventSpaces = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [roomData, setRoomData] = useState(state);
  const [loading, setLoading] = useState(!state);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [form] = Form.useForm();
  const startTimeMoment = Form.useWatch("waktu_mulai", form);

  useEffect(() => {
    if (!roomData) {
      setLoading(true);
      getEventSpaceById(id)
        .then(setRoomData)
        .catch(() => {
          message.error("Gagal memuat data. Redirecting...");
          setTimeout(() => navigate("/event-spaces"), 2000);
        })
        .finally(() => setLoading(false));
    }
  }, [id, roomData, navigate]);

  const handleDateSelect = (date) => setSelectedDate(date);

  const formatDateTimeSQL = (momentObject) =>
    momentObject ? momentObject.format("HH:mm:ss") : null;

  const handleSubmit = async (values) => {
    if (!selectedDate) {
      message.error("Pilih tanggal terlebih dahulu!");
      return;
    }

    if (!userProfile?.id_user)
      return message.error("Anda harus login untuk mengajukan booking.");

    const startHour = values.waktu_mulai.hour();
    const startMinute = values.waktu_mulai.minute();
    const endHour = values.waktu_selesai.hour();
    const endMinute = values.waktu_selesai.minute();

    const baseDate = moment(selectedDate);
    const finalWaktuMulai = baseDate
      .clone()
      .hour(startHour)
      .minute(startMinute)
      .second(0);
    const finalWaktuSelesai = baseDate
      .clone()
      .hour(endHour)
      .minute(endMinute)
      .second(0);

    const finalData = {
      id_user: userProfile.id_user,
      id_event_space: roomData.id_event_space,
      tanggal_event: selectedDate.toISOString().split("T")[0],
      waktu_mulai: finalWaktuMulai.format("YYYY-MM-DD HH:mm:ss"),
      waktu_selesai: finalWaktuSelesai.format("YYYY-MM-DD HH:mm:ss"),
      nama_acara: values.nama_acara,
      deskripsi: values.deskripsi,
      jumlah_peserta: values.jumlah_peserta,
      kebutuhan_tambahan: values.kebutuhan_tambahan || "-",
      email_customer: userProfile.user_logged,
    };

    try {
      setSubmitting(true);
      const token = await jwtStorage.retrieveToken();
      const result = await createBooking(finalData, token);

      setBookingData({
        ...finalData,
        booking_id: result?.data?.booking_id || "-",
        nama_ruangan: roomData.nama_event_space,
      });

      setModalVisible(true);
      message.success("Booking berhasil dikirim ke admin!");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Gagal menyimpan booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const disabledHoursStart = () => {
    const now = moment();
    const isToday = selectedDate && moment(selectedDate).isSame(now, "day");
    const currentHour = now.hour();
    const disabled = [];

    for (let i = 0; i < OPENING_HOUR; i++) disabled.push(i);
    for (let i = CLOSING_HOUR + 1; i <= 23; i++) disabled.push(i);

    if (isToday) {
      for (let i = OPENING_HOUR; i < currentHour; i++) disabled.push(i);
    }

    return [...new Set(disabled)];
  };

  const disabledHoursEnd = () => {
    if (!startTimeMoment) return [];
    const startHour = startTimeMoment.hour();
    const disabled = [];

    for (let i = 0; i <= startHour; i++) disabled.push(i);
    for (let i = CLOSING_HOUR + 1; i <= 23; i++) disabled.push(i);

    return [...new Set(disabled)];
  };

  const facilities = roomData?.fitur_ruangan
    ? roomData.fitur_ruangan.split("\n").filter((f) => f.trim() !== "")
    : [];

  if (loading || !roomData)
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );

  const mainImage = `${API_BASE_URL}/static/${roomData.gambar_ruangan}`;
  const images =
    roomData.galeri_gambar?.length > 0
      ? roomData.galeri_gambar.map((img) => `${API_BASE_URL}/static/${img}`)
      : [mainImage];

  return (
    <div style={{ background: "#f0f2f5", padding: 24, minHeight: "100vh" }}>
      <Row justify="center">
        <Col xs={24} sm={24} md={22} lg={20} xl={18}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            }}
          >
            <Row gutter={[0, 0]}>
              {/* BAGIAN KIRI */}
              <Col xs={24} lg={12} style={{ padding: 32, background: "#e6f7ff" }}>
                <Title
                  level={2}
                  style={{ color: "#0056b3", textAlign: "center" }}
                >
                  {roomData.nama_event_space}
                </Title>
                <Carousel autoplay arrows>
                  {images.map((src, i) => (
                    <div key={i}>
                      <img
                        src={src}
                        alt={`Event ${i}`}
                        style={{
                          width: "100%",
                          height: window.innerWidth < 768 ? 220 : 350,
                          objectFit: "cover",
                          borderRadius: 12,
                        }}
                      />
                    </div>
                  ))}
                </Carousel>

                <Title level={5} style={{ marginTop: 24 }}>
                  Deskripsi Ruangan
                </Title>
                <Paragraph style={{ textAlign: "justify" }}>
                  {roomData.deskripsi_event_space}
                </Paragraph>
                <Divider />
                <Text strong>Kapasitas: {roomData.kapasitas} orang</Text>
                <ul style={{ paddingLeft: 0, marginTop: 8, listStyle: "none" }}>
                  {facilities.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 6,
                        textAlign: "justify",
                      }}
                    >
                      <CheckCircleOutlined
                        style={{ color: "#1890ff", marginRight: 8 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </Col>

              {/* BAGIAN KANAN */}
              <Col xs={24} lg={12} style={{ padding: 32 }}>
                <Title
                  level={3}
                  style={{ color: "#0056b3", textAlign: "center" }}
                >
                  Formulir Booking
                </Title>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="nama_acara"
                        label="Nama Acara"
                        rules={[{ required: true, message: "Wajib diisi" }]}
                      >
                        <Input placeholder="Contoh: Rapat Tahunan" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="jumlah_peserta"
                        label="Jumlah Peserta"
                        rules={[
                          {
                            required: true,
                            message: "Jumlah peserta wajib diisi",
                          },
                          {
                            type: "number",
                            max: roomData.kapasitas,
                            message: `Jumlah peserta tidak boleh melebihi kapasitas (${roomData.kapasitas} orang)`,
                          },
                          {
                            type: "number",
                            min: 1,
                            message: "Jumlah peserta minimal 1 orang",
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={roomData.kapasitas}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="deskripsi"
                    label="Deskripsi Acara"
                    rules={[{ required: true, message: "Wajib diisi" }]}
                  >
                    <TextArea rows={3} />
                  </Form.Item>
                  <Form.Item
                    name="kebutuhan_tambahan"
                    label="Kebutuhan Tambahan (Opsional)"
                  >
                    <TextArea
                      rows={2}
                      placeholder="Contoh: Proyektor, Mic, Coffee Break"
                    />
                  </Form.Item>

                  {/* === VALIDASI TANGGAL === */}
                  <Form.Item
                    label="Pilih Tanggal & Waktu"
                    required
                    validateStatus={!selectedDate ? "error" : ""}
                    style={{ marginBottom: 8 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        background: "white",
                        borderRadius: 12,
                        padding: 6,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 260,
                          transform: "scale(0.78)",
                          transformOrigin: "top center",
                        }}
                      >
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={{ before: new Date() }}
                        />
                      </div>
                    </div>

                    {/* Pesan error manual agar muncul tepat di bawah kalender */}
                    {!selectedDate && (
                      <div
                        style={{
                          color: "#ff4d4f",
                          fontSize: 13,
                          marginTop: -50,
                          textAlign: "center",
                        }}
                      >
                        Pilih tanggal
                      </div>
                    )}
                  </Form.Item>


                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="waktu_mulai"
                        label="Jam Mulai"
                        rules={[{ required: true, message: "Pilih jam mulai" }]}
                      >
                        <TimePicker
                          format="HH"
                          hourStep={1}
                          minuteStep={60}
                          style={{ width: "100%" }}
                          disabledHours={disabledHoursStart}
                          hideDisabledOptions
                          showNow={false}
                          showOk={false}
                          needConfirm={false}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="waktu_selesai"
                        label="Jam Selesai"
                        rules={[{ required: true, message: "Pilih jam selesai" }]}
                      >
                        <TimePicker
                          format="HH"
                          hourStep={1}
                          minuteStep={60}
                          style={{ width: "100%" }}
                          hideDisabledOptions
                          showNow={false}
                          showOk={false}
                          disabledHours={disabledHoursEnd}
                          disabled={!startTimeMoment}
                          needConfirm={false}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Alert
                    message="Pengajuan Anda akan dikirim otomatis ke admin."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    block
                    size="large"
                    style={{ borderRadius: 10, fontWeight: "bold" }}
                  >
                    KIRIM PENGAJUAN BOOKING
                  </Button>
                </Form>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* === MODAL === */}
      <Modal
        title={<Title level={4}>✅ Detail Pengajuan Booking</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="riwayat"
            type="primary"
            onClick={() => navigate("/riwayat-transaksi")}
          >
            Lihat Riwayat Pesanan
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        bodyStyle={{
          maxHeight: "70vh",
          overflowY: "auto",
          padding: 16,
        }}
        centered
        destroyOnClose
      >
        {bookingData && (
          <div style={{ lineHeight: 1.7 }}>
            <Text strong>Ruangan:</Text> {bookingData.nama_ruangan}
            <br />
            <Text strong>Tanggal:</Text>{" "}
            {selectedDate?.toLocaleDateString("id-ID")}
            <br />
            <Text strong>Jam:</Text> {bookingData.waktu_mulai} -{" "}
            {bookingData.waktu_selesai}
            <br />
            <Text strong>Peserta:</Text> {bookingData.jumlah_peserta}
            <br />
            <Text strong>Nama Acara:</Text> {bookingData.nama_acara}
            <br />
            <Text strong>Deskripsi:</Text> {bookingData.deskripsi}
            <br />
            <Text strong>Kebutuhan Tambahan:</Text>{" "}
            {bookingData.kebutuhan_tambahan}
            <br />
            <Divider />
            <Text type="secondary">
              Admin akan segera menghubungi Anda melalui email untuk
              konfirmasi waktu & detail acara.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DetailEventSpaces;