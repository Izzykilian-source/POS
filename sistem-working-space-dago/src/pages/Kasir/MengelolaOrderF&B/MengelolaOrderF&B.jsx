import React from "react";
import {
  Menu,
  ShoppingCart,
  Package,
  Clock,
  BarChart,
  Settings,
} from "lucide-react";

const MengelolaOrderF_B = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome 😊</h1>
          <p className="text-gray-500">Dapoqing Creative Hub & Coffee Lab</p>
        </div>
        <div className="text-right text-gray-600">
          <p>Tue, Sep 2</p>
          <p>8:36 AM</p>
        </div>
      </div>

      {/* Order Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Jumlah Order (1)
            <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              + New Order
            </button>
          </h2>
        </div>
        <div className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Tes Hh</p>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm mr-2">
              Dine In
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
              Rm2
            </span>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded">
            SUCCESS
          </span>
        </div>
      </div>
    </div>
  );
};

export default MengelolaOrderF_B;
