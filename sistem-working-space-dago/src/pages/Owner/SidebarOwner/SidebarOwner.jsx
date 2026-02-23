import React, { useEffect, useState } from "react";
// --- PERBAIKAN: Impor Ikon Peringatan ---
import { Menu, X, TriangleAlert } from "lucide-react";
// --- AKHIR PERBAIKAN ---

import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../providers/AuthProvider";
import { BsGraphUpArrow } from "react-icons/bs";
import { SlLogout } from "react-icons/sl";
import { CiDollar } from "react-icons/ci";


const SidebarOwner = () => {
    const [selectedMenu, setSelectedMenu] = useState("Laporan");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- TAMBAHAN: State untuk modal konfirmasi ---
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    // --- AKHIR TAMBAHAN ---

    const navigate = useNavigate();
    const { userProfile, logout } = useAuth();

    // --- PERBAIKAN: handleLogout sekarang membuka modal ---
    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };
    // --- AKHIR PERBAIKAN ---

    // --- TAMBAHAN: Fungsi untuk menjalankan logout ---
    const executeLogout = () => {
        logout();
        // Tidak perlu navigate, AuthProvider akan menanganinya
    };
    // --- AKHIR TAMBAHAN ---

    // useEffect ini tidak diperlukan lagi
    // useEffect(() => {
    //   if (userProfile.roles !== "owner") {
    //     navigate("/");
    //   }
    // }, [userProfile]);


    const menuItems = [
        { name: "Laporan", icon: <BsGraphUpArrow />, path: "/laporan" },
        { name: "Bagi Hasil", icon: <CiDollar />, path: "/bagihasil" },
        {
            name: "Logout",
            icon: <SlLogout />,
            action: handleLogout // Ini sekarang memanggil fungsi yang membuka modal
        }
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">

            {/* Sidebar */}
            <div
                className={`
                fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300
                transform transition-all duration-300
                ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"}
                `}
                >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <img
                        src="/img/logo_dago.png"
                        alt="Dago Logo"
                        className="h-10 mx-auto"
                    />
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
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item, index) =>
                        item.action ? ( // Jika item punya 'action' (Logout)
                            <button
                                key={index}
                                onClick={item.action}
                                className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-800 hover:bg-blue-100"
                                    }`}
                            >
                                <span className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"}`}>
                                    {item.icon}
                                </span>
                                <span className={`font-medium ${!isSidebarOpen && 'md:hidden'}`}>{item.name}</span>
                            </button>
                        ) : ( // Jika item punya 'path' (Link biasa)
                            <Link
                                to={item.path}
                                key={index}
                                onClick={() => {
                                    setSelectedMenu(item.name);
                                    if (window.innerWidth < 768) {
                                        setIsSidebarOpen(false);
                                    }
                                }}
                                className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-800 hover:bg-blue-100"
                                    }`}
                            >
                                <span className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"}`}>
                                    {item.icon}
                                </span>
                                <span className={`font-medium ${!isSidebarOpen && 'md:hidden'}`}>{item.name}</span>
                            </Link>
                        )
                    )}
                </nav>
            </div>

            {/* Overlay (untuk mobile) */}
            {isSidebarOpen && (
                <div
                    // HAPUS class 'bg-black' dan 'bg-opacity-25' dari sini
                    className="fixed inset-0 z-30 md:hidden"



                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Header */}
                <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20">
                    {/* Left Section */}
                    <div className="flex items-center space-x-3">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-800">Welcome Owner</h1>
                            <p className="text-sm text-gray-600">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-800">
                            {userProfile?.detail?.nama || userProfile?.email || "Owner"}
                        </span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
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
                                onClick={executeLogout} // Memanggil fungsi logout
                            >
                                Logout
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => setIsLogoutModalOpen(false)} // Menutup modal
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

export default SidebarOwner;