// BARU: Impor useContext
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/images/logo.png";

// BARU: Impor loginProses dan AuthContext
import { register, loginProses } from "../../../services/service";
// (Asumsi loginProses ada di file service yang sama dengan register)
import { AuthContext } from "../../../providers/AuthProvider";
// (Sesuaikan path ini jika perlu)

const DaftarAkun = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // BARU: Dapatkan fungsi 'login' dari AuthContext
  const { login } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearError = () => {
    if (error) setError(null);
  };

  // MODIFIKASI: Logika handleSubmit diubah total
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak sama!");
      return;
    }

    setIsLoading(true); // Mulai loading

    const registerFormData = new FormData();
    registerFormData.append("nama", name);
    registerFormData.append("email", email);
    registerFormData.append("password", password);

    try {
      // Langkah 1: Lakukan Registrasi
      const registerResult = await register(registerFormData);

      if (registerResult.status === 201) {
        // Registrasi berhasil, sekarang lakukan auto-login
        setSuccess(`Akun berhasil dibuat untuk ${name}. Sedang login...`);

        const loginFormData = new FormData();

        // --- PERBAIKAN DI SINI ---
        // Kirim 'identifier' agar sesuai dengan endpoint /login
        loginFormData.append("identifier", email);
        // --- AKHIR PERBAIKAN ---

        loginFormData.append("password", password);

        try {
          // Langkah 2: Panggil service loginProses
          const loginResult = await loginProses(loginFormData);

          // Langkah 3: Panggil fungsi 'login' dari AuthContext
          await login(loginResult);

        } catch (loginError) {
          console.error("Auto-login failed after registration:", loginError);
          setError("Akun dibuat, tapi login otomatis gagal. Silakan login manual.");
          setIsLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } else {
        // Registrasi gagal (dari backend, cth: email/nama duplikat)
        setError(registerResult.data?.message || "Gagal mendaftar. Silakan coba lagi.");
        setIsLoading(false);
      }
    } catch (registerError) {
      // Registrasi gagal (error jaringan/server)
      console.error(registerError);
      setError("Terjadi error saat mendaftar. Periksa koneksi Anda.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Logo Dago"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Daftar Akun
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Buat akun baru untuk mulai menggunakan layanan
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              required
              disabled={isLoading} // BARU: disable saat loading
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
              disabled={isLoading} // BARU: disable saat loading
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
              disabled={isLoading} // BARU: disable saat loading
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError();
              }}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
              disabled={isLoading} // BARU: disable saat loading
            />
          </div>

          {/* Area Notifikasi (Error atau Sukses) */}
          <div className="h-6">
            {" "}
            {error && (
              <div
                className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm text-center"
                role="alert"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="w-full bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm text-center"
                role="alert"
              >
                {success}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || success} // Tetap disable saat sukses (karena sedang auto-login)
            className={`w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium shadow-md transition duration-200 ${isLoading || success
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-600"
              }`}
          >
            {/* MODIFIKASI: Teks tombol diubah */}
            {isLoading
              ? "Memproses..." // Teks umum untuk register + login
              : success
                ? "Berhasil!"
                : "Daftar"}
          </button>
        </form>

        {/* Link ke login */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Sudah punya akun?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default DaftarAkun;