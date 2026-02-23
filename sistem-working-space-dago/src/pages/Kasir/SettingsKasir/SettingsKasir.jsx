import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  PrinterOutlined,
  ApiOutlined,
  DisconnectOutlined,
  DatabaseOutlined,
  DownloadOutlined
} from '@ant-design/icons';

// --- PERUBAHAN 1: Import apiGenerateTestVoucher ---
import { apiExportDatabase, apiGenerateTestVoucher } from '../../../services/service.js';

const SettingsKasir = () => {
  const { logout, closeSession, userProfile } = useAuth();
  const navigate = useNavigate();

  // State Existing
  const [showModal, setShowModal] = useState(false);
  const [namaKonfirmasi, setNamaKonfirmasi] = useState('');
  const [saldoAkhir, setSaldoAkhir] = useState('');
  const [error, setError] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // State Baru untuk Export
  const [isExporting, setIsExporting] = useState(false);

  const namaKasirLogin = userProfile?.detail?.nama || userProfile?.email || '';
  const [printerName, setPrinterName] = useState(null);

  useEffect(() => {
    window.updatePrinterName = (name) => {
      if (name) {
        console.log(`Nama printer diterima dari Flutter: ${name}`);
        setPrinterName(name);
        message.success(`Printer terhubung: ${name}`);
      } else {
        console.log("Koneksi printer terputus.");
        setPrinterName(null);
        message.info("Koneksi printer terputus.");
      }
    };

    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('flutterGetConnectedPrinter');
    }

    return () => {
      delete window.updatePrinterName;
    };
  }, []);

  const handleCloseSessionClick = () => {
    setError('');
    setNamaKonfirmasi('');
    setSaldoAkhir('');
    setShowModal(true);
  };

  const handleConfirmCloseSession = async () => {
    if (!namaKonfirmasi || namaKonfirmasi.trim() === '') {
      setError('Nama kasir wajib diisi untuk konfirmasi.');
      return;
    }
    if (namaKonfirmasi.trim() !== namaKasirLogin) {
      setError(`Nama kasir tidak sesuai. Harap ketik "${namaKasirLogin}" dengan benar.`);
      return;
    }
    if (!saldoAkhir || isNaN(parseFloat(saldoAkhir))) {
      setError('Saldo akhir wajib diisi dan harus berupa angka.');
      return;
    }
    try {
      await closeSession(parseFloat(saldoAkhir), namaKasirLogin);
      message.success('Sesi kasir berhasil ditutup!');
      setShowModal(false);
      navigate('/kasir/buka-sesi');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal menutup sesi kasir.');
    }
  };

  const handleShowPrinterList = () => {
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('flutterShowPrinterList');
    } else {
      message.error("Fungsi ini hanya tersedia di aplikasi mobile.");
    }
  };

  const handleDisconnectPrinter = () => {
    if (window.flutter_inappwebview) {
      message.info("Memutuskan sambungan printer...");
      window.flutter_inappwebview.callHandler('flutterDisconnectPrinter');
    } else {
      message.error("Fungsi ini hanya tersedia di aplikasi mobile.");
    }
  };

  // --- PERUBAHAN 2: Update Logic Test Print dengan Voucher ---
  const handleTestPrint = async () => {
    setIsTesting(true);
    message.loading({ content: 'Menghubungkan ke Mikrotik...', key: 'print_test' });

    try {
      // 1. Generate Voucher Real-time dari Mikrotik
      const voucher = await apiGenerateTestVoucher();

      // 2. Susun data struk (menyesuaikan format printer_service.dart)
      const dataTes = {
        id: "TEST-001",
        time: new Date().toISOString(),
        cashier: namaKasirLogin || "Tes Kasir",
        customer: "Test Printer",
        location: "Settings Menu",
        // Masukkan Voucher sebagai Item
        items: [
          {
            name: "TEST PRINTER OK",
            qty: 1,
            price: 0,
            note: "Koneksi printer berhasil."
          }
        ],
        bookings: [], // Kosongkan array booking
        vouchers: [
          {
            profile: "SHOP-2H", // Sesuai format yang diinginkan
            code: voucher.user  // Single code
          }
        ],

        // Data Keuangan Dummy
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        paymentMethod: "CASH",
        tunai: 0,
        kembali: 0
      };

      // 3. Kirim ke Flutter
      if (window.flutter_inappwebview) {
        console.log("Mengirim data tes ke printer:", dataTes);
        window.flutter_inappwebview.callHandler('flutterPrintHandler', dataTes);
        message.success({ content: 'Perintah cetak dikirim!', key: 'print_test' });
      } else {
        message.error({ content: "Gagal: Mode Browser (bukan App)", key: 'print_test' });
      }

    } catch (error) {
      console.error("Test Print Error:", error);
      message.error({ content: `Gagal generate voucher: ${error.message}`, key: 'print_test' });
    } finally {
      setIsTesting(false);
    }
  };
  // --- AKHIR PERUBAHAN ---

  const handleExportDB = async () => {
    try {
      setIsExporting(true);
      message.loading({ content: 'Sedang memproses backup database...', key: 'backup_msg' });

      await apiExportDatabase();

      message.success({ content: 'Database berhasil di-backup!', key: 'backup_msg' });
    } catch (error) {
      console.error("Export failed:", error);
      message.error({ content: 'Gagal membackup database. Cek koneksi atau izin server.', key: 'backup_msg' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* --- Section Session --- */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Session</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow">
            <div className="p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">Close Cashier Session</h3>
              <button
                onClick={handleCloseSessionClick}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* --- Section Hardware / Printer --- */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Hardware / Printer</h2>
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6 space-y-4">

            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className='flex-1 min-w-[200px]'>
                <h3 className="text-lg font-semibold text-gray-700">Printer Terhubung</h3>
                {printerName ? (
                  <p className="text-sm text-green-600 font-medium">
                    Terhubung ke: {printerName}
                  </p>
                ) : (
                  <p className="text-sm text-red-500 font-medium">
                    Belum ada printer terhubung
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleShowPrinterList}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ApiOutlined className="mr-1" />
                  {printerName ? 'Ganti' : 'Pilih'} Printer
                </button>

                {printerName && (
                  <button
                    onClick={handleDisconnectPrinter}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-md bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <DisconnectOutlined className="mr-1" />
                    Putuskan
                  </button>
                )}
              </div>
            </div>

            <hr />

            <div className="flex justify-between items-center">
              <div className='flex-1'>
                <h3 className="text-lg font-semibold text-gray-700">Test Cetak & Voucher</h3>
                <p className="text-sm text-gray-500">Cetak struk tes beserta kode voucher Mikrotik 2 Jam.</p>
              </div>
              <button
                onClick={handleTestPrint}
                disabled={isTesting || !printerName}
                className="px-5 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PrinterOutlined className="mr-1" />
                {isTesting ? 'Memproses...' : 'Test Print'}
              </button>
            </div>
          </div>
        </div>

        {/* --- Section Data Management --- */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Data Management</h2>
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div className='flex-1'>
                <h3 className="text-lg font-semibold text-gray-700">Backup Database</h3>
                <p className="text-sm text-gray-500">
                  Unduh salinan database (SQL) untuk keperluan backup data.
                </p>
              </div>
              <button
                onClick={handleExportDB}
                disabled={isExporting}
                className="px-5 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <DownloadOutlined className="mr-2" />
                    Download SQL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* --- MODAL (Tidak Berubah) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Close Cashier Session
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm p-3 rounded-lg">
                <span className="font-semibold text-gray-700">
                  Pastikan semua transaksi sudah selesai.{' '}
                </span>
                <span className="text-red-600 font-medium">
                  Anda tidak akan bisa mengubah transaksi yang sudah dicatat setelah menutup cashier session.
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolong masukkan nama Anda{' '}
                  <span className="text-blue-600 font-medium">
                    ({namaKasirLogin})
                  </span>{' '}
                  sebagai konfirmasi
                </label>
                <input
                  type="text"
                  value={namaKonfirmasi}
                  onChange={(e) => setNamaKonfirmasi(e.target.value)}
                  placeholder="Konfirmasi nama kasir yang menutup sesi"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  (Uang Tunai di Laci)
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <span className="text-gray-500 text-sm mr-1">Rp.</span>
                  <input
                    type="number"
                    value={saldoAkhir}
                    onChange={(e) => setSaldoAkhir(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-center text-sm text-gray-600 mt-4">
                Kasir ditutup pada{' '}
                <span className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  {new Date().toLocaleTimeString('id-ID')}
                </span>
                <br />
                <span className="text-gray-400 text-xs">Waktu Server</span>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                onClick={handleConfirmCloseSession}
                className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsKasir;