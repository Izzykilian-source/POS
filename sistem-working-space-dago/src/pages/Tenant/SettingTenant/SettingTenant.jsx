import React, { useState } from "react";
import { Button } from "antd";

const SettingTenant = () => {
  const [darkMode, setDarkMode] = useState(false);

  const sectionClass = `rounded-xl border border-gray-200 mb-5 ${
    darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white"
  }`;

  const dividerClass = `${darkMode ? "border-gray-700" : "border-gray-200"}`;

  return (
    <div
      className={`p-8 overflow-y-auto flex-1 transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white"
      }`}
    >
      <h2 className="text-xl font-semibold mb-6 tracking-tight text-gray-700">
        Setting & Utility
      </h2>

      {/* Hardware */}
      <div className={sectionClass}>
        <div className={`px-5 py-3 border-b font-medium ${dividerClass}`}>
          Hardware
        </div>
        <div className="flex justify-between items-center px-5 py-3">
          <div>
            <p className="font-medium mb-0">Connect to Printer</p>
            <p className="text-gray-500 text-xs">
              Belum terhubung dengan printer
            </p>
          </div>
          <Button type="primary" className="rounded-md">
            Scan
          </Button>
        </div>
      </div>

      {/* Account */}
      <div className={sectionClass}>
        <div className={`px-5 py-3 border-b font-medium ${dividerClass}`}>
          Account
        </div>
        <div className="flex justify-between items-center px-5 py-3">
          <span className="text-red-600 font-medium">Sign Out</span>
          <Button type="primary" danger className="rounded-md">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingTenant;