import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';

const TransaksiDone = () => {
    const location = useLocation();
    const transactionData = location.state?.transactionData;

    // 1. Periksa apakah data transaksi ada
    if (!transactionData) {
        console.error("Tidak ada data transaksi diterima di halaman TransaksiDone.");
        return <Navigate to="/" replace />; // Gunakan replace agar tidak menambah history
    }

    // 2. Destructure data dari backend (sesuaikan nama field jika berbeda)
    // Asumsi backend mengembalikan field ini sesuai perubahan database
    const {
        // id_transaksi, // Anda mungkin perlu ini jika ingin menampilkan nomor order
        nama_guest, // Nama sudah ada sebelumnya
        subtotal,         // HARGA SEBELUM PAJAK
        pajak_nominal,    // JUMLAH PAJAK DALAM RUPIAH
        total_harga_final, // HARGA SETELAH PAJAK (gunakan ini, bukan total_harga lama)
        detail_items // Menggunakan nama alias dari query backend (jika pakai GROUP_CONCAT)
                      // atau detail_order jika backend mengembalikan array terpisah
    } = transactionData;

    // Pastikan detail_items adalah array, tangani jika null atau undefined
    const detailOrderList = detail_items || transactionData.detail_order || [];


    // Helper function untuk format angka ke Rupiah
    const formatRupiah = (number) => {
        // Konversi ke number jika string, tangani null/undefined
        const num = parseFloat(number);
        if (isNaN(num)) {
            return 'Rp 0'; // Default jika tidak valid
        }
        return `Rp ${num.toLocaleString('id-ID')}`;
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans"> {/* Ganti background & font */}
            <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 w-full max-w-md text-center">
                {/* Icon Check */}
                <svg className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 text-green-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Lakukan Pembayaran di Kasir!
                </h1>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                    Terima kasih! Silakan tunjukkan detail ini saat melakukan pembayaran di kasir.
                </p>

                {/* --- BAGIAN DETAIL PESANAN --- */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left space-y-3 mb-6">
                    {/* Nama Pemesan */}
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-semibold text-gray-600">Nama Pemesan:</span>
                        <span className="font-semibold text-gray-800">{nama_guest || '-'}</span>
                    </div>

                    {/* Rincian Item Pesanan */}
                    <h3 className="font-semibold text-gray-700 pt-2">Rincian Pesanan:</h3>
                    <div className='space-y-2 max-h-48 overflow-y-auto pr-2'> {/* Batasi tinggi & scroll */}
                        {detailOrderList.length > 0 ? (
                            detailOrderList.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm items-start">
                                    <div className="flex-1 mr-2">
                                        <span className="text-gray-800 font-medium">{item.nama_produk || 'Nama Produk T/A'} (x{item.jumlah || 0})</span>
                                        {item.catatan_pesanan && (
                                            <p className="text-xs text-gray-500 italic pl-1 mt-0.5">
                                                "{item.catatan_pesanan}"
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-gray-700 font-medium whitespace-nowrap">
                                        {/* Hitung total per item */}
                                        {formatRupiah((parseFloat(item.harga_satuan || item.harga || item.harga_saat_order) || 0) * (parseInt(item.jumlah) || 0))}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">Tidak ada rincian item.</p>
                        )}
                    </div>

                    {/* Pembatas */}
                    <hr className="my-3 border-dashed" />

                    {/* --- RINCIAN HARGA BARU --- */}
                    <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-700">{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Pajak:</span>
                            <span className="font-medium text-gray-700">{formatRupiah(pajak_nominal)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-800 text-lg">Total Pembayaran:</span>
                            <span className="font-bold text-green-600 text-lg">
                                {/* Gunakan total_harga_final dari data */}
                                {formatRupiah(total_harga_final)}
                            </span>
                        </div>
                    </div>
                     {/* --- AKHIR RINCIAN HARGA BARU --- */}
                </div>

                {/* Tombol Kembali */}
                <div className="flex justify-center">
                    <Link
                        to='/' // Arahkan ke halaman menu utama
                        replace // Ganti history agar tidak bisa kembali ke halaman ini
                        className="w-full bg-testPrimary text-white rounded-lg px-6 py-3 shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out font-semibold"
                    >
                        Kembali Ke Menu Utama
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default TransaksiDone;