// Di file: src/providers/AuthProvider.jsx
import { createContext, useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import { jwtStorage } from "../utils/jwtStorage";
import {
    getDataPrivate,
    // ❌ HAPUS: apiCheckActiveSession (tidak lagi dipakai)
    apiOpenSession,
    apiCloseSession,
    apiGetLastSaldo
} from "../services/service"; // Pastikan service.js mengekspor fungsi-fungsi ini


export const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState(null); // <-- State ini sekarang dikontrol oleh sessionStorage
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [isFirstLogin, setIsFirstLogin] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    // ... (getDataProfile tidak berubah, sudah benar)
    const getDataProfile = async () => {
        setLoading(true); // Pastikan loading di-set di awal
        try {
            const result = await getDataPrivate();
            if (result?.user_logged) {
                setUserProfile(result);
                setIsLoggedIn(true);
                setIsFirstLogin(result.is_first_login);
                setUserRole(result.roles);
                return result; // Kembalikan result untuk chain login
            } else {
                // ... (logika else Anda sudah benar)
                setUserProfile({});
                setIsLoggedIn(false);
                setIsFirstLogin(null);
                setUserRole(null);
                return null;
            }
        } catch (error) {
            // ... (logika catch Anda sudah benar)
            console.error("Gagal mendapatkan data profile:", error);
            setIsLoggedIn(false);
            setUserProfile({});
            setIsFirstLogin(null);
            setUserRole(null);
            jwtStorage.removeItem();
            return null;
        } finally {
            setLoading(false); // Selalu matikan loading di akhir
        }
    };

    // ... (useEffect on-mount tidak berubah, sudah benar)
    useEffect(() => {
        const checkTokenOnMount = async () => {
            const token = await jwtStorage.retrieveToken();
            if (token) {
                // Saat refresh, panggil getDataProfile
                // (useEffect lain akan menangani checkActiveSession)
                await getDataProfile();
            } else {
                setLoading(false);
                setIsSessionLoading(false); // Pastikan ini di-set false
            }
        };
        checkTokenOnMount();
    }, []);


    // --- (PERBAIKAN LOGIKA SESI DIMULAI DI SINI) ---

    /**
     * FUNGSI BARU
     * Menyimpan sesi yang dipilih kasir ke sessionStorage dan state.
     * Ini dipanggil dari BukaSesi.jsx saat kasir klik "Masuk Sesi" atau "Gabung Sesi".
     */
    const joinSession = (sessionData) => {
        if (!sessionData || !sessionData.id_sesi) {
            console.error("Gagal bergabung ke sesi: data sesi tidak valid", sessionData);
            return;
        }
        try {
            // Kita simpan seluruh objek sesi
            sessionStorage.setItem('activeKasirSession', JSON.stringify(sessionData));
            setActiveSession(sessionData);
        } catch (e) {
            console.error("Gagal menyimpan sesi ke sessionStorage:", e);
        }
    };

    /**
     * FUNGSI BARU
     * Membersihkan sesi yang dipilih dari sessionStorage dan state.
     * Dipanggil saat logout atau saat *sengaja* meninggalkan sesi (misal kembali ke BukaSesi).
     */
    const leaveSession = () => {
        try {
            sessionStorage.removeItem('activeKasirSession');
            setActiveSession(null);
        } catch (e) {
            console.error("Gagal membersihkan sesi dari sessionStorage:", e);
        }
    };

    /**
     * PERBAIKAN: Fungsi ini sekarang membaca dari sessionStorage,
     * BUKAN memanggil API untuk cek sesi milik user.
     * Ini hanya mengecek "Apakah browser ini sedang 'mengikuti' sebuah sesi?"
     */
    const checkActiveSession = () => {
        setIsSessionLoading(true);
        try {
            const storedSession = sessionStorage.getItem('activeKasirSession');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);

                // TODO Opsional (Best Practice): 
                // Tambahkan API call di sini untuk memvalidasi
                // apakah sessionData.id_sesi masih 'Dibuka' di database.
                // Jika tidak, panggil leaveSession() dan redirect ke /bukasesi.
                // Untuk saat ini, kita percaya sessionStorage.

                setActiveSession(sessionData);
            } else {
                setActiveSession(null);
            }
        } catch (error) {
            console.error("Error checking active session from storage:", error);
            setActiveSession(null);
        } finally {
            setIsSessionLoading(false);
        }
    };

    /**
     * PERBAIKAN: openSession sekarang harus otomatis "bergabung"
     * ke sesi yang baru dibuatnya.
     */
    const openSession = async (nama_sesi, saldo_awal) => {
        try {
            // apiOpenSession di backend harus diubah untuk TIDAK memerlukan id_user_kasir
            // dan harus mengecek apakah sudah ada sesi aktif (lihat respons saya sebelumnya)
            const response = await apiOpenSession({ nama_sesi, saldo_awal });
            if (response.session) {
                // Otomatis bergabung ke sesi yang baru dibuat
                joinSession(response.session);
            }
            return response;
        } catch (error) {
            console.error("Error opening session:", error);
            throw error;
        }
    };

    /**
     * PERBAIKAN: closeSession sekarang harus memanggil leaveSession()
     * untuk membersihkan sessionStorage.
     * Endpoint backend juga harus diubah untuk menerima ID sesi.
     */
    const closeSession = async (saldo_akhir_aktual, nama_kasir_penutup) => {
        try {
            // Ambil ID sesi dari state SEBELUM membersihkannya
            const sessionIdToClose = activeSession?.id_sesi;
            if (!sessionIdToClose) {
                throw new Error("Tidak ada sesi aktif untuk ditutup.");
            }

            const sessionData = {
                id_sesi: sessionIdToClose, // <-- KIRIM ID SESI
                saldo_akhir_aktual: saldo_akhir_aktual,
                nama_kasir_penutup: nama_kasir_penutup
            };

            // Panggil API (pastikan endpoint apiCloseSession di backend diubah
            // untuk menerima id_sesi dan tidak mengambilnya dari token)
            const response = await apiCloseSession(sessionData);

            // Bersihkan sesi dari browser
            leaveSession();
            return response;
        } catch (error) {
            console.error("Error closing session:", error);
            throw error;
        }
    };

    // ... (getLastSaldo tidak berubah, tapi endpoint-nya mungkin perlu diubah
    // menjadi global, bukan per-kasir)
    const getLastSaldo = async () => {
        try {
            // Pastikan apiGetLastSaldo di backend mengambil saldo global terakhir,
            // bukan saldo terakhir milik kasir ini.
            const response = await apiGetLastSaldo();
            return response.saldo_terakhir;
        } catch (error) {
            console.error("Error getting last saldo:", error);
            return 0;
        }
    };

    /**
     * PERBAIKAN: useEffect ini sekarang memanggil
     * checkActiveSession (versi sessionStorage) yang baru.
     */
    useEffect(() => {
        // 1. PENTING: Jika masih loading (cek token), JANGAN lakukan apa-apa.
        // Ini mencegah sesi dihapus secara tidak sengaja saat refresh halaman.
        if (loading) return;

        if (isLoggedIn) {
            // Jika user login sebagai kasir/tenant, cek apakah ada sesi tersimpan
            if (userRole === 'kasir' || userRole === 'admin_tenant') {
                checkActiveSession();
            }
        } else {
            // Jika user BENAR-BENAR tidak login (dan loading selesai), barulah hapus sesi
            leaveSession();
            setIsSessionLoading(false);
        }
    }, [isLoggedIn, userRole, loading]);
    // --- (AKHIR PERBAIKAN LOGIKA SESI) ---


    // ... (Fungsi login tidak berubah, sudah benar)
    const login = async (loginData) => {
        jwtStorage.storeToken(loginData.access_token);
        // setLoading(true); // getDataProfile sudah mengatur loading

        try {
            // Panggil getDataProfile untuk melengkapi state (nama, email, dll)
            const profile = await getDataProfile();

            if (!profile) {
                navigate("/", { replace: true });
                return;
            }

            // Navigasi berdasarkan data dari /login (paling baru)
            if (loginData.role === 'kasir' && loginData.is_first_login === 1) {
                navigate("/kasir/ganti-password", { replace: true });
            } else {
                switch (loginData.role) {
                    case "admin_dago":
                        navigate("/transaksiadmin", { replace: true });
                        break;
                    case "kasir":
                        // SELALU arahkan ke halaman pemilihan sesi
                        navigate("/kasir/buka-sesi", {
                            replace: true,
                            state: { fromLogin: true } // <-- TAMBAHKAN INI
                        });
                        break;
                    case "admin_tenant":
                        navigate("/tenant/buka-sesi", {
                            replace: true,
                            state: { fromLogin: true } // <-- TAMBAHKAN INI
                        });
                        break;
                    case "owner":
                        navigate("/laporan", { replace: true });
                        break;
                    default: // 'pelanggan'
                        navigate("/informasi-ruangan", { replace: true });
                        break;
                }
            }
        } catch (error) {
            console.error("Gagal login:", error);
            setLoading(false);
            navigate("/", { replace: true });
        }
    };

    /**
     * PERBAIKAN: logout sekarang memanggil leaveSession()
     */
    const logout = () => {
        jwtStorage.removeItem();
        setIsLoggedIn(false);
        setUserProfile({});
        leaveSession(); // <-- PANGGIL FUNGSI BARU
        // setActiveSession(null); // <-- Tidak perlu, leaveSession sudah handle
        // setIsSessionLoading(false); // <-- Tidak perlu
        setIsFirstLogin(null);
        setUserRole(null);
        navigate("/login", { replace: true });
    };


    const contextValue = useMemo(() => ({
        isLoggedIn,
        loading,
        login,
        logout,
        userProfile,
        isFirstLogin,
        userRole,

        // Konteks Sesi yang Diperbarui
        activeSession,      // Sesi yang "diikuti" saat ini (dari sessionStorage)
        isSessionLoading,   // Loading untuk sesi
        checkActiveSession, // Fungsi untuk cek sessionStorage
        openSession,        // Untuk MEMBUAT sesi baru (auto-join)
        closeSession,       // Untuk MENUTUP sesi (auto-leave)
        getLastSaldo,
        joinSession,        // (BARU) Untuk "mengikuti" sesi yang ada
        leaveSession        // (BARU) Untuk "meninggalkan" sesi (cth: kembali ke BukaSesi)

    }), [
        isLoggedIn,
        loading,
        userProfile,
        activeSession,
        isSessionLoading,
        isFirstLogin,
        userRole
    ]);


    return (
        <AuthContext.Provider value={contextValue} >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;