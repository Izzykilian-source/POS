import React, { useEffect, useState, useMemo } from 'react';
import { CiSearch } from 'react-icons/ci';
import { Input, Drawer, Badge, ConfigProvider, Spin, Typography } from 'antd';
import MenuItem from '../../components/MenuItem';
import { getMenu } from '../../services/api';
import DetailAddMenu from '../../components/Detail_AddMenu';
import { Link } from 'react-router-dom';
import { FaShoppingBasket, FaChevronRight } from "react-icons/fa";
import { TbBasketOff } from "react-icons/tb";

const { Text, Title } = Typography;

const MenuPelanggan = () => {
    const [open, setOpen] = useState(false);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [countItem, setCountItem] = useState(0);
    const [selectedItem, setSelectedItem] = useState(() => {
        const store = localStorage.getItem('selectedItem');
        return store ? JSON.parse(store) : [];
    });
    const [detailMenu, setDetailMenu] = useState({});

    // Kalkulasi Total Keranjang
    const totalCount = selectedItem.reduce((sum, item) => sum + item.countItem, 0);
    const totalPrice = selectedItem.reduce((sum, item) => sum + ((item.harga_menu || 0) * item.countItem), 0);

    useEffect(() => {
        localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
    }, [selectedItem]);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setLoading(true);
                const data = await getMenu();
                setMenu(Array.isArray(data?.datas) ? data.datas : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const addOrUpdateItem = async (newMenu, count) => {
        setSelectedItem((prevItems) => {
            const existingItem = prevItems.find((item) => item.id_menu === newMenu.id_menu);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id_menu === newMenu.id_menu ? { ...item, countItem: item.countItem + count } : item
                );
            } else {
                return [...prevItems, { ...newMenu, countItem: count }];
            }
        });
        onClose();
    };

    const showDrawer = (menuItem) => {
        setDetailMenu(menuItem);
        setCountItem(1); 
        setOpen(true);
    };

    const onClose = () => {
        setCountItem(0);
        setOpen(false);
        setDetailMenu({});
    };

    // Filter Menu Berdasarkan Pencarian
    const filteredMenu = useMemo(() => {
        if (!searchTerm.trim()) return menu;
        return menu.filter(item => 
            (item?.nama_menu || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menu, searchTerm]);

    return (
        <ConfigProvider>
            <div className="bg-slate-50 min-h-screen pb-32 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
                
                {/* 1. HEADER HERO SECTION (RESPONSIVE) */}
                <div className="bg-slate-900 px-4 pt-12 pb-24 lg:pb-32 relative overflow-hidden rounded-b-[2.5rem] lg:rounded-b-[4rem] shadow-sm">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 lg:w-96 lg:h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 w-48 h-48 lg:w-72 lg:h-72 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
                    
                    <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
                        <Tagline />
                        <Title level={2} style={{ color: 'white', margin: '8px 0 24px 0', fontWeight: 900, letterSpacing: '-0.025em' }}>
                            Dago Food & Beverage
                        </Title>
                        
                        {/* Search Bar Modern */}
                        <div className="w-full max-w-lg relative group">
                            <Input 
                                size="large"
                                placeholder="Cari kopi, snack, atau makanan..." 
                                prefix={<CiSearch className="text-slate-400 text-xl ml-2 mr-1" />} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-2xl border-none shadow-lg py-3 lg:py-4 px-2 bg-white/95 backdrop-blur-sm focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. MENU CONTENT (OVERLAPPING & GRID RESPONSIVE) */}
                <div className="max-w-6xl mx-auto px-4 -mt-12 lg:-mt-16 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 lg:p-8 min-h-[400px] border border-slate-100">
                        
                        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight m-0">
                                    {searchTerm ? 'Hasil Pencarian' : 'Semua Menu'}
                                </h2>
                                <Text className="text-slate-400 text-sm font-medium">
                                    {filteredMenu.length} item tersedia
                                </Text>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-64 gap-4">
                                <Spin size="large" />
                                <Text className="text-slate-400 font-medium">Menyiapkan menu terbaik...</Text>
                            </div>
                        ) : filteredMenu.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <TbBasketOff size={36} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 m-0">Menu tidak ditemukan</h3>
                                <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                            </div>
                        ) : (
                            /* GRID RESPONSIVE: 1 kolom (HP) -> 2 (Tablet) -> 3 (Laptop) -> 4 (Desktop Lebar) */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {filteredMenu.map((item, index) => (
                                    <div key={item.id_menu || index} className="group rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 transition-all duration-300">
                                        <MenuItem
                                            image={item.foto_menu}
                                            name={item.nama_menu}
                                            description={item.deskripsi}
                                            price={item.harga_menu}
                                            showDrawer={() => showDrawer(item)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. DRAWER ADD TO CART */}
                <Drawer
                    placement="bottom"
                    closable={true}
                    onClose={onClose}
                    open={open}
                    height="auto" 
                    className="custom-rounded-drawer"
                    styles={{ 
                        body: { padding: 0, paddingBottom: '100px', backgroundColor: '#fff' }, 
                        header: { borderBottom: 'none', padding: '24px 20px 0', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' } 
                    }}
                    key={detailMenu?.id_menu} 
                >
                    {detailMenu && (
                        <div className="px-6 lg:px-10 lg:max-w-2xl lg:mx-auto">
                            <DetailAddMenu
                                image={detailMenu.foto_menu}
                                name={detailMenu.nama_menu}
                                description={detailMenu.deskripsi}
                                price={detailMenu.harga_menu}
                                setCountItem={setCountItem}
                                countItem={countItem}
                            />
                        </div>
                    )}
                    
                    {/* Action Bottom Bar inside Drawer */}
                    <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 z-10 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                        <div className="max-w-md mx-auto">
                            <button
                                onClick={() => addOrUpdateItem(detailMenu, countItem)}
                                disabled={countItem === 0}
                                className={`w-full rounded-2xl px-6 py-4 font-bold transition-all flex justify-between items-center text-base ${
                                    countItem === 0 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 active:scale-[0.98]'
                                }`}
                            >
                                <span>Tambah Pesanan</span>
                                <span>Rp {((detailMenu?.harga_menu || 0) * countItem).toLocaleString('id-ID')}</span>
                            </button>
                        </div>
                    </div>
                </Drawer>

                {/* 4. FLOATING CART SUMMARY (Responsive Centered) */}
                {totalCount > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md pointer-events-none animate-slide-up">
                        <Link to="/keranjang-pelanggan" className="block w-full pointer-events-auto">
                            <div className="bg-slate-900 text-white rounded-full p-1.5 flex justify-between items-center shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-colors border border-slate-700/50">
                                
                                <div className="flex items-center gap-3 pl-2">
                                    <Badge count={totalCount} showZero={false} style={{ backgroundColor: '#4f46e5', boxShadow: 'none' }}>
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <FaShoppingBasket size={20} className="text-white" />
                                        </div>
                                    </Badge>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Total Keranjang</span>
                                        <span className="text-sm font-bold leading-none">Rp {totalPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-indigo-600 rounded-full px-6 py-3.5 flex items-center gap-2 h-full">
                                    <span className="text-sm font-bold">Bayar</span>
                                    <FaChevronRight size={14} className="text-indigo-200"/>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

            </div>
        </ConfigProvider>
    );
};

// Sub-komponen kecil untuk tulisan tag
const Tagline = () => (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Open for Order</span>
    </div>
);

export default MenuPelanggan;