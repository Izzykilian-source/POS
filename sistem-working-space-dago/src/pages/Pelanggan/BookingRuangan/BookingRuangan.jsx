import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaClipboard,
} from "react-icons/fa";

const BookingRuangan = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const room = location.state?.room;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);

  // New state variables for time slots
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  // Mock data for booked slots. In a real app, you would fetch this from an API.
  const mockBookings = [
    { date: "2025-09-10", startTime: "10:00", endTime: "11:30" },
    { date: "2025-09-11", startTime: "14:00", endTime: "15:00" },
  ];

  // Function to generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8:00 AM
    const endHour = 22; // 10:00 PM
    for (let i = startHour; i < endHour; i += 0.5) {
      const hour = Math.floor(i);
      const minute = (i % 1) * 60;
      const time = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;
      slots.push(time);
    }
    setTimeSlots(slots);
  };

  // Function to check if a specific time slot is booked
  const isBooked = (slot) => {
    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    return mockBookings.some((booking) => {
      const bookingDate = booking.date;
      if (bookingDate !== selectedDateStr) {
        return false;
      }
      const [slotH, slotM] = slot.split(":").map(Number);
      const [bookingStartH, bookingStartM] = booking.startTime.split(":").map(Number);
      const [bookingEndH, bookingEndM] = booking.endTime.split(":").map(Number);

      const slotTime = slotH * 60 + slotM;
      const bookingStartTime = bookingStartH * 60 + bookingStartM;
      const bookingEndTime = bookingEndH * 60 + bookingEndM;

      return slotTime >= bookingStartTime && slotTime < bookingEndTime;
    });
  };

  // Handle a click on a time slot button
  const handleSlotClick = (slot) => {
    if (isBooked(slot)) {
      return;
    }

    if (!selectedStartTime) {
      setSelectedStartTime(slot);
      setSelectedEndTime(null);
    } else if (selectedStartTime && !selectedEndTime) {
      if (slot > selectedStartTime) {
        setSelectedEndTime(slot);
      } else {
        setSelectedEndTime(selectedStartTime);
        setSelectedStartTime(slot);
      }
    } else {
      setSelectedStartTime(slot);
      setSelectedEndTime(null);
    }
  };

  // Calculate duration based on selected start and end times
  const calculateDuration = () => {
    if (selectedStartTime && selectedEndTime) {
      const [h1, m1] = selectedStartTime.split(":").map(Number);
      const [h2, m2] = selectedEndTime.split(":").map(Number);
      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      return (minutes2 - minutes1) / 60;
    }
    return 0;
  };

  useEffect(() => {
    generateTimeSlots();
    // In a real app, you'd fetch booked slots for the selectedDate here
    // e.g., fetchBookings(selectedDate).then(data => setBookedSlots(data));
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-4">
      <div className="bg-white w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl rounded-2xl shadow-lg p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 pb-3">
            <button
              className="text-gray-700 hover:text-blue-600"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft size={20} />
            </button>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
              Booking Ruangan
            </h2>
          </div>
          <hr className="border-gray-300" />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Calendar */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FaCalendarAlt className="text-blue-500" />
              <p className="text-gray-600 font-medium">Pilih Tanggal</p>
            </div>
            <div className="flex justify-center">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                minDate={new Date()}
                prev2Label={null}
                next2Label={null}
                className="rounded-xl border border-gray-300 p-2"
              />
            </div>
          </div>

          {/* Time & Duration Grid */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FaClock className="text-blue-500" />
              <p className="text-gray-600 font-medium">Pilih Jam</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {timeSlots.map((slot, index) => {
                const isSelected = slot === selectedStartTime || slot === selectedEndTime;
                const isBetween =
                  selectedStartTime &&
                  selectedEndTime &&
                  ((slot > selectedStartTime && slot < selectedEndTime) ||
                    (slot < selectedStartTime && slot > selectedEndTime));
                const slotBooked = isBooked(slot);
                const isPast =
                  selectedDate.toDateString() === new Date().toDateString() &&
                  slot < `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

                return (
                  <button
                    key={index}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slotBooked || isPast}
                    className={`
                      p-2 text-xs rounded-lg font-medium transition-all duration-200
                      ${slotBooked || isPast
                          ? "bg-red-200 text-gray-500 cursor-not-allowed line-through"
                          : ""
                      }
                      ${isSelected ? "bg-blue-600 text-white shadow-lg" : ""}
                      ${isBetween ? "bg-blue-300 text-blue-800" : ""}
                      ${!slotBooked && !isSelected && !isBetween && !isPast
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          : ""
                      }
                    `}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {/* Display duration */}
            <div className="mt-4 text-center">
              <p className="block text-gray-600 text-sm mb-1">
                Durasi (jam): <span className="font-semibold text-blue-600">{calculateDuration()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2 text-gray-600 font-medium">
              <FaUser className="text-blue-500" />
              <span>Nama</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-100 p-3 mt-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2 text-gray-600 font-medium">
              <FaPhone className="text-blue-500" />
              <span>No. HP</span>
            </label>
            <input
              type="tel"
              placeholder="No. HP"
              value={phone}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) setPhone(value);
              }}
              className="w-full rounded-xl border border-gray-300 bg-gray-100 p-3 mt-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-gray-600 font-medium">
            <FaClipboard className="text-blue-500" />
            <span>Keperluan</span>
          </label>
          <input
            type="text"
            placeholder="Masukkan keperluan (opsional)"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-100 p-3 mt-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Button */}
        <button
          onClick={() => setOpenDetail(true)}
          disabled={!name || !phone || !selectedStartTime || !selectedEndTime || calculateDuration() <= 0 || !/^[0-9]*$/.test(phone)}
          className={`w-full font-semibold py-3 rounded-xl shadow transition 
            ${
              !name || !phone || !selectedStartTime || !selectedEndTime || calculateDuration() <= 0 || !/^[0-9]*$/.test(phone)
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          Place Booking
        </button>
      </div>

      {/* Detail Booking Pop-up */}
      {openDetail && (
        <div
          className="fixed inset-0 bg-opacity-30 z-50 flex justify-center items-end"
          onClick={() => setOpenDetail(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-lg p-4 sm:p-6 max-h-[70vh] overflow-y-auto w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-bold tracking-wide mb-6">
              Detail Booking
            </h2>

            <div className="border rounded-xl p-4 mb-6 bg-gray-50 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Tanggal</span>
                <span>
                  {selectedDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Waktu</span>
                <span>
                  {selectedStartTime} - {selectedEndTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nama</span>
                <span>{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">No Hp</span>
                <span>{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Keperluan</span>
                <span>{purpose || "-"}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOpenDetail(false);
                setOpenBilling(true);
              }}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 transition"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* Billing Pop-up */}
      {openBilling && (
        <div
          className="fixed inset-0 bg-opacity-30 z-50 flex justify-center items-end"
          onClick={() => setOpenBilling(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-lg p-4 sm:p-6 max-h-[80vh] overflow-y-auto w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-bold tracking-wide mb-6">
              BILLING
            </h2>

            <div className="border rounded-xl p-4 mb-6 bg-gray-50">
              <div className="flex justify-between text-sm mb-2">
                <span>{calculateDuration()} jam x Rp50.000</span>
                <span>Rp{calculateDuration() * 50000}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Biaya Layanan</span>
                <span>Rp25.000</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>Rp{calculateDuration() * 50000 + 25000}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">
                Metode Pembayaran
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="qris"
                  name="payment"
                  className="accent-blue-600"
                  defaultChecked // Assuming QRIS is the default option
                />
                <label htmlFor="qris">Qris</label>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/payment/${room.id}`, {
                  state: {
                    room,
                    selectedDate,
                    startTime: selectedStartTime,
                    endTime: selectedEndTime,
                    duration: calculateDuration(),
                    name,
                    phone,
                    purpose,
                  },
                })
              }
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 transition"
            >
              Place Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRuangan;