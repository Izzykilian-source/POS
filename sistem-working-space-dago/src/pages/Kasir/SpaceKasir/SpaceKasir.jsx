import React, { useState, useEffect } from "react";
import { Input, Button, Tag, Spin, Alert, Collapse, Segmented } from "antd"; // 1. Import Segmented
import { getKasirDashboardData } from "../../../services/service";
import RentalTimer from "../../../components/RentalTimer";

const { Search } = Input;
const { Panel } = Collapse;

// Helper: gabungkan unit (Tidak berubah)
const getCombinedSpaceUnits = (availableUnits, activeRentals) => {
  const allUnits = [...availableUnits];
  const rentedUnits = activeRentals.map((r) => r.unit);

  const combinedUnits = rentedUnits.reduce((acc, unitName) => {
    const isAlreadyAvailable = acc.some(
      (u) => u.name.toLowerCase() === unitName.toLowerCase()
    );
    if (!isAlreadyAvailable) {
      acc.push({ name: unitName, isRented: true });
    }
    return acc;
  }, allUnits.map((u) => ({ name: u, isRented: false })));

  const finalUnits = combinedUnits.map((unit) => {
    const isRented = rentedUnits.some(
      (rName) => rName.toLowerCase() === unit.name.toLowerCase()
    );
    return { name: unit.name, isRented };
  });

  finalUnits.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
  return finalUnits;
};

const SpaceKasir = () => {
  const [status, setStatus] = useState("Active"); // Filter status (existing)
  const [sourceFilter, setSourceFilter] = useState("All"); // Filter source (new)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    todayTransaction: 0,
    spaceRental: 0,
    spaceAvailable: 0,
  });
  const [spaceTypes, setSpaceTypes] = useState([]);
  const [spaceUnitsAvailable, setSpaceUnitsAvailable] = useState([]);
  const [rentals, setRentals] = useState({ upcoming: [], active: [], finish: [] });
  const [combinedUnits, setCombinedUnits] = useState([]);

  // useEffect untuk fetch data (Tidak berubah)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getKasirDashboardData();
        setSummary(data.summary);
        setSpaceTypes(data.spaceTypes);
        setSpaceUnitsAvailable(data.availableUnits);
        setRentals(data.rentals);
        setCombinedUnits(getCombinedSpaceUnits(data.availableUnits, data.rentals.active));
        setError(null);
      } catch (err) {
        setError("Gagal memuat data dari server. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // useEffect untuk update combined units (Tidak berubah)
  useEffect(() => {
    if (!loading) {
      const allUnits = getCombinedSpaceUnits(spaceUnitsAvailable, rentals.active);
      setCombinedUnits(allUnits);
    }
  }, [rentals.active, spaceUnitsAvailable, loading]);

  // Filter utama
  let displayedRentals = [];
  if (status === "Upcoming") displayedRentals = rentals.upcoming;
  else if (status === "Active") displayedRentals = rentals.active;
  else displayedRentals = rentals.finish;

  // Filter source tambahan
  const finalFilteredRentals = displayedRentals.filter(rental => {
    if (sourceFilter === "All") return true;
    if (sourceFilter === "Online") return rental.booking_source === 'RoomDetail';
    if (sourceFilter === "Private Office") return rental.booking_source === 'PrivateOffice';
    if (sourceFilter === "Walk-In") return rental.booking_source === 'KasirWalkIn';
    if (sourceFilter === "Lainnya") {
      return !['RoomDetail', 'PrivateOffice', 'KasirWalkIn'].includes(rental.booking_source);
    }
    return true;
  });

  // Kelompokkan per customer
  const groupedByCustomer = finalFilteredRentals.reduce((acc, rental) => {
    if (!acc[rental.client]) acc[rental.client] = [];
    acc[rental.client].push(rental);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" tip="Memuat Data Dasbor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen transition-all duration-300">
      {/* 🔍 Search bar */}
      <Search
        placeholder="Search"
        allowClear
        className="w-full rounded-lg shadow-sm focus:shadow-md transition-all"
      />

      {/* 📊 Top Summary */}
      <div className="rounded-xl shadow-md p-6 border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-5 tracking-wide text-center">
          Space Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Today Transaction</p>
            <p className="text-2xl font-bold text-blue-700">
              Rp {summary.todayTransaction.toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Space Rental</p>
            <p className="text-2xl font-bold text-blue-700">{summary.spaceRental}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Space Available</p>
            <p className="text-2xl font-bold text-blue-700">{summary.spaceAvailable}</p>
          </div>
        </div>
      </div>

      {/* 🧩 Space Unit Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 tracking-wide">
          Space Unit Type
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaceTypes.map((type, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center bg-white rounded-lg p-4 shadow-xs hover:shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-sm font-semibold text-gray-600 mb-1">
                {type.name}
              </span>
              <div className="flex items-center space-x-2">
                <Tag color="blue" className="text-xs font-medium">
                  Total: {type.total}
                </Tag>
                <Tag color="green" className="text-xs font-medium">
                  Available: {type.available}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟩 Space Units */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 tracking-wide">
          Space Units Available
        </h3>
        <div className="flex flex-wrap gap-3">
          {combinedUnits.map((unit, index) => {
            const isRented = unit.isRented;
            const unitClass = isRented
              ? "bg-blue-400 text-white cursor-not-allowed"
              : "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer";
            return (
              <div
                key={index}
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md border border-gray-200 relative transition-all duration-300 hover:-translate-y-1 ${unitClass}`}
                title={isRented ? "Sedang digunakan" : "Tersedia"}
              >
                <span className="font-semibold text-center text-sm">{unit.name}</span>
                {isRented && (
                  <span className="absolute top-1 right-1 text-xs">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🧾 Space Rental per Customer */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 tracking-wide mb-3">
          Space Booking per Customer
        </h3>

        {/* 🔹 Filter Bar - kiri & kanan */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          {/* Kiri: Upcoming, Active, Finish */}
          <Segmented
            options={["Upcoming", "Active", "Finish"]}
            value={status}
            onChange={(value) => setStatus(value)}
          />

          {/* Kanan: All, Online, Private Office, Walk-In, Lainnya */}
          <Segmented
            options={["All", "Online", "Private Office", "Walk-In", "Lainnya"]}
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value)}
          />
        </div>

        {Object.keys(groupedByCustomer).length > 0 ? (
          <Collapse
            bordered={false}
            expandIconPosition="end"
            className="bg-transparent space-y-4"
          >
            {Object.entries(groupedByCustomer).map(([client, bookings]) => (
              <Panel
                key={client}
                header={
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold text-gray-800">{client}</h4>
                    <Tag color="blue">{bookings.length} Booking</Tag>
                  </div>
                }
                className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-2"
              >
                <div className="space-y-4">
                  {bookings.map((rental) => {
                    const isUpcoming = new Date(rental.waktu_mulai) > new Date();

                    let sourceTag = null;
                    if (rental.booking_source === 'PrivateOffice') {
                      sourceTag = <Tag color="purple">Private Office</Tag>;
                    } else if (rental.booking_source === 'RoomDetail') {
                      sourceTag = <Tag color="cyan">Online</Tag>;
                    } else if (rental.booking_source === 'KasirWalkIn') {
                      sourceTag = <Tag color="gold">Walk-In</Tag>;
                    } else if (rental.booking_source) {
                      sourceTag = <Tag color="default">{rental.booking_source}</Tag>;
                    } else {
                      sourceTag = <Tag color="grey">Lainnya</Tag>;
                    }

                    return (
                      <div
                        key={rental.id}
                        className="flex justify-between items-center bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 text-base">
                            {rental.unit.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">{rental.date}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {isUpcoming ? (
                              <Tag color="orange">UPCOMING</Tag>
                            ) : status === "Active" ? (
                              <Tag color="green">ACTIVE</Tag>
                            ) : (
                              <Tag color="default">FINISHED</Tag>
                            )}
                            {sourceTag}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-blue-600 font-bold text-lg">
                            Rp {rental.price.toLocaleString("id-ID")}
                          </p>
                          {status === "Finish" ? (
                            <Tag>Finished</Tag>
                          ) : (
                            <RentalTimer
                              startTime={rental.waktu_mulai}
                              endTime={rental.waktu_selesai}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <div className="text-center py-10 text-gray-500">
            Tidak ada data sewa untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceKasir;
