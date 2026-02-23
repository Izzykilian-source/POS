import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { MapPin, Mail, Building2, Wifi } from "lucide-react";

const virtualOfficePackages = [
  {
    id: 6,
    name: "Paket 6 Bulan",
    price: "Rp1.750.000",
    benefits: [
      { name: "Penerimaan surat & paket", included: true },
      { name: "Free meeting room (4 jam/bulan)", included: true },
      { name: "Free working space (8 jam/bulan)", included: true },
      { name: "Free WiFi member", included: true },
    ],
  },
  {
    id: 12,
    name: "Paket 12 Bulan",
    price: "Rp2.990.000",
    benefits: [
      { name: "Penerimaan surat & paket", included: true },
      { name: "Free meeting room (8 jam/bulan)", included: true },
      { name: "Free working space (12 jam/bulan)", included: true },
      { name: "Free WiFi member", included: true },
    ],
  },
];

// Hanya 4 fitur (Legal & Nama Logo dihapus)
const features = [
  {
    icon: <MapPin className="w-8 h-8 text-blue-500" />,
    title: "Alamat Bisnis",
    desc: "Anda dapat menjalankan bisnis secara efisien tanpa perlu menyewa ruang kantor",
  },
  {
    icon: <Mail className="w-8 h-8 text-blue-500" />,
    title: "Layanan Surat dan Dokumen",
    desc: "Kami akan mengurus surat dan dokumen Anda",
  },
  {
    icon: <Building2 className="w-8 h-8 text-blue-500" />,
    title: "Dago Credits",
    desc: "Anda dapat menggunakannya untuk memesan meja coworking atau ruang meeting",
  },
  {
    icon: <Wifi className="w-8 h-8 text-blue-500" />,
    title: "Free WIFI Member",
    desc: "Kerja nyaman dengan jaringan aman",
  },
];

const VirtualOffice = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  // useEffect(() => {
  //   if (userProfile?.roles === "admin") {
  //     navigate("/dashboardadmin");
  //   } else if (userProfile?.roles === "kasir") {
  //     navigate("/mengelola-orderan_fb");
  //   }
  // }, [userProfile, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="relative h-[600px] flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
          alt="Virtual Office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Virtual Office Premium <br /> Untuk Bisnis Modern
          </h1>
          <p className="text-lg lg:text-xl text-white mb-8">
            Dapatkan alamat bisnis prestisius, layanan surat, dan akses
            coworking space tanpa harus sewa kantor fisik. Hemat biaya,
            fleksibel, dan tetap profesional.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
            >
              Mulai Sekarang
            </button>
            <button
              onClick={() => window.scrollTo({ top: 800, behavior: "smooth" })}
              className="px-8 py-4 rounded-full border border-white text-white font-medium hover:bg-white hover:text-blue-700 transition"
            >
              Lihat Paket
            </button>
          </div>
        </div>
      </div>

      {/* Fitur Utama */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Fitur Utama</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dapatkan semua kebutuhan bisnis Anda dengan layanan virtual office
            terlengkap, mulai dari alamat bisnis prestisius hingga akses
            coworking dan meeting room modern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paket Virtual Office */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Pilih Paket Virtual Office
        </h2>
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 justify-center max-w-5xl mx-auto">
          {virtualOfficePackages.map((paket) => (
            <div
              key={paket.id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">{paket.name}</h3>
                <p className="text-xl font-semibold">{paket.price}</p>
              </div>

              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  {paket.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm text-gray-700"
                    >
                      <span>{benefit.name}</span>
                      {benefit.included ? (
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 mb-1">Mulai dari</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {paket.price}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/login/`, {
                      state: { paketName: paket.name },
                    })
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Daftar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualOffice;