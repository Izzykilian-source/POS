import React, { useEffect, useState } from 'react';
import DetailKeranjang from '../../components/DetailKeranjang';
import { Link, useNavigate } from 'react-router-dom';
import { getFnbTaxRate } from '../../services/api'; 
import { IoMdArrowBack } from "react-icons/io";
import { ConfigProvider, Typography, Spin, Divider } from 'antd';
import { TbReceiptTax, TbBasketOff } from "react-icons/tb";

const { Title } = Typography;

const ConfirmOrderPelanggan = () => {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState(() => {
        const store = localStorage.getItem('selectedItem');
        return store ? JSON.parse(store) : [];
    });

    const [pajakPersen, setPajakPersen] = useState(0); 
    const [isLoadingTax, setIsLoadingTax] = useState(true); 

    // Fetch Pajak
    useEffect(() => {
        const fetchTax = async () => {
            setIsLoadingTax(true);
            try {
                const rate = await getFnbTaxRate();
                setPajakPersen(rate);
            } catch (error) {
                console.error("Gagal mengambil tarif pajak:", error);
                setPajakPersen(10); // Fallback jika API gagal
            } finally {
                setIsLoadingTax(false);
            }
        };
        fetchTax();
    }, []); 

    // Update localStorage
    useEffect(() => {
        localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
    }, [selectedItem]);

    // Filter valid items
    const validItems = selectedItem.filter(item => item.countItem > 0);

    // Kalkulasi
    const subtotal = validItems.reduce((acc, item) => {
        const hargaItem = parseFloat(item.harga_menu || item.harga) || 0;
        const jumlahItem = parseInt(item.countItem) || 0;
        return acc + (hargaItem * jumlahItem);
    }, 0);

    const pajakNominal = subtotal * (pajakPersen / 100);
    const totalHargaFinal = subtotal + pajakNominal;

    // Helper Format Rupiah
    const formatRupiah = (number) => {
         const num = parseFloat(number);
         if (isNaN(num)) return 'Rp 0';
         return `Rp ${num.toLocaleString('id-ID')}`;
    };

    return (
        <ConfigProvider>
            <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-40 lg:pb-12">
                
                {/* 1. APP HEADER RESPONSIVE */}
                <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                    {/* max-w-6xl agar melebar pas di Desktop */}
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <IoMdArrowBack size={24} />
                        </button>
                        <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                            Konfirmasi Pesanan
                        </Title>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                </div>

                {/* 2. MAIN CONTENT RESPONSIVE */}
                <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
                    {validItems.length === 0 ? (
                        // EMPTY STATE
                        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
                            <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                                <TbBasketOff size={48} className="text-slate-300" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-2">Tidak ada pesanan</h2>
                            <p className="text-slate-500 mb-8 max-w-[250px]">
                                Silakan kembali ke menu untuk memilih hidangan.
                            </p>
                            <button 
                                onClick={() => navigate(-1)}
                                className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                            >
                                Kembali ke Menu
                            </button>
                        </div>
                    ) : (
                        // ORDER LIST & SUMMARY (GRID 2 KOLOM DI DESKTOP)
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                            
                            {/* KOLOM KIRI: RINCIAN ITEM (Lebar 8/12 di Desktop) */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-slate-100">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 pb-4 border-b border-slate-100">
                                        Pesanan Anda
                                    </h3>
                                    
                                    {/* Grid Item agar kalau layarnya lebar, isinya bisa nyamping 2 kolom */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                                        {validItems.map((item, index) => (
                                            <div key={item.id_menu || item.id_produk || index} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                <DetailKeranjang
                                                    image={item.foto_menu || item.foto_produk}
                                                    name={item.nama_menu || item.nama_produk}
                                                    description={item.deskripsi || item.deskripsi_produk}
                                                    price={item.harga_menu || item.harga}
                                                    countItem={item.countItem}
                                                    note={item.note}
                                                    setSelectedItem={setSelectedItem}
                                                    id={item.id_menu || item.id_produk}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* KOLOM KANAN: RINGKASAN BIAYA (Lebar 4/12 & Sticky di Desktop) */}
                            <div className="lg:col-span-4">
                                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 lg:sticky lg:top-24">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-5">
                                        Ringkasan Pembayaran
                                    </h3>
                                    
                                    {isLoadingTax ? (
                                        <div className="flex justify-center items-center py-6 gap-3">
                                            <Spin size="small" />
                                            <span className="text-slate-500 text-sm font-medium">Menghitung tagihan...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-slate-600 font-medium">
                                                <span>Subtotal ({validItems.reduce((s, i) => s + i.countItem, 0)} item)</span>
                                                <span className="text-slate-800">{formatRupiah(subtotal)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-slate-600 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    Pajak Resto ({pajakPersen}%)
                                                    <TbReceiptTax className="text-slate-400" />
                                                </span>
                                                <span className="text-slate-800">{formatRupiah(pajakNominal)}</span>
                                            </div>
                                            
                                            <Divider className="my-5 border-slate-200" dashed />
                                            
                                            <div className="flex justify-between items-end mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bayar</span>
                                                </div>
                                                <span className="text-2xl lg:text-3xl font-black text-indigo-600">
                                                    {formatRupiah(totalHargaFinal)}
                                                </span>
                                            </div>

                                            {/* TOMBOL CHECKOUT DESKTOP (Hanya Muncul di Layar Besar) */}
                                            <div className="hidden lg:block pt-2">
                                                <Link to='/payment-pelanggan' className="block w-full">
                                                    <button
                                                        disabled={isLoadingTax}
                                                        className={`w-full rounded-2xl px-6 py-4 font-bold text-base shadow-xl flex justify-center items-center gap-2 transition-all duration-300 ${
                                                            isLoadingTax 
                                                            ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                                                            : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98]'
                                                        }`}
                                                    >
                                                        {isLoadingTax ? 'Mohon Tunggu...' : 'Pilih Metode Pembayaran'}
                                                    </button>
                                                </Link>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* 3. STICKY BOTTOM CHECKOUT MOBILE (Sembunyi di Desktop) */}
                {validItems.length > 0 && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] z-50">
                        <div className="max-w-3xl mx-auto">
                            <Link to='/payment-pelanggan' className="block w-full">
                                <button
                                    disabled={isLoadingTax}
                                    className={`w-full rounded-2xl px-6 py-4 font-bold text-base shadow-xl flex justify-center items-center gap-2 transition-all duration-300 ${
                                        isLoadingTax 
                                        ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                                        : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98]'
                                    }`}
                                >
                                    {isLoadingTax ? 'Mohon Tunggu...' : 'Pilih Metode Pembayaran'}
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
                
            </div>
        </ConfigProvider>
    );
};

export default ConfirmOrderPelanggan;