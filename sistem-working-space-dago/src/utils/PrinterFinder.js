// src/utils/PrinterFinder.js

// UUID standar untuk Serial Port Profile (SPP)
const PRINTER_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
// UUID umum lainnya yang mungkin (Generic Access, Device Info)
// Terkadang kita perlu memintanya agar printer mau "berbicara"
const GENERIC_ACCESS_UUID = '00001800-0000-1000-8000-00805f9b34fb';
const DEVICE_INFO_UUID = '0000180a-0000-1000-8000-00805f9b34fb';

export const findPrinterDetails = async () => {
  try {
    console.log("Mencari printer 'RPP' & meminta izin untuk 3 service umum...");

    // 1. UBAHAN KUNCI:
    // Filter berdasarkan NAMA (RPP)
    // Minta izin untuk TIGA service umum (termasuk SPP)
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "RPP" }], 
      optionalServices: [
        PRINTER_SERVICE_UUID,  // 1101 (SPP)
        GENERIC_ACCESS_UUID,   // 1800 (Generic Access)
        DEVICE_INFO_UUID       // 180a (Device Info)
      ]
    });

    console.log("Printer ditemukan:", device.name); 
    console.log("Menghubungkan ke GATT Server...");
    const server = await device.gatt.connect();

    console.log("Mendapatkan SEMUA services yang diizinkan...");

    // 2. UBAHAN KUNCI:
    // Panggil getPrimaryServices() (plural) LAGI.
    // Karena kita sudah meminta izin di 'optionalServices',
    // ini seharusnya mengembalikan daftar service yang diizinkan oleh printer.
    const services = await server.getPrimaryServices();

    if (!services || services.length === 0) {
      alert("Gagal: Terhubung ke printer, tapi printer tidak melaporkan service apapun. Coba unpair/restart printer.");
      return;
    }

    console.log("Menjelajahi Services dan Characteristics:");
    
    let foundWriteCharacteristic = false;
    for (const service of services) {
      // Kita akan log SEMUA service yang ditemukan
      console.log(`> Service UUID: ${service.uuid}`);
      
      // Dapatkan characteristics untuk service ini
      const characteristics = await service.getCharacteristics();
      
      for (const characteristic of characteristics) {
        console.log(`  >> Characteristic UUID: ${characteristic.uuid}`);
        
        // Cek apakah characteristic ini bisa kita 'write' (kirimi data)
        if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
          console.log(`    [!!!] DITEMUKAN: Characteristic ini bisa untuk 'write'`);
          console.log(`    --- GUNAKAN INI DI printerService.js ---`);
          console.log(`    PRINTER_SERVICE_UUID: '${service.uuid}'`);
          console.log(`    PRINTER_CHARACTERISTIC_UUID: '${characteristic.uuid}'`);
          console.log(`    --------------------------------------`);
          foundWriteCharacteristic = true;
        }
      }
    }

    if (foundWriteCharacteristic) {
      alert("Pencarian Selesai! Cek Console (F12) untuk melihat Service & Characteristic UUID.");
    } else {
      alert("Printer ditemukan dan terhubung, tapi tidak ada Characteristic untuk 'write' yang ditemukan. Tidak bisa digunakan untuk mencetak.");
    }

  } catch (error) {
    console.error("Error:", error);
    if (error.name === 'NotFoundError') {
        alert('Pencarian dibatalkan atau printer RPP tidak ditemukan.');
    } else {
        alert(`Gagal terhubung: ${error.message}`);
    }
  }
};