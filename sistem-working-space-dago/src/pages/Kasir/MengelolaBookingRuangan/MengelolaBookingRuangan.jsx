import React from "react";
import {
  Menu,
  ShoppingCart,
  Package,
  Clock,
  BarChart,
  Settings,
} from "lucide-react";

const MengelolaBookingRuangan = () => {
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


    </div>
  );
};

export default MengelolaBookingRuangan;
