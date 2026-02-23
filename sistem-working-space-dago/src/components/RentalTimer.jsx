// src/components/RentalTimer.jsx

import React, { useState, useEffect, useRef } from 'react';

// 💎 1. Tambahkan prop 'onNotify' dengan nilai default fungsi kosong
const RentalTimer = ({ startTime, endTime, visualOnly = false, onNotify = () => { } }) => {

  const notificationSound = useRef(null);
  const [hasPlayedNotification, setHasPlayedNotification] = useState(false);

  useEffect(() => {
    if (visualOnly) return;

    // 💡 INGAT: Pastikan path ini benar (dari root folder 'public')
    notificationSound.current = new Audio("/sounds/notification_ruangan.mp3");
  }, [visualOnly]);

  // --- Fungsi calculateTimeLeft biarkan sama ---
  const calculateTimeLeft = () => {
    const now = +new Date();
    const start = +new Date(startTime);
    const end = +new Date(endTime);
    let timeLeft = {};

    if (now < start) {
      const difference = start - now;
      timeLeft = {
        status: 'UPCOMING',
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else if (now >= start && now <= end) {
      const difference = end - now;
      timeLeft = {
        status: 'ACTIVE',
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalSeconds: difference / 1000,
      };
    } else {
      timeLeft = { status: 'FINISHED', totalSeconds: 0 };
    }
    return timeLeft;
  };
  // ---------------------------------------------

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!visualOnly) {
      setHasPlayedNotification(false);
    }
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime, visualOnly]);

  // 💎 2. Modifikasi useEffect untuk notifikasi
  useEffect(() => {
    if (visualOnly) return; // Skip jika hanya visual

    if (
      !hasPlayedNotification &&
      timeLeft.status === 'ACTIVE' &&
      timeLeft.totalSeconds <= 900 &&
      timeLeft.totalSeconds > 0
    ) {
      // 1. Putar suara (seperti sebelumnya)
      notificationSound.current.play().catch(e => console.error("Gagal memutar suara:", e));

      // 2. Panggil callback 'onNotify' (untuk memicu pop-up)
      onNotify();

      // 3. Tandai sudah notifikasi
      setHasPlayedNotification(true);
    }
  }, [timeLeft, hasPlayedNotification, visualOnly, onNotify]); // 💎 3. Tambahkan 'onNotify' ke dependencies

  // --- Sisa kode render (visual) tidak perlu diubah ---
  const getTimeLevelAndColor = () => {
    if (timeLeft.status === 'UPCOMING') return { color: 'bg-orange-200 text-black' };
    if (timeLeft.status === 'FINISHED' || timeLeft.totalSeconds <= 0) return { color: 'bg-gray-200 text-black' };
    if (timeLeft.totalSeconds > 3600) return { color: 'bg-green-200 text-black' };
    if (timeLeft.totalSeconds > 900) return { color: 'bg-yellow-200 text-black' };
    return { color: 'bg-red-200 text-black' };
  };

  const { color } = getTimeLevelAndColor();
  const { hours, minutes, seconds } = timeLeft;

  let formattedTime;
  let prefix = '';

  if (timeLeft.status === 'UPCOMING') {
    prefix = 'Starts in ';
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (timeLeft.status === 'ACTIVE') {
    prefix = '⏱ ';
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    formattedTime = "Finished";
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <span>{prefix}{formattedTime}</span>
    </div>
  );
};

export default RentalTimer;