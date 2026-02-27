import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { ConfigProvider, Typography, Divider } from 'antd';
import { FaCheckCircle, FaReceipt } from "react-icons/fa";

const { Title, Text } = Typography;

const TransaksiDone = () => {
    const location = useLocation();
    const transactionData = location.state?.transactionData;

    // 1. Periksa apakah data transaksi ada
    if (!transactionData) {
        console.error("Tidak ada data transaksi diterima di halaman TransaksiDone.");
        return <Navigate to="/" replace />; 
    }

    // 2. Destructure data dari backend
    const {
        nama_guest, 
        subtotal,         
        pajak_nominal,    
        discount_nominal, // Tambahan defensif jika backend merespon dengan data diskon
        total_harga_final, 
        detail_items,
        detail_order 
    } = transactionData;

    const detailOrderList = detail_items || detail_order || [];

    // Helper function format Rupiah
    const formatRupiah = (number) => {
        const num = parseFloat(number);
        if (isNaN(num)) return 'Rp 0';
        return `Rp ${num.toLocaleString('id-ID')}`;
    };

    return (
        <ConfigProvider>
            <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col items-center justify-center p-4 py-12">
                
                <div className="w-full max-w-md w-full animate-fade-in">
                    
                    {/* --- KEPALA STRUK (SUCCESS INDICATOR) --- */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-5 relative">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                            <FaCheckCircle className="text-emerald-500 text-6xl relative z-10" />
                        </div>
                        <Title level={3} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                            Pesanan Berhasil!
                        </Title>
                        <p className="text-slate-500 mt-2 max-w-[280px] mx-auto text-sm font-medium">
                            Terima kasih! Silakan tunjukkan layar ini saat melakukan pembayaran di kasir.
                        </p>
                    </div>

                    {/* --- KARTU STRUK DIGITAL --- */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
                        
                        {/* Aksen "Gerigi" Struk (Efek Visual) */}
                        <div className="absolute top-0 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:16px_16px] -mt-1"></div>

                        <div className="p-6 pt-8">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                                <FaReceipt className="text-indigo-500 text-xl" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Transaksi</h3>
                            </div>

                            {/* Nama Pemesan */}
                            <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Atas Nama</span>
                                <span className="font-black text-slate-900 text-base">{nama_guest || '-'}</span>
                            </div>

                            {/* Rincian Item */}
                            <div className="mb-6">
                                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Item Dipesan</Text>
                                <div className='space-y-4 max-h-48 overflow-y-auto pr-2 no-scrollbar'>
                                    {detailOrderList.length > 0 ? (
                                        detailOrderList.map((item, index) => (
                                            <div key={index} className="flex justify-between items-start">
                                                <div className="flex-1 pr-3">
                                                    <div className="flex items-start">
                                                        <span className="font-bold text-slate-800 text-sm">{item.nama_produk || 'Menu T/A'}</span>
                                                        <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                                            x{item.jumlah || 0}
                                                        </span>
                                                    </div>
                                                    {item.catatan_pesanan && (
                                                        <p className="text-[11px] text-slate-500 italic mt-0.5 leading-snug">
                                                            "{item.catatan_pesanan}"
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-slate-700 text-sm whitespace-nowrap mt-0.5">
                                                    {formatRupiah((parseFloat(item.harga_satuan || item.harga || item.harga_saat_order) || 0) * (parseInt(item.jumlah) || 0))}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Rincian item tidak tersedia.</p>
                                    )}
                                </div>
                            </div>

                            <Divider className="my-0 border-slate-200" dashed />

                            {/* Rincian Biaya */}
                            <div className="py-5 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Subtotal</span>
                                    <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                                </div>
                                
                                {/* Tampilkan diskon jika ada data diskon dari API */}
                                {discount_nominal > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-emerald-500">Diskon Promo</span>
                                        <span className="font-semibold text-emerald-600">- {formatRupiah(discount_nominal)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Pajak Resto</span>
                                    <span className="font-semibold text-slate-800">{formatRupiah(pajak_nominal)}</span>
                                </div>
                            </div>

                            {/* Total Harga (Dark Card) */}
                            <div className="bg-slate-900 rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/30 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                                <span className="font-bold text-slate-300 text-sm relative z-10">Total Bayar</span>
                                <span className="font-black text-white text-xl relative z-10">
                                    {formatRupiah(total_harga_final)}
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* --- TOMBOL KEMBALI --- */}
                    <div className="mt-8 px-2">
                        <Link to='/' replace className="block w-full">
                            <button className="w-full bg-indigo-600 text-white rounded-2xl px-6 py-4 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all font-bold text-base flex justify-center items-center">
                                Selesai & Kembali ke Menu
                            </button>
                        </Link>
                    </div>

                </div>
            </div>

            <style>{`
                /* Sembunyikan scrollbar untuk bagian list item */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </ConfigProvider>
    );
}

export default TransaksiDone;