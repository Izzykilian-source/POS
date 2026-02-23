// DashboardPengguna.jsx
import React, { useState, useContext, useEffect } from "react";
import {
    Home,
    Menu,
    X,
    Calendar,
    CreditCard,
    Building,
    Users,
    Diamond,
    History,
    LogOut,
    TriangleAlert, // --- TAMBAHAN: Ikon untuk modal ---
    MessageCircleQuestion
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { AuthContext } from "../../../providers/AuthProvider";
import { MdEvent, MdOutlineDiscount, MdOutlineMeetingRoom } from "react-icons/md";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { IoInformationCircleOutline } from "react-icons/io5";

const DashboardPengguna = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, logout } = useContext(AuthContext);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    // --- TAMBAHAN: State untuk modal konfirmasi ---
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const basePath = "";

    useEffect(() => {
        if (location.pathname === basePath || location.pathname === `${basePath}/`) {
            navigate(`${basePath}/informasi-ruangan`, { replace: true });
        }
    }, [location.pathname, navigate, basePath]);

    // --- PERBAIKAN: handleLogout sekarang membuka modal ---
    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    // --- TAMBAHAN: Fungsi untuk menjalankan logout ---
    const executeLogout = () => {
        logout?.();
        navigate("/");
        // tidak perlu setIsLogoutModalOpen(false) karena navigasi akan unmount
    };

    const menuItems = [
        {
            key: "informasi-ruangan",
            label: "Pesan Ruangan",
            icon: <Diamond size={18} />,
            path: "/informasi-ruangan",
        },
        {
            key: "membership",
            label: "Membership",
            icon: <Users size={18} />,
            path: "/membership",
        },
        {
            key: "virtual-office",
            label: "Virtual Office",
            icon: <Building size={18} />,
            path: "/virtual-office",
        },
        {
            key: "cek-kredit-membership",
            label: "Cek Kredit Membership",
            icon: <CreditCard size={18} />,
            path: "/cek-kredit-membership",
        },
        {
            key: "cek-masa-vo",
            label: "Cek Masa VO",
            icon: <Calendar size={18} />,
            path: "/cek-masa-vo",
        },
        {
            key: "event-spaces",
            label: "Event Spaces",
            icon: <MdOutlineMeetingRoom size={18} />,
            path: "/event-spaces",
        },
        {
            key: "promo-pelanggan",
            label: "Promo",
            icon: <MdOutlineDiscount size={18} />,
            path: "/promo-pelanggan",
        },
        {
            key: "informasi-acara",
            label: "Acara",
            icon: <MdEvent size={18} />,
            path: "/informasi-acara-pelanggan",
        },
        {
            key: "private-office",
            label: "Private Office",
            icon: <HiOutlineBuildingOffice2 size={18} />,
            path: "/private-office",
        },
        {
            key: "riwayat-transaksi",
            label: "Riwayat Transaksi",
            icon: <History size={18} />,
            path: "/riwayat-transaksi",
        },
        {
            key: "about-us",
            label: "About Us",
            icon: <IoInformationCircleOutline size={18} />,
            path: "/about-us",
        },
        {
            key: "faq",
            label: "FAQ",
            icon: <MessageCircleQuestion size={18} />,
            path: "/faq",
        },
    ];

    const isActive = (path) => location.pathname?.startsWith(`${basePath}${path}`);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* === Overlay hitam, muncul di semua layar === */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* === Sidebar === */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 w-64 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Header Sidebar */}
                <div className="flex items-center justify-between h-20 px-4 lg:px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="h-8 object-contain" />
                        <span className="font-semibold text-gray-700">Dago Space</span>
                    </div>
                    <button
                        className="p-1 rounded-md hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Tutup menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Menu Sidebar */}
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => {
                                navigate(`${basePath}${item.path}`);
                                setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                ${isActive(item.path)
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                        >
                            <span
                                className={
                                    isActive(item.path) ? "text-white" : "text-gray-500"
                                }
                            >
                                {item.icon}
                            </span>
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-2 lg:p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout} // <-- INI DIPERBARUI
                        className="w-full flex items-center space-x-3 lg:space-x-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 text-left text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm lg:text-base">Logout</span>
                    </button>
                </div>
            </aside>

            {/* === Konten Utama === */}
            <div className="flex-1 flex flex-col">
                <header className="flex items-center justify-between h-20 px-4 lg:px-6 bg-white border-b border-gray-200 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded-full hover:bg-gray-100"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Buka menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <p className="text-sm text-gray-500">Halo, Selamat Datang!</p>
                            <h1 className="text-lg font-bold text-gray-800">
                                {userProfile?.detail?.nama || "Pengguna"}
                            </h1>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Kembali ke Beranda"
                    >
                        <Home size={20} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children || <Outlet />}
                </main>
            </div>

            {/* --- TAMBAHAN: Modal Konfirmasi Logout --- */}
            {isLogoutModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm"
                    aria-labelledby="modal-title"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 pt-5 w-full max-w-md mx-4 transform transition-all duration-300 scale-100 opacity-100">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <TriangleAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
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
            {/* --- AKHIR TAMBAHAN --- */}
        </div>
    );
};

export default DashboardPengguna;