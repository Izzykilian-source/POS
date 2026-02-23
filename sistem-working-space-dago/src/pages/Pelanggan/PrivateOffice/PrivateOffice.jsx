import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DatePicker,
    TimePicker,
    InputNumber,
    Button,
    message,
    Spin,
    Alert,
    Modal,
    Input,
    Select,
    Tag,
    List,
    Card,
    Typography,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { jwtStorage } from "../../../utils/jwtStorage";
import { formatRupiah } from "../../../utils/formatRupiah";
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    SearchOutlined,
    ExclamationCircleOutlined,
    BankOutlined,
} from "@ant-design/icons";

import {
    getUserProfile,
    getPrivateOfficeRooms,
    createBulkBooking,
    checkBulkAvailability,
} from "../../../services/service";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;
const baseUrl = import.meta.env.VITE_BASE_URL || "";

const qrisImgSrc = "/static/qris-barcode.png";

const PrivateOffice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    // ✅ State untuk kontrol buka/tutup kalender
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // ✅ Fungsi auto close setelah pilih rentang lengkap
    const onRangeCalendarChange = (dates) => {
        setSelectedDateRange(dates);
        if (dates && dates[0] && dates[1]) {
            setTimeout(() => setIsCalendarOpen(false), 200);
        }
    };

    const [selectedTimeRange, setSelectedTimeRange] = useState(null);

    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        metode: "qris",
    });
    const [selectedCategoriesForModal, setSelectedCategoriesForModal] = useState(
        []
    );
    const [loggedInUser, setLoggedInUser] = useState(null);

    // --- NEW STATES FOR AVAILABILITY CHECK ---
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityResult, setAvailabilityResult] = useState(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [lastCheckParams, setLastCheckParams] = useState(null);

    // === NEW: include weekends state ===
    const [includeWeekends, setIncludeWeekends] = useState({
        saturday: false,
        sunday: false,
    });

    // === NEW: isMobile state to avoid ReferenceError and make range pickers responsive ===
    const [isMobile, setIsMobile] = useState(() => {
        // initial safe check (works in SSR-ish envs where window may be undefined)
        try {
            return window.innerWidth <= 768;
        } catch (e) {
            return false;
        }
    });
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // --- FUNCTION TO LOAD INITIAL DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const userData = await getUserProfile();
                if (userData.data) {
                    setLoggedInUser(userData.data);
                } else {
                    throw new Error("Gagal memuat data pengguna.");
                }

                const roomData = await getPrivateOfficeRooms();
                setRooms(roomData || []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "Gagal memuat data. Silakan coba lagi.");
                if (err.message.includes("Token") || err.message.includes("Sesi")) {
                    message.error("Sesi Anda habis, silakan login kembali.");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // Reset availability check result if parameters change (now also when includeWeekends changes)
    useEffect(() => {
        setAvailabilityResult(null);
        setLastCheckParams(null);
    }, [selectedDateRange, selectedTimeRange, quantities, includeWeekends]);

    const groupByCategory = (list) => {
        return list.reduce((acc, item) => {
            const kategori = item.nama_kategori || "Lainnya";
            if (!acc[kategori]) acc[kategori] = [];
            acc[kategori].push(item);
            return acc;
        }, {});
    };

    const groupedRooms = groupByCategory(rooms);

    const disabledDate = (current) => current && current < dayjs().startOf("day");

    const handleQuantityChange = (category, value) => {
        const availableUnits = groupedRooms[category]?.length ?? 0;
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            setQuantities((prev) => ({ ...prev, [category]: 0 }));
            return;
        }
        const newValue = Math.max(0, Math.min(numericValue, availableUnits));
        setQuantities((prev) => ({ ...prev, [category]: newValue }));
    };

    const isAnyCategorySelected = Object.keys(quantities).some(
        (k) => quantities[k] > 0
    );

    // === NEW: helper to get active dates taking includeWeekends into account ===
    const getActiveDates = (startDayjs, endDayjs) => {
        if (!startDayjs || !endDayjs) return [];
        const dates = [];
        let cur = startDayjs.startOf("day");
        const last = endDayjs.startOf("day");
        while (cur.isBefore(last) || cur.isSame(last, "day")) {
            const dow = cur.day(); // 0 = Sunday, 6 = Saturday
            const isSat = dow === 6;
            const isSun = dow === 0;
            if (
                (!isSat || includeWeekends.saturday) &&
                (!isSun || includeWeekends.sunday)
            ) {
                dates.push(cur.clone());
            }
            cur = cur.add(1, "day");
        }
        return dates;
    };

    // --- FUNCTION TO HANDLE AVAILABILITY CHECK ---
    const handleCheckAvailability = async () => {
        // Basic input validation
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning(
                "Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid."
            );
        }
        // Validate time range is within bounds (8 to 22)
        const startHour =
            selectedTimeRange && selectedTimeRange[0]
                ? selectedTimeRange[0].hour()
                : undefined;
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error(
                "Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai."
            );
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning(
                "Pilih minimal satu unit ruangan untuk dicek ketersediaannya."
            );
        }

        // Collect room IDs to check
        const roomIdsToCheck = [];
        let validationError = false;
        selectedCats.forEach((cat) => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToCheck = quantities[cat];
            if (numToCheck > availableRoomsInCategory.length || numToCheck <= 0) {
                message.error(`Jumlah unit ${cat} (${numToCheck}) tidak valid.`);
                validationError = true;
                return;
            }
            const ids = availableRoomsInCategory
                .slice(0, numToCheck)
                .map((room) => room.id_ruangan);
            roomIdsToCheck.push(...ids);
        });

        if (validationError || roomIdsToCheck.length === 0) return;

        // Prepare payload for the check (unchanged)
        const payload = {
            room_ids: roomIdsToCheck,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
        };

        try {
            setCheckingAvailability(true);
            setAvailabilityResult(null);
            setLastCheckParams(null);

            const result = await checkBulkAvailability(payload);

            setAvailabilityResult(result);
            if (result.available) {
                setLastCheckParams(payload);
            }
            setShowAvailabilityModal(true);
        } catch (error) {
            console.error("Error checking availability:", error);
            message.error(`Gagal memeriksa ketersediaan: ${error.message}`);
            setAvailabilityResult({
                available: false,
                unavailable_slots: [],
                error: error.message,
            });
            setShowAvailabilityModal(true);
        } finally {
            setCheckingAvailability(false);
        }
    };
    // --- END AVAILABILITY CHECK FUNCTION ---

    // --- MODIFIED: Open Order/Payment Modal ---
    const openOrderModal = () => {
        // 1. Basic Validations (Date, Time, Quantity)
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning(
                "Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid."
            );
        }
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error(
                "Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai."
            );
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }
        let validationPassed = true;
        selectedCats.forEach((cat) => {
            const requestedQuantity = quantities[cat];
            const availableQuantity = groupedRooms[cat]?.length ?? 0;
            if (requestedQuantity > availableQuantity || requestedQuantity <= 0) {
                message.error(`Jumlah unit ${cat} (${requestedQuantity}) tidak valid.`);
                validationPassed = false;
            }
        });
        if (!validationPassed) return;

        // 2. AVAILABILITY CHECK VALIDATION
        if (!availabilityResult || !availabilityResult.available) {
            message.warning(
                "Silakan cek ketersediaan terlebih dahulu dan pastikan semua slot tersedia."
            );
            return;
        }

        // 3. PARAMETER CONSISTENCY CHECK
        const currentParams = {
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
        };

        if (
            !lastCheckParams ||
            lastCheckParams.tanggal_mulai !== currentParams.tanggal_mulai ||
            lastCheckParams.tanggal_selesai !== currentParams.tanggal_selesai ||
            lastCheckParams.jam_mulai !== currentParams.jam_mulai ||
            lastCheckParams.jam_selesai !== currentParams.jam_selesai
        ) {
            message.warning(
                "Parameter tanggal/waktu/ruangan berubah sejak cek terakhir. Silakan cek ulang ketersediaan."
            );
            setAvailabilityResult(null);
            setLastCheckParams(null);
            return;
        }

        setSelectedCategoriesForModal(selectedCats);
        setIsModalOpen(true);
    };
    // --- END MODIFIED openOrderModal ---

    const handleFinalSubmit = async () => {
        // --- 1. VALIDASI INPUT (TIDAK BERUBAH) ---
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning("Rentang tanggal atau waktu tidak valid.");
        }
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error("Waktu sewa tidak valid (08:00 - 22:00).");
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        // Collect room IDs
        const roomIdsToBook = [];
        let validationError = false;
        selectedCats.forEach((cat) => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToBook = quantities[cat];
            if (numToBook > availableRoomsInCategory.length || numToBook <= 0) {
                message.error(`Jumlah unit ${cat} (${numToBook}) tidak valid.`);
                validationError = true;
                return;
            }
            const ids = availableRoomsInCategory
                .slice(0, numToBook)
                .map((room) => room.id_ruangan);
            roomIdsToBook.push(...ids);
        });
        if (validationError || roomIdsToBook.length === 0) return;

        // --- 2. PERSIAPAN PAYLOAD (DIPERBARUI) ---
        const payload = {
            id_user: loggedInUser?.id_user,
            room_ids: roomIdsToBook,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
            metode_pembayaran: "Non-Tunai",
            // HAPUS 'status_pembayaran: "Lunas"' agar Backend set default ke 'Belum Lunas'
            include_saturday: includeWeekends.saturday,
            include_sunday: includeWeekends.sunday,
        };

        console.log("Mengirim Payload Booking:", JSON.stringify(payload, null, 2));

        try {
            setSubmitLoading(true);
            
            // --- 3. KIRIM REQUEST KE BACKEND ---
            const response = await createBulkBooking(payload);

            // --- 4. HANDLING RESPONSE & REDIRECT IPAYMU ---
            if (response.status === 201) {
                const { payment_url, message: msg } = response.data;

                if (payment_url) {
                    // KASUS A: Ada Link Pembayaran (Normal Flow)
                    message.loading("Mengalihkan ke halaman pembayaran...", 2.5);
                    
                    // Beri jeda sebentar agar user membaca pesan
                    setTimeout(() => {
                        window.location.href = payment_url;
                    }, 1000);

                } else {
                    // KASUS B: Tidak ada link (Fallback / Gratis)
                    message.success(msg || "Pesanan berhasil dibuat!");
                    navigate("/riwayat-transaksi");
                }
                
                // Reset State UI
                setIsModalOpen(false);
                setQuantities({});
                setSelectedDateRange(null);
                setSelectedTimeRange([
                    dayjs().hour(8).minute(0),
                    dayjs().hour(17).minute(0),
                ]);
                setAvailabilityResult(null);
                setLastCheckParams(null);

            } else {
                // KASUS C: Error Logis dari Backend (bukan network error)
                message.error(
                    response.data.error ||
                    response.data.message ||
                    "Gagal membuat pesanan."
                );
            }
        } catch (error) {
            console.error("Error creating bulk booking:", error);
            const errMsg =
                error.response?.data?.error || error.message || "Terjadi kesalahan";
            
            // Handle Conflict (409) khusus
            if (error.response?.status === 409) {
                message.error(
                    `Gagal: ${errMsg}. Slot mungkin baru saja terisi. Cek ulang ketersediaan.`
                );
                setAvailabilityResult(null);
                setLastCheckParams(null);
                setIsModalOpen(false);
            } else {
                message.error("Gagal mengirim pesanan: " + errMsg);
            }
        } finally {
            setSubmitLoading(false);
        }
    };
    // --- FUNCTION TO DISABLE HOURS in TimePicker ---
    const disabledRangeTime = (_, type) => {
        const disabledHours = () => {
            const hours = [];
            for (let i = 0; i < 8; i++) {
                hours.push(i);
            }
            for (let i = 23; i < 24; i++) {
                hours.push(i);
            }

            if (type === "start" && selectedTimeRange?.[1]) {
                for (let i = selectedTimeRange[1].hour(); i <= 23; i++) {
                    if (!hours.includes(i)) hours.push(i);
                }
            } else if (type === "end" && selectedTimeRange?.[0]) {
                for (let i = 0; i <= selectedTimeRange[0].hour(); i++) {
                    if (!hours.includes(i)) hours.push(i);
                }
                if (selectedTimeRange[0].hour() === 22 && !hours.includes(22)) {
                    hours.push(22);
                }
            }

            return hours;
        };

        const disabledMinutes = (selectedHour) => {
            if (selectedHour !== undefined) {
                return Array.from({ length: 59 }, (_, i) => i + 1);
            }
            return [];
        };

        return {
            disabledHours,
            disabledMinutes,
        };
    };
    // --- END FUNCTION TO DISABLE HOURS ---

    // --- dateRender for RangePicker to show "Sabtu"/"Minggu" in small grey text ---
    const dateRender = (current) => {
        const dow = current.day();
        const isSat = dow === 6;
        const isSun = dow === 0;
        const label = isSat ? "Sabtu" : isSun ? "Minggu" : null;

        return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <div style={{ textAlign: "center" }}>
                    <div>{current.date()}</div>
                    {label && (
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                            {label}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Memuat data..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-xl mx-auto">
                <Alert type="error" message={error} showIcon />
            </div>
        );
    }

    // --- Helper to compute estimated total price for modal (frontend-only) ---
    const computeEstimatedTotal = () => {
        if (!selectedDateRange || !selectedTimeRange)
            return { totalDays: 0, totalPrice: 0 };

        const activeDates = getActiveDates(
            selectedDateRange[0],
            selectedDateRange[1]
        );
        const totalDays = activeDates.length;
        if (totalDays === 0) return { totalDays: 0, totalPrice: 0 };

        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        const hoursPerDay = Math.max(0, endHour - startHour);

        let grandTotal = 0;

        // For each selected category, estimate price
        const cats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        cats.forEach((cat) => {
            const qty = quantities[cat] || 0;
            const roomsInCat = groupedRooms[cat] || [];
            if (roomsInCat.length === 0 || qty === 0) return;

            const room = roomsInCat[0];
            // If paket_harga exists, choose the minimum paket by harga_paket
            if (room.paket_harga && room.paket_harga.length > 0) {
                const minPackage = room.paket_harga.reduce(
                    (min, p) => (p.harga_paket < min.harga_paket ? p : min),
                    room.paket_harga[0]
                );
                const paketHours = minPackage.durasi_jam || 1;
                // number of packages needed per day (ceil)
                const packagesPerDay = Math.ceil(hoursPerDay / paketHours) || 1;
                const pricePerUnitPerDay = minPackage.harga_paket * packagesPerDay;
                const totalForCat = pricePerUnitPerDay * qty * totalDays;
                grandTotal += totalForCat;
            } else {
                // fallback to harga_per_jam
                const pricePerHour = room.harga_per_jam || 0;
                const pricePerUnitPerDay = pricePerHour * hoursPerDay;
                const totalForCat = pricePerUnitPerDay * qty * totalDays;
                grandTotal += totalForCat;
            }
        });

        return { totalDays, totalPrice: grandTotal };
    };

    const { totalDays, totalPrice } = computeEstimatedTotal();
    // ... state dan useEffect lainnya ...

    // ✅ FUNGSI BARU: Logika untuk menonaktifkan tanggal
    const dynamicDisabledDate = (current, rangeType = null) => {
        // 1. Selalu nonaktifkan tanggal lampau
        if (current && current < dayjs().startOf("day")) {
            return true;
        }

        // 2. Logika untuk menonaktifkan Sabtu/Minggu
        const day = current.day(); // 0 = Minggu, 6 = Sabtu
        if (day === 6 && !includeWeekends.saturday) {
            return true;
        }
        if (day === 0 && !includeWeekends.sunday) {
            return true;
        }

        // 3. Logika tambahan untuk picker individual (mode Mobile)
        if (rangeType === 'start' && selectedDateRange?.[1]) {
            // Nonaktifkan jika melebihi tanggal selesai
            return current > selectedDateRange[1].endOf("day");
        }
        if (rangeType === 'end' && selectedDateRange?.[0]) {
            // Nonaktifkan jika sebelum tanggal mulai
            return current < selectedDateRange[0].startOf("day");
        }

        return false;
    };

    // ✅ FUNGSI BARU: Untuk merender checkbox di dalam kalender
    const renderCalendarFooter = () => (
        <div className="flex flex-col sm:flex-row justify-start gap-4 px-4 py-3 border-t border-gray-100">
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                    type="checkbox"
                    checked={includeWeekends.saturday}
                    onChange={(e) =>
                        setIncludeWeekends((prev) => ({
                            ...prev,
                            saturday: e.target.checked,
                        }))
                    }
                    className="form-checkbox"
                />
                Sertakan Sabtu
            </label>
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                    type="checkbox"
                    checked={includeWeekends.sunday}
                    onChange={(e) =>
                        setIncludeWeekends((prev) => ({
                            ...prev,
                            sunday: e.target.checked,
                        }))
                    }
                    className="form-checkbox"
                />
                Sertakan Minggu
            </label>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-4">Pemesanan Ruang Kerja Tim</h2>
            <p className="text-gray-600 mb-8">
                Sewa beberapa unit ruang kerja sekaligus untuk tim Anda. Pilih tanggal,
                waktu (08:00 - 22:00), dan jumlah unit per kategori.
            </p>

            {/* === RESPONSIVE: Date and Time Section === */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm mb-10">
                <h2 className="text-xl sm:text-2xl font-bold mb-6">
                    Detail Waktu Sewa
                </h2>

                <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                    {/* === Kolom Kalender === */}
                    <div className="flex-1 w-full">
                        <label className="text-gray-700 mb-2 font-semibold flex items-center">
                            <CalendarOutlined className="mr-2" />
                            <span>
                                Tanggal Sewa <span className="text-red-500">*</span>
                            </span>
                        </label>

                        {/* === Date Picker Responsive === */}
                        {isMobile ? (
                            // MOBILE MODE: tampil vertikal (dua DatePicker)
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1 font-medium">
                                        Tanggal Mulai
                                    </label>
                                    <DatePicker
                                        className="w-full"
                                        format="DD MMM YYYY"
                                        // disabledDate={(current) => {
                                        //     // Tidak boleh tanggal lampau
                                        //     if (current && current < dayjs().startOf("day"))
                                        //         return true;
                                        //     // Jika tanggal selesai sudah dipilih, batasi agar tidak melewati tanggal selesai
                                        //     if (selectedDateRange?.[1]) {
                                        //         return current > selectedDateRange[1].endOf("day");
                                        //     }
                                        //     return false;
                                        // }}
                                        renderExtraFooter={renderCalendarFooter}
                                        disabledDate={(current) => dynamicDisabledDate(current, 'start')}
                                        value={selectedDateRange?.[0] || null}
                                        onChange={(date) =>
                                            setSelectedDateRange([
                                                date,
                                                selectedDateRange?.[1] || null,
                                            ])
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1 font-medium">
                                        Tanggal Selesai
                                    </label>
                                    <DatePicker
                                        className="w-full"
                                        format="DD MMM YYYY"
                                        // disabledDate={(current) => {
                                        //     if (current && current < dayjs().startOf("day"))
                                        //         return true;
                                        //     // Tidak boleh sebelum tanggal mulai
                                        //     if (selectedDateRange?.[0]) {
                                        //         return current < selectedDateRange[0].startOf("day");
                                        //     }
                                        //     return false;
                                        // }}
                                        renderExtraFooter={renderCalendarFooter}
                                        disabledDate={(current) => dynamicDisabledDate(current, 'end')}
                                        value={selectedDateRange?.[1] || null}
                                        onChange={(date) =>
                                            setSelectedDateRange([
                                                selectedDateRange?.[0] || null,
                                                date,
                                            ])
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            // DESKTOP MODE: tetap pakai RangePicker horizontal
                            <RangePicker
                                className="w-full text-sm sm:text-base"
                                format="DD MMM YYYY"
                                value={selectedDateRange}
                                open={isCalendarOpen}
                                onOpenChange={(open) => setIsCalendarOpen(open)}
                                onChange={(dates) => { setSelectedDateRange(dates); }}
                                // disabledDate={(current) =>
                                //     current && current < dayjs().startOf("day")
                                // }
                                renderExtraFooter={renderCalendarFooter}
                                disabledDate={dynamicDisabledDate}
                            />
                        )}

                        {/* <div className="mt-3 flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeWeekends.saturday}
                                    onChange={(e) =>
                                        setIncludeWeekends((prev) => ({
                                            ...prev,
                                            saturday: e.target.checked,
                                        }))
                                    }
                                />
                                Sertakan Sabtu
                            </label>
                            <label className="flex items-center gap-2 text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeWeekends.sunday}
                                    onChange={(e) =>
                                        setIncludeWeekends((prev) => ({
                                            ...prev,
                                            sunday: e.target.checked,
                                        }))
                                    }
                                />
                                Sertakan Minggu
                            </label>
                        </div> */}
                    </div>

                    {/* Kolom TimePicker */}
                    <div className="flex-1 w-full">
                        <label className="text-gray-700 mb-2 font-semibold flex items-center">
                            <ClockCircleOutlined className="mr-2" />
                            Waktu Sewa (08:00 - 22:00) <span className="text-red-500">*</span>
                        </label>

                        <TimePicker.RangePicker
                            className="w-full"
                            format="HH:00"
                            minuteStep={60}
                            hourStep={1}
                            hideDisabledOptions={false}
                            showNow={false}
                            value={selectedTimeRange}
                            placeholder={["Pilih Jam Mulai", "Pilih Jam Selesai"]}
                            disabledTime={(_, type) => {
                                const hours = Array.from({ length: 24 }, (_, i) => i);
                                const startHour = selectedTimeRange?.[0]?.hour();

                                if (type === "start") {
                                    return {
                                        disabledHours: () => hours.filter((h) => h < 8 || h >= 22),
                                    };
                                }

                                if (type === "end") {
                                    return {
                                        disabledHours: () => {
                                            if (startHour === undefined) {
                                                return hours.filter((h) => h <= 8 || h > 22);
                                            }
                                            return hours.filter((h) => h <= startHour || h > 22);
                                        },
                                    };
                                }

                                return {};
                            }}
                            onChange={(times) => {
                                if (!times) {
                                    setSelectedTimeRange(times);
                                    return;
                                }

                                const [start, end] = times;

                                // Kalau jam selesai belum dipilih
                                if (!start || !end) {
                                    setSelectedTimeRange(times);
                                    return;
                                }

                                // ✅ Benerin otomatis kalau jam selesai <= jam mulai
                                if (!end.isAfter(start)) {
                                    const corrected = [start, dayjs(start).add(1, "hour")];
                                    setSelectedTimeRange(corrected);
                                    message.warning(
                                        "Jam selesai minimal 1 jam setelah jam mulai."
                                    );
                                    return;
                                }

                                setSelectedTimeRange(times);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Room Selection Section */}
            <h2 className="text-2xl font-bold mb-6">Pilih Unit Ruangan</h2>
            <div className="grid grid-cols-1 gap-6 mb-8">
                {Object.keys(groupedRooms).length === 0 && !loading && (
                    <Alert
                        message="Tidak ada kategori ruangan yang tersedia saat ini."
                        type="info"
                        showIcon
                    />
                )}
                {Object.keys(groupedRooms).map((category) => {
                    const categoryRooms = groupedRooms[category];
                    if (!categoryRooms || categoryRooms.length === 0) return null;
                    const room = categoryRooms[0];
                    let displayPrice = room?.harga_per_jam ?? 0;
                    let priceLabel = "per Jam";
                    if (room.paket_harga && room.paket_harga.length > 0) {
                        const minPackage = room.paket_harga.reduce(
                            (min, p) => (p.harga_paket < min.harga_paket ? p : min),
                            room.paket_harga[0]
                        );
                        displayPrice = minPackage.harga_paket;
                        priceLabel = `/ ${minPackage.durasi_jam} Jam`;
                    } else if (displayPrice <= 0) {
                        priceLabel = "";
                    }

                    const features = room?.fitur_ruangan
                        ? room.fitur_ruangan
                            .split(/[\r\n]+/)
                            .map((f) => f.trim())
                            .filter((f) => f)
                        : [];
                    const availableUnits = categoryRooms.length;

                    return (
                        <div
                            key={category}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-stretch gap-4 relative ${availableUnits === 0 ? "opacity-50 pointer-events-none" : ""
                                }`}
                        >
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img
                                    src={`${baseUrl}/static/${room?.gambar_ruangan}`}
                                    alt={category}
                                    className="w-full h-56 object-cover rounded-lg bg-gray-200"
                                    onError={(e) => {
                                        e.target.src =
                                            "https://placehold.co/600x400/EEE/31343C?text=No+Image";
                                    }}
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                        <h3 className="text-xl font-semibold">{category}</h3>
                                        {displayPrice > 0 && priceLabel && (
                                            <div>
                                                <span className="text-sm text-gray-600 mr-1">
                                                    Mulai:
                                                </span>
                                                <Tag
                                                    color="blue"
                                                    className="font-semibold text-sm py-1 px-3"
                                                >
                                                    {formatRupiah(displayPrice)} {priceLabel}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center gap-3 mb-3">
                                        <UserOutlined />
                                        <span>
                                            Kapasitas: {room?.kapasitas || "N/A"} org/unit | Tersedia:{" "}
                                            <strong
                                                className={
                                                    availableUnits > 0 ? "text-green-600" : "text-red-600"
                                                }
                                            >
                                                {availableUnits} unit
                                            </strong>
                                        </span>
                                    </div>
                                    {features.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3 text-sm text-gray-700 mb-3">
                                            {features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircleOutlined
                                                        style={{ color: "#1890ff", fontSize: "20px" }}
                                                    />
                                                    <span className="truncate" title={f}>
                                                        {f}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                                    <label className="block text-gray-700 font-semibold mr-2">
                                        Jumlah Unit <span className="text-red-500">*</span>:
                                    </label>
                                    <InputNumber
                                        min={0}
                                        max={availableUnits}
                                        value={quantities[category] || 0}
                                        onChange={(val) => handleQuantityChange(category, val)}
                                        disabled={availableUnits === 0}
                                        controls={true}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Check Availability Button */}
            <div className="my-6">
                <Button
                    type="default"
                    icon={<SearchOutlined />}
                    size="large"
                    className="w-full"
                    onClick={handleCheckAvailability}
                    loading={checkingAvailability}
                    disabled={
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedDateRange[0] ||
                        !selectedTimeRange ||
                        !selectedTimeRange[0] ||
                        checkingAvailability ||
                        submitLoading
                    }
                >
                    Cek Ketersediaan Slot
                </Button>
                {availabilityResult && !checkingAvailability && (
                    <Alert
                        message={
                            availabilityResult.error
                                ? "Gagal Memeriksa"
                                : availabilityResult.available
                                    ? "Semua slot yang dipilih tersedia!"
                                    : "Beberapa slot tidak tersedia."
                        }
                        description={
                            availabilityResult.error ? availabilityResult.error : null
                        }
                        type={
                            availabilityResult.error
                                ? "error"
                                : availabilityResult.available
                                    ? "success"
                                    : "warning"
                        }
                        showIcon
                        style={{ marginTop: "10px" }}
                        action={
                            !availabilityResult.error && (
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => setShowAvailabilityModal(true)}
                                >
                                    Lihat Detail
                                </Button>
                            )
                        }
                    />
                )}
            </div>

            {/* Proceed to Confirmation Button */}
            <div className="mt-8 mb-10">
                <Button
                    type="primary"
                    size="large"
                    className="w-full"
                    onClick={openOrderModal}
                    disabled={
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedDateRange[0] ||
                        !selectedTimeRange ||
                        !selectedTimeRange[0] ||
                        submitLoading ||
                        checkingAvailability ||
                        !availabilityResult?.available ||
                        !lastCheckParams
                    }
                    loading={submitLoading}
                >
                    Lanjut ke Konfirmasi Pesanan
                </Button>
            </div>

            {/* Payment Confirmation Modal */}
            {/* Payment Confirmation Modal (Disederhanakan) */}
            <Modal
                title="Konfirmasi Pesanan"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={600}
                bodyStyle={{ padding: 24 }}
                maskClosable={!submitLoading}
            >
                <Spin spinning={submitLoading} tip="Menghubungkan ke iPaymu...">
                    <div className="space-y-4">
                        
                        {/* Hapus bagian Image QRIS di sini */}
                        
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm mb-4">
                            <p>
                                Anda akan memesan <strong>{Object.values(quantities).reduce((a,b)=>a+b,0)} unit</strong> ruangan 
                                selama <strong>{totalDays} hari</strong>.
                            </p>
                            <p className="mt-2 font-semibold">
                                Total Estimasi: {totalPrice > 0 ? formatRupiah(totalPrice) : "-"}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                                Klik tombol di bawah untuk diarahkan ke halaman pembayaran aman.
                            </p>
                        </div>

                        {/* Order Summary (Tetap pertahankan agar user bisa review) */}
                        <div className="border-t pt-3 text-sm text-gray-700">
                            {/* ... Tampilkan detail tanggal/jam seperti sebelumnya ... */}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                                Batal
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFinalSubmit}
                                loading={submitLoading}
                                icon={<BankOutlined />}
                            >
                                Bayar Sekarang
                            </Button>
                        </div>
                    </div>
                </Spin>
            </Modal>
            {/* Availability Check Results Modal */}
            <Modal
                title="Hasil Pengecekan Ketersediaan"
                open={showAvailabilityModal}
                onCancel={() => setShowAvailabilityModal(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setShowAvailabilityModal(false)}
                    >
                        Tutup
                    </Button>,
                ]}
                width={600}
                centered
            >
                {checkingAvailability && (
                    <div className="text-center p-10">
                        <Spin tip="Memeriksa..." />
                    </div>
                )}

                {!checkingAvailability && availabilityResult && (
                    <div>
                        {availabilityResult.error ? (
                            <Alert
                                message="Gagal Memeriksa Ketersediaan"
                                description={availabilityResult.error || "Terjadi kesalahan."}
                                type="error"
                                showIcon
                                icon={<ExclamationCircleOutlined />}
                            />
                        ) : (
                            <>
                                {availabilityResult.available ? (
                                    <Alert
                                        message="Semua Slot Tersedia"
                                        description="Semua unit yang Anda pilih tersedia."
                                        type="success"
                                        showIcon
                                        icon={<CheckCircleOutlined />}
                                        style={{ marginBottom: "16px" }}
                                    />
                                ) : (
                                    <Alert
                                        message="Beberapa Slot Tidak Tersedia"
                                        description="Silakan ubah tanggal, waktu, atau jumlah unit."
                                        type="error"
                                        showIcon
                                        icon={<ExclamationCircleOutlined />}
                                        style={{ marginBottom: "16px" }}
                                    />
                                )}

                                {/* === Bagian Sesuai Pesanan === */}
                                {availabilityResult.bookings && (
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: "#fafafa",
                                            borderRadius: "8px",
                                            marginTop: "12px",
                                        }}
                                    >
                                        <Typography.Title level={5}>
                                            Sesuai Pesanan:
                                        </Typography.Title>

                                        <List
                                            size="small"
                                            dataSource={availabilityResult.bookings}
                                            renderItem={(item, index) => (
                                                <List.Item
                                                    style={{
                                                        padding: "10px 0",
                                                        borderBottom:
                                                            index === availabilityResult.bookings.length - 1
                                                                ? "none"
                                                                : "1px solid #f0f0f0",
                                                    }}
                                                >
                                                    <div>
                                                        <Typography.Text strong>
                                                            {item.nama_ruangan} : {item.jumlah_unit} unit
                                                        </Typography.Text>
                                                        <br />
                                                        <Typography.Text type="secondary">
                                                            <CalendarOutlined
                                                                style={{ marginRight: "6px" }}
                                                            />
                                                            {dayjs(item.tanggal_mulai).format(
                                                                "DD MMM YYYY, HH:mm"
                                                            )}{" "}
                                                            - {dayjs(item.tanggal_selesai).format("HH:mm")}
                                                        </Typography.Text>
                                                    </div>
                                                </List.Item>
                                            )}
                                        />
                                    </Card>
                                )}

                                {/* === Jika Ada Slot Tidak Tersedia === */}
                                {!availabilityResult.available &&
                                    availabilityResult.unavailable_slots?.length > 0 && (
                                        <div style={{ marginTop: "16px" }}>
                                            <Typography.Text strong>
                                                Detail Slot Tidak Tersedia:
                                            </Typography.Text>
                                            <List
                                                size="small"
                                                bordered
                                                dataSource={availabilityResult.unavailable_slots}
                                                renderItem={(item) => (
                                                    <List.Item>
                                                        <List.Item.Meta
                                                            title={item.nama_ruangan}
                                                            description={`Pada ${dayjs(item.tanggal).format(
                                                                "DD MMM YYYY"
                                                            )}, Jam ${item.jam_mulai}:00 - ${item.jam_selesai
                                                                }:00`}
                                                        />
                                                    </List.Item>
                                                )}
                                                style={{ maxHeight: "200px", overflowY: "auto" }}
                                            />
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PrivateOffice;
