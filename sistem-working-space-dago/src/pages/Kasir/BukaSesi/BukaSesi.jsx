// src/pages/Kasir/BukaSesi/BukaSesi.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import {
    apiGetAllOpenSessions,
    apiGetRecentClosedSessions,
} from '../../../services/service';
import logoImage from '../../../assets/images/logo.png';
import { Modal, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { HistoryOutlined, PlusOutlined } from '@ant-design/icons';

const BukaSesi = () => {
    const {
        openSession,
        getLastSaldo,
        activeSession,
        isSessionLoading,
        joinSession,
        userRole,
        isLoggedIn
    } = useAuth();

    const [namaSesi, setNamaSesi] = useState('');
    const [saldoAwal, setSaldoAwal] = useState('');
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    
    const [openSessions, setOpenSessions] = useState([]);
    const [closedSessions, setClosedSessions] = useState([]);

    const navigate = useNavigate();

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Set nama sesi default
    useEffect(() => {
        const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        setNamaSesi(`Cashier ${tgl}`);
    }, []);

    const navigateToDashboard = (role) => {
        if (role === 'admin_tenant') {
            navigate('/ordertenant', { replace: true });
        } else {
            navigate('/transaksikasir', { replace: true });
        }
    };

    const handleViewHistory = (session) => {
        if (userRole === 'admin_tenant') {
            navigate(`/ordertenant/${session.id_sesi}`);
        } else {
            navigate(`/kasir/riwayat-sesi/${session.id_sesi}`);
        }
    };

    const fetchAllSessions = async () => {
        try {
            console.log("Memuat data sesi...");
            const [saldoData, openSessionsData, closedSessionsData] = await Promise.all([
                getLastSaldo(),
                apiGetAllOpenSessions(),
                apiGetRecentClosedSessions()
            ]);

            const saldoVal = (saldoData && typeof saldoData === 'object' && saldoData.data)
                ? saldoData.data
                : saldoData;

            setSaldoAwal(saldoVal != null ? saldoVal.toString() : '0');
            setOpenSessions(openSessionsData.sessions || []);
            setClosedSessions(closedSessionsData.sessions || []);
            console.log("Data sesi berhasil dimuat:", { openSessionsData });
        } catch (err) {
            console.error("Gagal memuat sesi:", err);
            setSaldoAwal('0');
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (isSessionLoading || !userRole) return;

        if (activeSession) {
            console.log("Sudah ada sesi aktif, redirect ke dashboard...");
            navigateToDashboard(userRole);
            return;
        }

        setIsPageLoading(true);
        fetchAllSessions();
    }, [isSessionLoading, activeSession, navigate, userRole]);

    const allSessionsForDisplay = useMemo(() => {
        const openWithStatus = openSessions.map(s => ({ ...s, status: 'open' }));
        const closedWithStatus = closedSessions.map(s => ({ ...s, status: 'closed' }));
        const combined = [...openWithStatus, ...closedWithStatus];

        return combined.filter(session => {
            const sessionDate = new Date(session.waktu_mulai);
            const sName = session.nama_sesi || '';
            const kName = session.nama_kasir || '';

            const matchSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                kName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchMonth = sessionDate.getMonth() === selectedMonth;
            const matchYear = sessionDate.getFullYear() === selectedYear;

            return matchSearch && matchMonth && matchYear;
        }).sort((a, b) => new Date(b.waktu_mulai) - new Date(a.waktu_mulai));
    }, [openSessions, closedSessions, searchQuery, selectedMonth, selectedYear]);

    // =================================================================
    // FIX DI SINI: Logika Tombol Buat Sesi (Langsung Buka Modal)
    // =================================================================
    const handleOpenModal = () => {
        console.log("🔥 TOMBOL DITEKAN! Memaksa modal terbuka...");
        // Kita HAPUS pengecekan (if openSessions.length > 0) sementara
        // supaya modal pasti muncul.
        setShowModal(true);
    };

    const handleSubmitNewSession = async (e) => {
        e.preventDefault();
        setError('');

        const cleanSaldo = saldoAwal.toString().replace(/[^\d]/g, '');

        if (!cleanSaldo || isNaN(parseFloat(cleanSaldo)) < 0) {
            setError('Saldo awal tidak valid');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Mengirim request buka sesi:", { namaSesi, cleanSaldo });
            await openSession(namaSesi, parseFloat(cleanSaldo));
            setShowModal(false);
            message.success("Sesi baru berhasil dibuat!");
        } catch (err) {
            console.error("Gagal buat sesi:", err);
            setError(err.message || 'Gagal membuka sesi');
            message.error(err.message || 'Gagal membuka sesi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinSession = (session) => {
        if (session.status !== 'open') return;
        joinSession(session);
        navigateToDashboard(userRole);
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- TAMPILAN LOADING ---
    if (isPageLoading || isSessionLoading || (isLoggedIn && !userRole)) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <Spin size="large" tip="Memuat data sesi..." />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Cashier Session</h1>
                    
                    {/* TOMBOL UTAMA */}
                    <button
                        type="button" 
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-100 hover:text-green-700 transition-colors cursor-pointer border border-green-200"
                    >
                        <PlusOutlined className="text-lg" />
                        <span>Buat Sesi Baru</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Sessions List */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Search & Filter */}
                        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari nama sesi atau nama kasir..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="flex gap-4">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                                >
                                    {[2023, 2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                                >
                                    {months.map((month, idx) => (
                                        <option key={idx} value={idx}>{month}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="space-y-3">
                            {allSessionsForDisplay.length === 0 ? (
                                <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-dashed border-gray-300">
                                    <p className="text-gray-500 text-lg">Tidak ada sesi ditemukan</p>
                                    <p className="text-sm text-gray-400 mt-1">Silakan buat sesi baru untuk memulai.</p>
                                </div>
                            ) : (
                                allSessionsForDisplay.map(session => {
                                    const isOpen = session.status === 'open';
                                    const isMyJoinedSession = session.id_sesi === activeSession?.id_sesi;

                                    return (
                                        <div key={session.id_sesi} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${isMyJoinedSession ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                                            <div className="flex items-center gap-4 p-5">
                                                {/* Status Badge */}
                                                <div className={`flex-shrink-0 rounded-lg px-3 py-1.5 ${isOpen ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                    <span className="text-xs font-bold tracking-wide">{isOpen ? 'OPEN' : 'CLOSED'}</span>
                                                </div>

                                                {/* Session Info */}
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-gray-800 text-lg">{session.nama_sesi}</h3>
                                                    <p className="text-sm text-gray-600">Kasir: <span className="font-medium">{session.nama_kasir}</span></p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Mulai: {dayjs(session.waktu_mulai).format('DD MMM YYYY, HH:mm')}
                                                    </p>
                                                </div>

                                                {/* Tombol Aksi List */}
                                                {isOpen ? (
                                                    <button
                                                        onClick={() => handleJoinSession(session)}
                                                        className={`px-5 py-2.5 text-sm rounded-lg font-semibold shadow-sm transition-all ${isMyJoinedSession
                                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {isMyJoinedSession ? 'Lanjutkan' : 'Masuk'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleViewHistory(session)}
                                                        className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium flex items-center gap-2"
                                                    >
                                                        <HistoryOutlined />
                                                        <span>Riwayat</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column - Clock & Logo */}
                    <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center sticky top-24 h-fit">
                        <div className="w-40 h-40 mb-6 bg-white rounded-full p-4 shadow-sm flex items-center justify-center">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-6xl font-mono font-bold text-gray-800 tracking-tight">
                                {currentTime.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\./g, ':')}
                            </div>
                            <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Asia/Makassar (WITA)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add New Session */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Buka Sesi Baru</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitNewSession} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Sesi</label>
                                <input
                                    type="text"
                                    value={namaSesi}
                                    onChange={(e) => setNamaSesi(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: Shift Pagi Andi"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo Awal (Cash Drawer)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        value={saldoAwal === '0' ? '' : parseInt(saldoAwal.toString().replace(/[^\d]/g, '') || 0).toLocaleString('id-ID')}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^\d]/g, '');
                                            setSaldoAwal(value);
                                        }}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg transition-all"
                                        placeholder="0"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-1">Masukkan jumlah uang tunai yang ada di laci saat ini.</p>
                            </div>

                            <button
                                type="submit"
                                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 ${isSubmitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                    }`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Spin size="small" className="text-white" />
                                        <span>Memproses...</span>
                                    </div>
                                ) : (
                                    'Buka Sesi Sekarang'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BukaSesi;