// src/components/GlobalRentalMonitor.jsx

import React, { useState, useEffect } from 'react';
import { notification } from 'antd'; // 💎 1. Import sistem notifikasi Ant Design
import { ClockCircleOutlined } from '@ant-design/icons'; // Import ikon (opsional)
import { getKasirDashboardData } from '../services/service'; // Sesuaikan path jika perlu
import RentalTimer from './RentalTimer';

const GlobalRentalMonitor = () => {
  const [activeRentals, setActiveRentals] = useState([]);

  useEffect(() => {
    const fetchActiveRentals = async () => {
      try {
        const data = await getKasirDashboardData(); 
        setActiveRentals(data.rentals.active || []);
      } catch (err) {
        console.error("Gagal polling data rental:", err);
      }
    };

    fetchActiveRentals(); 
    const intervalId = setInterval(fetchActiveRentals, 60000); // Tetap polling tiap 1 menit
    return () => clearInterval(intervalId);
  }, []);

  // 💎 2. Buat fungsi untuk menampilkan pop-up notifikasi
  const triggerNotification = (rental) => {
    // 'rental' berisi info seperti { client, unit, ... }
    notification.warning({
      message: 'Waktu Sewa Segera Habis',
      // --- UBAH BARIS INI ---
      description: `Sewa atas nama "${rental.client || 'N/A'}" di unit "${(rental.unit || 'N/A').toUpperCase()}" akan berakhir dalam 15 menit.`,
      // --- AKHIR PERUBAHAN ---
      placement: 'topRight', // Posisi pop-up
      duration: 10, // Tampilkan selama 10 detik
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />, // Ikon penanda
    });
  };

  return (
    // Div ini tetap tersembunyi
    <div style={{ display: 'none' }}> 
      {activeRentals.map(rental => (
        <RentalTimer
          key={rental.id}
          startTime={rental.waktu_mulai}
          endTime={rental.waktu_selesai}
          // 💎 3. 'Sambungkan' pemicu notifikasi
          // Saat timer 15 menit, ia akan memanggil triggerNotification(rental)
          onNotify={() => triggerNotification(rental)}
        />
      ))}
    </div>
  );
};

export default GlobalRentalMonitor;