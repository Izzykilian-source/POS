import React, { useContext, useEffect, useState } from "react";
import { Menu, X } from "lucide-react"; // ✅ icon buka/tutup sidebar
import { useNavigate } from "react-router-dom";
import RiwayatPesananPage from "../../Pelanggan/RiwayatPesanan/RiwayatPesanan";
import PengelolaUser from "../../Admin/PengelolaUser/PengelolaUser";
import PengelolaRuangan from "../../Admin/PengelolaRuangan/PengelolaRuangan";
import PengelolaPromo from "../../Admin/PengelolaPromo/PengelolaPromo";
import PengelolaMembership from "../../Admin/PengelolaMembership/PengelolaMembership";
import { AuthContext } from "../../../providers/AuthProvider";
import { BsBox2, BsBox2Fill, BsCart, BsCart3, BsCartFill, BsFileBarGraph, BsGraphUpArrow } from "react-icons/bs";
import { MdChair, MdHistory, MdOutlineChair, MdOutlineHistory } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { GrCart } from "react-icons/gr";
import { FaHouse } from "react-icons/fa6";
import { RiHomeOfficeLine } from "react-icons/ri";
import { IoSettingsOutline } from "react-icons/io5";
import TransaksiKasir from "../TransaksiKasir/TransaksiKasir";
import MerchantKasir from "../MerchantKasir/MerchantKasir";
import ProductKasir from "../ProductKasir/ProductKasir";
import HistoryKasir from "../HistoryKasir/HistoryKasir";
import SpaceKasir from "../SpaceKasir/SpaceKasir";
import SettingsKasir from "../SettingsKasir/SettingsKasir";

// Komponen DashboardContent (biarkan sama)

const DashboardKasir = () => {
    const [selectedMenu, setSelectedMenu] = useState("Transaksi");
    const [showBilling, setShowBilling] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { userProfile } = useContext(AuthContext);

    useEffect(() => {
        if (userProfile.roles == "kasir") {
            navigate("/");
        }
    }, [userProfile]);

    const [orders, setOrders] = useState([
        { id: 1, name: "Xes", orderId: "#001", status: "WAITING", price: 57000, avatar: "X" },
        { id: 2, name: "Meca", orderId: "#002", status: "SUCCESS", price: 15000, avatar: "M" },
        { id: 3, name: "Jonathan", orderId: "#003", status: "SUCCESS", price: 28000, avatar: "J" },
        { id: 4, name: "24st7", orderId: "#004", status: "TAKE AWAY", price: 15000, avatar: "2" },
        { id: 5, name: "Diah", orderId: "#005", status: "SUCCESS", price: 30000, avatar: "D" },
    ]);

    const menuItems = [
        { name: "Transaksi", icon: <GrCart /> },
        { name: "Merchant", icon: <RiHomeOfficeLine /> },
        { name: "Product", icon: <BsBox2 /> },
        { name: "History", icon: <MdOutlineHistory /> },
        { name: "Report", icon: <BsGraphUpArrow /> },
        { name: "Space", icon: <MdOutlineChair /> },
        { name: "Settings", icon: <IoSettingsOutline /> },

    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "WAITING": return "bg-yellow-100 text-yellow-800";
            case "SUCCESS": return "bg-green-100 text-green-800";
            case "TAKE AWAY": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const handleStatusChange = (orderId) => {
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId
                    ? { ...order, status: ["WAITING", "SUCCESS", "TAKE AWAY"][(["WAITING", "SUCCESS", "TAKE AWAY"].indexOf(order.status) + 1) % 3] }
                    : order
            )
        );
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
            .format(price)
            .replace("IDR", "Rp.");

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">

            {/* Sidebar */}
            <div
                className={`
                            fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300 
                            transform transition-all duration-300
                            ${isSidebarOpen
                        ? "translate-x-0 w-64"              // kalau open → full (mobile & desktop)
                        : "-translate-x-full md:translate-x-0 md:w-20"} // kalau close → hilang di mobile, 20px di desktop
                        `}
            >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <img
                        src="../../../../public/img/logo_dago.png"
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
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setSelectedMenu(item.name);
                                if (window.innerWidth < 768) {
                                    setIsSidebarOpen(false); // hanya close kalau layar < md (mobile)
                                }
                            }}

                            className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                ? "bg-blue-600 text-white"
                                : "text-gray-800 hover:bg-blue-100"
                                }`}
                        >
                            <span
                                className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"
                                    }`}
                            >
                                {item.icon}
                            </span>
                            {isSidebarOpen && <span className="font-medium">{item.name}</span>}

                        </button>
                    ))}
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
            <div className="flex-1 bg-white overflow-y-auto">
                {/* Header */}
                <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
                    {/* Left Section */}
                    <div className="flex items-center space-x-3">
                        {/* Tombol menu (tampil di mobile & desktop) */}
                        <button
                            className="p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <X className="h-6 w-6 text-gray-700" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-700" />
                            )}
                        </button>

                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-800">POS KASIR</h1>
                            <p className="text-sm text-gray-600">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-800">KASIR</span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.714 5.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}

            </div>
        </div>
    );
};

export default DashboardKasir;
