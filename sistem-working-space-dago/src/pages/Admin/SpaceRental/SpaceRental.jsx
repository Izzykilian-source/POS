import React, { useState, useEffect } from "react";
import { Input, Button, Tag, Spin, Alert } from "antd";
import { getKasirDashboardData } from "../../../services/service";
import RentalTimer from "../../../components/RentalTimer"; // Pastikan path ini benar

const { Search } = Input;

// Fungsi helper ini sudah benar, tidak perlu diubah
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

const SpaceRental = () => {
  const [status, setStatus] = useState("Active");
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

  useEffect(() => {
    if (!loading) {
      const allUnits = getCombinedSpaceUnits(spaceUnitsAvailable, rentals.active);
      setCombinedUnits(allUnits);
    }
  }, [rentals.active, spaceUnitsAvailable, loading]);
  
  // Menggabungkan booking 'upcoming' dan 'active' untuk ditampilkan di tab "Active"
  const activeAndUpcomingRentals = [...rentals.upcoming, ...rentals.active];
  const displayedRentals = status === "Active" ? activeAndUpcomingRentals : rentals.finish;

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
      {/* Search bar */}
      <Search
        placeholder="Search"
        allowClear
        className="w-full rounded-lg shadow-sm focus:shadow-md transition-all"
      />

      {/* Top Summary */}
      <div className="rounded-xl shadow-md p-6 border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-5 tracking-wide text-center">
          Space Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-600 mb-1">Today Transaction</p>
            <p className="text-2xl font-bold text-blue-700">
              Rp {summary.todayTransaction.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-600 mb-1">Space Rental</p>
            <p className="text-2xl font-bold text-blue-700">{summary.spaceRental}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-600 mb-1">Space Available</p>
            <p className="text-2xl font-bold text-blue-700">{summary.spaceAvailable}</p>
          </div>
        </div>
      </div>

      {/* Section: Space Unit Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 tracking-wide">
          Space Unit Type
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaceTypes.map((type, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center bg-white rounded-lg p-3 shadow-xs hover:shadow-sm border border-gray-100 transition-all duration-200"
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

      {/* Section: Space Units Available */}
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
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md border border-gray-200 relative ${unitClass}`}
                title={isRented ? "Sedang digunakan" : "Tersedia"}
              >
                <span className="font-semibold text-center text-sm">
                  {unit.name}
                </span>
                {isRented && (
                  <span className="absolute top-1 right-1 text-xs">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Space Rental (Today) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-700 tracking-wide">
            Space Rental (Today)
          </h3>
          <div className="space-x-2">
            <Button
              type={status === "Active" ? "primary" : "default"}
              onClick={() => setStatus("Active")}
              className="rounded-lg"
            >
              Active
            </Button>
            <Button
              type={status === "Finish" ? "primary" : "default"}
              onClick={() => setStatus("Finish")}
              className="rounded-lg"
            >
              Finish
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {displayedRentals.length > 0 ? (
            displayedRentals.map((rental) => {
              // Menentukan apakah booking ini 'upcoming' atau 'active'
              const isUpcoming = new Date(rental.waktu_mulai) > new Date();

              return (
                <div
                  key={rental.id}
                  className="flex justify-between items-center bg-white rounded-xl shadow-sm hover:shadow-md p-5 transition-all duration-300 border border-gray-100"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{rental.client}</p>
                    <p className="text-sm text-gray-600">{rental.unit.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{rental.date}</p>
                    
                    {/* PERBAIKAN 1: Tag Status Dinamis */}
                    <div className="flex gap-2 mt-2">
                      {isUpcoming ? (
                        <Tag color="orange">UPCOMING</Tag>
                      ) : (
                        <Tag color="green">ACTIVE</Tag>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-blue-600 font-bold">
                      Rp {rental.price.toLocaleString("id-ID")}
                    </p>
                    {status === "Active" ? (
                      // PERBAIKAN 2: Melewatkan startTime ke RentalTimer
                      <RentalTimer
                        startTime={rental.waktu_mulai}
                        endTime={rental.waktu_selesai}
                      />
                    ) : (
                      <Tag>Finished</Tag>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500">
              Tidak ada data sewa untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceRental;