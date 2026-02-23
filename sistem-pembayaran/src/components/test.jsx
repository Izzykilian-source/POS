// DetailKeranjang.jsx
import { useState } from "react";
export default function DetailKeranjangtest({ image, name, description, price, setSelectedItem, countItem, id }) {

    const formattedPrice = Number(price).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // Hilangkan angka desimal
    });

    const counterJumlahItem = (mode, id) => {
        if (mode == "+") {
            setSelectedItem((prevItems) => prevItems.map((item) => item.id_menu === id ? { ...item, countItem: item.countItem + 1 } : item));
        } else {
            if (countItem > 0) {
                setSelectedItem((prevItems) => prevItems.map((item) => item.id_menu === id ? { ...item, countItem: item.countItem - 1 } : item));
            }
        }
    };
    return (
        <div className="flex items-center justify-between p-2 border-b bg-white rounded-lg shadow-sm">
            {/* Gambar Menu */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                <img
                    src={`./img/${image}`}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Informasi Menu */}
            <div className="flex-1 px-3">
                <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
                <p className="text-[#E95322] font-bold text-sm mt-1">{formattedPrice}</p>
            </div>

            {/* Tombol Tambah */}
            <div className="flex justify-center items-center gap-2">
                <button onClick={() => counterJumlahItem("-", id)} className="bg-white text-[#E95322] font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md shadow-md hover:scale-110 transition-transform">
                    -
                </button>
                <p>{countItem}</p>
                <button onClick={() => counterJumlahItem("+", id)} className="bg-[#E95322] text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md shadow-md hover:scale-110 transition-transform">
                    +
                </button>
            </div>
        </div>
    );
}