import React, { useState, useEffect } from "react";
import { Button, Select, Tag, Spin } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Option } = Select;

// ✅ Data Dummy Kasir
const dummyData = {
  2025: {
    Oktober: [
      { id: 1, date: "01 Oktober 2025", status: "close" },
      { id: 2, date: "02 Oktober 2025", status: "close" },
      { id: 3, date: "03 Oktober 2025", status: "close" },
      { id: 4, date: "04 Oktober 2025", status: "open" },
    ],
    November: [
      { id: 5, date: "01 November 2025", status: "close" },
      { id: 6, date: "02 November 2025", status: "close" },
      { id: 7, date: "03 November 2025", status: "open" },
    ],
  },
  2024: {
    Desember: [
      { id: 8, date: "25 Desember 2024", status: "close" },
      { id: 9, date: "26 Desember 2024", status: "close" },
    ],
  },
};

const KasirSession = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("Oktober");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const data =
        dummyData[selectedYear]?.[selectedMonth] || [];
      setSessions(data);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth]);

  const formatTime = (date) => date.format("HH : mm : ss");

  const monthOptions = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ].map((m) => ({ value: m, label: m }));

  const yearOptions = ["2025", "2024", "2023"].map((y) => ({
    value: y,
    label: y,
  }));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800 font-sans">
      {/* Left Panel */}
      <div className="flex-1 bg-white flex flex-col border-r border-gray-200 p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
          <div className="text-lg font-semibold">Cashier Session</div>
          <div className="flex gap-3">
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              size="middle"
            />
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
              size="middle"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin tip="Memuat sesi kasir..." />
          </div>
        ) : sessions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 transition"
              >
                <Tag
                  color={session.status === "close" ? "green" : "orange"}
                  className="px-3 py-1 text-sm font-semibold rounded flex items-center gap-1"
                >
                  {session.status === "close" ? (
                    <>
                      <CheckCircleOutlined /> CLOSE
                    </>
                  ) : (
                    <>
                      <ClockCircleOutlined /> OPEN
                    </>
                  )}
                </Tag>
                <span className="text-gray-700 font-medium text-sm truncate">
                  Cashier {session.date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            Tidak ada sesi kasir pada bulan ini.
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8">
        <img
          src="/logo-dago.png" // Ganti sesuai logo kamu
          alt="dago logo"
          className="w-40 mb-10"
        />
        <div className="text-6xl font-mono font-bold tracking-widest">
          {formatTime(currentTime)}
        </div>
        <div className="text-gray-500 text-sm mt-2">
          Asia/Makassar <br />
          <span className="text-gray-400">Waktu Server</span>
        </div>
      </div>
    </div>
  );
};

export default KasirSession;
