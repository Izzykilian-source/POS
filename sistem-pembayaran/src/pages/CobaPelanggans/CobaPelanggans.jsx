import React, { useEffect, useState, useRef, useMemo } from 'react';
import { IoMdSearch, IoMdClose } from "react-icons/io";
import { Drawer, Badge, Spin, Alert, Typography, ConfigProvider } from 'antd';
import MenuItem from '../../components/MenuItem';
import { getKategori, getMenuByCategory, getTenants } from '../../services/api';
import DetailAddMenu from '../../components/Detail_AddMenu';
import { Link } from 'react-router-dom';
import { FaShoppingBasket, FaChevronRight } from "react-icons/fa";
import { TbBasketOff, TbSearchOff } from "react-icons/tb";
import DetailKeranjang from '../../components/DetailKeranjang';
import locale from "antd/locale/id_ID";

const { Text } = Typography;

const CobaMenuPelanggans = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [kategori, setKategori] = useState([]);
    const [menuByKategori, setMenuByKategori] = useState({});
    const [activeKategori, setActiveKategori] = useState(null);
    const [open, setOpen] = useState(false);
    const [countItem, setCountItem] = useState(0);
    const [selectedItem, setSelectedItem] = useState(() => {
        const store = localStorage.getItem('selectedItem');
        return store ? JSON.parse(store) : [];
    });
    const [detailMenu, setDetailMenu] = useState({});
    const [openCart, setOpenCart] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [note, setNote] = useState("");

    const menuKategoriRefs = useRef({});
    const kategoriNavRefs = useRef({});
    const isClickScrolling = useRef(false);
    
    // REF BARU: Untuk mengukur tinggi header gabungan (Tenant + Kategori) secara dinamis
    const stickyHeaderRef = useRef(null);

    const handleSelectTenant = (tenantId) => {
        if (tenantId !== selectedMerchant) {
            setLoading(true);
            setSelectedMerchant(tenantId);
            setKategori([]);
            setMenuByKategori({});
            setActiveKategori(null);
            setSearchTerm(""); 
        }
    };

    const fetchKategoriByMerchant = async (idMerchant) => {
        try {
            setKategori([]);
            setMenuByKategori({});
            const kategoriData = await getKategori(idMerchant);
            if (!kategoriData.datas) throw new Error("Format data kategori salah");
            setKategori(kategoriData.datas);

            const menuPromises = kategoriData.datas.map(kat => getMenuByCategory(kat.id_kategori));
            const menuResults = await Promise.all(menuPromises);

            let menuDataObj = {};
            menuResults.forEach((menuData, index) => {
                 const katId = kategoriData.datas[index].id_kategori;
                 menuDataObj[katId] = menuData.datas || []; 
            });

            setMenuByKategori(menuDataObj);
            if (kategoriData.datas.length > 0) setActiveKategori(kategoriData.datas[0].id_kategori);
            else setActiveKategori(null);
        } catch (error) {
            setError("Gagal memuat menu untuk tenant ini.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initialLoad = async () => {
            try {
                setLoading(true);
                const tenantData = await getTenants();
                if (tenantData.datas && tenantData.datas.length > 0) {
                    setTenants(tenantData.datas);
                    setSelectedMerchant(tenantData.datas[0].id_tenant);
                } else {
                    setError("Tidak ada tenant yang tersedia.");
                    setLoading(false);
                }
            } catch (error) {
                setError("Gagal memuat daftar tenant.");
                setLoading(false);
            }
        };
        initialLoad();
    }, []);

    useEffect(() => {
        if (selectedMerchant) fetchKategoriByMerchant(selectedMerchant);
    }, [selectedMerchant]);

    let totalCount = selectedItem.reduce((sum, item) => sum + item.countItem, 0);
    let totalPrice = selectedItem.reduce((sum, item) => sum + ((item.harga_menu || item.harga || 0) * item.countItem), 0);

    useEffect(() => {
        localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
    }, [selectedItem]);

    // ==========================================
    // LOGIKA SCROLL DINAMIS (RESPONSIVE)
    // ==========================================
    const scrollToCategory = (id_kategori) => {
        isClickScrolling.current = true;
        setActiveKategori(id_kategori);
        
        const element = menuKategoriRefs.current[id_kategori];
        const headerElement = stickyHeaderRef.current;
        
        if (element && headerElement) {
            // Ukur tinggi header saat ini (Berbeda di HP vs Desktop)
            const headerHeight = headerElement.offsetHeight; 
            const elementPosition = element.getBoundingClientRect().top;
            
            // Beri margin ekstra 20px agar judul kategori tidak mepet dengan navbar
            const offsetPosition = elementPosition + window.scrollY - headerHeight - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            setTimeout(() => { 
                isClickScrolling.current = false; 
            }, 800); 
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (isClickScrolling.current || kategori.length === 0) return; 
            
            const headerElement = stickyHeaderRef.current;
            const headerHeight = headerElement ? headerElement.offsetHeight : 140;
            
            // Titik deteksi: Tinggi header + 50px toleransi ke bawah
            const scrollPos = window.scrollY + headerHeight + 50; 
            let current = activeKategori;

            for (let i = kategori.length - 1; i >= 0; i--) {
                const kat = kategori[i];
                const section = menuKategoriRefs.current[kat.id_kategori];
                if (section) {
                    const top = section.offsetTop;
                     if (scrollPos >= top) { 
                          current = kat.id_kategori;
                          break; 
                     }
                }
            }
            if (current !== activeKategori) setActiveKategori(current);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [kategori, activeKategori]);

    useEffect(() => {
         if (activeKategori && kategoriNavRefs.current[activeKategori]) {
             kategoriNavRefs.current[activeKategori].scrollIntoView({
                 behavior: 'smooth', inline: 'center', block: 'nearest'
             });
         }
     }, [activeKategori]);

    // ==========================================

    const addOrUpdateItem = (newMenu, count, note) => {
        setSelectedItem(prevItems => {
            const existingItem = prevItems.find(item => item.id_produk === newMenu.id_produk);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id_produk === newMenu.id_produk
                        ? { ...item, countItem: item.countItem + count, note }
                        : item
                );
            } else {
                return [...prevItems, { ...newMenu, countItem: count, note: note || "" }];
            }
        });
        onClose();
    };

    const showDrawer = (menu) => {
        if (menu.status_ketersediaan !== 'Active') return; 
        setDetailMenu(menu);
        setCountItem(1); 
        setNote(menu.note || "");
        setOpen(true);
    };

    const onClose = () => {
        setCountItem(0);
        setOpen(false);
        setDetailMenu({}); 
        setNote(""); 
    };

    const filteredMenuData = useMemo(() => {
        if (!searchTerm) return menuByKategori; 
        
        const newFilteredMenu = {};
        for (const katId in menuByKategori) {
             newFilteredMenu[katId] = menuByKategori[katId].filter(item =>
                 (item?.nama_produk || "").toLowerCase().includes(searchTerm.toLowerCase())
             );
        }
        return newFilteredMenu;
    }, [searchTerm, menuByKategori]);

    const isSearchEmpty = searchTerm && Object.values(filteredMenuData).every(arr => arr.length === 0);

    return (
        <ConfigProvider locale={locale}>
            <div className="bg-slate-50 min-h-screen pb-32 font-sans text-slate-900">
                
                {/* 1. STICKY HEADER WRAPPER (TENANT & CATEGORY) */}
                <div ref={stickyHeaderRef} className="sticky top-0 z-50 flex flex-col shadow-sm">
                    
                    {/* A. HEADER TENANTS */}
                    <div className="bg-white border-b border-slate-100">
                        {/* max-w-7xl membuat layout melebar di layar Desktop */}
                        <div className="max-w-7xl mx-auto px-4 py-3">
                            <div className="flex overflow-x-auto no-scrollbar gap-3 pb-1 items-center">
                                {tenants.map((tenant) => {
                                    const isActive = selectedMerchant === tenant.id_tenant;
                                    return (
                                        <button
                                            key={tenant.id_tenant}
                                            onClick={() => handleSelectTenant(tenant.id_tenant)}
                                            className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 border ${
                                                isActive 
                                                ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30 transform scale-100' 
                                                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 transform scale-95 hover:scale-100 text-slate-500'
                                            }`}
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_BASE_URL.replace('/api/v1', '')}/static/${tenant.gambar_tenant}`}
                                                alt={tenant.nama_tenant}
                                                className="w-9 h-9 rounded-full object-cover bg-slate-100"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "/static/logo_dago.png" }}
                                            />
                                            <span className={`font-bold text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                                {tenant.nama_tenant}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* B. CATEGORY NAV & SEARCH */}
                    <div className="bg-white/95 backdrop-blur-md border-b border-slate-100">
                        <div className="max-w-7xl mx-auto px-4 py-3">
                            {showSearch ? (
                                <div className="flex items-center gap-3 animate-fade-in">
                                    <div className="flex-1 relative">
                                        <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="Cari menu favoritmu..." 
                                            value={searchTerm} 
                                            onChange={(e) => setSearchTerm(e.target.value)} 
                                            className="w-full bg-slate-100 text-slate-900 rounded-full pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                                        className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                                    >
                                        <IoMdClose size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className='flex items-center gap-3'>
                                    <button 
                                        onClick={() => setShowSearch(true)}
                                        className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                                    >
                                        <IoMdSearch size={20} />
                                    </button>
                                    <div className="w-[1px] h-6 bg-slate-200 shrink-0 mx-1"></div>
                                    
                                    {/* Pembungkus Navigasi Kategori (Bisa di-swipe di Mobile) */}
                                    <div className="flex overflow-x-auto no-scrollbar gap-2 scroll-smooth w-full items-center py-1">
                                        {kategori.map(kat => {
                                            const isActive = activeKategori === kat.id_kategori;
                                            return (
                                                <button 
                                                    key={kat.id_kategori} 
                                                    ref={el => kategoriNavRefs.current[kat.id_kategori] = el}
                                                    onClick={() => scrollToCategory(kat.id_kategori)}
                                                    // Class shrink-0 memastikan tombol tidak gepeng di layar kecil
                                                    className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                                        isActive 
                                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {kat.nama_kategori}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* 2. MENU CONTENT (GRID RESPONSIVE) */}
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <Spin size="large" />
                            <Text className="text-slate-400 font-medium">Menyiapkan menu terbaik...</Text>
                        </div>
                    ) : error ? (
                        <Alert message="Oops!" description={error} type="error" showIcon className="rounded-xl border-none shadow-sm max-w-lg mx-auto" />
                    ) : (
                        <div className="flex flex-col gap-10">
                             {kategori.length === 0 && !loading && (
                                 <div className="text-center py-20 flex flex-col items-center">
                                     <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                         <TbBasketOff size={40} className="text-slate-300" />
                                     </div>
                                     <h3 className="text-lg font-bold text-slate-800">Belum ada menu</h3>
                                     <p className="text-slate-500 mt-1">Tenant ini sedang menyiapkan menu andalannya.</p>
                                 </div>
                             )}

                            {kategori.map(kat => {
                                const menuInCategory = filteredMenuData[kat.id_kategori]; 
                                if (!menuInCategory || menuInCategory.length === 0) return null; 

                                return (
                                    <div key={kat.id_kategori} ref={el => menuKategoriRefs.current[kat.id_kategori] = el}>
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-5 tracking-tight">{kat.nama_kategori}</h2>
                                        
                                        {/* GRID RESPONSIVE: 1 kolom di HP, 2 di Tablet, 3-4 di Desktop */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                            {menuInCategory.map((item) => (
                                                <div key={item.id_produk} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                                    <MenuItem
                                                        image={item.foto_produk}
                                                        name={item.nama_produk}
                                                        description={item.deskripsi_produk}
                                                        price={item.harga}
                                                        statusKetersediaan={item.status_ketersediaan} 
                                                        showDrawer={() => showDrawer(item)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                             {kategori.length > 0 && isSearchEmpty && (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <TbSearchOff size={40} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Menu tidak ditemukan</h3>
                                    <p className="text-slate-500 mt-1">Coba gunakan kata kunci lain untuk mencari.</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>

                {/* 3. DRAWER ADD TO CART */}
                <Drawer
                    placement="bottom"
                    closable={true}
                    onClose={onClose}
                    open={open}
                    height="auto" 
                    className="custom-rounded-drawer"
                    styles={{ body: { padding: 0, paddingBottom: '90px' }, header: { borderBottom: 'none', padding: '16px 20px 0' } }}
                    key={detailMenu?.id_produk} 
                >
                    {detailMenu && (
                        <div className="px-5">
                            <DetailAddMenu
                                image={detailMenu.foto_produk}
                                name={detailMenu.nama_produk}
                                description={detailMenu.deskripsi_produk}
                                price={detailMenu.harga}
                                countItem={countItem}
                                setCountItem={setCountItem}
                                note={note}
                                setNote={setNote}
                            />
                        </div>
                    )}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-10">
                        <div className="max-w-md mx-auto">
                            <button
                                onClick={() => addOrUpdateItem(detailMenu, countItem, note)}
                                disabled={countItem === 0}
                                className={`w-full rounded-full px-6 py-3.5 font-bold transition-all shadow-lg flex justify-between items-center ${
                                    countItem === 0 
                                    ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-95'
                                }`}
                            >
                                <span>Tambah ke Pesanan</span>
                                <span>Rp {((detailMenu?.harga || 0) * countItem).toLocaleString('id-ID')}</span>
                            </button>
                        </div>
                    </div>
                </Drawer>

                {/* 4. FLOATING CART SUMMARY */}
                {totalCount > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none">
                        <div 
                           className="bg-slate-900 text-white rounded-full p-1.5 flex justify-between items-center shadow-2xl shadow-slate-900/40 pointer-events-auto cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700"
                           onClick={() => setOpenCart(true)}
                         >
                            <div className="flex items-center gap-3 pl-3">
                                <Badge count={totalCount} style={{ backgroundColor: '#4f46e5', boxShadow: 'none' }}>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                        <FaShoppingBasket size={18} className="text-white" />
                                    </div>
                                </Badge>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Pesanan</span>
                                    <span className="text-sm font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <div className="bg-indigo-600 rounded-full px-5 py-2.5 flex items-center gap-2">
                                <span className="text-sm font-bold">Checkout</span>
                                <FaChevronRight size={14} className="text-indigo-200"/>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. DRAWER CART DETAIL */}
                <Drawer 
                    title={<span className="font-black text-slate-900 text-lg">Keranjang Anda</span>}
                    placement="bottom" 
                    closable={true} 
                    onClose={() => setOpenCart(false)} 
                    open={openCart} 
                    height="85vh"
                    className="custom-rounded-drawer"
                    styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: '0 0 90px 0', backgroundColor: '#f8fafc' } }}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full"> 
                            {selectedItem.filter(item => item.countItem > 0).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-20">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <TbBasketOff size={40} />
                                    </div>
                                    <p className="font-bold text-slate-700 text-lg">Keranjang Kosong</p>
                                    <p className="text-sm">Yuk, pilih menu favoritmu dulu!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {selectedItem.filter(item => item.countItem > 0).map((item, index) => (
                                        <div key={item.id_produk || index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <DetailKeranjang
                                                image={item.foto_produk}
                                                name={item.nama_produk}
                                                description={item.deskripsi_produk}
                                                price={item.harga}
                                                countItem={item.countItem}
                                                note={item.note}
                                                setSelectedItem={setSelectedItem}
                                                id={item.id_produk}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {selectedItem.filter(item => item.countItem > 0).length > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-10"> 
                                <div className="max-w-md mx-auto">
                                    <Link to="/confirm-order-pelanggan">
                                        <button className="w-full rounded-full bg-indigo-600 text-white px-6 py-4 font-bold text-base shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex justify-between items-center">
                                            <span>Lanjut Pembayaran</span>
                                            <FaChevronRight size={14}/>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </Drawer>

            </div>

            <style>{`
                /* Sembunyikan scrollbar bawaan untuk tampilan mobile yang clean */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                /* Custom drawer Antd untuk sudut melengkung modern */
                .custom-rounded-drawer .ant-drawer-content {
                    border-top-left-radius: 24px !important;
                    border-top-right-radius: 24px !important;
                    overflow: hidden;
                }
                .custom-rounded-drawer .ant-drawer-header {
                    padding-top: 24px;
                }
                .custom-rounded-drawer .ant-drawer-close {
                    margin-top: 4px;
                    color: #94a3b8;
                    background: #f1f5f9;
                    border-radius: 50%;
                    width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                }
            `}</style>
        </ConfigProvider>
    );
};

export default CobaMenuPelanggans;