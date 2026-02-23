import React, { useEffect, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { AuthContext } from "../../../providers/AuthProvider";
import { postTransaksiRuangan } from "../../../services/service";
import { formatRupiah } from "../../../utils/formatRupiah";
import { message, Spin } from "antd";

const BookingPayment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useContext(AuthContext);
    
    // State Loading untuk mencegah double submit & memberi feedback visual
    const [isLoading, setIsLoading] = useState(false);

    const {
        room,
        selectedRange,
        selectedStartTime,
        selectedEndTime,
        duration,
        purpose,
        total,
        paymentMethod,
        creditCost,
        membershipId,
        virtualOfficeId,
    } = location.state || {};

    // Validasi data saat load
    useEffect(() => {
        if (!room || !selectedRange || !duration) {
            message.error("Data booking tidak lengkap, silakan ulangi.");
            navigate("/");
        }
    }, [location.state, navigate, room, selectedRange, duration]);

    if (!room || !selectedRange || !duration) return null;

    // --- Helper Formatting ---
    const formattedDateDisplay = () => {
        if (!selectedRange.from) return "-";
        if (!selectedRange.to || moment(selectedRange.from).isSame(selectedRange.to, 'day')) {
            return moment(selectedRange.from).format("dddd, DD MMMM YYYY");
        }
        return `${moment(selectedRange.from).format("DD MMM YYYY")} - ${moment(selectedRange.to).format("DD MMM YYYY")}`;
    };

    const totalHari = selectedRange?.to ? moment(selectedRange.to).diff(moment(selectedRange.from), 'days') + 1 : 1;
    const totalCreditCost = creditCost * totalHari;
    const formattedStartTime = `${String(selectedStartTime).padStart(2, '0')}:00`;
    const formattedEndTime = `${String(selectedEndTime).padStart(2, '0')}:00`;

    // --- Variabel Boolean untuk Kondisi Render ---
    const isCreditPayment = paymentMethod === 'credit';
    const isVOPayment = paymentMethod === 'virtual_office';
    const isNormalPayment = !isCreditPayment && !isVOPayment;

    // --- HANDLER TRANSAKSI UTAMA ---
    const handleInputTransaksi = async () => {
        setIsLoading(true); // Mulai loading
        try {
            const bookingData = {
                id_user: userProfile?.id_user,
                id_ruangan: room.id_ruangan,
                tanggal_mulai: moment(selectedRange.from).format("YYYY-MM-DD"),
                tanggal_selesai: moment(selectedRange.to || selectedRange.from).format("YYYY-MM-DD"),
                jam_mulai: selectedStartTime,
                jam_selesai: selectedEndTime,
                
                paymentMethod: paymentMethod,
                
                // Jika metode normal, kirim harga asli. Jika kredit/VO, harga 0.
                total_harga_final: isNormalPayment ? total : 0,
                
                metode_pembayaran: 
                    isCreditPayment ? 'Membership Credit' 
                    : isVOPayment ? 'Virtual Office Benefit' 
                    : 'qris', // Default label untuk backend

                creditCost: totalCreditCost,
                membershipId: membershipId,
                virtualOfficeId: virtualOfficeId,
                benefitCost: duration * totalHari 
            };

            const res = await postTransaksiRuangan(bookingData);

            if (res.payment_url) {
                // KASUS 1: Ada URL Pembayaran (iPaymu)
                message.loading("Mengalihkan ke halaman pembayaran...", 2.5);
                
                // Beri jeda sedikit agar user bisa baca pesan loading
                setTimeout(() => {
                    window.location.href = res.payment_url; 
                }, 1000);

            } else if (res.message && res.message.toLowerCase().includes("berhasil")) {
                // KASUS 2: Sukses Tanpa Redirect (Kredit / VO)
                message.success("Booking berhasil dikonfirmasi!");
                navigate("/riwayat-transaksi", {
                    state: { transaksi: res, isNew: true },
                });
            } else {
                // KASUS 3: Gagal / Error dari Backend
                throw new Error(res.error || res.message || "Gagal memproses booking.");
            }

        } catch (error) {
            console.error("Gagal input transaksi:", error);
            message.error(`Gagal: ${error.message || 'Terjadi kesalahan sistem.'}`);
            setIsLoading(false); // Stop loading jika error
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full">

                {/* Header & Judul */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isNormalPayment ? "Pembayaran Online" : "Konfirmasi Booking"}
                    </h2>
                    
                    {/* Pesan Khusus untuk iPaymu */}
                    {isNormalPayment && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-lg">
                            <p>Anda akan diarahkan ke halaman pembayaran aman <b>iPaymu</b> (QRIS / Virtual Account) setelah menekan tombol bayar.</p>
                        </div>
                    )}
                </div>

                {/* Card Detail Pesanan */}
                <div className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100">
                    <div className="flex justify-between items-center text-gray-700"> 
                        <span className="font-medium">Ruangan</span> 
                        <span className="font-semibold">{room.nama_ruangan}</span> 
                    </div>
                    <div className="flex justify-between items-center text-gray-700"> 
                        <span className="font-medium">Tanggal</span> 
                        <span className="font-semibold text-right">{formattedDateDisplay()}</span> 
                    </div>
                    <div className="flex justify-between items-center text-gray-700"> 
                        <span className="font-medium">Waktu</span> 
                        <span className="font-semibold"> {formattedStartTime} - {formattedEndTime} </span> 
                    </div>
                    <div className="flex justify-between items-center text-gray-700"> 
                        <span className="font-medium">Durasi Total</span> 
                        <span className="font-semibold">{duration * totalHari} jam</span> 
                    </div>
                    {purpose && (
                        <div className="flex justify-between items-center text-gray-700"> 
                            <span className="font-medium">Keperluan</span> 
                            <span className="font-semibold">{purpose}</span> 
                        </div>
                    )}

                    <hr className="my-2 border-gray-200" />

                    {/* Total Biaya Dinamis */}
                    {isVOPayment ? (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Biaya</span>
                            <span className="text-green-600">Benefit VO (Gratis)</span>
                        </div>
                    ) : isCreditPayment ? (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Biaya</span>
                            <span className="text-blue-600">{totalCreditCost} Kredit</span>
                        </div>
                    ) : (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Bayar</span>
                            <span className="text-blue-600">{formatRupiah(total)}</span>
                        </div>
                    )}
                </div>

                {/* Tombol Aksi */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        disabled={isLoading}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                        Batal
                    </button>
                    
                    <button 
                        onClick={handleInputTransaksi} 
                        disabled={isLoading}
                        className={`w-full text-white py-3 rounded-xl font-semibold shadow-md transition flex justify-center items-center gap-2
                            ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                        `}
                    >
                        {isLoading && <Spin size="small" />} {/* Spinner Loading */}
                        
                        {!isLoading && (
                            isVOPayment ? 'Gunakan Benefit' 
                            : isCreditPayment ? 'Bayar Pakai Kredit' 
                            : 'Bayar Sekarang'
                        )}
                        
                        {isLoading && ' Memproses...'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;