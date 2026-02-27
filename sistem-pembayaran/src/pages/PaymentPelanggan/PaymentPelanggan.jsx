// src/pages/Pelanggan/PaymentPelanggan.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft, FaTimes, FaTicketAlt, FaCheckCircle, FaUtensils, FaShoppingBag } from "react-icons/fa"; 
import { createOrder, getFnbTaxRate, getActivePromos, getActiveLocations } from '../../services/api';
import { Spin, Modal, ConfigProvider, Typography } from 'antd'; 

const { Title } = Typography;

// Helper format Rupiah
const formatRupiah = (number) => {
    const num = parseFloat(number);
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const PaymentPelanggan = () => {
    const navigate = useNavigate();

    // --- STATE FORM ---
    const [activeButtonEatType, setActiveButtonEatType] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [namaGuest, setNamaGuest] = useState("");
    const [lokasiPemesanan, setLokasiPemesanan] = useState("");

    // --- STATE MASTER DATA LOKASI ---
    const [lokasiOptions, setLokasiOptions] = useState([]);
    const [loadingLokasi, setLoadingLokasi] = useState(false);

    // --- STATE KERANJANG ---
    const [selectedItem, setSelectedItem] = useState(() => {
        try {
            const store = localStorage.getItem('selectedItem');
            return store ? JSON.parse(store) : [];
        } catch (e) { return []; }
    });

    // --- STATE KEUANGAN ---
    const [pajakPersen, setPajakPersen] = useState(0);
    const [isLoadingTax, setIsLoadingTax] = useState(true);

    // --- STATE MULTI-PROMO ---
    const [availablePromos, setAvailablePromos] = useState([]); 
    const [appliedPromos, setAppliedPromos] = useState([]); 
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false); 
    const [loadingPromos, setLoadingPromos] = useState(false);

    // --- INITIAL FETCH (PAJAK, PROMO, DAN LOKASI) ---
    useEffect(() => {
        let isMounted = true;
        
        const initData = async () => {
            setIsLoadingTax(true);
            setLoadingLokasi(true);
            setLoadingPromos(true);

            try {
                // 1. Ambil Pajak
                const rate = await getFnbTaxRate();
                if (isMounted) setPajakPersen(rate);

                // 2. Ambil Promo
                const promos = await getActivePromos();
                if (isMounted) setAvailablePromos(promos);

                // 3. Ambil Master Lokasi
                const dataLokasi = await getActiveLocations(); 
                if (isMounted && Array.isArray(dataLokasi)) {
                    const formatted = dataLokasi.map(loc => ({
                        value: loc.nama_lokasi, 
                        label: loc.nama_lokasi 
                    }));
                    setLokasiOptions(formatted);
                }
            } catch (error) {
                console.error("Gagal load data inisial", error);
            } finally {
                if (isMounted) {
                    setIsLoadingTax(false);
                    setLoadingLokasi(false);
                    setLoadingPromos(false);
                }
            }
        };

        initData();

        return () => {
            isMounted = false;
        };
    }, []);

    // --- LOGIKA KALKULASI HARGA ---
    const subtotal = useMemo(() =>
        selectedItem.filter(item => item.countItem > 0).reduce((acc, item) => {
            const harga = parseFloat(item.harga_menu || item.harga) || 0; 
            const qty = parseInt(item.countItem) || 0;
            return acc + (harga * qty);
        }, 0), [selectedItem]
    );

    // Helper Validasi Promo
    const validatePromo = (promo, currentSubtotal) => {
        if (!promo) return { valid: true };
        let syarat = promo.syarat;
        if (syarat && typeof syarat === 'string') {
            try { syarat = JSON.parse(syarat); } catch { syarat = {}; }
        }
        
        if (syarat?.min_transaksi && currentSubtotal < syarat.min_transaksi) {
            return { valid: false, message: `Min. order ${formatRupiah(syarat.min_transaksi)}` };
        }

        if (promo.waktu_mulai && promo.waktu_selesai) {
            const now = new Date();
            const currentString = now.toTimeString().slice(0, 5);
            const start = promo.waktu_mulai.slice(0, 5);
            const end = promo.waktu_selesai.slice(0, 5);
            if (currentString < start || currentString > end) {
                return { valid: false, message: `Hanya jam ${start} - ${end}` };
            }
        }
        return { valid: true };
    };

    // --- HITUNG TOTAL DISKON ---
    const discountAmount = useMemo(() => {
        if (appliedPromos.length === 0) return 0;

        let totalDiscount = 0;
        appliedPromos.forEach(promo => {
            const check = validatePromo(promo, subtotal);
            if (check.valid) {
                const nilai = parseFloat(promo.nilai_diskon);
                if (nilai <= 100) {
                    totalDiscount += subtotal * (nilai / 100);
                } else {
                    totalDiscount += nilai;
                }
            }
        });
        return Math.min(totalDiscount, subtotal);
    }, [appliedPromos, subtotal]);

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const pajakNominal = useMemo(() => taxableAmount * (pajakPersen / 100), [taxableAmount, pajakPersen]);
    const totalHargaFinal = useMemo(() => taxableAmount + pajakNominal, [taxableAmount, pajakNominal]);

    // --- HANDLERS ---
    const handleTogglePromo = (promo) => {
        const check = validatePromo(promo, subtotal);
        if (!check.valid) {
            Modal.warning({ title: "Tidak Memenuhi Syarat", content: check.message, centered: true });
            return;
        }

        const isSelected = appliedPromos.find(p => p.id_promo === promo.id_promo);
        if (isSelected) {
            setAppliedPromos(prev => prev.filter(p => p.id_promo !== promo.id_promo));
        } else {
            setAppliedPromos(prev => [...prev, promo]);
        }
    };

    const handleRemoveAllPromos = (e) => {
        e.stopPropagation();
        setAppliedPromos([]);
    };

    const handlePlaceOrder = async () => {
        const validItems = selectedItem.filter(item => item.countItem > 0);
        if (validItems.length === 0) { alert("Keranjang kosong."); return; }
        if (!namaGuest.trim()) { alert("Nama harus diisi."); return; }
        if (activeButtonEatType === 1 && !lokasiPemesanan) { alert("Pilih tempat duduk."); return; }
        if (!paymentMethod) { alert("Pilih metode pembayaran."); return; }

        const orderDetails = {
            fnb_type: activeButtonEatType === 1 ? 'Dine In' : 'Takeaway',
            nama_guest: namaGuest.trim(),
            lokasi_pemesanan: activeButtonEatType === 1 ? lokasiPemesanan : null,
            metode_pembayaran: paymentMethod,
            subtotal: subtotal,
            id_promo: appliedPromos.length > 0 ? appliedPromos[0].id_promo : null,
            discount_nominal: discountAmount,
            pajak_persen: pajakPersen,
            pajak_nominal: pajakNominal,
            total_harga_final: totalHargaFinal,
            detail_order: validItems.map(item => ({
                id_produk: item.id_produk || item.id_menu, 
                jumlah: item.countItem,
                harga_saat_order: parseFloat(item.harga_menu || item.harga) || 0,
                catatan_pesanan: item.note || null
            }))
        };

        try {
            const result = await createOrder(orderDetails);
            if (result?.datas) {
                localStorage.removeItem('selectedItem');
                navigate('/transaksi-selesai', { state: { transactionData: result.datas } });
            } else {
                alert('Gagal memproses pesanan. Silakan coba lagi.');
            }
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    };

    // --- DATA STATIS ---
    const methods = [{ id: "QRIS", label: "QRIS / E-Wallet" }, { id: "CASH", label: "Bayar Tunai di Kasir" }];
    
    // Validasi Form
    const isFormValid = useMemo(() => {
        const hasItems = selectedItem.some(i => i.countItem > 0);
        return hasItems && namaGuest.trim() && (activeButtonEatType === 2 || lokasiPemesanan) && paymentMethod && !isLoadingTax;
    }, [selectedItem, namaGuest, activeButtonEatType, lokasiPemesanan, paymentMethod, isLoadingTax]);

    return (
        <ConfigProvider>
            <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-32">
                
                {/* 1. APP HEADER */}
                <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <FaChevronLeft size={20} />
                        </button>
                        <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                            Pembayaran
                        </Title>
                        <div className="w-10"></div> 
                    </div>
                </div>

                {/* 2. MAIN CONTENT SCROLLABLE */}
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                    
                    {/* Tipe Pesanan (Dine-in / Takeaway) */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Tipe Pesanan</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setActiveButtonEatType(1)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                                    activeButtonEatType === 1 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <FaUtensils className="text-2xl mb-2" />
                                <span className="font-bold text-sm">Makan di Tempat</span>
                            </button>
                            <button 
                                onClick={() => setActiveButtonEatType(2)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                                    activeButtonEatType === 2 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <FaShoppingBag className="text-2xl mb-2" />
                                <span className="font-bold text-sm">Bungkus / Takeaway</span>
                            </button>
                        </div>
                    </div>

                    {/* Form Identitas */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Detail Pemesan</h3>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Nama Pemesan</label>
                            <input 
                                type="text" 
                                value={namaGuest} 
                                onChange={(e) => setNamaGuest(e.target.value)} 
                                placeholder="Cth: Budi Santoso" 
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            />
                        </div>

                        {/* --- PILIHAN TEMPAT DINAMIS (UPDATED) --- */}
                        {activeButtonEatType === 1 && (
                            <div className="animate-fade-in">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1">Lokasi Meja / Duduk</label>
                                <div className="relative">
                                    <select 
                                        value={lokasiPemesanan} 
                                        onChange={(e) => setLokasiPemesanan(e.target.value)} 
                                        disabled={loadingLokasi} // Disable saat loading
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <option value="" disabled>
                                            {loadingLokasi ? "Memuat lokasi..." : "Pilih Area Meja..."}
                                        </option>
                                        
                                        {/* Render Options dari State (Database) */}
                                        {!loadingLokasi && lokasiOptions.map((opt, idx) => (
                                            <option key={idx} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {loadingLokasi ? (
                                            <Spin size="small" />
                                        ) : (
                                            <FaChevronRight className="text-slate-400 rotate-90" />
                                        )}
                                    </div>
                                </div>
                                {lokasiOptions.length === 0 && !loadingLokasi && (
                                    <p className="text-xs text-rose-500 mt-1 ml-1">* Data lokasi belum tersedia. Hubungi admin.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pilihan Metode Pembayaran */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Metode Pembayaran</h3>
                        <div className="space-y-3">
                            {methods.map((method) => (
                                <div 
                                    key={method.id} 
                                    onClick={() => setPaymentMethod(method.id)} 
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                        paymentMethod === method.id 
                                        ? "border-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100" 
                                        : "border-slate-100 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <span className={`font-bold ${paymentMethod === method.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                                        {method.label}
                                    </span>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        paymentMethod === method.id ? 'border-indigo-600' : 'border-slate-300'
                                    }`}>
                                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-fade-in"></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modul Voucher Promo */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Punya Promo?</h3>
                        <div 
                            onClick={() => setIsPromoModalOpen(true)}
                            className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <FaTicketAlt size={18} />
                                </div>
                                <div className="flex flex-col">
                                    {appliedPromos.length > 0 ? (
                                        <>
                                            <span className="text-sm font-bold text-slate-800">{appliedPromos.length} Promo Terpasang</span>
                                            <span className="text-xs font-bold text-emerald-600 mt-0.5">Hemat {formatRupiah(discountAmount)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-bold text-slate-700">Gunakan Voucher</span>
                                            <span className="text-xs text-slate-500 font-medium mt-0.5">Klik untuk lihat promo tersedia</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                {appliedPromos.length > 0 ? (
                                    <button 
                                        onClick={handleRemoveAllPromos}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                    >
                                        <FaTimes size={14} />
                                    </button>
                                ) : (
                                    <FaChevronRight className="text-indigo-300"/>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ringkasan Total */}
                <div className="max-w-3xl mx-auto px-4 pb-6">
                    {isLoadingTax ? (
                        <div className="flex justify-center py-6"><Spin /></div>
                    ) : (
                        <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                            
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rincian Pembayaran</h3>
                            
                            <div className="space-y-2.5 relative z-10">
                                <div className="flex justify-between items-center text-slate-300 text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>
                                
                                {appliedPromos.length > 0 && (
                                    <div className="flex justify-between items-center text-emerald-400 text-sm font-bold">
                                        <span>Total Diskon</span>
                                        <span>- {formatRupiah(discountAmount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-slate-300 text-sm font-medium">
                                    <span>Pajak Resto ({pajakPersen}%)</span>
                                    <span>{formatRupiah(pajakNominal)}</span>
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-5 border-t border-slate-700/50 flex justify-between items-end relative z-10">
                                <span className="text-sm font-bold text-slate-200">Total Harga</span>
                                <span className="text-2xl font-black text-white">{formatRupiah(totalHargaFinal)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. STICKY BOTTOM CHECKOUT BUTTON */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-40">
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={!isFormValid}
                            className={`w-full rounded-2xl px-6 py-4 font-bold text-base shadow-xl flex justify-center items-center transition-all duration-300 ${
                                !isFormValid 
                                ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                                : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98]'
                            }`}
                        >
                            {!isFormValid ? 'Lengkapi Data Pesanan' : 'Buat Pesanan Sekarang'}
                        </button>
                    </div>
                </div>

                {/* 4. MODAL VOUCHER (Clean Design) */}
                <Modal
                    title={<span className="font-black text-slate-800 text-lg">Pilih Promo</span>}
                    open={isPromoModalOpen}
                    onCancel={() => setIsPromoModalOpen(false)}
                    footer={
                        <div className="flex justify-between items-center w-full pt-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">
                                {appliedPromos.length} Dipilih
                            </span>
                            <button 
                                onClick={() => setIsPromoModalOpen(false)}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                Simpan & Pakai
                            </button>
                        </div>
                    }
                    centered
                    className="custom-promo-modal"
                    styles={{ body: { maxHeight: '65vh', overflowY: 'auto', padding: '16px 0' } }}
                >
                    {loadingPromos ? (
                        <div className="py-12 flex justify-center"><Spin /></div>
                    ) : availablePromos.length > 0 ? (
                        <div className="space-y-3 px-1">
                            {availablePromos.map(promo => {
                                const check = validatePromo(promo, subtotal);
                                const isSelected = appliedPromos.some(p => p.id_promo === promo.id_promo);
                                
                                return (
                                    <div 
                                        key={promo.id_promo}
                                        onClick={() => check.valid && handleTogglePromo(promo)}
                                        className={`relative bg-white border-2 rounded-2xl p-4 transition-all duration-200 overflow-hidden ${
                                            check.valid 
                                                ? 'hover:border-indigo-300 cursor-pointer border-slate-100 shadow-sm' 
                                                : 'border-slate-100 opacity-60 cursor-not-allowed bg-slate-50 grayscale-[0.5]'
                                        } ${isSelected ? 'border-indigo-600 bg-indigo-50/30 shadow-md' : ''}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h4 className="font-black text-slate-800 text-base">{promo.kode_promo}</h4>
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                                                        {parseFloat(promo.nilai_diskon) <= 100 ? `${parseFloat(promo.nilai_diskon)}% OFF` : 'Potongan'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{promo.deskripsi_promo}</p>
                                                
                                                {!check.valid && (
                                                    <div className="mt-3 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md inline-block">
                                                        ⚠️ {check.message}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
                                                isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent'
                                            }`}>
                                                <FaCheckCircle size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <FaTicketAlt size={40} className="mb-3 text-slate-300" />
                            <p className="font-bold text-slate-600">Belum Ada Promo</p>
                            <p className="text-xs mt-1">Cek lagi nanti untuk voucher menarik!</p>
                        </div>
                    )}
                </Modal>
                
                <style>{`
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    .custom-promo-modal .ant-modal-content {
                        border-radius: 28px !important;
                        overflow: hidden;
                        padding: 24px !important;
                    }
                    .custom-promo-modal .ant-modal-header { margin-bottom: 8px; }
                    .custom-promo-modal .ant-modal-close { top: 20px; right: 20px; }
                `}</style>
            </div>
        </ConfigProvider>
    );
}

export default PaymentPelanggan;