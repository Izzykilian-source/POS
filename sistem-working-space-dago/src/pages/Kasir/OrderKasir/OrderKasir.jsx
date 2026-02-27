/* eslint-disable no-unused-vars */
// src/pages/Kasir/OrderKasir/OrderKasir.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Button,
    Input,
    Select,
    Tag,
    Modal,
    Form,
    InputNumber,
    Radio,
    message,
    Dropdown,
    Menu,
    Spin,
    Divider,
    ConfigProvider,
    Space
} from "antd";
import {
    SearchOutlined,
    PlusOutlined,
    MinusOutlined,
    CloseOutlined,
    UserOutlined,
    MoreOutlined,
    DollarOutlined,
    QrcodeOutlined,
    CheckCircleOutlined,
    PercentageOutlined,
    SaveOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../providers/AuthProvider";
import {
    getPosInitData,
    createOrderKasir,
    getRoomsToday,
    saveOrderKasir,
    getSavedOrderDetails,
    paySavedOrder,
    updateBatalStatus,
} from "../../../services/service";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";

const { Option } = Select;

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

const generateOrderNumber = () => {
    return `T${Math.floor(100000 + Math.random() * 900000)}`;
};

const OrderKasir = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // PERBAIKAN 1: Membungkus initialState dengan useMemo untuk menghilangkan warning dependensi
    const initialState = useMemo(() => location.state || {}, [location.state]);

    const { activeSession, userProfile } = useAuth();

    // --- States ---
    const [searchProductQuery, setSearchProductQuery] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState("all_merchants");
    const [selectedProductType, setSelectedProductType] = useState("all_types");
    
    const [currentOrderType, setCurrentOrderType] = useState(initialState.orderType || "dinein");
    const [currentOrderNumber, setCurrentOrderNumber] = useState(generateOrderNumber());
    const [customerName, setCustomerName] = useState(initialState.customerName || "Guest");
    const [room, setRoom] = useState(initialState.room || null);
    const [cashierName, setCashierName] = useState(userProfile?.nama_user || userProfile?.nama || "Kasir");
    const [currentDate, setCurrentDate] = useState(dayjs());
    
    const [selectedItems, setSelectedItems] = useState([]);
    
    // --- STATE DISKON BARU ---
    const [discountType, setDiscountType] = useState("percent"); // "percent" | "nominal"
    const [discountValue, setDiscountValue] = useState(0);        // Nilai input (e.g., 10 atau 50000)
    // -------------------------

    const [taxRateFnbPercentFromAPI, setTaxRateFnbPercentFromAPI] = useState(0);
    const [loadingError, setLoadingError] = useState(null);
    
    // Modals State
    const [isNewOrderModalVisible, setIsNewOrderModalVisible] = useState(false);
    const [newOrderForm] = Form.useForm();
    
    const [isCashPaymentModalVisible, setIsCashPaymentModalVisible] = useState(false);
    const [isStrukModalVisible, setIsStrukModalVisible] = useState(false);
    
    const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState(false);
    const [itemToAddNote, setItemToAddNote] = useState(null);
    const [addNoteForm] = Form.useForm();
    
    const [cashInput, setCashInput] = useState(0);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    
    const [products, setProducts] = useState([]);
    const [merchantCategories, setMerchantCategories] = useState([]);
    const [productTypeCategories, setProductTypeCategories] = useState([]);
    const [orderTypes, setOrderTypes] = useState([]);
    
    const [isLoadingInitData, setIsLoadingInitData] = useState(true);
    const [isLoading, setIsLoadingSavedOrder] = useState(false);
    
    const [isDiscountModalVisible, setIsDiscountModalVisible] = useState(false);
    const [discountForm] = Form.useForm();
    
    const [posMode, setPosMode] = useState('fnb');
    const [rooms, setRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [isBookingConfirmModalVisible, setIsBookingConfirmModalVisible] = useState(false);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBookingProcessing, setIsBookingProcessing] = useState(false);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

  const resetOrderState = useCallback(() => {
    // Reset semua state internal
    setSelectedItems([]);
    setDiscountType("percent");
    setDiscountValue(0);
    setCashInput(0);
    setCustomerName("Guest");
    setRoom(null);
    setCurrentOrderType("dinein");
    setCurrentOrderNumber(generateOrderNumber());
    setSelectedPaymentMethod(null);
    setPaymentSuccess(false);
    setEditingOrderId(null);
    setIsStrukModalVisible(false);
    setIsCashPaymentModalVisible(false);
    setIsDiscountModalVisible(false);
    setIsNewOrderModalVisible(false);
    setIsAddNoteModalVisible(false);

    // Reset Form AntD
    newOrderForm.resetFields();
    newOrderForm.setFieldsValue({
        customerName: "Guest",
        orderType: "dinein",
        room: null
    });
    
    // FIX: Navigasi balik ke dashboard sambil membuang 'state' di memori URL browser
    navigate('/transaksikasir', { replace: true, state: {} });
    
    console.log("Order state reset and history cleared.");
}, [newOrderForm, navigate]);

// --- TEMPELKAN DI BAWAH resetOrderState ---
const handleCancelAndDeleteOrder = async () => {
    // Jika hanya order baru di layar, langsung balik dashboard
    if (!editingOrderId) {
        resetOrderState();
        return;
    }

    try {
        setIsProcessing(true);
        console.log("Membatalkan Order ID:", editingOrderId);
        
        // PANGGIL FUNGSI BATAL YANG SUDAH ADA DI BACKEND MAS IZZY
        await updateBatalStatus(editingOrderId); 
        
        message.success(`Order #${editingOrderId} berhasil dibatalkan.`);
        
        // Setelah sukses dibatalkan di DB, bersihkan layar & balik dashboard
        resetOrderState(); 
        
    } catch (error) {
        console.error("Gagal membatalkan order:", error);
        message.error("Gagal membatalkan order dari server.");
    } finally {
        setIsProcessing(false);
    }
};
    // useEffect for initialState
    useEffect(() => {
        if (initialState.customerName || initialState.orderType) {
            newOrderForm.setFieldsValue({
                customerName: initialState.customerName,
                orderType: initialState.orderType,
                room: initialState.room,
            });
        }
    }, [initialState, newOrderForm]);

    // useEffect for LoadInitialData
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoadingInitData(true);
            setLoadingError(null);
            try {
                const data = await getPosInitData();
                if (isMounted) {
                    setProducts(data.products || []);
                    setMerchantCategories(data.merchantCategories || []);
                    setProductTypeCategories(data.productTypeCategories || []);
                    setOrderTypes(data.orderTypes || []);
                    
                    // --- PERBAIKAN DI SINI: GUNAKAN ?? AGAR ANGKA 0 BISA DITERIMA ---
                    // Jika data.taxRateFnbPercent adalah 0, maka 0 yang akan dipakai, BUKAN 10.
                    // 10 hanya akan dipakai jika datanya undefined/null.
                    const finalTaxRate = data.taxRateFnbPercent ?? 10;
                    setTaxRateFnbPercentFromAPI(finalTaxRate);
                    // ----------------------------------------------------------------

                    console.log("Initial POS data loaded. Tax Rate:", finalTaxRate);
                }
            } catch (error) {
                if (isMounted) {
                    const errorMsg = "Gagal memuat data POS awal.";
                    message.error(errorMsg);
                    setLoadingError(errorMsg);
                    console.error("Error loading initial POS data:", error);
                    
                    // Jika gagal terhubung ke server, set ke 0 agar lebih aman bagi pelanggan
                    setTaxRateFnbPercentFromAPI(0); 
                }
            } finally {
                if (isMounted) setIsLoadingInitData(false);
            }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    // useEffect for loading SAVED ORDER
    useEffect(() => {
        let isMounted = true;
        const savedOrderIdFromState = location.state?.savedOrderId;

        const loadSavedOrder = async (orderId) => {
            setIsLoadingSavedOrder(true);
            console.log(`Attempting to load saved order ID: ${orderId}`);
            try {
                const savedOrderData = await getSavedOrderDetails(orderId);
                console.log("Saved order data received:", savedOrderData);

                if (isMounted) {
                    setCustomerName(savedOrderData.customerName || "Guest");
                    const orderTypeFrontend = savedOrderData.orderType?.toLowerCase().replace(" ", "") || 'dinein';
                    setCurrentOrderType(orderTypeFrontend);
                    setRoom(savedOrderData.room || null);
                    setSelectedItems(savedOrderData.items || []);
                    
                    // --- LOAD LOGIC DISKON ---
                    // Prioritaskan Nominal jika ada data baru dari backend, jika tidak pakai persen
                    if (savedOrderData.discountNominal && savedOrderData.discountNominal > 0) {
                        setDiscountType("nominal");
                        setDiscountValue(savedOrderData.discountNominal);
                    } else {
                        setDiscountType("percent");
                        setDiscountValue(savedOrderData.discountPercentage || 0);
                    }
                    // -------------------------

                    setCurrentOrderNumber(savedOrderData.orderNumber || generateOrderNumber());
                    setEditingOrderId(orderId);

                    newOrderForm.setFieldsValue({
                        customerName: savedOrderData.customerName || "Guest",
                        orderType: orderTypeFrontend,
                        room: savedOrderData.room || null,
                    });

                    message.success(`Melanjutkan order #${orderId}`);

                    if (window.history.replaceState) {
                        window.history.replaceState({}, document.title)
                    }
                }
            } catch (error) {
                if (isMounted) {
                    message.error(`Gagal memuat order tersimpan #${orderId}: ${error.message}`);
                    console.error("Error loading saved order:", error);
                    setEditingOrderId(null);
                    resetOrderState();
                }
            } finally {
                if (isMounted) setIsLoadingSavedOrder(false);
            }
        };

        if (savedOrderIdFromState && !isLoadingInitData) {
            if (!editingOrderId || editingOrderId !== savedOrderIdFromState) {
                loadSavedOrder(savedOrderIdFromState);
            }
        }

        return () => { isMounted = false; };

    }, [
        location.state?.savedOrderId,
        isLoadingInitData,
        editingOrderId,
        newOrderForm,
        resetOrderState // Menambahkan referensi resetOrderState agar stabil
    ]);

    // useEffect for loading room data
    useEffect(() => {
        const loadRoomData = async () => {
            try {
                setIsLoadingRooms(true);
                const roomData = await getRoomsToday();
                setRooms(roomData || []);
            } catch (error) {
                message.error("Gagal memuat data ruangan.");
            } finally {
                setIsLoadingRooms(false);
            }
        };
        if (posMode === 'ruangan') {
            loadRoomData();
        }
    }, [posMode]);

    // useMemo and other useEffects for filtering
    const availableProductTypes = useMemo(() => {
        if (selectedMerchant === "all_merchants") {
            return productTypeCategories;
        }
        const merchantProducts = products.filter(p => p.merchantId === selectedMerchant);
        const uniqueCategoryIds = [...new Set(merchantProducts.map(p => p.category))];
        return productTypeCategories.filter(cat =>
            cat.id === "all_types" || uniqueCategoryIds.includes(cat.id)
        );
    }, [selectedMerchant, products, productTypeCategories]);

    useEffect(() => {
        if (selectedMerchant !== "all_merchants" && selectedProductType !== "all_types") {
            const isCurrentTypeAvailable = availableProductTypes.some(
                cat => cat.id === selectedProductType
            );
            if (!isCurrentTypeAvailable) {
                setSelectedProductType("all_types");
            }
        }
    }, [selectedMerchant, availableProductTypes, selectedProductType]);


    // --- LOGIKA KALKULASI (DIPERBARUI UNTUK NOMINAL/PERSEN) ---
    const subtotalFnb = useMemo(() =>
        selectedItems
            .filter(item => item.type === 'fnb')
            .reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.qty) || 0), 0),
        [selectedItems]
    );

    const subtotalRoom = useMemo(() =>
        selectedItems
            .filter(item => item.type === 'room')
            .reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.qty) || 0), 0),
        [selectedItems]
    );

    const subtotal = useMemo(() => subtotalFnb + subtotalRoom, [subtotalFnb, subtotalRoom]);

    // Kalkulasi Diskon (Nominal Absolute)
    const totalDiscountNominal = useMemo(() => {
        if (subtotal === 0) return 0;
        if (discountType === "nominal") {
            // Pastikan nominal tidak lebih besar dari subtotal
            return Math.min(discountValue, subtotal);
        } else {
            // Persentase
            return subtotal * (discountValue / 100);
        }
    }, [subtotal, discountType, discountValue]);

    // Hitung Persentase Efektif (untuk dikirim ke backend jika perlu, atau untuk display)
    const effectiveDiscountPercentage = useMemo(() => {
        if (subtotal === 0 || totalDiscountNominal === 0) return 0;
        return (totalDiscountNominal / subtotal) * 100;
    }, [subtotal, totalDiscountNominal]);

    const fnbTaxableAmount = useMemo(() => {
        if (subtotal === 0) return 0;
        // Alokasi diskon proporsional ke F&B
        const fnbDiscountPortion = (subtotalFnb / subtotal) * totalDiscountNominal;
        const taxable = subtotalFnb - fnbDiscountPortion;
        return taxable > 0 ? taxable : 0;
    }, [subtotalFnb, subtotal, totalDiscountNominal]);

    const totalTaxNominal = useMemo(() =>
        parseFloat((fnbTaxableAmount * (taxRateFnbPercentFromAPI / 100)).toFixed(2)),
        [fnbTaxableAmount, taxRateFnbPercentFromAPI]
    );

    const totalAmount = useMemo(() =>
        parseFloat((subtotal - totalDiscountNominal + totalTaxNominal).toFixed(2)),
        [subtotal, totalDiscountNominal, totalTaxNominal]
    );
    
    const changeAmount = useMemo(() =>
        parseFloat(cashInput) > totalAmount ? parseFloat(cashInput) - totalAmount : 0,
        [cashInput, totalAmount]
    );
    // --- AKHIR KALKULASI ---


    // --- Event Handlers Keranjang ---
    const handleAddProductToCart = (product) => {
        setItemToAddNote({ ...product, qty: 1, note: "" });
        setIsAddNoteModalVisible(true);
    };

    const handleUpdateItemQty = (cartId, newQty) => {
        if (newQty <= 0) {
            handleRemoveItemFromCart(cartId);
            return;
        }
        const updatedItems = selectedItems.map((item) =>
            item.cartId === cartId ? { ...item, qty: newQty } : item
        );
        setSelectedItems(updatedItems);
    };

    const handleRemoveItemFromCart = (cartId) => {
        setSelectedItems(selectedItems.filter((item) => item.cartId !== cartId));
    };

    // --- Event Handlers Modal Diskon ---
    const showDiscountModal = () => {
        // Set nilai form sesuai state saat ini
        discountForm.setFieldsValue({ 
            type: discountType, 
            value: discountValue 
        });
        setIsDiscountModalVisible(true);
    };

    const handleDiscountSubmit = async () => {
        try {
            const values = await discountForm.validateFields();
            const inputVal = parseFloat(values.value) || 0;
            const type = values.type;

            // Validasi input
            if (type === "percent" && inputVal > 100) {
                message.error("Diskon persen tidak boleh lebih dari 100%.");
                return;
            }
            
            setDiscountType(type);
            setDiscountValue(inputVal);
            
            setIsDiscountModalVisible(false);
            
            const formattedValue = type === "percent" ? `${inputVal}%` : formatRupiah(inputVal);
            message.success(`Diskon ${formattedValue} berhasil diterapkan.`);
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    // --- Event Handlers Order Baru ---
    const showNewOrderModal = () => {
        setIsNewOrderModalVisible(true);
    };
    const handleNewOrderOk = async () => {
        try {
            const values = await newOrderForm.validateFields();
            resetOrderState();
            setCustomerName(values.customerName || "Guest");
            setCurrentOrderType(values.orderType);
            setRoom(values.room || null);
            message.success("Order baru siap! Silakan tambahkan produk.");
            setIsNewOrderModalVisible(false);
        } catch (error) {
            console.error("Failed to validate new order form:", error);
            message.error("Gagal membuat order baru. Periksa kembali input Anda.");
        }
    };
    const handleNewOrderCancel = () => {
        setIsNewOrderModalVisible(false);
        newOrderForm.resetFields();
    };

    // Penambahan item F&B ke keranjang
    const handleAddNoteOk = async () => {
        try {
            const values = await addNoteForm.validateFields();
            const cartId = `fnb_${itemToAddNote.id}_${values.note || 'no-note'}`;
            const updatedItem = {
                ...itemToAddNote,
                note: values.note,
                type: 'fnb',
                cartId: cartId
            };

            setSelectedItems((prevItems) => {
                const existingItemIndex = prevItems.findIndex(
                    (item) => item.cartId === cartId
                );

                if (existingItemIndex > -1) {
                    const newItems = [...prevItems];
                    newItems[existingItemIndex].qty += updatedItem.qty;
                    return newItems;
                } else {
                    return [...prevItems, updatedItem];
                }
            });

            message.success(`Produk "${updatedItem.name}" ditambahkan ke keranjang.`);
            setIsAddNoteModalVisible(false);
            setItemToAddNote(null);
            addNoteForm.resetFields();
        } catch (error) {
            console.error("Failed to add note:", error);
            message.error("Gagal menambahkan catatan.");
        }
    };

    const handleAddNoteCancel = () => {
        setIsAddNoteModalVisible(false);
        setItemToAddNote(null);
        addNoteForm.resetFields();
    };
    
    // --- Event Handlers Pembayaran ---
    const handleProcessPayment = () => {
        if (selectedItems.length === 0) {
            message.warning("Keranjang masih kosong.");
            return;
        }
        if (!selectedPaymentMethod) {
            message.warning("Pilih metode pembayaran terlebih dahulu (Cash atau QRIS).");
            return;
        }
        if (selectedPaymentMethod === 'cash') {
            setCashInput(0);
            setIsCashPaymentModalVisible(true);
        } else if (selectedPaymentMethod === 'qris') {
            message.info("Simulasi Pembayaran QRIS berhasil! (Dalam pengembangan)");
            setPaymentSuccess(true);
            setIsStrukModalVisible(true);
        } else if (selectedPaymentMethod === 'debit') {
            message.info("Simulasi Pembayaran Debit berhasil! (Dalam pengembangan)");
            setPaymentSuccess(true);
            setIsStrukModalVisible(true);
        }
    };
    
    const handleCashPaymentSubmit = () => {
        if (cashInput < totalAmount) {
            message.error("Jumlah uang yang dibayar kurang dari total belanja.");
            return;
        }
        message.success("Pembayaran tunai berhasil!");
        setIsCashPaymentModalVisible(false);
        setPaymentSuccess(true);
        setIsStrukModalVisible(true);
    };
    
    const handleStrukCancel = () => {
        setIsStrukModalVisible(false);
        setPaymentSuccess(false);
        message.info("Pembayaran dibatalkan.");
    };

    // --- Fungsi Helper untuk Membangun Data Order ---
    const buildMixedOrderData = useCallback(() => {
        const isCash = selectedPaymentMethod === 'cash';
        
        // PENTING: Pengambilan id_sesi tetap ada di sini
        const finalSesiId = initialState?.id_sesi || activeSession?.id_sesi;

        return {
            id_sesi: finalSesiId,
            customerName: customerName,
            orderType: currentOrderType,
            room: currentOrderType === 'dinein' ? room : null,
            paymentMethod: selectedPaymentMethod === 'cash' ? 'CASH' : selectedPaymentMethod === 'qris' ? 'QRIS' : 'DEBIT',
            
            uang_diterima: isCash ? parseFloat(cashInput) : null,
            kembalian: isCash ? parseFloat(changeAmount) : null,

            items: selectedItems.map(item => ({
                id: item.id,
                type: item.type,
                qty: parseInt(item.qty) || 0,
                price: parseFloat(item.price) || 0,
                note: item.note || null,
                bookingData: item.type === 'room' ? item.bookingData : null
            })),
            subtotal: subtotal,
            
            // --- DATA DISKON DIKIRIM LENGKAP ---
            discountPercentage: parseFloat(effectiveDiscountPercentage.toFixed(2)), 
            discountNominal: totalDiscountNominal, 
            // -----------------------------------

            taxDetails: {
                fnbTaxableAmount: fnbTaxableAmount,
                taxRate: taxRateFnbPercentFromAPI,
                taxNominal: totalTaxNominal
            },
            taxPercentage: taxRateFnbPercentFromAPI,
            taxNominal: totalTaxNominal,
            totalAmount: totalAmount,
            // TAMBAHKAN BARIS INI:
            booking_source: 'KasirWalkIn'
        };
    }, [initialState, activeSession, customerName, currentOrderType, room, selectedPaymentMethod, cashInput, changeAmount, selectedItems, subtotal, effectiveDiscountPercentage, totalDiscountNominal, taxRateFnbPercentFromAPI, totalTaxNominal, totalAmount]);

    // --- Handler untuk Simpan & Bayar (Keranjang Campuran) ---
    const handleSaveOrder = async () => {
        if (selectedItems.length === 0) {
            message.warning("Tidak ada item untuk disimpan.");
            return;
        }
        if (!activeSession || !activeSession.id_sesi) {
            message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
            return;
        }
        setIsProcessing(true);
        const orderData = buildMixedOrderData();
        delete orderData.paymentMethod; // Hapus data pembayaran untuk save draft

        try {
            console.log("Menyimpan Order Data (Kasir):", orderData);
            const result = await saveOrderKasir(orderData);
            message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);
            navigate('/transaksikasir');
            resetOrderState();
        } catch (error) {
            message.error(`Gagal menyimpan order: ${error.message || 'Error tidak diketahui'}`);
            console.error("Error saving order:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- MODIFIED: FITUR CETAK STRUK ---
    const handlePrintReceipt = (voucherDataFromBackend = null) => {
        console.log("Mencetak struk order baru...");
        setIsPrinting(true);

        // 1. Format Item F&B
        const formattedFnbItems = selectedItems
            .filter(item => item.type === 'fnb')
            .map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                note: item.note
            }));

        // 2. Format Item Booking
        const formattedBookingItems = selectedItems
            .filter(item => item.type === 'room')
            .map(item => ({
                name: item.name,
                price: item.price, // Harga total paket
                bookingData: {
                    durasi_jam: item.bookingData.durasi_jam,
                    waktu_mulai_jam: item.bookingData.waktu_mulai_jam,
                }
            }));
            
        // 3. Format Vouchers (BARU)
        // Ambil dari parameter jika ada (hasil generate backend)
        const formattedVouchers = [];
        if (voucherDataFromBackend) {
            formattedVouchers.push({
                profile: voucherDataFromBackend.profile, // Ex: shop-2h
                code: voucherDataFromBackend.code // Single code
            });
        }

        // 4. Mapping Payment Method
        let printerPaymentMethod = selectedPaymentMethod === 'cash' ? 'CASH' 
                                 : selectedPaymentMethod === 'qris' ? 'QRIS' 
                                 : 'DEBIT';

        // 5. Susun Data
        const dataToPrint = {
            id: currentOrderNumber, // Gunakan nomor order sementara/baru
            time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            cashier: cashierName,
            customer: customerName,
            location: room || "-",
            
            items: formattedFnbItems,
            bookings: formattedBookingItems,
            
            // Field Voucher (Untuk Printer Service)
            vouchers: formattedVouchers, 
            
            subtotal: subtotal,
            tax: totalTaxNominal,
            discount: totalDiscountNominal,
            total: totalAmount,
            
            paymentMethod: printerPaymentMethod,
            tunai: parseFloat(cashInput) || 0,
            kembali: parseFloat(changeAmount) || 0
        };

        // 6. Kirim ke Flutter
        if (window.flutter_inappwebview) {
            window.flutter_inappwebview.callHandler('flutterPrintHandler', dataToPrint);
            message.info("Mencetak struk...");
        } else {
            message.error("Printer tidak ditemukan (Mode Web).");
            console.log("Data Print:", dataToPrint);
        }

        setTimeout(() => setIsPrinting(false), 2000);
    };
    // --- AKHIR FITUR CETAK ---

    // --- MODIFIED: Menambahkan opsi shouldPrint (default true) ---
    // --- ALUR BARU: SIMPAN DULU -> BARU CETAK ---
    const handleStrukConfirmPayment = async (shouldPrint = true) => {
        setIsProcessing(true);

        if (!activeSession || !activeSession.id_sesi) {
            message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
            setIsProcessing(false);
            return;
        }

        try {
            let result;
            // 1. SIMPAN KE DATABASE (Backend akan generate voucher jika perlu)
            if (editingOrderId) {
                console.log(`Membayar Order Tersimpan (ID: ${editingOrderId})`);
                result = await paySavedOrder(editingOrderId, buildMixedOrderData());
            } else {
                console.log("Mengirim Order Data Baru (Kasir)");
                result = await createOrderKasir(buildMixedOrderData());
            }

            message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);
            
            // 2. AMBIL DATA VOUCHER DARI RESPONSE BACKEND
            const generatedVoucher = result.voucher; // { code, profile, duration }

            // 3. CETAK STRUK (Jika diminta)
            if (shouldPrint) {
                // Kirim voucher yang baru dibuat ke fungsi cetak
                handlePrintReceipt(generatedVoucher);
            }

            // 4. PINDAH HALAMAN (Tunggu sebentar biar proses cetak jalan)
            setTimeout(() => {
                navigate('/transaksikasir');
                resetOrderState();
            }, 1000);

        } catch (error) {
            message.error(`Gagal memproses order: ${error.message || 'Error tidak diketahui'}`);
            console.error(`Error processing order:`, error);
        } finally {
            setIsProcessing(false);
            setIsStrukModalVisible(false);
            setPaymentSuccess(false);
        }
    };

    // --- Event Handlers Ruangan ---
    const orderDropdownMenu = (
        <Menu>
            {!editingOrderId && (
                <Menu.Item key="1" onClick={showNewOrderModal}>Ganti/Buat Order Baru</Menu.Item>
            )}
            <Menu.Item key="2" danger onClick={() => {
                resetOrderState();
                message.warning(`Order ${editingOrderId ? `#${editingOrderId}` : 'saat ini'} dibatalkan.`);
            }}>
                {editingOrderId ? 'Batalkan Edit & Mulai Baru' : 'Hapus Order Saat Ini'}
            </Menu.Item>
        </Menu>
    );

    const handleRoomCardClick = (room) => {
        setSelectedRoomForBooking(room);
        setSelectedDuration(null);
        setSelectedStartTime(null);
        setIsBookingConfirmModalVisible(true);
    };

    // Penambahan item Ruangan ke keranjang
    const handleBookingSubmit = () => {
        setIsBookingProcessing(true);
        try {
            if (!activeSession || !activeSession.id_sesi) {
                message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
                setIsBookingProcessing(false);
                return;
            }
            if (!selectedRoomForBooking) {
                message.error("Ruangan tidak dipilih. Silakan tutup modal dan coba lagi.");
                setIsBookingProcessing(false);
                return;
            }
            if (!selectedDuration || !selectedStartTime) {
                message.error("Harap pilih jam mulai dan durasi.");
                setIsBookingProcessing(false);
                return;
            }

            const cartId = `room_${selectedRoomForBooking.id_ruangan}_${selectedStartTime}`;

            if (selectedItems.find(item => item.cartId === cartId)) {
                message.error("Booking ruangan ini sudah ada di keranjang.");
                setIsBookingConfirmModalVisible(false);
                setIsBookingProcessing(false);
                return;
            }

            const roomItem = {
                id: selectedRoomForBooking.id_ruangan,
                cartId: cartId,
                name: `${selectedRoomForBooking.nama_ruangan}`,
                price: selectedDuration.harga_paket,
                qty: 1,
                type: 'room',
                note: `Booking ${selectedStartTime}:00 - ${selectedStartTime + selectedDuration.durasi_jam}:00`,
                bookingData: {
                    id_ruangan: selectedRoomForBooking.id_ruangan,
                    durasi_jam: selectedDuration.durasi_jam,
                    waktu_mulai_jam: selectedStartTime,
                    total_harga_final: selectedDuration.harga_paket
                }
            };

            setSelectedItems(prevItems => [...prevItems, roomItem]);

            message.success(`${roomItem.name} ditambahkan ke keranjang.`);
            setIsBookingConfirmModalVisible(false);
            setSelectedRoomForBooking(null);
            setSelectedDuration(null);
            setSelectedStartTime(null);

        } catch (errorInfo) {
            console.error("Gagal menambah ruangan ke keranjang:", errorInfo);
            message.error(`Gagal menambah ruangan: ${errorInfo.message}`);
        } finally {
            setIsBookingProcessing(false);
        }
    };


    const filteredProducts = products.filter((product) => {
        const matchesMerchant =
            selectedMerchant === "all_merchants" || product.merchantId === selectedMerchant;
        const matchesProductType =
            selectedProductType === "all_types" || product.category === selectedProductType;
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchProductQuery.toLowerCase());
        return matchesMerchant && matchesProductType && matchesSearch;
    });

    // --- JSX (RENDER) ---
    return (
        <Spin spinning={isLoadingInitData || isLoading || isProcessing} tip={isProcessing ? "Menyimpan..." : "Memuat..."} size="large">
            <div className="flex flex-col lg:flex-row bg-gray-50 text-gray-800 font-sans h-screen">
                {/* Product Selection Column */}
                <div className="flex-1 h-screen overflow-y-scroll p-6 bg-white border-r border-gray-100">
                    {/* Header: Mode Toggle, Logo, Cashier */}
                    <div className="flex justify-between items-center mb-6">
                        <Radio.Group value={posMode} onChange={(e) => setPosMode(e.target.value)}>
                            <Radio.Button value="fnb">
                                <div className="flex items-center justify-center gap-2">
                                    <MdOutlineShoppingCart />
                                    <span>F&B</span>
                                </div>
                            </Radio.Button>
                            
                            {/* Tombol Ruangan dinonaktifkan sementara atas permintaan manajer */}
                            {/* <Radio.Button value="ruangan">
                                <div className="flex items-center justify-center gap-2">
                                    <FaRegIdCard />
                                    <span>Ruangan</span>
                                </div>
                            </Radio.Button> 
                            */}

                        </Radio.Group>
                        <img src="/img/logo_dago.png" alt="Dago Creative Home" className="h-12" /> 
                        <div className="flex items-center space-x-2 text-gray-600"><UserOutlined /><span>{cashierName}</span></div>
                    </div>

                    {/* Content based on posMode */}
                    {posMode === 'fnb' ? (
                        <>
                            {/* Search and Filters */}
                            <div className="mb-6">
                                <Input placeholder="Cari produk F&B..." prefix={<SearchOutlined />} value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tenant</h3>
                                <div className="flex flex-wrap gap-2">
                                    {merchantCategories.map((category) => <Button key={category.id} type={selectedMerchant === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedMerchant(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tipe Produk</h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableProductTypes.map((category) => <Button key={category.id} type={selectedProductType === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedProductType(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>

                            {/* Product List */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-1">
                                {!isLoadingInitData && loadingError && (
                                    <div className="text-center py-10 text-red-500">{loadingError}</div>
                                )}
                                {!isLoadingInitData && !loadingError && filteredProducts.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">Tidak ada produk ditemukan.</div>
                                )}
                                {!isLoadingInitData && !loadingError && filteredProducts.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className={`rounded-lg shadow-sm border p-3 flex flex-col justify-between transition-all duration-150 h-full ${product.available ? "bg-white border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300" : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"}`}
                                                onClick={() => product.available && handleAddProductToCart(product)}
                                                tabIndex={product.available ? 0 : -1}
                                                role="button"
                                                aria-disabled={!product.available}
                                            >
                                                <div className="flex-1 mb-1">
                                                    <h3 className={`font-semibold text-sm leading-tight ${product.available ? "text-gray-800" : "text-gray-500"}`}>{product.name}</h3>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className={`text-xs font-bold ${product.available ? "text-blue-600" : "text-gray-500"}`}>{formatRupiah(product.price)}</span>
                                                    {!product.available && <Tag color="red" className="ml-1 text-xs">Habis</Tag>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Room Booking Mode Content
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Pilih Ruangan untuk Booking Hari Ini</h2>
                            {isLoadingRooms ? <div className="flex justify-center items-center h-full"><Spin size="large" /></div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map((roomItem) => (
                                        <div key={roomItem.id_ruangan} className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleRoomCardClick(roomItem)}>
                                            <h3 className="font-bold text-gray-800">{roomItem.nama_ruangan}</h3>
                                            <p className="text-sm text-gray-500">{roomItem.nama_kategori} - Kapasitas: {roomItem.kapasitas} orang</p>
                                            <Tag color="green" className="mt-2">Tambahkan ke Keranjang</Tag>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- Kolom Keranjang (Kanan) --- */}
                <div className={`lg:w-2/5 bg-gray-50 flex flex-col p-6 overflow-y-scroll h-screen`}>
                    {/* Header: Title and Order Options Dropdown */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {editingOrderId ? `Edit Order #${editingOrderId}` : 'Detail Order'}
                        </h2>
                        <Dropdown overlay={orderDropdownMenu} trigger={["click"]}>
                            <Button type="text" icon={<MoreOutlined className="text-xl" />} />
                        </Dropdown>
                    </div>

                    {/* Order Type Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6 text-sm font-medium">
                        {orderTypes.map((type) => (
                            <Button
                                key={type.id}
                                type={currentOrderType === type.id ? "primary" : "text"}
                                className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${currentOrderType === type.id ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                                onClick={() => setCurrentOrderType(type.id)}
                            >
                                {type.name}
                            </Button>
                        ))}
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col mb-6">
                        <span className="text-gray-500 text-sm">Order ({currentOrderNumber})</span>
                        <span className="text-lg font-bold">Order {customerName} {room && `(${room})`}</span>
                    </div>

                    {/* --- Daftar Item Keranjang Campuran --- */}
                    <div className="flex-1 space-y-3 mb-6 overflow-y-auto custom-scrollbar pr-1">
                        {selectedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Keranjang kosong.</div>
                        ) : (
                            selectedItems.map((item) => (
                                <div key={item.cartId}
                                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                    
                                    <div className="flex flex-col flex-1 min-w-0 mr-2">
                                        <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {formatRupiah(item.price)}
                                            {item.note && <span className="text-gray-400 italic"> ({item.note})</span>}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {item.type === 'fnb' ? (
                                            <>
                                                <Button icon={<MinusOutlined />} size="small" onClick={() => handleUpdateItemQty(item.cartId, item.qty - 1)} />
                                                <span className="font-medium w-6 text-center">{item.qty}</span>
                                                <Button icon={<PlusOutlined />} size="small" onClick={() => handleUpdateItemQty(item.cartId, item.qty + 1)} />
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-medium w-6 text-center">{item.qty}x</span>
                                            </>
                                        )}
                                        <Button danger type="text" icon={<CloseOutlined />} size="small" onClick={() => handleRemoveItemFromCart(item.cartId)} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* --- Tampilan Rincian Harga --- */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border">
                        {isLoadingInitData && !editingOrderId ? (
                            <div className="flex justify-center items-center py-4"><Spin /></div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
                                    <span>Subtotal F&B</span>
                                    <span className="font-medium">{formatRupiah(subtotalFnb)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
                                    <span>Subtotal Ruangan</span>
                                    <span className="font-medium">{formatRupiah(subtotalRoom)}</span>
                                </div>
                                
                                {/* DISKON SECTION */}
                                {totalDiscountNominal > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1 text-red-600">
                                        <span>
                                            Diskon {discountType === 'percent' ? `(${discountValue}%)` : '(Manual)'}
                                        </span>
                                        <span className="font-medium">-{formatRupiah(totalDiscountNominal)}</span>
                                    </div>
                                )}

                                {subtotalFnb > 0 && subtotalRoom > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1 text-gray-700 font-semibold border-t pt-1 mt-1">
                                        <span>Subtotal (F&B + Ruangan)</span>
                                        <span className="font-medium">{formatRupiah(subtotal)}</span>
                                    </div>
                                )}

                                {totalTaxNominal > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-3 text-gray-600">
                                        <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                        <span className="font-medium">{formatRupiah(totalTaxNominal)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-lg font-bold text-blue-600 border-t border-gray-200 pt-3 mt-2">
                                    <span>Total</span>
                                    <span>{formatRupiah(totalAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="large" type="primary" className="bg-blue-500 hover:bg-blue-600 border-none text-white" icon={<PercentageOutlined />} onClick={showDiscountModal}>
                                Discount
                            </Button>
                           <Button 
                                danger 
                                size="large" 
                                className="text-white border-none bg-red-500 hover:bg-red-600" 
                                onClick={handleCancelAndDeleteOrder} // Ganti ke fungsi ini
                                loading={isProcessing}
                            >
                                Cancel Order
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                            <Button
                                type="default"
                                className={`flex-1 py-2 px-3 ${selectedPaymentMethod === "cash" ? "bg-blue-600 text-white" : "text-gray-700"}`}
                                icon={<DollarOutlined />}
                                onClick={() => setSelectedPaymentMethod("cash")}
                            >
                                Cash
                            </Button>
                            <Button
                                type="default"
                                className={`flex-1 py-2 px-3 ${selectedPaymentMethod === "qris" ? "bg-blue-600 text-white" : "text-gray-700"}`}
                                icon={<QrcodeOutlined />}
                                onClick={() => setSelectedPaymentMethod("qris")}
                            >
                                QRIS
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                size="large"
                                icon={<SaveOutlined />}
                                onClick={handleSaveOrder}
                                disabled={selectedItems.length === 0 || isProcessing}
                                className="bg-green-600 hover:bg-green-700 border-none text-white"
                            >
                                Save
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                className="bg-blue-600 hover:bg-blue-700 border-none text-white"
                                block
                                onClick={handleProcessPayment}
                                disabled={selectedItems.length === 0 || !selectedPaymentMethod || isProcessing}
                                loading={isProcessing && selectedPaymentMethod !== null}
                            >
                                Payment & Print
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}

            {/* MODAL DISKON BARU */}
            <Modal 
                title="Atur Diskon" 
                open={isDiscountModalVisible} 
                onOk={handleDiscountSubmit} 
                onCancel={() => setIsDiscountModalVisible(false)} 
                okText="Terapkan" 
                cancelText="Batal"
                centered
            >
                <Form form={discountForm} layout="vertical" className="mt-4" initialValues={{ type: 'percent', value: 0 }}>
                    
                    {/* Pilihan Tipe Diskon */}
                    <Form.Item name="type" className="mb-4">
                        <Radio.Group className="w-full flex" buttonStyle="solid">
                            <Radio.Button value="percent" className="flex-1 text-center">
                                <PercentageOutlined className="mr-2"/> Persen (%)
                            </Radio.Button>
                            <Radio.Button value="nominal" className="flex-1 text-center">
                                <DollarOutlined className="mr-2"/> Nominal (Rp)
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    {/* Input Nilai - Dinamis berdasarkan Tipe */}
                    <Form.Item 
                        noStyle 
                        shouldUpdate={(prev, curr) => prev.type !== curr.type}
                    >
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type') || 'percent';
                            return (
                                <Form.Item 
                                    label={type === 'percent' ? "Nilai Persentase" : "Nilai Rupiah"} 
                                    name="value" 
                                    rules={[{ required: true, message: 'Harap masukkan nilai diskon!' }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        size="large"
                                        min={0}
                                        max={type === 'percent' ? 100 : subtotal} 
                                        formatter={value => type === 'percent' 
                                            ? `${value}%` 
                                            : `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                        // PERBAIKAN 4: REGEX YANG BENAR (tanpa escape \R)
                                        parser={value => type === 'percent'
                                            ? value.replace('%', '') 
                                            : value.replace(/[Rr][Pp]\s?|(,*)/g, '')
                                        }
                                        placeholder={type === 'percent' ? "Contoh: 10" : "Contoh: 50000"}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    
                    {/* Info Preview Diskon */}
                    <Form.Item shouldUpdate>
                        {({ getFieldValue }) => {
                            const val = getFieldValue('value') || 0;
                            const type = getFieldValue('type');
                            let previewNominal = 0;
                            
                            if (type === 'percent') previewNominal = subtotal * (val / 100);
                            else previewNominal = val;

                            return (
                                <div className="text-right text-gray-500 text-sm">
                                    Estimasi potongan: <span className="font-bold text-red-500">{formatRupiah(previewNominal)}</span>
                                </div>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>

            {/* --- Modal Booking Ruangan (Dengan Perbaikan) --- */}
            <Modal
                title={<div className="font-bold text-lg">Booking Ruangan: {selectedRoomForBooking?.nama_ruangan}</div>}
                open={isBookingConfirmModalVisible}
                onCancel={() => setIsBookingConfirmModalVisible(false)}
                destroyOnClose
                footer={[
                    <Button key="back" onClick={() => setIsBookingConfirmModalVisible(false)}>Batal</Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleBookingSubmit}
                        disabled={!selectedDuration || !selectedStartTime || isBookingProcessing}
                        loading={isBookingProcessing}
                    >
                        Tambah ke Keranjang
                    </Button>
                ]}
                width={600}
                centered
            >
                <div className="mt-4">
                    <p className="mb-4 text-gray-600">Pilih jam mulai dan durasi untuk booking hari ini.</p>
                    <Divider>Pilih Jam Mulai</Divider>
                    <div className="grid grid-cols-5 md:grid-cols-7 gap-2 mb-4">
                        {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => {
                            const isBooked = selectedRoomForBooking?.booked_hours.includes(hour);
                            const isPast = hour < dayjs().hour();
                            const isInCart = selectedItems.some(item =>
                                item.type === 'room' &&
                                item.bookingData.id_ruangan === selectedRoomForBooking?.id_ruangan &&
                                hour >= item.bookingData.waktu_mulai_jam &&
                                hour < (item.bookingData.waktu_mulai_jam + item.bookingData.durasi_jam)
                            );
                            const isDisabled = isBooked || isPast || isInCart;
                            return (
                                <Button
                                    key={hour}
                                    type={selectedStartTime === hour ? 'primary' : 'default'}
                                    disabled={isDisabled}
                                    onClick={() => { setSelectedStartTime(hour); setSelectedDuration(null); }}
                                    title={isInCart ? "Sudah ada di keranjang" : isBooked ? "Sudah di-booking" : isPast ? "Waktu lampau" : ""}
                                >
                                    {`${hour}:00`}
                                </Button>
                            );
                        })}
                    </div>

                    {selectedStartTime && (
                        <>
                            <Divider>Pilih Durasi</Divider>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                {selectedRoomForBooking?.paket_harga.sort((a, b) => a.durasi_jam - b.durasi_jam).map(pkg => {
                                    const endTime = selectedStartTime + pkg.durasi_jam;
                                    const isOverlapping = selectedRoomForBooking.booked_hours.some(h => h >= selectedStartTime && h < endTime);
                                    const isOverlappingCart = selectedItems.some(item =>
                                        item.type === 'room' &&
                                        item.bookingData.id_ruangan === selectedRoomForBooking?.id_ruangan &&
                                        (
                                            (selectedStartTime < (item.bookingData.waktu_mulai_jam + item.bookingData.durasi_jam)) &&
                                            (endTime > item.bookingData.waktu_mulai_jam)
                                        )
                                    );
                                    const isInvalid = endTime > 22 || isOverlapping || isOverlappingCart;
                                    return (
                                        <Button
                                            key={pkg.durasi_jam}
                                            type={selectedDuration?.durasi_jam === pkg.durasi_jam ? 'primary' : 'default'}
                                            disabled={isInvalid}
                                            onClick={() => setSelectedDuration(pkg)}
                                            className="h-auto py-2 min-w-[100px] min-h-[50px]"
                                            title={isInvalid ? (isOverlapping ? "Bentrok jadwal" : isOverlappingCart ? "Bentrok keranjang" : "Melebihi jam 22:00") : ""}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span>{pkg.durasi_jam} Jam</span>
                                                <span className="text-xs font-normal">{formatRupiah(pkg.harga_paket)}</span>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    <Divider />
                    {selectedDuration && <div className="text-right font-bold text-lg text-blue-600">Total: {formatRupiah(selectedDuration.harga_paket)}</div>}
                </div>
            </Modal>
            
            {/* New Order Modal */}
            <Modal title={<div className="text-xl font-bold text-gray-800"><PlusOutlined className="mr-2" /> Buat Order Baru</div>} open={isNewOrderModalVisible} onOk={handleNewOrderOk} onCancel={handleNewOrderCancel} okText="Buat Order" cancelText="Batal" width={400} centered className="new-order-modal">
                <Form form={newOrderForm} layout="vertical" initialValues={{ orderType: currentOrderType, customerName: customerName, room: room }} className="mt-4">
                    <Form.Item label="Tipe Order" name="orderType" rules={[{ required: true, message: "Pilih tipe order!" }]}>
                        <Radio.Group className="w-full">
                            <Radio.Button value="dinein" className="w-1/3 text-center">Dine In</Radio.Button>
                            <Radio.Button value="takeaway" className="w-1/3 text-center">Take Away</Radio.Button>
                            <Radio.Button value="pickup" className="w-1/3 text-center">Pick Up</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Nama Customer (Opsional)" name="customerName"><Input placeholder="Nama customer" /></Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.orderType !== currentValues.orderType}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('orderType') === 'dinein' ? (
                                <Form.Item label="Nomor Meja/Ruangan (contoh: Meja 1, RM1)" name="room">
                                    <Input placeholder="Nomor Meja/Ruangan" />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item label="Kasir" className="mb-0"><Input value={cashierName} disabled prefix={<UserOutlined />} /></Form.Item>
                </Form>
            </Modal>

            {/* Add Note Modal */}
            <Modal
                title={
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold text-gray-800">Tambahkan Catatan untuk</div>
                        <div className="text-xl font-bold text-blue-600 mt-1">{itemToAddNote?.name}</div>
                    </div>
                }
                open={isAddNoteModalVisible}
                onOk={handleAddNoteOk}
                onCancel={handleAddNoteCancel}
                okText="Konfirmasi"
                cancelText="Batal"
                width={420}
                centered
                className="rounded-xl"
            >
                <Form
                    form={addNoteForm}
                    layout="vertical"
                    className="mt-2 space-y-4"
                    initialValues={{ note: itemToAddNote?.note || "" }}
                >
                    {itemToAddNote?.category && (
                        <p className="text-sm text-gray-500 mb-1">
                            Kategori:{" "}
                            <span className="font-medium text-gray-700">
                                {productTypeCategories.find(
                                    (cat) => cat.id === itemToAddNote.category
                                )?.name || itemToAddNote.category}
                            </span>
                        </p>
                    )}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Catatan</span>}
                        name="note"
                    >
                        <Input.TextArea
                            placeholder="Contoh: nasi setengah, tidak pedas, tanpa sambal, dll."
                            rows={3}
                            maxLength={150}
                            showCount
                        />
                    </Form.Item>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-lg font-bold text-blue-600">
                            {formatRupiah(itemToAddNote?.price || 0)}
                        </span>
                        <div className="flex items-center space-x-3">
                            <Button
                                icon={<MinusOutlined />}
                                size="small"
                                shape="circle"
                                onClick={() =>
                                    setItemToAddNote((prev) => ({
                                        ...prev,
                                        qty: Math.max(1, (prev?.qty || 1) - 1),
                                    }))
                                }
                                disabled={itemToAddNote?.qty <= 1}
                            />
                            <span className="font-semibold text-gray-800 w-6 text-center">
                                {itemToAddNote?.qty || 1}
                            </span>
                            <Button
                                icon={<PlusOutlined />}
                                size="small"
                                shape="circle"
                                onClick={() =>
                                    setItemToAddNote((prev) => ({
                                        ...prev,
                                        qty: (prev?.qty || 0) + 1,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Cash Payment Modal */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Pembayaran Tunai</div>}
                open={isCashPaymentModalVisible}
                onCancel={() => setIsCashPaymentModalVisible(false)}
                footer={null}
                width={400}
                centered
            >
                <div className="text-lg font-semibold text-blue-600 mb-2 text-right">
                    Total: {formatRupiah(totalAmount)}
                </div>

                <Form layout="vertical" className="mt-2">
                    <Form.Item label="Uang Tunai" className="mb-4 relative">
                        <Input
                            prefix="Rp"
                            value={cashInput > 0 ? cashInput.toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setCashInput(Number(value) || 0);
                            }}
                            size="large"
                            className="text-right text-lg font-medium pr-10"
                            autoFocus
                            suffix={
                                cashInput > 0 && (
                                    <Button
                                        type="text"
                                        onClick={() => setCashInput(0)}
                                        style={{
                                            color: "red",
                                            border: "none",
                                            fontWeight: "bold",
                                            fontSize: "16px",
                                            padding: 0,
                                        }}
                                        icon={<span style={{ fontSize: "16px" }}>✕</span>}
                                    />
                                )
                            }
                        />
                    </Form.Item>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { amount: 5000, bg: "#FACC15", color: "black" },
                            { amount: 10000, bg: "#8B5CF6", color: "white" },
                            { amount: 20000, bg: "#22C55E", color: "white" },
                            { amount: 50000, bg: "#3B82F6", color: "white" },
                            { amount: 100000, bg: "#EF4444", color: "white" },
                        ].map((denom) => (
                            <Button
                                key={denom.amount}
                                size="large"
                                style={{
                                    backgroundColor: denom.bg,
                                    color: denom.color,
                                    fontWeight: "600",
                                    border: "none",
                                    height: "48px",
                                }}
                                onClick={() => setCashInput((prev) => prev + denom.amount)}
                            >
                                {denom.amount.toLocaleString('id-ID')}
                            </Button>
                        ))}
                        <Button
                            size="large"
                            style={{
                                backgroundColor: "#9CA3AF",
                                color: "white",
                                fontWeight: "600",
                                border: "none",
                                height: "48px",
                            }}
                            onClick={() => setCashInput((prev) => (prev > 0 ? prev * 1000 : 0))}
                        >
                            + 000
                        </Button>
                        {totalAmount > 0 && (
                            <Button
                                size="large"
                                style={{
                                    backgroundColor: "#2563EB",
                                    color: "white",
                                    fontWeight: "600",
                                    border: "none",
                                    height: "48px",
                                    gridColumn: "span 3",
                                }}
                                onClick={() => setCashInput(totalAmount)}
                            >
                                {totalAmount.toLocaleString('id-ID')}
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-between items-center mb-4 text-base">
                        <span>Kembalian:</span>
                        <span className="font-bold text-green-600">{formatRupiah(changeAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button size="large" onClick={() => setIsCashPaymentModalVisible(false)}>
                            Batal
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleCashPaymentSubmit}
                            disabled={cashInput < totalAmount}
                        >
                            Submit
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Struk/Confirm Modal */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Struk Pembayaran</div>}
                open={isStrukModalVisible}
                onOk={() => handleStrukConfirmPayment(true)} // Default print = true untuk tombol enter
                onCancel={handleStrukCancel}
                footer={[
                    <Button key="back" size="large" onClick={handleStrukCancel}>
                        {paymentSuccess ? "Tutup" : "Batal Pembayaran"}
                    </Button>,
                    <Button
                        key="no-print"
                        size="large"
                        onClick={() => handleStrukConfirmPayment(false)}
                        loading={isProcessing}
                        disabled={isProcessing}
                    >
                        Selesai (Tanpa Cetak)
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        size="large"
                        onClick={() => handleStrukConfirmPayment(true)}
                        loading={isProcessing}
                        disabled={isProcessing}
                    >
                        {editingOrderId ? 'Selesaikan & Cetak' : 'Simpan & Cetak Struk'}
                    </Button>,
                ]}
                width={380}
                centered
                destroyOnClose
            >
                <div className="flex flex-col pt-4 bg-white rounded-lg text-xs">
                    {paymentSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md relative mb-3 flex items-center text-xs">
                            <CheckCircleOutlined className="mr-2 text-base" />
                            <span className="font-semibold">Pembayaran berhasil diterima!</span>
                        </div>
                    )}
                    <div className="text-gray-600 mb-3 space-y-0.5">
                        <p><strong>Customer:</strong> {customerName || 'Guest'}</p>
                        <p><strong>Tipe:</strong> {currentOrderType === 'dinein' ? 'Dine In' : currentOrderType === 'takeaway' ? 'Take Away' : 'Pick Up'}{room ? ` (${room})` : ''}</p>
                        <p><strong>Order #:</strong> {currentOrderNumber}</p>
                        <p><strong>Kasir:</strong> {cashierName}</p>
                        <p><strong>Tanggal:</strong> {currentDate.format("DD/MM/YY HH:mm")}</p>
                        <p><strong>Bayar:</strong> {selectedPaymentMethod === 'cash' ? 'Tunai' : selectedPaymentMethod === 'qris' ? 'QRIS' : selectedPaymentMethod === 'debit' ? 'DEBIT' : '-'}</p>
                    </div>
                    <div className="border-t border-b border-gray-200 py-2 my-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {selectedItems.map((item) => (
                            <div key={item.cartId} className="flex justify-between items-start mb-1.5">
                                <div className="mr-2">
                                    <p className="font-medium text-gray-800 leading-tight">{item.name} <span className="font-normal text-gray-500">x{item.qty}</span></p>
                                    {item.note && <p className="text-gray-500 italic">({item.note})</p>}
                                </div>
                                <span className="font-medium whitespace-nowrap">{formatRupiah(item.price * item.qty)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mb-1 space-y-0.5">
                        {subtotalFnb > 0 && (
                             <div className="flex justify-between">
                                <span>Subtotal F&B</span>
                                <span>{formatRupiah(subtotalFnb)}</span>
                            </div>
                        )}
                        {subtotalRoom > 0 && (
                             <div className="flex justify-between">
                                <span>Subtotal Ruangan</span>
                                <span>{formatRupiah(subtotalRoom)}</span>
                            </div>
                        )}
                        {totalDiscountNominal > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Diskon {discountType === 'percent' ? `(${discountValue}%)` : '(Rp)'}</span>
                                <span>-{formatRupiah(totalDiscountNominal)}</span>
                            </div>
                        )}
                        {totalTaxNominal > 0 && (
                            <div className="flex justify-between">
                                <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                <span>{formatRupiah(totalTaxNominal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-gray-800 pt-1.5 border-t border-dashed mt-1.5">
                            <span>Total</span>
                            <span>{formatRupiah(totalAmount)}</span>
                        </div>
                        {selectedPaymentMethod === 'cash' && (
                            <>
                                <div className="flex justify-between pt-1">
                                    <span>Tunai</span>
                                    <span>{formatRupiah(cashInput)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-green-600">
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(changeAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

        </Spin>
    );
};

export default OrderKasir;