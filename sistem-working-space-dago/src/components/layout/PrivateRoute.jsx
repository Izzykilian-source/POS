// src/components/layout/PrivateRoute.jsx

import React from 'react';
// --- PERBAIKAN: Impor Navigate, Outlet, DAN useLocation ---
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// Impor hook 'useAuth' yang telah kita buat di AuthProvider
import { useAuth } from '../../providers/AuthProvider'; 

/**
 * Komponen ini melindungi rute.
 * 1. Menunggu loading selesai.
 * 2. Jika belum login, redirect ke /login.
 * 3. JIKA KASIR & LOGIN PERTAMA, paksa redirect ke /kasir/ganti-password.
 * 4. Jika sudah login tapi role tidak sesuai, redirect ke /forbidden.
 * 5. Jika semua oke, tampilkan halaman (via <Outlet />).
 */
const PrivateRoute = ({ allowedRoles }) => {
    // --- PERBAIKAN: Ambil semua state yang kita butuhkan ---
    const { 
        isLoggedIn, 
        loading, 
        isFirstLogin, // State baru dari AuthProvider
        userRole      // State baru dari AuthProvider
    } = useAuth();
    
    // Ambil lokasi saat ini
    const location = useLocation();

    // 1. Cek state loading DULU
    if (loading) {
        // Tampilkan layar loading selagi AuthProvider mengambil data profile
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    // 2. Jika tidak loading, cek status login
    if (!isLoggedIn) {
        // Pengguna tidak login, paksa kembali ke halaman login
        return <Navigate to="/login" replace />;
    }

    // --- PERBAIKAN: Cek Kasus Ganti Password ---
    // 3. JIKA KASIR & LOGIN PERTAMA, paksa redirect
    if (
        userRole === 'kasir' && 
        isFirstLogin === 1 && 
        location.pathname !== '/kasir/ganti-password'
    ) {
        // Jika kasir login pertama kali DAN dia tidak sedang di halaman ganti password,
        // paksa dia ke halaman ganti password.
        return <Navigate to="/kasir/ganti-password" replace />;
    }
    // --- AKHIR PERBAIKAN ---


    // 4. Jika sudah login (dan bukan kasus ganti password), cek 'allowedRoles'
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Pengguna sudah login, tapi rolenya tidak diizinkan
        return <Navigate to="/forbidden" replace />;
    }

    // 5. Jika tidak loading, sudah login, dan role diizinkan
    // Tampilkan komponen anak (BukaSesi, TransaksiKasir, dll.)
    return <Outlet />;
};

export default PrivateRoute;