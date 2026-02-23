import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const DetailPaket = () => {
  const { id } = useParams(); // "6" atau "12"
  const navigate = useNavigate();
  const location = useLocation();

  const paketName = location.state?.paketName || `Paket ${id} Bulan`;

  const data = {
    benefits: [
      { name: "Harga", paket6: "Rp1.750.000", paket12: "Rp2.950.000" },
      { name: "Penerimaan surat & paket", paket6: true, paket12: true },
      { name: "Free meeting room*", paket6: "4 jam/bulan", paket12: "8 jam/bulan" },
      { name: "Free working space", paket6: "8 jam/bulan", paket12: "12 jam/bulan" },
      { name: "Free wifi member", paket6: true, paket12: true },
    ],
  };


  // Tentukan kolom mana yang ditampilkan
  const paketKey = id === "6" ? "paket6" : "paket12";

  return (
    <div className="w-full min-h-screen bg-[#F5F2ED] flex justify-center px-4 lg:px-8 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-600 font-medium hover:underline"
        >
          ← Kembali
        </button>


        <h1 className="text-2xl font-bold text-center mb-6">
          Detail {paketName}
        </h1>

        {/* Tabel hanya 1 kolom sesuai pilihan */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm md:text-base">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border border-gray-300 p-3">Benefit</th>
                <th className="border border-gray-300 p-3 text-center">
                  {paketName}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.benefits.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{row.name}</td>
                  <td className="border border-gray-300 p-3 text-center">
                    {typeof row[paketKey] === "boolean"
                      ? row[paketKey]
                        ? "✔️"
                        : "❌"
                      : row[paketKey]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tombol Pilih Paket */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate(`/daftar-vo/${id}`)}

            className="bg-blue-500 text-white py-3 px-6 rounded-full font-semibold shadow-md hover:bg-blue-600 transition"
          >
            Pilih {paketName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailPaket;
