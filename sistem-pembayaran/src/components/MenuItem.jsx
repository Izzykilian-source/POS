import React from 'react';
import { Typography, Tag } from 'antd'; // Import Tag untuk label "Habis"

const { Text, Paragraph } = Typography;

// Helper function untuk path gambar
const getImageUrl = (filename) => {
    if (!filename) return "/img/kopi.jpg"; // Fallback default jika filename null/undefined
    const baseUrlWithoutApi = import.meta.env.VITE_BASE_URL?.replace('/api/v1', '') || '';
    // PERBAIKAN PATH: /static/ -> /img/
    return `${baseUrlWithoutApi}/static/${filename}`; 
};

export default function MenuItem({ image, name, description, price, showDrawer, statusKetersediaan }) {
    // Tentukan apakah item tersedia berdasarkan prop baru
    const isAvailable = statusKetersediaan === 'Active';

    // Format harga ke Rupiah
    const formattedPrice = Number(price || 0).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    return (
        <div
            // PERBAIKAN KONDISIONAL: Ubah style & cursor jika tidak tersedia
            className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-200 ${
                isAvailable
                    ? 'bg-white cursor-pointer hover:bg-gray-50 shadow-sm' // Style jika tersedia
                    : 'bg-gray-50 opacity-60 cursor-not-allowed' // Style jika HABIS
            }`}
            // Nonaktifkan onClick jika tidak tersedia
            onClick={isAvailable ? showDrawer : undefined}
        >
            {/* Gambar Menu */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative">
                <img
                    src={getImageUrl(image)} // Gunakan helper dengan path yang benar
                    alt={name}
                    // PERBAIKAN KONDISIONAL: Tambah grayscale jika tidak tersedia
                    className={`w-full h-full object-cover ${!isAvailable ? 'filter grayscale' : ''}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/img/kopi.jpg" }} // Fallback
                />
                {/* PERBAIKAN KONDISIONAL: Tampilkan Tag "Habis" */}
                {!isAvailable && (
                    <Tag
                        color="error" // Warna merah dari Ant Design
                        className="absolute top-1 right-1 text-xs font-semibold"
                        style={{ margin: 0 }} // Override margin default Tag
                    >
                        Habis
                    </Tag>
                )}
            </div>

            {/* Informasi Menu */}
            <div className="flex-1 px-3 min-w-0"> {/* Tambah min-w-0 untuk ellipsis */}
                <h3 className={`text-sm font-semibold ${!isAvailable ? 'text-gray-500' : 'text-gray-800'}`}>
                    {name}
                </h3>
                {description && (
                     <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2, expandable: false }}
                        className="text-xs mt-1 mb-1" // Atur margin
                     >
                         {description}
                     </Paragraph>
                )}
                <p className={`font-bold text-sm mt-1 ${!isAvailable ? 'text-gray-500' : 'text-testPrimary'}`}>
                    {formattedPrice}
                </p>
            </div>

            {/* Tombol Tambah */}
            {/* PERBAIKAN KONDISIONAL: Hanya tampilkan tombol jika tersedia */}
            {isAvailable ? (
                <button
                    // onClick tidak perlu di sini, karena div utama sudah menanganinya
                    className="bg-testPrimary text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md shadow-md hover:scale-110 transition-transform flex-shrink-0"
                    aria-label={`Tambah ${name}`}
                >
                    +
                </button>
            ) : (
                // Beri placeholder agar layout tidak rusak
                <div className="w-8 h-8 flex-shrink-0" />
            )}
        </div>
    );
}