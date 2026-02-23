// SidebarAdmin.jsx
import React from "react";
import { Link } from "react-router-dom";

const SidebarKasir = ({ menuItems, selectedMenu, setSelectedMenu }) => {
  return (
    <div className="hidden md:flex md:w-64 lg:w-72 bg-white shadow-xl border-r border-gray-200 flex-col">
      {/* Logo / Brand */}
      <div className="p-4 lg:p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-base lg:text-lg">
              CL
            </span>
          </div>
          <span className="text-lg lg:text-xl font-semibold text-gray-800">
            Dago ENG  
          </span>
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 p-2 lg:p-4 space-y-2">
        {menuItems.map((item, index) => (
          <Link
          to={`${item.path}`}
            key={index}
            onClick={() => setSelectedMenu(item.name)}
            className={`w-full flex items-center space-x-3 lg:space-x-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 text-left ${
              selectedMenu === item.name
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <span className="text-lg lg:text-xl">{item.icon}</span>
            <span className="font-medium text-sm lg:text-base">
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SidebarKasir;
