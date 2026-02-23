import { useState } from "react";

export default function DetailAddMenu({ image, name, description, price, setCountItem, countItem, note, setNote }) {
    // const [note, setNote] = useState("");

    const formattedPrice = Number(price).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    const counterJumlahItem = (mode) => {
        if (mode === "+") {
            setCountItem(prev => prev + 1);
        } else {
            if (countItem > 0) {
                setCountItem(prev => prev - 1);
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 border-b-gray-50 rounded-lg shadow-sm">
                {/* Gambar Menu */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                    <img
                        src={`${import.meta.env.VITE_BASE_URL}/static/${image}`}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info Menu */}
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

            {/* Input Catatan */}
            <div>
                <label className="text-xs text-gray-500">Catatan:</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tambahkan catatan untuk menu ini"
                    className="border rounded px-2 py-1 w-full text-sm"
                />
            </div>
        </div>
    );
}
