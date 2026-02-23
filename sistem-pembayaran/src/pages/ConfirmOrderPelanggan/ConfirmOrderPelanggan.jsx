import React, { useEffect, useState } from 'react';
import DetailKeranjang from '../../components/DetailKeranjang';
import { FaChevronLeft } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { getFnbTaxRate } from '../../services/api'; // <<<--- IMPORT SERVICE BARU

const ConfirmOrderPelanggan = () => {
    const [selectedItem, setSelectedItem] = useState(() => {
        const store = localStorage.getItem('selectedItem');
        return store ? JSON.parse(store) : [];
    });

    // --- STATE BARU UNTUK PAJAK ---
    const [pajakPersen, setPajakPersen] = useState(0); // Default 0%
    const [isLoadingTax, setIsLoadingTax] = useState(true); // State loading

    // --- FETCH PAJAK SAAT KOMPONEN DIMUAT ---
    useEffect(() => {
        const fetchTax = async () => {
            setIsLoadingTax(true);
            const rate = await getFnbTaxRate();
            setPajakPersen(rate);
            setIsLoadingTax(false);
        };
        fetchTax();
    }, []); // Dependency kosong, hanya dijalankan sekali

    // Update localStorage
    useEffect(() => {
        localStorage.setItem('selectedItem', JSON.stringify(selectedItem));
    }, [selectedItem]);

    // --- PERHITUNGAN HARGA DENGAN PAJAK DARI STATE ---
    const subtotal = selectedItem
        .filter(item => item.countItem > 0)
        .reduce((acc, item) => {
            const hargaItem = parseFloat(item.harga) || 0;
            const jumlahItem = parseInt(item.countItem) || 0;
            return acc + (hargaItem * jumlahItem);
        }, 0);

    // Gunakan state pajakPersen di sini
    const pajakNominal = subtotal * (pajakPersen / 100);
    const totalHargaFinal = subtotal + pajakNominal;
    // --- AKHIR PERHITUNGAN HARGA ---

    // Helper format Rupiah (opsional, bisa dipindah ke utils)
    const formatRupiah = (number) => {
         const num = parseFloat(number);
         if (isNaN(num)) return 'Rp 0';
         return `Rp ${num.toLocaleString('id-ID')}`;
    };

    return (
        <>
            <div>
                <div className="px-4 bg-white h-[100vh] flex flex-col">
                    {/* Konten scrollable */}
                    <div className="pt-4 flex-1 overflow-y-auto pb-4">
                        <div className="flex items-center mb-4">
                            <button
                                className="p-2 rounded-full hover:bg-gray-100 transition"
                                onClick={() => window.history.back()}
                            >
                                <FaChevronLeft className="text-gray-700 text-xl" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 ml-2">
                                Konfirmasi Pesanan
                            </h1>
                        </div>

                        {/* Tampilkan item pesanan */}
                        <div className="flex flex-col gap-3">
                            {selectedItem.filter(item => item.countItem > 0).map((item, index) => (
                                <DetailKeranjang
                                    key={index}
                                    image={item.foto_produk}
                                    name={item.nama_produk}
                                    description={item.deskripsi_produk}
                                    price={item.harga}
                                    countItem={item.countItem}
                                    note={item.note}
                                    setSelectedItem={setSelectedItem}
                                    id={item.id_produk}
                                />
                            ))}
                            {selectedItem.filter(item => item.countItem > 0).length === 0 && (
                                <p className="text-center text-gray-500 mt-10">
                                    Keranjang Anda kosong. Kembali ke menu untuk memesan.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bagian bawah untuk total dan tombol */}
                    {selectedItem.filter(item => item.countItem > 0).length > 0 && (
                        <div className="p-4 border-t bg-white sticky bottom-0">
                            {/* Tampilkan loading jika sedang fetch pajak */}
                            {isLoadingTax ? (
                                 <div className="text-center text-gray-500 mb-4">Menghitung total...</div>
                            ) : (
                                <div className="mb-4 space-y-1">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Subtotal:</span>
                                        <span>{formatRupiah(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        {/* Tampilkan persentase dari state */}
                                        <span>Pajak ({pajakPersen}%):</span>
                                        <span>{formatRupiah(pajakNominal)}</span>
                                    </div>
                                    <hr className="my-1 border-dashed"/>
                                    <div className="flex justify-between items-center text-lg font-semibold text-gray-800 pt-1">
                                        <span>Total Harga:</span>
                                        <span className="text-testPrimary font-bold">
                                            {formatRupiah(totalHargaFinal)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <Link to='/payment-pelanggan'>
                                <button
                                    // Disable tombol jika pajak belum terload
                                    disabled={isLoadingTax}
                                    className={`rounded-lg px-5 py-3 shadow-md w-full font-semibold text-lg transition ${
                                        isLoadingTax ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-testPrimary text-white hover:bg-red-700'
                                    }`}
                                >
                                    Lanjut ke Pembayaran
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ConfirmOrderPelanggan;