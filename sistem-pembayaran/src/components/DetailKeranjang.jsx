import { useState } from "react";

export default function DetailKeranjang({ image, name, description, price, setSelectedItem, countItem, id, note }) {
    const formattedPrice = Number(price).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    const counterJumlahItem = (mode) => {
        setSelectedItem(prevItems => prevItems.map(item =>
            item.id_produk === id
                ? { ...item, countItem: mode === "+" ? item.countItem + 1 : Math.max(0, item.countItem - 1) }
                : item
        ));
    };

    return (
        <div className="flex flex-col gap-2 p-2 border-b bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
                {/* Gambar */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                    <img src={`${import.meta.env.VITE_BASE_URL}/static/${image}`} alt={name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 px-3">
                    <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                    <p className="text-testPrimary font-bold text-sm mt-1">{formattedPrice}</p>
                </div>

                {/* Counter */}
                <div className="flex justify-center items-center gap-2">
                    <button onClick={() => counterJumlahItem("-")} className="bg-white text-testPrimary font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md shadow-md hover:scale-110 transition-transform">
                        -
                    </button>
                    <p>{countItem}</p>
                    <button onClick={() => counterJumlahItem("+")} className="bg-testPrimary text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md shadow-md hover:scale-110 transition-transform">
                        +
                    </button>
                </div>
            </div>

            {/* Edit Catatan */}
            <div>
                <label className="text-xs text-gray-500">Catatan:</label>
                <textarea
                    value={note}
                    onChange={(e) => setSelectedItem(prevItems =>
                        prevItems.map(item =>
                            item.id_produk === id ? { ...item, note: e.target.value } : item
                        )
                    )}
                    placeholder="Edit catatan"
                    className="border rounded px-2 py-1 w-full text-sm"
                />
            </div>
        </div>
    );
}
