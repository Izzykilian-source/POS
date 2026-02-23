import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

// Komponen Pembantu untuk baris detail
const DetailRow = ({ label, value, isTotal = false }) => (
  <div className="flex justify-between items-center">
    <span className={`${isTotal ? "font-bold text-black" : "text-gray-700 font-medium"} text-sm`}>{label}</span>
    <span className={`${isTotal ? "font-bold text-black" : "text-black font-semibold"} text-sm text-right`}>{value}</span>
  </div>
);

const BookingSukses = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Ambil data pemesanan yang dikirim dari halaman sebelumnya
  const bookingData = location.state || null;

  useEffect(() => {
    // Redirect jika data kosong, mencegah akses langsung ke halaman ini
    if (!bookingData) {
      alert("Data pemesanan tidak ditemukan. Kembali ke halaman utama.");
      navigate("/");
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null; // Jangan render jika tidak ada data

  const handleUnduhBukti = () => {
    alert("Bukti pemesanan diunduh (simulasi)");
  };

  const handleKembaliKeHome = () => {
    navigate("/dashboard-pengguna");
  };

  // Langsung tampilkan halaman struk sukses
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Ikon Centang Hijau */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={2} />
            </div>
          </div>
          
          {/* Judul dan pesan sukses */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Pesanan #{bookingData.id} Berhasil!
          </h1>
          <p className="text-gray-600 text-base mb-8 leading-relaxed">
            Silakan lakukan pembayaran <br /> melalui kasir.
          </p>
          
          {/* Detail Struk */}
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
            <div className="space-y-3">
              <DetailRow label="Ruangan:" value={bookingData.roomName} />
              <DetailRow label="Tanggal:" value={bookingData.selectedDate} />
              <DetailRow label="Waktu:" value={`${bookingData.selectedStartTime} - ${bookingData.selectedEndTime}`} />
              <DetailRow label="Durasi:" value={`${bookingData.duration} Jam`} />
              <DetailRow label="Nama Pemesan:" value={bookingData.name} />
              <DetailRow label="Keperluan:" value={bookingData.purpose} />
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4">
              <DetailRow label="Total Bayar" value={`Rp${bookingData.totalPrice?.toLocaleString()}`} isTotal={true} />
            </div>
          </div>
          
          {/* Tombol Unduh dan Kembali */}
          <button
            onClick={handleUnduhBukti}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-full font-semibold text-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            Unduh Bukti Pemesanan
          </button>
          <button
            onClick={handleKembaliKeHome}
            className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base transition duration-200"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSukses;