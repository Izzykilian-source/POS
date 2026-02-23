import React, { useState, useMemo, useEffect } from "react";
import {
  SearchOutlined,
  CalendarOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  TagOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
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
  Modal,
  Divider,
  Empty,
  Spin, // <-- Impor Spin untuk loading
  message, // <-- Impor message untuk notifikasi error
} from "antd";
import { useNavigate } from "react-router-dom";

// Impor service Anda (pastikan path ini benar)
import { getSemuaAcara } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

// --- KOMPONEN MODAL PRATINJAU GAMBAR (ZOOM) ---
// (Tetap sama seperti kode Anda sebelumnya)
const ImagePreviewModal = ({ isVisible, imageUrl, handleCancel }) => {
  return (
    <Modal
      open={isVisible}
      onCancel={handleCancel}
      footer={null}
      title={null}
      width="fit-content"
      centered
      closeIcon={<CloseOutlined style={{ fontSize: 24, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 4 }} />}
      bodyStyle={{ padding: 0, backgroundColor: 'transparent' }}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      <img
        src={`${import.meta.env.VITE_BASE_URL}/static/${imageUrl}`}
        alt="Poster Acara Detail"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'block',
          borderRadius: '8px',
        }}
      />
    </Modal>
  );
};

// --- KOMPONEN MODAL DETAIL ACARA ---
// (Tetap sama seperti kode Anda sebelumnya)
const EventDetailModal = ({ isModalVisible, event, handleCancel }) => {
  if (!event) return null;

  const isUpcoming = event.status === 'upcoming';

  const customTitle = (
    <Title level={3} style={{ margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
      {event.title}
    </Title>
  );

  return (
    <Modal
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      title={customTitle}
      width={700}
      closeIcon={<CloseOutlined style={{ fontSize: 18, color: '#000' }} />}
      style={{ top: 50 }}
      bodyStyle={{ padding: 0 }}
    >
      <Card bordered={false} bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Gambar Detail */}
        <div
          style={{
            paddingBottom: '40%',
            backgroundImage: `url(${import.meta.env.VITE_BASE_URL}/static/${event.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            filter: isUpcoming ? 'none' : 'grayscale(10%) brightness(95%)',
            borderBottom: '1px solid #eee'
          }}
        >
          <Tag
            color={isUpcoming ? "green" : "red"}
            icon={isUpcoming ? null : <HistoryOutlined />}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontWeight: 600,
              padding: '4px 10px',
              fontSize: 13
            }}
          >
            {isUpcoming ? "Akan Datang" : "Sudah Berlalu"}
          </Tag>
        </div>

        {/* Detail Informasi */}
        <div style={{ padding: 24 }}>
          <Title level={4} style={{ margin: '0 0 20px 0', fontWeight: 600 }}>
            Informasi Utama
          </Title>

          <Row gutter={[24, 16]} style={{ marginBottom: 20 }}>
            <Col span={24}>
              <Space direction="vertical" size={10} style={{ display: 'flex' }}>
                <Space size={8}>
                  <CalendarOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                  <Text strong>Waktu & Tanggal:</Text>
                  <Text>{event.date} ({event.time})</Text>
                </Space>
                <Space size={8}>
                  <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                  <Text strong>Lokasi:</Text>
                  <Text>{event.location}</Text>
                </Space>
                <Space size={8}>
                  <DollarCircleOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                  <Text strong>Biaya:</Text>
                  {/* Menangani null price atau string 'Gratis' */}
                  <Text>{event.price ? event.price : 'Gratis'}</Text>
                </Space>
              </Space>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '8px 0 16px 0' }}>
            Deskripsi Lengkap
          </Divider>

          <Text style={{ display: 'block', lineHeight: 1.8, marginBottom: 20 }}>
            {event.description}
          </Text>

          <Divider orientation="left" style={{ margin: '8px 0 16px 0' }}>
            Kategori
          </Divider>
          <Space size={[0, 8]} wrap>
            {/* Pastikan event.tags adalah array sebelum mapping */}
            {Array.isArray(event.tags) && event.tags.map(tag => (
              <Tag key={tag} color="blue" icon={<TagOutlined />}>
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>
    </Modal>
  );
};

// --- KOMPONEN CARD InformasiAcara (RINGKAS & RATA TINGGI) ---
// (Tetap sama seperti kode Anda sebelumnya, tapi pastikan handleImageClick meneruskan imageUrl)
const EventCard = ({ event, handleDetailClick, handleImageClick }) => {
  const isUpcoming = event.status === 'upcoming';
  const cardBackgroundColor = isUpcoming ? '#fff' : '#f5f5f5';

  return (
    <Col
      xs={24}
      sm={12}
      lg={8}
      style={{ display: 'flex' }}
    >
      <Card
        onClick={() => isUpcoming && handleDetailClick(event)}
        hoverable={isUpcoming}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: isUpcoming ? "0 4px 12px rgba(0, 0, 0, 0.08)" : "0 2px 6px rgba(0, 0, 0, 0.05)",
          backgroundColor: cardBackgroundColor,
          cursor: isUpcoming ? 'pointer' : 'default',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ padding: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Bagian Poster Gambar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            // Pastikan event.imageUrl ada sebelum memanggil
            if (event.imageUrl) {
               handleImageClick(event.imageUrl);
            } else {
               // Handle jika tidak ada gambar, misal: tampilkan pesan
               console.warn("Tidak ada URL gambar untuk acara:", event.title);
            }
          }}
          style={{
            paddingBottom: '56.25%',
            backgroundImage: `url(${import.meta.env.VITE_BASE_URL}/static/${event.imageUrl})`, // Fallback jika imageUrl null
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            cursor: 'zoom-in',
            filter: isUpcoming ? 'none' : 'grayscale(10%) brightness(95%)',
          }}
        >
          <Tag
            color={isUpcoming ? "green" : "red"}
            icon={isUpcoming ? null : <HistoryOutlined />}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              fontWeight: 600,
              padding: '4px 10px',
              fontSize: 13
            }}
          >
            {isUpcoming ? "Akan Datang" : "Sudah Berlalu"}
          </Tag>
          {/* Teks "KLIK UNTUK ZOOM" bisa dihilangkan jika dirasa tidak perlu */}
        </div>

        {/* Bagian Detail Ringkas */}
        <div style={{
          padding: "16px 20px 20px 20px",
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Konten Atas */}
          <div>
            <Title
              level={4}
              style={{
                margin: "0 0 12px 0",
                fontWeight: 700,
                lineHeight: 1.3,
                color: isUpcoming ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.45)',
                height: '2.6em',
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {event.title}
            </Title>

            <Space direction="vertical" size={10} style={{ display: 'flex', marginBottom: 12 }}>
              <Space size={8} style={{ display: 'flex' }}>
                <CalendarOutlined style={{ color: isUpcoming ? '#1677ff' : '#bfbfbf', fontSize: 16 }} />
                <Text type={isUpcoming ? undefined : 'secondary'} style={{ fontSize: 14, color: isUpcoming ? '#595959' : '#8c8c8c', fontWeight: 500 }}>
                  {event.date} ({event.time})
                </Text>
              </Space>
              <Space size={8} style={{ display: 'flex' }}>
                <EnvironmentOutlined style={{ color: isUpcoming ? '#1677ff' : '#bfbfbf', fontSize: 16 }} />
                <Text type={isUpcoming ? undefined : 'secondary'} style={{ fontSize: 14, color: isUpcoming ? '#595959' : '#8c8c8c', fontWeight: 500 }}>
                  {event.location}
                </Text>
              </Space>
            </Space>
          </div>

          {/* Konten Bawah */}
          <div>
            {isUpcoming && (
              <Button
                type="dashed"
                size="small"
                icon={<InfoCircleOutlined />}
                style={{ width: '100%', marginBottom: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailClick(event);
                }}
              >
                Lihat Detail
              </Button>
            )}
            {/* Pastikan event.tags adalah array sebelum mapping */}
            <Space size={[0, 8]} wrap>
              {Array.isArray(event.tags) && event.tags.map(tag => (
                <Tag
                  key={tag}
                  color="default"
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    opacity: isUpcoming ? 1 : 0.5
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </Card>
    </Col>
  );
};


// --- KOMPONEN UTAMA InformasiAcara (Menggunakan Data Live) ---
const InformasiAcara = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("upcoming");

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  // --- State untuk Data Live ---
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // State untuk pesan error

  const navigate = useNavigate();

  // --- Fetch Data saat Komponen Dimuat ---
  useEffect(() => {
    const fetchAcara = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error sebelum fetch
        const data = await getSemuaAcara();
        setAllEvents(data || []); // Pastikan data adalah array
      } catch (err) {
        setError("Gagal memuat data acara. Silakan coba lagi nanti.");
        message.error("Gagal memuat data acara. Silakan coba lagi nanti."); // Tampilkan notifikasi
        console.error("Error fetching acara:", err);
        setAllEvents([]); // Kosongkan data jika error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcara();
  }, []); // Hanya dijalankan sekali saat mount

  // --- Handler untuk Modal ---
  const handleDetailClick = (event) => {
    setSelectedEvent(event);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedEvent(null);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalVisible(true);
  };

  const handleImageModalClose = () => {
    setIsImageModalVisible(false);
    setSelectedImageUrl(null);
  };

  // --- Filter Events berdasarkan State ---
  const filteredEvents = useMemo(() => {
    // Pastikan allEvents adalah array sebelum filter
    if (!Array.isArray(allEvents)) return [];

    return allEvents
      .filter((event) => event.status === filterStatus)
      .filter((event) =>
        // Periksa null/undefined sebelum toLowerCase()
        (event.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, filterStatus, allEvents]);

  // --- Hitung Jumlah Acara untuk Tombol Filter ---
   const upcomingCount = useMemo(() =>
    Array.isArray(allEvents) ? allEvents.filter(e => e.status === 'upcoming').length : 0,
  [allEvents]);

  const pastCount = useMemo(() =>
    Array.isArray(allEvents) ? allEvents.filter(e => e.status === 'past').length : 0,
  [allEvents]);

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh" }}>
      {/* HERO SECTION (Tetap sama) */}
       <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <Title
          level={1}
          style={{
            fontSize: "clamp(2.2rem, 4vw, 3.8rem)",
            fontWeight: 800,
            marginBottom: 20,
            color: "#1677ff",
          }}
        >
          Temukan Acara & Workshop Terdekat
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
          Tingkatkan skill dan perluas jaringan Anda dengan bergabung di berbagai
          acara edukatif dan komunitas yang kami selenggarakan.
        </Text>
      </div>


      {/* Konten Acara */}
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Search dan Filter Button */}
        <Row gutter={[16, 24]} style={{ marginBottom: "32px" }} align="middle">
          <Col xs={24} md={14}>
            <Search
              placeholder="Cari judul atau deskripsi acara..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(value) => setSearchTerm(value)}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
              size="large"
              loading={isLoading} // Tampilkan loading di search bar jika sedang fetch
            />
          </Col>

          <Col xs={24} md={10}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
              <Button
                type={filterStatus === "upcoming" ? "primary" : "default"}
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => setFilterStatus("upcoming")}
                style={{ fontWeight: 600, minWidth: 160 }}
                disabled={isLoading} // Disable tombol saat loading
              >
                Akan Datang ({isLoading ? <Spin size="small" /> : upcomingCount})
              </Button>
              <Button
                type={filterStatus === "past" ? "primary" : "default"}
                size="large"
                icon={<HistoryOutlined />}
                onClick={() => setFilterStatus("past")}
                style={{ fontWeight: 600, minWidth: 160 }}
                disabled={isLoading}
              >
                Sudah Berlalu ({isLoading ? <Spin size="small" /> : pastCount})
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Judul List Acara */}
        <Title level={3} style={{ margin: "0 0 16px 0", borderBottom: '2px solid #f0f0f0', paddingBottom: 8 }}>
          {filterStatus === "upcoming" ? "Acara Akan Datang" : "Acara Sudah Berlalu"}
        </Title>

        {/* Tampilkan Loading, Error, atau Data */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>Memuat Acara...</Text>
          </div>
        ) : error ? ( // Tampilkan pesan error jika ada
           <Empty
             description={
               <span style={{ color: 'red' }}>
                 {error}
               </span>
             }
             image={Empty.PRESENTED_IMAGE_SIMPLE}
             style={{ padding: '50px 0' }}
           />
        ) : filteredEvents.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id} // Gunakan ID dari database
                event={event}
                handleDetailClick={handleDetailClick}
                handleImageClick={handleImageClick}
              />
            ))}
          </Row>
        ) : ( // Tampilkan Empty jika tidak ada data setelah filter
          <Empty
            description={
              <span>
                Tidak ada acara <strong>{filterStatus === "upcoming" ? "Akan Datang" : "Sudah Berlalu"}</strong> yang cocok dengan pencarian Anda.
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '50px 0' }}
          />
        )}
      </div>

      {/* RENDER MODAL DETAIL ACARA */}
      {selectedEvent && (
        <EventDetailModal
          isModalVisible={isDetailModalVisible}
          event={selectedEvent}
          handleCancel={handleDetailModalClose}
        />
      )}

      {/* RENDER MODAL PRATINJAU GAMBAR */}
      {selectedImageUrl && (
        <ImagePreviewModal
          isVisible={isImageModalVisible}
          imageUrl={selectedImageUrl}
          handleCancel={handleImageModalClose}
        />
      )}
    </div>
  );
};

export default InformasiAcara;