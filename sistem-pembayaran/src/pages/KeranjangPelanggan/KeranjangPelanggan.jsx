    import React, { useEffect, useState } from 'react';
    import { ConfigProvider, Typography } from 'antd';
    import DetailKeranjang from '../../components/DetailKeranjang';
    import { Link } from 'react-router-dom';
    import { FaChevronRight } from "react-icons/fa";
    import { TbBasketOff } from "react-icons/tb";
    import { IoMdArrowBack } from "react-icons/io";

    const { Title, Text } = Typography;

    const KeranjangPelanggan = () => {
        // Hanya state yang benar-benar dibutuhkan untuk keranjang
        const [selectedItem, setSelectedItem] = useState(() => {
            const store = localStorage.getItem('selectedItem');
            return store ? JSON.parse(store) : [];
        });

        useEffect(() => {
            localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
        }, [selectedItem]);

        // Saring item yang jumlahnya lebih dari 0
        const validItems = selectedItem.filter(item => item.countItem > 0);
        
        // Kalkulasi
        const totalCount = validItems.reduce((sum, item) => sum + item.countItem, 0);
        // Antisipasi jika field harga bernama harga_menu atau harga
        const totalPrice = validItems.reduce((sum, item) => sum + ((item.harga_menu || item.harga || 0) * item.countItem), 0);

        return (
            <ConfigProvider>
                <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-32">
                    
                    {/* 1. APP HEADER (Clean & Native Feel) */}
                    <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                            <Link 
                                to="/" // Sesuaikan dengan route halaman menu Anda (misal: /menu-pelanggan)
                                className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <IoMdArrowBack size={24} />
                            </Link>
                            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                                Keranjang Pesanan
                            </Title>
                            {/* Spacer untuk menyeimbangkan layout grid */}
                            <div className="w-10"></div> 
                        </div>
                    </div>

                    {/* 2. MAIN CONTENT */}
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        {validItems.length === 0 ? (
                            // EMPTY STATE
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <TbBasketOff size={48} className="text-slate-300" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 mb-2">Keranjangmu Kosong</h2>
                                <p className="text-slate-500 mb-8 max-w-[250px]">
                                    Yuk, jelajahi menu terbaik kami dan masukkan ke keranjang!
                                </p>
                                <Link to="/"> {/* Sesuaikan path dengan halaman menu F&B */}
                                    <button className="bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all">
                                        Lihat Menu
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            // CART LIST
                            <>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <Text className="text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        Daftar Pesanan ({totalCount} Item)
                                    </Text>
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    {validItems.map((item, index) => (
                                        <div 
                                            key={item.id_menu || item.id_produk || index} 
                                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md"
                                        >
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
                            </>
                        )}
                    </div>

                    {/* 3. STICKY BOTTOM CHECKOUT BAR */}
                    {validItems.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-50">
                            <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
                                
                                {/* Total Amount Info */}
                                <div className="flex flex-col flex-shrink-0 pl-2">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                                        Total Harga
                                    </span>
                                    <span className="text-lg font-black text-slate-900 leading-none">
                                        Rp {totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Action Button */}
                                <Link to="/confirm-order-pelanggan" className="flex-1 max-w-[200px]">
                                    <button className="w-full bg-indigo-600 text-white rounded-2xl px-6 py-4 font-bold text-sm shadow-xl shadow-indigo-600/20 flex justify-center items-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                                        <span>Checkout</span>
                                        <FaChevronRight size={12} className="opacity-80" />
                                    </button>
                                </Link>
                                
                            </div>
                        </div>
                    )}
                    
                </div>
            </ConfigProvider>
        );
    }

    export default KeranjangPelanggan;