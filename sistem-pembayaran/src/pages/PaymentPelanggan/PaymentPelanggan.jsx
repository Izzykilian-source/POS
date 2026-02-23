import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft, FaPercentage, FaTimes, FaTicketAlt, FaCheckCircle } from "react-icons/fa"; 
import { createOrder, getFnbTaxRate, getActivePromos } from '../../services/api';
import { Spin, Alert, Modal, Empty, Tag } from 'antd'; 

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
    const [errorTax, setErrorTax] = useState(null);

    // --- STATE MULTI-PROMO (DIBUAH MENJADI ARRAY) ---
    const [availablePromos, setAvailablePromos] = useState([]); 
    const [appliedPromos, setAppliedPromos] = useState([]); // Array untuk menampung banyak voucher
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false); 
    const [loadingPromos, setLoadingPromos] = useState(false);

    // --- INITIAL FETCH ---
    useEffect(() => {
        let isMounted = true;
        const initData = async () => {
            setIsLoadingTax(true);
            try {
                const rate = await getFnbTaxRate();
                if (isMounted) setPajakPersen(rate);

                setLoadingPromos(true);
                const promos = await getActivePromos();
                if (isMounted) setAvailablePromos(promos);
            } catch (err) {
                if (isMounted && !pajakPersen) setPajakPersen(10);
            } finally {
                if (isMounted) {
                    setIsLoadingTax(false);
                    setLoadingPromos(false);
                }
            }
        };
        initData();
        return () => { isMounted = false; };
    }, []);

    // --- LOGIKA KALKULASI HARGA ---
    const subtotal = useMemo(() =>
        selectedItem.filter(item => item.countItem > 0).reduce((acc, item) => {
            const harga = parseFloat(item.harga) || 0;
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
                return { valid: false, message: `Berlaku jam ${start} - ${end}` };
            }
        }
        return { valid: true };
    };

    // --- HITUNG TOTAL DISKON DARI BANYAK VOUCHER ---
    const discountAmount = useMemo(() => {
        if (appliedPromos.length === 0) return 0;

        let totalDiscount = 0;

        // Loop semua voucher yang dipilih
        appliedPromos.forEach(promo => {
            // Cek validitas real-time (jika user hapus item, voucher mungkin jadi tidak valid)
            const check = validatePromo(promo, subtotal);
            
            // Hanya hitung jika valid
            if (check.valid) {
                const nilai = parseFloat(promo.nilai_diskon);
                if (nilai <= 100) {
                    // Tipe Persen: Dihitung dari Subtotal Awal
                    totalDiscount += subtotal * (nilai / 100);
                } else {
                    // Tipe Rupiah
                    totalDiscount += nilai;
                }
            }
        });

        // Pastikan total diskon tidak melebihi harga belanja
        return Math.min(totalDiscount, subtotal);
    }, [appliedPromos, subtotal]);

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const pajakNominal = useMemo(() => taxableAmount * (pajakPersen / 100), [taxableAmount, pajakPersen]);
    const totalHargaFinal = useMemo(() => taxableAmount + pajakNominal, [taxableAmount, pajakNominal]);

    // --- HANDLERS (LOGIKA TOGGLE) ---
    const handleTogglePromo = (promo) => {
        // Cek syarat dulu
        const check = validatePromo(promo, subtotal);
        if (!check.valid) {
            Modal.warning({ title: "Tidak Bisa Digunakan", content: check.message, centered: true });
            return;
        }

        // Cek apakah sudah ada di array appliedPromos
        const isSelected = appliedPromos.find(p => p.id_promo === promo.id_promo);

        if (isSelected) {
            // Kalau sudah ada, HAPUS (Unselect)
            setAppliedPromos(prev => prev.filter(p => p.id_promo !== promo.id_promo));
        } else {
            // Kalau belum ada, TAMBAH (Select)
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
            
            // PAYLOAD PROMO (Updated)
            // Karena DB cuma support 1 ID, kita kirim ID yang pertama saja (sebagai referensi)
            // Tapi discount_nominal kita kirim TOTAL GABUNGAN
            id_promo: appliedPromos.length > 0 ? appliedPromos[0].id_promo : null,
            discount_nominal: discountAmount,
            
            pajak_persen: pajakPersen,
            pajak_nominal: pajakNominal,
            total_harga_final: totalHargaFinal,
            detail_order: validItems.map(item => ({
                id_produk: item.id_produk,
                jumlah: item.countItem,
                harga_saat_order: parseFloat(item.harga) || 0,
                catatan_pesanan: item.note || null
            }))
        };

        try {
            const result = await createOrder(orderDetails);
            if (result?.datas) {
                localStorage.removeItem('selectedItem');
                navigate('/transaksi-selesai', { state: { transactionData: result.datas } });
            } else {
                alert('Gagal memproses pesanan.');
            }
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    };

    // --- DATA STATIS & VALIDASI FORM ---
    const methods = [{ id: "QRIS", label: "QRIS" }, { id: "CASH", label: "Cash" }];
    const lokasiOptions = [
        { value: "ruangan meeting 01", label: "Ruangan Meeting 01" },
        { value: "ruangan meeting 02", label: "Ruangan Meeting 02" },
        { value: "space monitor", label: "Space Monitor" },
        { value: "open space", label: "Open Space" },
        { value: "lesehan", label: "Lesehan" },
        { value: "outdoor", label: "Outdoor" },
        { value: "homebro", label: "Homebro" },
    ];

    const isFormValid = useMemo(() => {
        const hasItems = selectedItem.some(i => i.countItem > 0);
        return hasItems && namaGuest.trim() && (activeButtonEatType === 2 || lokasiPemesanan) && paymentMethod && !isLoadingTax;
    }, [selectedItem, namaGuest, activeButtonEatType, lokasiPemesanan, paymentMethod, isLoadingTax]);

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header Tetap */}
            <div className="px-4 pt-2 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center">
                    <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition" onClick={() => navigate(-1)}>
                        <FaChevronLeft className="text-gray-700 text-xl" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 ml-2">Detail Pesanan & Pembayaran</h1>
                </div>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
                {errorTax && <Alert message={errorTax} type="warning" showIcon className="mb-4"/>}

                {/* Pilihan Dine In / Take Away */}
                <div className='flex justify-evenly pb-4 border-b border-gray-100 mb-4'>
                    <div className='flex flex-col items-center space-y-2'>
                        <img src="./img/dine-in.png" alt="Dine In" className="w-20 h-20 md:w-24 md:h-24 p-1" />
                        <button onClick={() => setActiveButtonEatType(1)} className={`text-sm w-32 h-9 flex items-center justify-center rounded-full shadow-md transition-colors ${activeButtonEatType === 1 ? "bg-testPrimary text-white font-semibold" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                            Dine In <FaChevronRight className="ml-1 text-xs"/>
                        </button>
                    </div>
                    <div className='flex flex-col items-center space-y-2'>
                        <img src="./img/take-away.png" alt="Take Away" className="w-20 h-20 md:w-24 md:h-24 p-1" />
                        <button onClick={() => setActiveButtonEatType(2)} className={`text-sm w-32 h-9 flex items-center justify-center rounded-full shadow-md transition-colors ${activeButtonEatType === 2 ? "bg-testPrimary text-white font-semibold" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                            Takeaway <FaChevronRight className="ml-1 text-xs"/>
                        </button>
                    </div>
                </div>

                {/* Form Input */}
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-gray-700 block mb-1 text-sm">Nama Pemesan*</label>
                        <input type="text" value={namaGuest} onChange={(e) => setNamaGuest(e.target.value)} placeholder="Masukkan nama Anda" className="w-full bg-gray-50 border border-gray-300 px-3 py-2 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-testPrimary text-sm"/>
                    </div>

                    {activeButtonEatType === 1 && (
                        <div>
                            <label className="font-semibold text-gray-700 block mb-1 text-sm">Pilih Tempat Duduk*</label>
                            <select value={lokasiPemesanan} onChange={(e) => setLokasiPemesanan(e.target.value)} className="w-full bg-gray-50 border border-gray-300 px-3 py-2 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-testPrimary appearance-none text-sm">
                                <option value="" disabled>-- Pilih Lokasi --</option>
                                {lokasiOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Ringkasan Item */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-2 pt-3 border-t border-gray-100 mt-4">Ringkasan Pesanan</h2>
                        {selectedItem.filter(item => item.countItem > 0).length > 0 ? (
                            <div className="space-y-3">
                                {selectedItem.filter(item => item.countItem > 0).map((item, index) => (
                                     <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start text-sm">
                                        <div className="flex-1 mr-2">
                                            <p className="font-semibold text-gray-800">
                                                {item.nama_produk} <span className="ml-1.5 text-xs font-normal text-white bg-testPrimary rounded-full px-1.5 py-0.5 align-middle">x{item.countItem}</span>
                                            </p>
                                            {item.note && <p className="text-xs text-gray-500 italic mt-1 pl-1">"{item.note}"</p>}
                                        </div>
                                        <p className="font-medium text-gray-700 whitespace-nowrap">{formatRupiah(parseFloat(item.harga * item.countItem) || 0)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500 italic text-center py-4">Keranjang kosong.</p>}
                    </div>

                    {/* === BAGIAN PILIH PROMO (MULTI) === */}
                    <div className="mt-4">
                        <label className="font-semibold text-gray-700 block mb-2 text-sm">Promo / Voucher</label>
                        <div 
                            onClick={() => setIsPromoModalOpen(true)}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-300 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition active:scale-95"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="text-testPrimary text-lg shrink-0">
                                    <FaTicketAlt />
                                </div>
                                <div className="flex-1">
                                    {appliedPromos.length > 0 ? (
                                        <>
                                            <p className="text-sm font-bold text-gray-800">
                                                {appliedPromos.length} Promo Dipasang
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {appliedPromos.map(p => (
                                                    <Tag key={p.id_promo} color="green" className="text-[10px] m-0 border-0 bg-green-100 text-green-700">
                                                        {p.kode_promo}
                                                    </Tag>
                                                ))}
                                            </div>
                                            <p className="text-xs text-green-600 font-bold mt-1">
                                                Total Hemat {formatRupiah(discountAmount)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-600 font-medium">Makin hemat pakai promo</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center shrink-0">
                                {appliedPromos.length > 0 ? (
                                    <button 
                                        onClick={handleRemoveAllPromos}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                    >
                                        <FaTimes />
                                    </button>
                                ) : (
                                    <FaChevronRight className="text-gray-400 text-sm"/>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rincian Harga Akhir */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200 space-y-2">
                        {isLoadingTax ? (
                            <div className="text-center text-gray-500 py-4"><Spin size="small" className="mr-2"/> Menghitung...</div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-sm text-gray-700">
                                    <span className="font-medium">Subtotal</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>

                                {/* Tampilkan Total Diskon */}
                                {appliedPromos.length > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                                        <span>Total Diskon ({appliedPromos.length} Voucher)</span>
                                        <span>- {formatRupiah(discountAmount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm text-gray-700">
                                    <span className="font-medium">Pajak ({pajakPersen}%)</span>
                                    <span>{formatRupiah(pajakNominal)}</span>
                                </div>
                                
                                <hr className="my-2 border-dashed"/>
                                
                                <div className="flex justify-between items-center text-green-600 pt-1">
                                    <span className="text-lg font-bold">Total Pembayaran</span>
                                    <span className="text-lg font-bold">{formatRupiah(totalHargaFinal)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Metode Pembayaran */}
                    <div>
                        <span className="font-semibold text-gray-700 block mb-2 pt-1.5 text-sm">Metode Pembayaran*</span>
                        <div className="space-y-2">
                            {methods.map((method) => (
                                <label key={method.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition ${paymentMethod === method.id ? "border-testPrimary bg-red-50 ring-1 ring-testPrimary" : "border-gray-300 bg-white hover:bg-gray-50"}`}>
                                    <span className={`font-medium text-sm ${paymentMethod === method.id ? 'text-testPrimary' : 'text-gray-700'}`}>{method.label}</span>
                                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="form-radio h-4 w-4 text-testPrimary focus:ring-testPrimary"/>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tombol Bawah */}
            <div className="p-4 border-t bg-white sticky bottom-0 left-0 right-0 w-full z-10">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-base font-semibold">Total Harga:</span>
                    <span className="text-lg font-bold text-testPrimary">{isLoadingTax ? <Spin size="small"/> : formatRupiah(totalHargaFinal)}</span>
                </div>
                <button
                    onClick={handlePlaceOrder}
                    disabled={!isFormValid}
                    className={`w-full text-white rounded-lg px-5 py-3 shadow-md font-semibold text-base transition ${!isFormValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-testPrimary hover:bg-red-700'}`}
                >
                    Konfirmasi & Buat Pesanan
                </button>
            </div>

            {/* === MODAL PILIH VOUCHER (MULTI-SELECT) === */}
            <Modal
                title={<span className="font-bold text-lg">Pilih Voucher ({appliedPromos.length})</span>}
                open={isPromoModalOpen}
                onCancel={() => setIsPromoModalOpen(false)}
                footer={
                    <div className="flex justify-between items-center w-full px-2">
                        <span className="text-xs text-gray-500">
                            {appliedPromos.length} Terpilih
                        </span>
                        <button 
                            onClick={() => setIsPromoModalOpen(false)}
                            className="bg-testPrimary text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md"
                        >
                            Simpan & Pakai
                        </button>
                    </div>
                }
                centered
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px', backgroundColor: '#F9FAFB' }}
            >
                {loadingPromos ? (
                    <div className="py-10 text-center"><Spin /></div>
                ) : availablePromos.length > 0 ? (
                    <div className="space-y-3">
                        {availablePromos.map(promo => {
                            const check = validatePromo(promo, subtotal);
                            const isSelected = appliedPromos.some(p => p.id_promo === promo.id_promo);
                            
                            return (
                                <div 
                                    key={promo.id_promo}
                                    onClick={() => check.valid && handleTogglePromo(promo)}
                                    className={`relative bg-white border rounded-xl p-3 shadow-sm transition-all overflow-hidden ${
                                        check.valid 
                                            ? 'hover:border-testPrimary cursor-pointer border-gray-200' 
                                            : 'border-gray-100 opacity-60 cursor-not-allowed grayscale-[0.5]'
                                    } ${isSelected ? 'ring-2 ring-testPrimary border-testPrimary bg-red-50' : ''}`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${check.valid ? 'bg-testPrimary' : 'bg-gray-300'}`}></div>
                                    <div className="flex justify-between items-center pl-4">
                                        <div className="flex-1 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-800 text-sm">{promo.kode_promo}</h4>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                                                    {parseFloat(promo.nilai_diskon) <= 100 ? `${parseFloat(promo.nilai_diskon)}%` : 'Potongan'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-tight">{promo.deskripsi_promo}</p>
                                            {!check.valid && (
                                                <div className="mt-2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded w-fit">⚠️ {check.message}</div>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-2xl text-testPrimary">
                                            {isSelected ? <FaCheckCircle /> : (
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Empty description="Tidak ada promo tersedia" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Modal>
        </div>
    );
}

export default PaymentPelanggan;