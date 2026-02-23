import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { formatRupiah } from "../../../utils/formatRupiah";
import { getAllRuangan } from "../../../services/service";
import {
  Calendar,
  Clock,
  Monitor,
  CheckCircle,
  Wifi,
  Coffee,
  Snowflake,
  XCircle,
} from "lucide-react";
import { CgUser } from "react-icons/cg";
import { MdDesk, MdMeetingRoom } from "react-icons/md";

const baseUrl = import.meta.env.VITE_BASE_URL || "";

// Hook deteksi ukuran layar
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

// === Komponen Jadwal ===
const JadwalHariIni = ({ jadwalTerisi = [], isMobile }) => {
  const jamOperasional = Array.from({ length: 15 }, (_, i) => 8 + i);
  const currentHour = new Date().getHours();

  return (
    <div className={`${isMobile ? "mt-2 mb-2" : "mt-2 mb-2"}`}>
      <p
        className={`text-${
          isMobile ? "xs" : "sm"
        } text-gray-500 font-bold mb-2`}
        style={{ fontSize: isMobile ? 10 : 12 }}
      >
        Jam Tersedia Hari Ini:
      </p>

      <div className="flex flex-wrap gap-1">
        {jamOperasional.map((jam) => {
          const isBooked = jadwalTerisi.includes(jam);
          const isPast = jam < currentHour;
          const isUnavailable = isBooked || isPast;
          const timeText = String(jam).padStart(2, "0");

          const titleSuffix = isBooked
            ? " (Terisi)"
            : isPast
            ? " (Telah Lewat)"
            : " (Tersedia)";
          const tooltipTitle = `${timeText}:00 - ${String(jam + 1).padStart(
            2,
            "0"
          )}:00${titleSuffix}`;

          const boxClasses = isUnavailable
            ? "bg-gray-200 text-gray-500"
            : "bg-green-100 text-green-700 font-semibold";

          return (
            <div
              key={jam}
              title={tooltipTitle}
              className={`${boxClasses} py-1 px-2 rounded text-xs`}
              style={{ minWidth: 30, textAlign: "center" }}
            >
              {timeText}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === Komponen Fitur Utama ===
const MainFeatures = ({ features, isMobile }) => {
  const iconSize = isMobile ? 18 : 22;
  const labelSize = isMobile ? 9 : 11;
  const mainFeatureIcons = [
    {
      key: "internet",
      icon: <Wifi size={iconSize} />,
      label: "Internet",
    },
    {
      key: "air minum",
      icon: <Coffee size={iconSize} />,
      label: "Refill Water",
    },
    {
      key: "ac",
      icon: <Snowflake size={iconSize} />,
      label: "AC",
    },
    {
      key: "rokok",
      icon: <XCircle size={iconSize} />,
      label: "No Smoking",
      isNegative: true,
    },
  ];

  const featuresLower = (features || "").toLowerCase();

  return (
    <div className="flex justify-around py-2 gap-1 my-2 border-t border-b border-gray-200">
      {mainFeatureIcons.map((f) => {
        let opacityValue = 1;
        if (f.isNegative) {
          const isSmokingAllowed = featuresLower.includes("rokok");
          opacityValue = isSmokingAllowed ? 0.4 : 1;
        }

        return (
          <div
            key={f.key}
            className="flex flex-col items-center gap-1 flex-1"
            style={{ opacity: opacityValue }}
          >
            {f.icon}
            <span
              className="text-gray-500 text-center"
              style={{ fontSize: labelSize }}
            >
              {f.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// === Komponen Utama ===
const InformasiRuangan = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("");
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [width] = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    if (userProfile?.roles === "admin") {
      navigate("/dashboardadmin");
    } else if (userProfile?.roles === "kasir") {
      navigate("/mengelola-orderan_fb");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, navigate]);

  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        const result = await getAllRuangan();
        const availableRooms = result.datas || [];
        setRooms(availableRooms);

        if (availableRooms.length > 0) {
          const firstCategory = Object.keys(groupByCategory(availableRooms))[0];
          setActiveTabKey(firstCategory);
        }
      } catch (error) {
        console.error("Gagal mengambil data ruangan:", error);
      }
    };

    fetchRuangan();
  }, []);

  const groupByCategory = (roomsList) => {
    return roomsList.reduce((groups, room) => {
      let kategori = room.nama_kategori?.toLowerCase() || "lainnya";

      // Gabungkan semua kategori yang mengandung kata "meeting" atau "room" ke satu kategori
      if (kategori.includes("meeting") || kategori.includes("room")) {
        kategori = "Meeting Room";
      } else if (kategori.includes("monitor")) {
        kategori = "Monitor";
      } else if (kategori.includes("lesehan")) {
        kategori = "Lesehan";
      } else if (kategori.includes("open space")) {
        kategori = "Open Space";
      } else {
        // Kapitalisasi huruf pertama agar rapi
        kategori = kategori.charAt(0).toUpperCase() + kategori.slice(1);
      }

      if (!groups[kategori]) groups[kategori] = [];
      groups[kategori].push(room);
      return groups;
    }, {});
  };

  const getCategoryIcon = (kategori) => {
    const iconSize = isMobile ? 18 : 16;
    const lower = (kategori || "").toLowerCase();

    if (lower.includes("monitor")) return <Monitor size={iconSize} />;
    if (lower.includes("lesehan")) return <CgUser size={iconSize} />;
    if (lower.includes("open space")) return <MdDesk size={iconSize} />;
    if (lower.includes("room") || lower.includes("meeting"))
      return <MdMeetingRoom size={iconSize} />;
    return null;
  };

  const getAllRoomFeatures = (featureString) => {
    if (!featureString) return [];
    return featureString
      .split(/\r?\n|,/)
      .map((f) => f.trim())
      .filter(Boolean);
  };

  const groupedRooms = groupByCategory(rooms);
  const categories = Object.keys(groupedRooms);
  const getCategoryColor = () => "#1890ff";

  return (
    <div
      className={`min-h-screen ${
        isMobile ? "overflow-y-auto overscroll-contain" : "overflow-y-visible"
      }`}
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className={`px-${isMobile ? "4" : "6"} py-6 max-w-6xl mx-auto`}
        style={{
          paddingTop: isMobile ? 16 : 24,
          paddingBottom: isMobile ? 80 : 24, // tambah padding bawah biar tidak ketutup
        }}
      >
        <div
          className={`mb-6 ${isMobile ? "text-center" : "text-left"}`}
          style={{ marginBottom: 24 }}
        >
          <h2 className={`font-bold ${isMobile ? "text-2xl" : "text-3xl"}`}>
            Pilih Ruangan Anda
          </h2>
          <p className="text-gray-500">
            Temukan ruang kerja yang sempurna untuk produktivitas Anda.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 w-full">
          <input
            type="text"
            placeholder="Cari nama ruangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 bg-gray-100 p-1.5 rounded-full">
            {categories.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-600">
                Tidak ada kategori
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTabKey(cat);
                    setSearchTerm("");
                  }}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeTabKey === cat
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2 text-center">
                    {getCategoryIcon(cat)}
                    <span>
                      {isMobile
                        ? `${cat.split(" ")[0]} (${groupedRooms[cat].length})`
                        : `${cat} (${groupedRooms[cat].length})`}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* List ruang berdasarkan category aktif */}
        <div>
          {(!activeTabKey || !groupedRooms[activeTabKey]) &&
            categories.length > 0 &&
            // set first tab if not set yet
            (() => {
              setActiveTabKey(categories[0]);
              return null;
            })()}

          {activeTabKey && groupedRooms[activeTabKey] && (
            <div className="space-y-6">
              {groupedRooms[activeTabKey]
                .filter((room) =>
                  room.nama_ruangan
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((room) => {
                  const allFeaturesList = getAllRoomFeatures(
                    room.fitur_ruangan
                  );
                  const featuresList = allFeaturesList.slice(0, 6);
                  const minPrice =
                    room.paket_harga?.length > 0
                      ? Math.min(...room.paket_harga.map((p) => p.harga_paket))
                      : null;
                  const jamOperasionalText =
                    room.jam_operasional || "Senin - Sabtu | 08:00 - 22:00";
                  const [hari, jam] = jamOperasionalText
                    .split("|")
                    .map((s) => s.trim());

                  return (
                    <div
                      key={room.id_ruangan}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <div
                        className={`flex flex-col md:flex-row ${
                          isMobile ? "" : ""
                        }`}
                      >
                        {/* IMAGE */}
                        <div
                          className={`w-full md:w-2/5 ${
                            isMobile ? "h-48" : "h-auto"
                          }`}
                        >
                          <img
                            alt={room.nama_ruangan}
                            src={`${baseUrl}/static/${room.gambar_ruangan}`}
                            className="w-full h-full object-cover"
                            style={{ height: isMobile ? 200 : "100%" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found";
                            }}
                          />
                        </div>

                        {/* DETAIL */}
                        <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                          <div>
                            <h3
                              className={`font-bold ${
                                isMobile ? "text-lg" : "text-xl"
                              } mb-1`}
                            >
                              {room.nama_ruangan}
                            </h3>

                            <div className="flex items-center flex-wrap text-sm text-gray-500 gap-3 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} /> {hari}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} /> {jam}
                              </span>
                              <span className="flex items-center gap-1">
                                <CgUser size={14} />{" "}
                                <strong>{room.kapasitas}</strong> Orang
                              </span>
                            </div>

                            <MainFeatures
                              features={room.fitur_ruangan}
                              isMobile={isMobile}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                              {featuresList.map((feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle
                                    size={16}
                                    className="text-green-600"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <JadwalHariIni
                              jadwalTerisi={room.jadwal_hari_ini || []}
                              isMobile={isMobile}
                            />
                          </div>

                          <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase text-gray-500">
                                Mulai dari
                              </p>
                              <p
                                className={`font-extrabold ${
                                  isMobile ? "text-2xl" : "text-3xl"
                                }`}
                              >
                                {minPrice !== null
                                  ? formatRupiah(minPrice)
                                  : "N/A"}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                navigate(`/roomdetail/${room.id_ruangan}`, {
                                  state: room,
                                })
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                              style={{ borderRadius: 8 }}
                            >
                              Pesan Sekarang
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Jika tidak ada kategori / data */}
          {categories.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>Belum ada data ruangan tersedia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformasiRuangan;