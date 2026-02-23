import React, { Children, useContext, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { BsCart3, BsGraphUpArrow } from "react-icons/bs";
import { MdChair } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { Card, Table } from "antd";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const DashboardAdmin = ({ children }) => {
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  useEffect(() => {
    if (userProfile.roles !== "admin_dago") {
      navigate("/");
    }
  }, [userProfile]);

  // === Dummy Data ===
  


  const menuItems = [
    { name: "Dashboard", icon: <BsGraphUpArrow />, path:"/" },
    { name: "Space Rental", icon: <MdChair /> },
    { name: "Transaksi", icon: <BsCart3 /> },
    { name: "Master Data", icon: <FaDatabase /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300 
          transform transition-all duration-300
          ${
            isSidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full md:translate-x-0 md:w-20"
          }`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <img
            src="../../../assets/images/logo.png"
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
        <nav className="flex-1 py-4 space-y-1">
          {menuItems.map((item, index) => (
            <Link
              to="/"
              key={index}
              onClick={() => setSelectedMenu(item.name)}
              className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${
                selectedMenu === item.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-800 hover:bg-blue-100"
              }`}
            >
              <span
                className={`text-xl ${
                  selectedMenu === item.name ? "text-white" : "text-gray-700"
                }`}
              >
                {item.icon}
              </span>
              {isSidebarOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 bg-white overflow-y-auto">
        {/* Header */}
        <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
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
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                POS DASHBOARD
              </h1>
              <p className="text-sm text-gray-600">
                Dago Creative Hub & Coffee Lab
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-800">ADMIN</span>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
              {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;