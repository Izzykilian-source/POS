// src/components/layout/SesiKasirGuard.jsx
import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate, Outlet } from 'react-router-dom';

const SesiKasirGuard = () => {
    const { activeSession, isSessionLoading, user } = useAuth();

    if (isSessionLoading) {
        return <div>Loading Sesi...</div>; // Tampilkan loading
    }

    // Jika user adalah kasir TAPI tidak punya sesi aktif
    if (user && user.role === 'kasir' && !activeSession) {
        // Arahkan ke halaman Buka Sesi
        return <Navigate to="/kasir/buka-sesi" replace />;
    }

    // Jika punya sesi aktif, tampilkan halaman yang dituju (misal: POS)
    return <Outlet />;
};

export default SesiKasirGuard;