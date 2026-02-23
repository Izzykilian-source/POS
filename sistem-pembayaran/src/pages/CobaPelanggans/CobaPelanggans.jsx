import React, { useEffect, useState, useRef, useMemo } from 'react';
import { IoMdSearch } from "react-icons/io";
import { Drawer, Badge, Spin, Alert } from 'antd';
import MenuItem from '../../components/MenuItem';
import { getKategori, getMenuByCategory, getTenants } from '../../services/api';
import DetailAddMenu from '../../components/Detail_AddMenu';
import { Link } from 'react-router-dom';
import { FaShoppingBasket, FaChevronRight, FaStar } from "react-icons/fa";
import { TbBasketOff } from "react-icons/tb";
import './CobaPelanggan.css';
import DetailKeranjang from '../../components/DetailKeranjang';

// Helper function untuk path gambar
const getImageUrl = (path, filename) => {
    const baseUrlWithoutApi = import.meta.env.VITE_BASE_URL.replace('/api/v1', '');
    // Asumsi folder 'img' ada di root, bukan 'static'
    return `${baseUrlWithoutApi}/static/${filename}`; 
};

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

    const handleSelectTenant = (tenantId) => {
        if (tenantId !== selectedMerchant) {
            setLoading(true);
            setSelectedMerchant(tenantId);
            // Reset state menu saat ganti tenant
            setKategori([]);
            setMenuByKategori({});
            setActiveKategori(null);
            setSearchTerm(""); // Reset search
        }
    };

    const fetchKategoriByMerchant = async (idMerchant) => {
        try {
            setKategori([]);
            setMenuByKategori({});
            const kategoriData = await getKategori(idMerchant);
            if (!kategoriData.datas) throw new Error("Format data kategori salah");
            setKategori(kategoriData.datas);

            // Fetch menu untuk semua kategori secara paralel
            const menuPromises = kategoriData.datas.map(kat =>
                getMenuByCategory(kat.id_kategori)
            );
            const menuResults = await Promise.all(menuPromises);

            let menuDataObj = {};
            menuResults.forEach((menuData, index) => {
                 const katId = kategoriData.datas[index].id_kategori;
                 menuDataObj[katId] = menuData.datas || []; // Pastikan array
            });

            setMenuByKategori(menuDataObj);

            if (kategoriData.datas.length > 0) {
                setActiveKategori(kategoriData.datas[0].id_kategori);
            } else {
                setActiveKategori(null);
            }
        } catch (error) {
            console.error(error);
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
                console.error(error);
                setError("Gagal memuat daftar tenant.");
                setLoading(false);
            }
        };
        initialLoad();
    }, []);

    useEffect(() => {
        if (selectedMerchant) {
            fetchKategoriByMerchant(selectedMerchant);
        }
    }, [selectedMerchant]);

    
    let totalCount = selectedItem.reduce((sum, item) => sum + item.countItem, 0);

    useEffect(() => {
        localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
    }, [selectedItem]);

    // ... (useEffect untuk scroll, dll tetap sama) ...
    useEffect(() => {
        if (isClickScrolling.current && activeKategori && menuKategoriRefs.current[activeKategori]) {
            const element = menuKategoriRefs.current[activeKategori];
            const offset = 150; // Disesuaikan dengan tinggi header + nav kategori
            const y = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setTimeout(() => { isClickScrolling.current = false; }, 500); // Waktu timeout
        }
    }, [activeKategori]);

    useEffect(() => {
        const handleScroll = () => {
            if (isClickScrolling.current || kategori.length === 0) return; // Jangan jalankan jika sedang auto-scroll
            const scrollPos = window.scrollY + 160; // Offset lebih besar
            let current = activeKategori;

            // Cari dari bawah ke atas agar lebih akurat
            for (let i = kategori.length - 1; i >= 0; i--) {
                const kat = kategori[i];
                const section = menuKategoriRefs.current[kat.id_kategori];
                if (section) {
                    const top = section.offsetTop;
                     if (scrollPos >= top) { // Jika scroll melewati bagian atas section
                          current = kat.id_kategori;
                          break; // Ambil yang pertama dari bawah
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
        // Cek lagi, walaupun seharusnya sudah dicegah di MenuItem
        if (menu.status_ketersediaan !== 'Active') return; 
        
        setDetailMenu(menu);
        setCountItem(1); // Default 1
        setNote(menu.note || "");
        setOpen(true);
    };

    const onClose = () => {
        setCountItem(0);
        setOpen(false);
        setDetailMenu({}); // Reset detail menu
        setNote(""); // Reset note
    };

    // Filter data yang akan ditampilkan berdasarkan search term
     const filteredMenuData = useMemo(() => {
        if (!searchTerm) return menuByKategori; // Jika tidak search, kembalikan semua
        
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
        <>
            <div className="bg-white pb-[60px] min-h-screen"> {/* Pastikan bg penuh */}
                {/* Navbar Tenant */}
                <div className="bg-white border-b sticky top-0 z-50">
                    <div className="flex overflow-x-auto px-2 scrollbar-hide">
                        {tenants.map((tenant) => (
                            <button
                                key={tenant.id_tenant}
                                onClick={() => handleSelectTenant(tenant.id_tenant)}
                                className={`flex-shrink-0 px-4 py-3 border-b-4 transition-all ${selectedMerchant === tenant.id_tenant
                                    ? 'border-testPrimary'
                                    : 'border-transparent hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3"> {/* Kurangi gap sedikit */}
                                    <img
                                        // PERBAIKAN PATH GAMBAR: /static/ -> /img/
                                        src={`${import.meta.env.VITE_BASE_URL.replace('/api/v1', '')}/static/${tenant.gambar_tenant}`}
                                        alt={tenant.nama_tenant}
                                        className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-200" // Kecilkan sedikit
                                        onError={(e) => { e.target.onerror = null; e.target.src = "/sta/logo_dago.png" }} // Fallback
                                    />
                                    <div className="text-left">
                                        <h3 className={`font-semibold text-base ${selectedMerchant === tenant.id_tenant ? 'text-testPrimary' : 'text-gray-800'
                                            }`}>
                                            {tenant.nama_tenant}
                                        </h3>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4">
                    {/* Navbar Kategori */}
                    <div className="sticky top-[89px] bg-white z-40 py-2"> {/* Sesuaikan offset top */}
                        <div className="border-t border-b border-gray-200">
                            <div className='flex justify-start items-center gap-4 px-2 overflow-x-auto no-scrollbar py-2'>
                                <IoMdSearch size={24} className="text-black cursor-pointer flex-shrink-0" onClick={() => setShowSearch(!showSearch)} />
                                {showSearch && (
                                    <input type="text" placeholder="Cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
                                )}
                                {/* Hanya tampilkan kategori jika tidak sedang search */}
                                {!showSearch && kategori.map(kat => (
                                    <div key={kat.id_kategori} ref={el => kategoriNavRefs.current[kat.id_kategori] = el}
                                        className={`cursor-pointer whitespace-nowrap px-2 py-1 ${activeKategori === kat.id_kategori ? 'text-testPrimary font-semibold border-b-2 border-testPrimary' : 'text-gray-600'}`} // Ubah warna non-aktif
                                        onClick={() => {
                                            isClickScrolling.current = true;
                                            setActiveKategori(kat.id_kategori);
                                        }}>
                                        <p className="leading-tight text-sm font-medium">{kat.nama_kategori}</p> {/* Ubah font */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section Menu */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
                    ) : error ? (
                        <div className="text-center py-10"><Alert message="Error" description={error} type="error" showIcon /></div>
                    ) : (
                        <div className="flex flex-col gap-y-6 mt-4"> {/* Tambah margin top */}
                             {kategori.length === 0 && !loading && (
                                 <div className="text-center py-20 text-gray-400">
                                     <TbBasketOff size={64} className="mx-auto" />
                                     <p className="mt-2 text-lg">Tenant ini belum memiliki menu.</p>
                                 </div>
                             )}

                            {kategori.map(kat => {
                                const menuInCategory = filteredMenuData[kat.id_kategori]; // Ambil dari data yg sudah difilter
                                if (!menuInCategory || menuInCategory.length === 0) {
                                    return null; // Sembunyikan kategori jika tidak ada item (baik karena kosong atau terfilter search)
                                }

                                return (
                                    <div key={kat.id_kategori} ref={el => menuKategoriRefs.current[kat.id_kategori] = el} className="pt-2">
                                        <h1 className="text-black text-xl font-semibold mb-3">{kat.nama_kategori}</h1>
                                        <div className="flex flex-col gap-y-4"> {/* Spasi antar item */}
                                            {menuInCategory.map((item) => (
                                                <MenuItem
                                                    key={item.id_produk} // PERBAIKAN: Gunakan id_produk sebagai key
                                                    image={item.foto_produk}
                                                    name={item.nama_produk}
                                                    description={item.deskripsi_produk}
                                                    price={item.harga}
                                                    // === PERBAIKAN UTAMA ===
                                                    // Asumsi backend mengirim 'status_ketersediaan'
                                                    statusKetersediaan={item.status_ketersediaan} 
                                                    // =======================
                                                    showDrawer={() => showDrawer(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                             {/* Tampilkan pesan jika search tidak menemukan hasil */}
                             {kategori.length > 0 && isSearchEmpty && (
                                <div className="text-center py-20 text-gray-400">
                                    <IoMdSearch size={64} className="mx-auto"/>
                                    <p className="mt-2 text-lg">Produk tidak ditemukan</p>
                                    <p className="text-sm">Coba kata kunci lain untuk "{searchTerm}"</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>

            {/* Drawer Detail Menu */}
            <Drawer
                title=""
                closable={true}
                onClose={onClose}
                open={open}
                placement="bottom"
                height="auto" // Biarkan tinggi menyesuaikan konten
                bodyStyle={{ padding: '16px', paddingBottom: '100px' }} // Padding bawah lebih besar untuk tombol
                key={detailMenu?.id_produk} // Reset drawer saat item berubah
            >
                {detailMenu && (
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
                )}
                {/* Tombol Add to Cart di dalam Drawer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-10">
                    <button
                        onClick={() => addOrUpdateItem(detailMenu, countItem, note)}
                        disabled={countItem === 0} // Disable jika count 0
                        className={`bg-testPrimary text-white rounded-md px-5 py-3 shadow-md w-full font-semibold transition-opacity ${
                            countItem === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                        }`}
                    >
                        Tambah ke Keranjang - Rp {((detailMenu?.harga || 0) * countItem).toLocaleString('id-ID')}
                    </button>
                </div>
            </Drawer>

            {/* Footer Keranjang */}
            {totalCount > 0 && (
                <div
                   className="fixed bottom-0 left-0 right-0 bg-testPrimary text-white px-4 py-3 flex justify-between items-center shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] cursor-pointer z-50"
                   style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                   onClick={() => setOpenCart(true)}
                 >
                    <Badge count={totalCount} size="default" color="#fff" style={{ color: '#667eea', fontWeight: 'bold', boxShadow: '0 0 0 1px #fff inset' }}>
                        <FaShoppingBasket size={24} className="text-white" />
                    </Badge>
                    <span className="text-md font-semibold">Lihat Keranjang</span>
                    <FaChevronRight size={16}/>
                </div>
            )}

            {/* Drawer Keranjang Pesanan */}
            <Drawer title="Keranjang Pesanan" placement="bottom" closable={true} onClose={() => setOpenCart(false)} open={openCart} height="80vh">
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-1"> {/* Tambah padding sedikit */}
                        {selectedItem.filter(item => item.countItem > 0).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <TbBasketOff size={64} />
                                <p className="mt-2 text-lg">Keranjang masih kosong</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3"> {/* Tambah gap antar item keranjang */}
                                {selectedItem.filter(item => item.countItem > 0).map((item, index) => (
                                    <DetailKeranjang
                                        key={item.id_produk || index} // Gunakan id_produk
                                        image={item.foto_produk}
                                        name={item.nama_produk}
                                        description={item.deskripsi_produk}
                                        price={item.harga}
                                        countItem={item.countItem}
                                        note={item.note}
                                        setSelectedItem={setSelectedItem}
                                        id={item.id_produk}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Tombol Lanjut ke Pembayaran */}
                    {selectedItem.filter(item => item.countItem > 0).length > 0 && (
                        <div className="p-4 border-t bg-white sticky bottom-0"> {/* P-4 untuk spasi */}
                            <Link to="/confirm-order-pelanggan">
                                <button className="bg-testPrimary text-white rounded-md px-5 py-3 shadow-md w-full font-semibold hover:bg-opacity-90">
                                    Lanjut ke Pembayaran
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
};

export default CobaMenuPelanggans;