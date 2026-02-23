import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { loginProses } from "../../services/service";
import { AuthContext } from "../../providers/AuthProvider";

// Komponen SVG untuk ikon "mata" (Show)
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 10.224 6.365 7.5 12 7.5c5.635 0 8.573 2.724 9.963 4.183.39.39.39 1.023 0 1.414C20.573 14.776 17.635 17.5 12 17.5c-5.635 0-8.573-2.724-9.963-4.183z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Komponen SVG untuk ikon "mata-tercoret" (Hide)
const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.99 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.575M9 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 1.5l21 21" />
  </svg>
);

const Login = () => {
  // MODIFIKASI: Ubah 'email' menjadi 'identifier'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const formData = new FormData();
    // MODIFIKASI: Kirim 'identifier' (bukan 'email')
    formData.append("identifier", identifier);
    formData.append("password", password);

    try {
      const result = await loginProses(formData);
      await login(result);
    } catch (error) {
      console.error("Login gagal:", error);
      // MODIFIKASI: Ubah pesan error
      setErrorMessage("Email/Username atau password salah. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Logo Dago"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Login
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Masuk untuk mengakses akun Anda
        </p>

        {errorMessage && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            {/* MODIFIKASI: Ubah label */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email atau Username
            </label>
            <input
              // MODIFIKASI: Ubah type menjadi 'text'
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              // MODIFIKASI: Ubah placeholder
              placeholder="Email atau Username Anda"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            {/* Wrapper div relative untuk menampung ikon */}
            <div className="relative">
              <input
                // Tipe dinamis berdasarkan state showPassword
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Tambahkan padding kanan (pr-10) agar teks tidak tertutup ikon
                className="w-full px-4 py-3 pr-10 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                required
              />
              {/* Tombol untuk toggle show/hide */}
              <button
                type="button" // Penting agar tidak submit form
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md transition duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "" // Style loading
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-6">
          Belum punya akun?{" "}
          <button
            onClick={() => navigate("/daftar-akun")}
            className="text-blue-500 hover:underline font-medium"
          >
            Daftar Akun
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;