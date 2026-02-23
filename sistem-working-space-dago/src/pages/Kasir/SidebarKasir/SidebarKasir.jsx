import React, { useEffect, useState } from "react";
import { Menu, X, ArrowLeft } from "lucide-react"; // Tambah ArrowLeft
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom"; // Tambah useLocation

import { useAuth } from "../../../providers/AuthProvider";

import { BsBox2, BsBox2Fill, BsCart, BsCart3, BsCartFill, BsFileBarGraph, BsGraphUpArrow } from "react-icons/bs";
import { MdChair, MdHistory, MdMoney, MdOutlineChair, MdOutlineHistory } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { GrCart } from "react-icons/gr";
import { FaHouse } from "react-icons/fa6";
import { RiHomeOfficeLine } from "react-icons/ri";
import { IoSettingsOutline, IoWarningOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import GlobalRentalMonitor from "../../../components/GlobalRentalMonitor";
import { findPrinterDetails } from "../../../utils/PrinterFinder";

const SidebarKasir = ({ children }) => {
    const [selectedMenu, setSelectedMenu] = useState("Transaksi");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Hook untuk cek URL

    // State Modal Logout
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const { userProfile, logout } = useAuth();

    // Deteksi Mode History (Riwayat Sesi Detail)
    const isHistoryMode = location.pathname.includes("/kasir/riwayat-sesi/");

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const executeLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
    };

    // --- DEFINISI MENU ---

    // 1. Menu Standar (Normal Operation)
    const standardMenuItems = [
        { name: "Transaksi", icon: <GrCart />, path: "/transaksikasir" },
        { name: "Merchant", icon: <RiHomeOfficeLine />, path: "/merchantkasir" },
        { name: "Product", icon: <BsBox2 />, path: "/productkasir" },
        { name: "History", icon: <MdOutlineHistory />, path: "/historykasir" },
        //{ name: "Space", icon: <MdOutlineChair />, path: "/spacekasir" },
        { name: "Laporan Pembayaran", icon: <MdMoney />, path: "/laporanpembayarankasir" },
        { name: "Settings", icon: <IoSettingsOutline />, path: "/settingskasir" },
        {
            name: "Logout",
            icon: <SlLogout />,
            action: handleLogout
        }
    ];

    // 2. Menu Khusus Mode History (Review)
    const historyMenuItems = [
        { 
            name: "Detail Sesi", 
            icon: <MdHistory />, 
            path: null, // Tidak navigasi kemana-mana (aktif saat ini)
            isStatic: true // Penanda item ini statis/aktif
        },
        {
            name: "Logout",
            icon: <SlLogout />,
            action: handleLogout
        }
    ];

    // Tentukan menu mana yang dipakai
    const currentMenuItems = isHistoryMode ? historyMenuItems : standardMenuItems;

    // Update selected menu otomatis jika pindah halaman (opsional, untuk sinkronisasi UI)
    useEffect(() => {
        if (!isHistoryMode) {
            // Cari menu yang path-nya cocok dengan URL saat ini
            const activeItem = standardMenuItems.find(item => item.path && location.pathname.startsWith(item.path));
            if (activeItem) {
                setSelectedMenu(activeItem.name);
            }
        }
    }, [location.pathname, isHistoryMode]);


    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">

            {/* Sidebar */}
            <div
                className={`
                        fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300 
                        transform transition-all duration-300
                        ${isSidebarOpen
                        ? "translate-x-0 w-64"
                        : "-translate-x-full md:translate-x-0 md:w-20"}
                        `}
            >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <img
                        src="/img/logo_dago.png"
                        alt="Dago Logo"
                        className="h-10 mx-auto"
                    />
                    {/* Tombol close di mobile */}
                    {isSidebarOpen && (
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-6 w-6 text-gray-700" />
                        </button>
                    )}
                </div>


                {/* Menu Section */}
                <nav className="flex-1 py-4 space-y-1">
                    {currentMenuItems.map((item, index) => {
                        // Logika Highlight: 
                        // Jika mode history -> item "Detail Sesi" selalu aktif.
                        // Jika mode standar -> cek state selectedMenu.
                        const isActive = isHistoryMode 
                            ? item.name === "Detail Sesi" 
                            : selectedMenu === item.name;

                        return (
                            <div
                                key={index}
                                onClick={() => {
                                    if (item.path) navigate(item.path);
                                    if (item.action) item.action();
                                    
                                    // Hanya update state jika bukan mode history (karena mode history statis)
                                    if (!isHistoryMode && !item.action) {
                                        setSelectedMenu(item.name);
                                    }
                                    
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 cursor-pointer
                                    ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-800 hover:bg-blue-100"
                                    }
                                `}
                            >
                                <span className={`text-xl ${isActive ? "text-white" : "text-gray-700"}`}>
                                    {item.icon}
                                </span>
                                {/* Tampilkan teks jika sidebar terbuka */}
                                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                            </div>
                        );
                    })}
                </nav>
            </div>
            
            {/* Overlay (hanya tampil di mobile saat sidebar terbuka) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Header */}
                <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
                    {/* Left Section */}
                    <div className="flex items-center space-x-3">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>

                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                                {isHistoryMode ? "MODE RIWAYAT" : "POS KASIR"}
                            </h1>
                            <p className="text-sm text-gray-600">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-800">
                            {userProfile?.detail?.nama || userProfile?.email || "Pengguna"}
                        </span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.714 5.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
                <GlobalRentalMonitor />
            </div>

            {/* Modal Konfirmasi Logout */}
            {isLogoutModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 pt-5 w-full max-w-md mx-4 transform transition-all duration-300 scale-100 opacity-100">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <IoWarningOutline className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Konfirmasi Logout
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Apakah Anda yakin ingin keluar dari akun Anda?
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={executeLogout}
                            >
                                Logout
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => setIsLogoutModalOpen(false)}
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SidebarKasir;