import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider'; // Pastikan path ini benar
import { Spin } from 'antd';

/**
 * Guard ini HANYA mengecek apakah sesi sudah "join" (ada di AuthContext).
 * Guard ini TIDAK mengecek role. Pengecekan role harus dilakukan oleh
 * <PrivateRoute> yang membungkus guard ini.
 */
const SesiAktifGuard = () => {
  const { activeSession, isSessionLoading, userRole } = useAuth();
  const location = useLocation();

  if (isSessionLoading) {
    // Tampilkan loading jika AuthProvider masih mengecek sesi dari sessionStorage
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Memverifikasi sesi..." />
      </div>
    );
  }

  if (!activeSession) {
    // JIKA TIDAK ADA SESI AKTIF:
    // Kembalikan pengguna ke halaman pemilihan sesi yang sesuai dengan role-nya.
    
    // Tentukan halaman sesi berdasarkan role
    const redirectTo = userRole === 'admin_tenant' 
      ? '/tenant/buka-sesi' 
      : '/kasir/buka-sesi'; // Default ke kasir

    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // JIKA SESI AKTIF:
  // Izinkan akses ke halaman yang diminta (dirender via <Outlet />)
  return <Outlet />;
};

export default SesiAktifGuard;