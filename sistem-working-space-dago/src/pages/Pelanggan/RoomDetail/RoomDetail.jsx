import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import moment from "moment";
import { formatRupiah } from "../../../utils/formatRupiah";
import { Alert, Divider, Button as AntButton, Input, Modal, Typography, Radio, Tag, Spin } from "antd";
import { ArrowLeft, Users, Calendar, Clock, Info, Banknote, Type, CreditCard, CheckCircle, TicketPercent } from "lucide-react";

// Impor semua fungsi service yang dibutuhkan dari satu file
import { getPromo, getMembershipForCategory, getDataPrivate, getVOClientByUserId } from "../../../services/service";

const { Text } = Typography;
const baseUrl = import.meta.env.VITE_BASE_URL;

// Komponen kecil untuk menampilkan info dengan rapi
const InfoPill = ({ icon, label, value }) => (
    <div className="flex flex-col items-center justify-center text-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-blue-600 mb-1">{icon}</div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-sm text-gray-800 font-semibold">{value}</span>
    </div>
);

const RoomDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const room = location.state;

    // --- STATE MANAGEMENT ---
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [selectedRange, setSelectedRange] = useState();
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedEndTime, setSelectedEndTime] = useState(null);
    const [duration, setDuration] = useState(0);
    const [purpose, setPurpose] = useState('');
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [bookedHours, setBookedHours] = useState([]);
    const [isLoadingTimes, setIsLoadingTimes] = useState(false);
    const [showDateRequiredAlert, setShowDateRequiredAlert] = useState(false);
    const [promo, setPromo] = useState([]);
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [userMembership, setUserMembership] = useState(null);
    const [isLoadingMembership, setIsLoadingMembership] = useState(true);
    const [virtualOfficeClient, setVirtualOfficeClient] = useState(null);
    const [isLoadingVO, setIsLoadingVO] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('normal');
    const [creditCost, setCreditCost] = useState(0);
    const [includeSaturday, setIncludeSaturday] = useState(true);
    const [includeSunday, setIncludeSunday] = useState(false);

    // --- KONSTANTA & FUNGSI HELPER ---
    const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i);
    const today = new Date();
    const features = room?.fitur_ruangan ? room.fitur_ruangan.split(/\r?\n|,/).map(f => f.trim()).filter(Boolean) : [];
    const getFeatureIcon = () => <CheckCircle size={18} className="text-green-500" />;

    const getPromoRequirement = (promoItem) => {
        try {
            if (!promoItem.syarat) return null;
            const syarat = typeof promoItem.syarat === 'string' ? JSON.parse(promoItem.syarat) : promoItem.syarat;
            if (syarat.min_durasi_jam) return `Min. booking ${syarat.min_durasi_jam} jam`;
            return null;
        } catch (e) {
            return null;
        }
    };

    const countIncludedDays = (start, end, includeSat, includeSun) => {
        if (!start) return 0;
        let count = 0;
        let current = moment(start).clone().startOf('day');
        const last = end ? moment(end).clone().startOf('day') : current.clone();
        while (current.isSameOrBefore(last, 'day')) {
            const day = current.day();
            if ((day >= 1 && day <= 5) || (day === 6 && includeSat) || (day === 0 && includeSun)) {
                count++;
            }
            current.add(1, 'day');
        }
        return count;
    };

    const buildDisabledDays = () => {
        // Mulai dengan aturan dasar (menonaktifkan hari-hari sebelum hari ini)
        const arr = [{ before: today }];

        // Buat array untuk menampung hari-hari yang akan dinonaktifkan
        const disabledDaysOfWeek = [];

        if (!includeSunday) {
            disabledDaysOfWeek.push(0); // 0 adalah Minggu
        }
        if (!includeSaturday) {
            disabledDaysOfWeek.push(6); // 6 adalah Sabtu
        }

        // Jika ada hari yang perlu dinonaktifkan, tambahkan sebagai satu aturan
        if (disabledDaysOfWeek.length > 0) {
            arr.push({ dayOfWeek: disabledDaysOfWeek });
        }

        return arr;
    };
    // --- STATE TURUNAN (DERIVED STATES) ---
    const countedDays = countIncludedDays(selectedRange?.from, selectedRange?.to, includeSaturday, includeSunday);
    const hasEnoughCredit = userMembership ? userMembership.sisa_credit >= creditCost * (countedDays > 0 ? countedDays : 1) : false;
    const isMeetingRoom = room?.nama_kategori === 'Room Meeting';
    const relevantVOBenefitHours = virtualOfficeClient?.benefit_tersisa
        ? (isMeetingRoom ? virtualOfficeClient.benefit_tersisa.meeting_room : virtualOfficeClient.benefit_tersisa.working_space)
        : 0;

    // --- (MOVED UP) HELPER VARIABLE: Check if promo conditions are met ---
    let isPromoConditionsMet = false;
    if (appliedPromo && appliedPromo.syarat) {
        try {
            const syarat = typeof appliedPromo.syarat === 'string' ? JSON.parse(appliedPromo.syarat) : appliedPromo.syarat;
            if (syarat.min_durasi_jam !== undefined) {
                if (duration > syarat.min_durasi_jam) {
                    isPromoConditionsMet = true;
                }
            }
            // Add other condition checks here in the future
        } catch (e) {
            console.error("Failed to parse promo conditions:", e);
        }
    } else if (appliedPromo) {
        // If promo exists but has no special conditions, it's valid
        isPromoConditionsMet = true;
    }


    // --- EFFECTS (LOGIKA PENGAMBILAN DATA) ---

    // 1. Ambil data user
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await getDataPrivate();
                setCurrentUser(response?.detail || null);
            } catch (error) {
                console.error("Gagal mengambil data user:", error);
                setCurrentUser(null);
            } finally {
                setIsLoadingUser(false);
            }
        };
        fetchUserData();
    }, []);

    // 2. Ambil data membership
    useEffect(() => {
        const fetchUserMembership = async () => {
            if (!currentUser?.id_user || !room?.id_kategori_ruangan) {
                setIsLoadingMembership(false);
                setUserMembership(null);
                return;
            }
            setIsLoadingMembership(true);
            try {
                const response = await getMembershipForCategory(currentUser.id_user, room.id_kategori_ruangan);
                setUserMembership(response[0] || null);
            } catch (error) {
                if (error.response?.status !== 404) console.error("Error fetching membership:", error);
                setUserMembership(null);
            } finally {
                setIsLoadingMembership(false);
            }
        };
        if (!isLoadingUser) fetchUserMembership();
    }, [currentUser, room?.id_kategori_ruangan, isLoadingUser]);

    // 3. Ambil data Virtual Office
    useEffect(() => {
        const fetchVOClientData = async () => {
            if (!currentUser?.id_user) {
                setIsLoadingVO(false);
                setVirtualOfficeClient(null);
                return;
            }
            setIsLoadingVO(true);
            const targetDate = selectedRange?.from ? moment(selectedRange.from).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
            try {
                const response = await getVOClientByUserId(currentUser.id_user, targetDate);
                setVirtualOfficeClient(response.data || null);
            } catch (error) {
                if (error?.response?.status !== 404) console.error("Error fetching VO client data:", error);
                setVirtualOfficeClient(null);
            } finally {
                setIsLoadingVO(false);
            }
        };
        if (!isLoadingUser) fetchVOClientData();
    }, [currentUser, isLoadingUser, selectedRange?.from]);

    // 4. Ambil data promo
useEffect(() => {
        const fetchPromo = async () => {
            try {
                const response = await getPromo();
                const allPromos = response.datas || [];

                // Opsi Tambahan: Filter lagi di client-side untuk keamanan ganda
                // (Meskipun backend sudah memfilter, ini memastikan tidak ada promo 'fnb' yang lolos)
                const roomPromos = allPromos.filter(p => 
                    p.kategori_promo === 'room' || p.kategori_promo === 'all'
                );

                setPromo(roomPromos);
            } catch (error) {
                console.error("Error fetching promo:", error);
            }
        };
        fetchPromo();
    }, []);

    // 5. Cek promo aktif (Find potentially applicable promo)
    useEffect(() => {
        if (paymentMethod !== 'normal' || !promo.length || !selectedRange?.from || !selectedStartTime) {
            setAppliedPromo(null);
            return;
        }

        const potentialPromo = promo.find(p => {
            const selectedDate = moment(selectedRange.from);
            const startHour = selectedStartTime;
            const withinDate = selectedDate.isBetween(moment(p.tanggal_mulai), moment(p.tanggal_selesai), "day", "[]");
            let withinTime = true;
            if (p.waktu_mulai && p.waktu_selesai) {
                const [startH] = p.waktu_mulai.split(":").map(Number);
                const [endH] = p.waktu_selesai.split(":").map(Number);
                withinTime = startHour >= startH && startHour < endH;
            }
            return withinDate && withinTime;
        });

        setAppliedPromo(potentialPromo || null);

    }, [promo, selectedRange, selectedStartTime, paymentMethod]);

    // 6. Ambil jam yang sudah dibooking
    useEffect(() => {
        const fetchBookedHours = async (date) => {
            setIsLoadingTimes(true);
            setBookedHours([]);
            setSelectedStartTime(null);
            setDuration(0);
            const formattedDate = moment(date).format('YYYY-MM-DD');
            try {
                const response = await fetch(`${baseUrl}/api/v1/ruangan/ruangan/${room.id_ruangan}/booked_hours/${formattedDate}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                setBookedHours(result.datas?.booked_hours || []);
            } catch (error) {
                console.error("Gagal mengambil jadwal booking:", error);
            } finally {
                setIsLoadingTimes(false);
            }
        };
        if (room?.id_ruangan && selectedRange?.from) {
            fetchBookedHours(selectedRange.from);
        } else {
            setBookedHours([]);
        }
    }, [selectedRange?.from, room?.id_ruangan]);

    // 7. Hitung total harga/biaya
    // 7. Hitung total harga/biaya
    useEffect(() => {
        if (duration > 0) {
            const days = countedDays > 0 ? countedDays : 1;
            if (paymentMethod === 'credit' && userMembership) {
                setCreditCost(duration);
                setTotalPrice(0);
                setAppliedPromo(null);
            } else if (paymentMethod === 'virtual_office') {
                setTotalPrice(0);
                setCreditCost(0);
                setAppliedPromo(null);
            } else {
                const pricePerDay = room.paket_harga.find(p => p.durasi_jam === duration)?.harga_paket || 0;
                let total = pricePerDay * days;

                // --- PERBAIKAN LOGIKA DISKON (PERSEN VS NOMINAL) ---
                if (appliedPromo && isPromoConditionsMet) {
                    const nilaiDiskon = Number(appliedPromo.nilai_diskon) || 0;

                    // Jika nilai <= 100, hitung sebagai PERSEN
                    if (nilaiDiskon <= 100) {
                        const potongan = (total * nilaiDiskon) / 100;
                        total = Math.max(total - potongan, 0);
                    }
                    // Jika nilai > 100, hitung sebagai NOMINAL RUPIAH
                    else {
                        total = Math.max(total - nilaiDiskon, 0);
                    }
                }
                // --- AKHIR PERBAIKAN ---

                setTotalPrice(total);
                setCreditCost(0);
            }
        } else {
            setTotalPrice(0);
            setCreditCost(0);
        }
    }, [selectedRange, duration, room.paket_harga, appliedPromo, paymentMethod, userMembership, countedDays, isPromoConditionsMet]);

    // --- HANDLER & GUARDS ---

    if (!room) {
        useEffect(() => { navigate('/informasiruangan'); }, [navigate]);
        return null;
    }

    if (!room.paket_harga || room.paket_harga.length === 0) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center p-4">
                <Alert message="Data Harga Ruangan Tidak Ditemukan" type="error" showIcon action={<AntButton onClick={() => navigate(-1)} type="primary">Kembali</AntButton>} />
            </div>
        );
    }

    const handleDurationSelect = (paket) => {
        setDuration(paket.durasi_jam);
        if (selectedStartTime !== null) {
            setSelectedEndTime(selectedStartTime + paket.durasi_jam);
        }
    };

    const handleStartTimeSelect = (hour) => {
        if (!selectedRange?.from) {
            setShowDateRequiredAlert(true);
            return;
        }
        setShowDateRequiredAlert(false);
        setSelectedStartTime(hour);
        setDuration(0);
        setSelectedEndTime(null);
    };

    const dateDisplayValue = () => {
        if (!selectedRange || !selectedRange.from) return "Pilih tanggal...";
        if (!selectedRange.to || moment(selectedRange.from).isSame(selectedRange.to, 'day')) {
            return moment(selectedRange.from).format("dddd, DD MMMM YYYY");
        }
        return `${moment(selectedRange.from).format("DD MMM YYYY")} - ${moment(selectedRange.to).format("DD MMM YYYY")}`;
    };

    const imageUrl = `${baseUrl}/static/${room.gambar_ruangan}`;

    const isBookingDataValid = duration > 0 && selectedRange?.from && !isLoadingTimes;
    let isPaymentValid = false;
    if (isBookingDataValid) {
        if (paymentMethod === 'normal') {
            isPaymentValid = true;
        } else if (paymentMethod === 'credit') {
            isPaymentValid = hasEnoughCredit;
        } else if (paymentMethod === 'virtual_office') {
            isPaymentValid = (duration * (countedDays > 0 ? countedDays : 1) <= relevantVOBenefitHours);
        }
    }
    const isButtonDisabled = !isPaymentValid;

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Kembali">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{room.nama_ruangan}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Kolom Kiri: Detail Ruangan */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <img src={imageUrl} alt={room.nama_ruangan} className="w-full h-64 sm:h-96 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800x600?text=Gambar+Tidak+Tersedia"; }} />
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
                                    <InfoPill icon={<Banknote size={24} />} label="Mulai Dari" value={formatRupiah(Math.min(...room.paket_harga.map(p => p.harga_paket)))} />
                                    <InfoPill icon={<Users size={24} />} label="Kapasitas" value={`${room.kapasitas} orang`} />
                                    <InfoPill icon={<Type size={24} />} label="Tipe" value={room.nama_kategori} />
                                    <InfoPill icon={<Clock size={24} />} label="Jam Buka" value="08:00 - 22:00" />
                                </div>
                                <p className="text-gray-600 mb-6 text-base leading-relaxed">{room.deskripsi_ruangan}</p>
                                <h3 className="font-semibold text-lg text-gray-800 mb-4">Fasilitas yang Termasuk</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">{getFeatureIcon()}<span>{feature}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Form Booking */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Jadwalkan Sesi Anda</h2>
                            <div className="space-y-4">
                                {/* --- BAGIAN BARU: LIST PROMO TERSEDIA --- */}
                                {promo.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-4">
                                        <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                            <TicketPercent size={18} /> Promo Spesial Untukmu
                                        </h3>
                                        <div className="space-y-3">
                                            {promo.map((p) => {
                                                const nilai = Number(p.nilai_diskon);
                                                const isPersen = nilai <= 100;
                                                const syaratText = getPromoRequirement(p);

                                                return (
                                                    <div key={p.id_promo} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm">{p.kode_promo}</div>
                                                            <div className="text-xs text-gray-500 mt-1">{p.deskripsi_promo}</div>

                                                            {/* Tampilkan Jam Berlaku jika ada */}
                                                            {p.waktu_mulai && p.waktu_selesai && (
                                                                <div className="text-xs text-orange-600 mt-1 font-medium flex items-center gap-1">
                                                                    <Clock size={10} /> Berlaku jam: {p.waktu_mulai.slice(0, 5)} - {p.waktu_selesai.slice(0, 5)}
                                                                </div>
                                                            )}

                                                            {/* Tampilkan Syarat jika ada */}
                                                            {syaratText && (
                                                                <div className="text-xs text-gray-500 mt-0.5 italic">
                                                                    * {syaratText}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block font-bold text-green-600 text-sm">
                                                                Diskon {isPersen ? `${nilai}%` : formatRupiah(nilai)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {/* --- AKHIR BAGIAN BARU --- */}

                                {/* Metode Pembayaran Dinamis */}
                                {isLoadingUser || isLoadingMembership || isLoadingVO ? (
                                    <div className="text-center p-3 bg-gray-50 rounded-lg"><Spin /><p className="text-xs text-gray-500 mt-2">Memeriksa data Anda...</p></div>
                                ) : (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><CreditCard size={16} /> Metode Pembayaran</h3>
                                        <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} className="w-full">
                                            <div className="space-y-3">
                                                <div className="bg-gray-50 p-3 rounded-lg border"><Radio value="normal">Bayar Normal (Rupiah)</Radio></div>
                                                {currentUser && userMembership && userMembership.sisa_credit > 0 && (
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                        <Radio value="credit">Gunakan Kredit Membership</Radio>
                                                        <p className="text-xs text-gray-600 mt-1 ml-6">Sisa kredit Anda: <strong>{userMembership.sisa_credit} kredit</strong></p>
                                                    </div>
                                                )}
                                                {currentUser && virtualOfficeClient && relevantVOBenefitHours > 0 && (
                                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                        <Radio value="virtual_office" disabled={duration > 0 && (duration * (countedDays > 0 ? countedDays : 1)) > relevantVOBenefitHours}>Gunakan Benefit Virtual Office</Radio>
                                                        <p className="text-xs text-gray-600 mt-1 ml-6">Sisa benefit untuk bulan ini: <strong>{relevantVOBenefitHours} jam</strong></p>
                                                        {duration > 0 && (duration * (countedDays > 0 ? countedDays : 1)) > relevantVOBenefitHours && (
                                                            <p className="text-xs text-red-600 mt-1 ml-6">Durasi booking melebihi sisa benefit Anda.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Radio.Group>
                                    </div>
                                )}

                                {/* Pemilih Tanggal */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16} /> Tanggal Booking</h3>
                                    <Input readOnly value={dateDisplayValue()} onClick={() => setCalendarVisible(true)} size="large" className="cursor-pointer" />
                                    <Modal title="Pilih Tanggal Booking" open={isCalendarVisible} onCancel={() => setCalendarVisible(false)} width={window.innerWidth > 768 ? 800 : '90%'} footer={<div className="flex justify-between w-full"><AntButton onClick={() => setSelectedRange(undefined)}>Reset</AntButton><AntButton type="primary" onClick={() => setCalendarVisible(false)} disabled={!selectedRange?.from}>Selesai</AntButton></div>} centered>
                                        <div className="py-4 border-b mb-4"><Text type="secondary"><b>Tips:</b> Klik satu tanggal untuk booking harian, atau klik tanggal kedua untuk memilih rentang.</Text></div>
                                        <div className="mb-4 p-3 rounded-lg border bg-gray-50">
                                            <h4 className="font-medium text-gray-700 mb-2">Opsi Hari yang Dihitung</h4>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={includeSaturday} onChange={e => setIncludeSaturday(e.target.checked)} /><span className="text-sm">Hitung Sabtu</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={includeSunday} onChange={e => setIncludeSunday(e.target.checked)} /><span className="text-sm">Hitung Minggu</span></label>
                                            </div>
                                        </div>
                                        <DayPicker mode="range" selected={selectedRange} onSelect={setSelectedRange} disabled={buildDisabledDays()} numberOfMonths={window.innerWidth > 768 ? 2 : 1} />
                                    </Modal>
                                </div>

                                {/* Pemilih Jam Mulai */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2"><Clock size={16} /> Pilih Jam Mulai</h3>
                                    {showDateRequiredAlert && <Alert message="Pilih tanggal terlebih dahulu." type="info" className="mb-4" />}
                                    {isLoadingTimes ? <div className="text-center p-4"><Spin /></div> : (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                            {timeSlots.map(hour => {
                                                const isToday = selectedRange?.from && moment(selectedRange.from).isSame(moment(), 'day');
                                                const isPast = isToday && hour < new Date().getHours();
                                                const isBooked = bookedHours.includes(hour);
                                                const isDisabled = isPast || isBooked || !selectedRange?.from;
                                                return (
                                                    <button key={`start-${hour}`} onClick={() => handleStartTimeSelect(hour)} disabled={isDisabled} className={`py-2 px-1 text-xs rounded-lg font-medium transition ${isDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : selectedStartTime === hour ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-blue-100"}`}>
                                                        {`${String(hour).padStart(2, '0')}:00`}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Pemilih Durasi */}

                                {selectedStartTime && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2"><Clock size={16} /> Pilih Paket Durasi</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[...room.paket_harga].sort((a, b) => a.durasi_jam - b.durasi_jam).map((paket, index) => {
                                                const endTime = selectedStartTime + paket.durasi_jam;

                                                // --- PERBAIKAN LOGIKA ADA DI SINI ---
                                                // Cek apakah ada jam yang sudah dibooking di dalam rentang durasi yang dipilih
                                                const isOverlapping = bookedHours.some(
                                                    bookedHour => bookedHour >= selectedStartTime && bookedHour < endTime
                                                );

                                                // Tombol durasi menjadi tidak valid jika:
                                                // 1. Waktu selesai melebihi jam tutup (22:00)
                                                // 2. Ada tumpang tindih dengan jadwal yang sudah ada
                                                const isInvalid = endTime > 22 || isOverlapping;
                                                // --- AKHIR PERBAIKAN LOGIKA ---

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleDurationSelect(paket)}
                                                        disabled={isInvalid}
                                                        className={`p-2 text-xs rounded-lg font-medium transition flex flex-col items-center justify-center h-16 ${isInvalid
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            : duration === paket.durasi_jam
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-100 hover:bg-blue-100"
                                                            }`}
                                                    >
                                                        <span className="font-bold text-base">{paket.durasi_jam} Jam</span>
                                                        <span className="text-xs font-semibold opacity-90">{formatRupiah(paket.harga_paket)}</span>

                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <Divider />

                                {/* Ringkasan Harga */}
                                <div className="space-y-3">
                                    {/* PERBAIKAN DI BARIS INI */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Durasi Harian</span>
                                        <strong>
                                            {selectedStartTime !== null && selectedEndTime !== null
                                                ? `${String(selectedStartTime).padStart(2, '0')}:00 - ${String(selectedEndTime).padStart(2, '0')}:00`
                                                : `${duration || 0} Jam`
                                            }
                                        </strong>
                                    </div>

                                    {selectedRange?.from && <div className="flex justify-between items-center"><span className="text-gray-600">Total Hari Dikenakan Biaya</span><strong>{countedDays} Hari</strong></div>}

                                    {/* --- (MODIFIED) PROMO DISPLAY LOGIC --- */}
                                    {paymentMethod === 'normal' && appliedPromo && (
                                        <>
                                            <div className={`flex justify-between items-center ${isPromoConditionsMet ? 'text-green-700' : 'text-gray-500'}`}>
                                                <span><Tag color={isPromoConditionsMet ? "green" : "default"}>Promo ({appliedPromo.kode_promo})</Tag></span>

                                                {/* --- PERBAIKAN TAMPILAN --- */}
                                                <strong>
                                                    -
                                                    {Number(appliedPromo.nilai_diskon) <= 100
                                                        ? `${Number(appliedPromo.nilai_diskon)}%`
                                                        : formatRupiah(Number(appliedPromo.nilai_diskon))
                                                    }
                                                </strong>
                                                {/* -------------------------- */}

                                            </div>
                                            {!isPromoConditionsMet && duration > 0 && appliedPromo.syarat && (
                                                <div className="text-right text-xs text-orange-600 mt-1">
                                                    Syarat: Booking di atas {appliedPromo.syarat.min_durasi_jam} jam
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {paymentMethod === 'virtual_office' ? (
                                        <div className="flex justify-between items-center"><span className="text-gray-600">Total Biaya</span><strong className="text-green-600 text-xl">Benefit VO (Gratis)</strong></div>
                                    ) : paymentMethod === 'credit' ? (
                                        <><div className="flex justify-between items-center"><span className="text-gray-600">Biaya Kredit</span><strong className="text-blue-600 text-xl">{creditCost * (countedDays > 0 ? countedDays : 1)} Kredit</strong></div>{!hasEnoughCredit && duration > 0 && (<Alert message="Kredit tidak mencukupi!" type="warning" showIcon />)}</>
                                    ) : (
                                        <div className="flex justify-between items-center"><span className="text-gray-600">Total Harga</span><strong className="text-blue-600 text-xl">{formatRupiah(totalPrice)}</strong></div>
                                    )}
                                </div>

                                {/* Tombol Lanjutkan */}
                                <button
                                    onClick={() =>
                                        navigate(`/payment/${room.id_ruangan}`, {
                                            state: {
                                                room,
                                                selectedRange,
                                                selectedStartTime,
                                                selectedEndTime,
                                                duration,
                                                purpose,
                                                total: totalPrice,
                                                paymentMethod: paymentMethod,
                                                creditCost: creditCost,
                                                membershipId: userMembership?.id_memberships,
                                                virtualOfficeId: virtualOfficeClient?.id_client_vo,
                                                includeSaturday,
                                                includeSunday,
                                                countedDays: (countedDays > 0 ? countedDays : 1)
                                            },
                                        })
                                    }
                                    disabled={isButtonDisabled}
                                    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold transition hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {paymentMethod === 'credit' ? 'Konfirmasi dengan Kredit' : paymentMethod === 'virtual_office' ? 'Konfirmasi dengan Benefit VO' : 'Lanjutkan ke Pembayaran'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetail;