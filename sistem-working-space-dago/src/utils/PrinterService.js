// src/utils/printerService.js
import { message } from 'antd';

// !!! GANTI DENGAN UUID YANG ANDA TEMUKAN DI LANGKAH 1 !!!
const PRINTER_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002201-0000-1000-8000-00805f9b34fb';

// Untuk mengirim text ke printer
const textEncoder = new TextEncoder("gb18030"); // Encoding umum untuk printer thermal

// Perintah ESC/POS
const ESC = '\x1B';
const GS = '\x1D';
const INIT_PRINTER = ESC + '@';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const FEED_AND_CUT = GS + 'V' + '\x41' + '\x00'; // Umpan sebagian dan potong
const FEED_LINE = '\x0A'; // New line

let printerDevice = null;
let printerCharacteristic = null;

// Fungsi 1: Menghubungkan ke printer
export const connectToPrinter = async () => {
  try {
    message.loading({ content: 'Mencari printer Bluetooth...', key: 'printer' });
    
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "RPP" }], // Filter nama EPPOS
      optionalServices: [PRINTER_SERVICE_UUID] // Minta akses ke service UUID
    });

    printerDevice = device;
    message.loading({ content: `Menghubungkan ke ${device.name}...`, key: 'printer' });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
    printerCharacteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID);

    message.success({ content: `Printer ${device.name} terhubung!`, key: 'printer' });
    
    // Tambahkan listener jika koneksi terputus
    printerDevice.addEventListener('gattserverdisconnected', () => {
      message.warn('Printer terputus!');
      printerDevice = null;
      printerCharacteristic = null;
    });

    return printerDevice;
    
  } catch (error) {
    console.error("Gagal terhubung ke printer:", error);
    message.error({ content: `Gagal terhubung: ${error.message}`, key: 'printer' });
    return null;
  }
};

// Fungsi 2: Mendapatkan status koneksi
export const getPrinterStatus = () => {
  return printerDevice;
};

// Fungsi 3: Mencetak struk
export const printReceipt = async (transaksi) => {
  if (!printerCharacteristic) {
    message.error("Printer tidak terhubung.");
    return;
  }

  // Format struk
  let commands = INIT_PRINTER;
  commands += ALIGN_CENTER;
  commands += BOLD_ON;
  commands += "Dago Working Space" + FEED_LINE;
  commands += BOLD_OFF;
  commands += "--------------------------------" + FEED_LINE;
  commands += ALIGN_LEFT;
  commands += `ID Transaksi: ${transaksi.id_transaksi}` + FEED_LINE;
  commands += `Tanggal: ${new Date(transaksi.tanggal_transaksi).toLocaleString()}` + FEED_LINE;
  commands += "--------------------------------" + FEED_LINE;

  // Daftar Item (Asumsi `transaksi.items` adalah array dari `detail_order_fnb`)
  if (transaksi.items && transaksi.items.length > 0) {
    for (const item of transaksi.items) {
      const nama = item.nama_produk.padEnd(20); // 20 karakter untuk nama
      const qty = `x${item.jumlah}`.padStart(3); // 3 karakter untuk qty
      const total = `${item.harga_saat_order * item.jumlah}`.padStart(8); // 8 karakter untuk total
      commands += `${nama.substring(0, 20)}${qty} ${total}` + FEED_LINE;
    }
  }

  commands += "--------------------------------" + FEED_LINE;
  commands += ALIGN_LEFT;
  commands += `Subtotal: ${transaksi.subtotal}`.padStart(32) + FEED_LINE;
  commands += `Pajak (10%): ${transaksi.pajak_nominal}`.padStart(32) + FEED_LINE;
  commands += BOLD_ON;
  commands += `TOTAL: ${transaksi.total_harga_final}`.padStart(32) + FEED_LINE;
  commands += BOLD_OFF;
  commands += FEED_LINE + FEED_LINE;
  commands += ALIGN_CENTER;
  commands += "Terima Kasih!" + FEED_LINE + FEED_LINE + FEED_LINE;
  commands += FEED_AND_CUT; // Potong kertas

  // Kirim data ke printer
  try {
    const data = textEncoder.encode(commands);
    // Kirim data dalam potongan kecil (chunks) jika perlu
    const CHUNK_SIZE = 100; // 100 bytes per chunk
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await printerCharacteristic.writeValueWithoutResponse(chunk);
    }
    message.success("Struk terkirim ke printer!");
  } catch (error) {
    console.error("Gagal mencetak:", error);
    message.error(`Gagal mencetak: ${error.message}`);
  }
};


// Di dalam file: src/utils/printerService.js

// ... (kode 'textEncoder', 'ESC', 'ALIGN_CENTER', 'printerCharacteristic', dll.)

// ... (setelah fungsi 'printReceipt')

// --- TAMBAHKAN FUNGSI BARU INI ---
export const printTestReceipt = async () => {
  if (!printerCharacteristic) {
    message.error("Printer tidak terhubung.");
    return;
  }

  let commands = INIT_PRINTER;
  commands += ALIGN_CENTER;
  commands += BOLD_ON + "TES CETAK" + BOLD_OFF + FEED_LINE;
  commands += "--------------------------------" + FEED_LINE;
  commands += ALIGN_LEFT;
  commands += "Printer EPPOS EP5858L" + FEED_LINE;
  commands += "Koneksi Web Bluetooth Berhasil!" + FEED_LINE;
  commands += "--------------------------------" + FEED_LINE;
  commands += FEED_LINE + FEED_LINE;
  commands += "Terima Kasih!" + FEED_LINE + FEED_LINE + FEED_LINE;
  commands += FEED_AND_CUT; // Perintah potong kertas

  try {
    const data = textEncoder.encode(commands);
    // Mengirim data ke printer
    await printerCharacteristic.writeValueWithoutResponse(data);
    message.success("Test print terkirim!");
  } catch (error) {
    console.error("Gagal test print:", error);
    message.error(`Gagal test print: ${error.message}`);
    throw error; // Lempar error agar bisa ditangkap di komponen
  }
};
// --- AKHIR FUNGSI BARU ---