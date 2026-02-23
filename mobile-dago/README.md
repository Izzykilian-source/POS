# Mobile Dago - Flutter WebView & Bluetooth Printer

Aplikasi mobile ini merupakan *client* untuk **Sistem Kasir Dago**. Dibangun menggunakan **Flutter**, aplikasi ini berfungsi sebagai pembungkus (*wrapper*) sistem web berbasis React, yang memungkinkan integrasi mendalam dengan perangkat keras mobile, khususnya pemindaian dan pencetakan struk melalui printer thermal Bluetooth.

## 🚀 Fitur Utama

Aplikasi ini bertindak sebagai jembatan (*bridge*) antara sistem web (React) dan hardware perangkat:

* **WebView Integration**: Memuat seluruh antarmuka sistem kasir Dago dengan performa tinggi menggunakan `flutter_inappwebview`.
* **Bluetooth Printer Management**: 
    * Mencari dan menghubungkan printer thermal Bluetooth.
    * Mencetak struk transaksi langsung dari antarmuka web.
    * Manajemen koneksi (Hubungkan/Putuskan) yang sinkron dengan UI web.
* **JavaScript Bridge**: Komunikasi dua arah antara Flutter dan React menggunakan JavaScript Handlers.
* **Permission Handling**: Manajemen izin otomatis untuk penggunaan Bluetooth dan lokasi pada perangkat Android/iOS.

## 🛠️ Teknologi & Library

* **Flutter SDK**: ^3.9.2.
* **flutter_inappwebview**: Untuk menampilkan sistem kasir berbasis web.
* **flutter_blue_plus**: Untuk komunikasi dengan perangkat Bluetooth.
* **esc_pos_utils_plus**: Untuk pemformatan data struk belanja.
* **permission_handler**: Untuk meminta izin akses hardware perangkat.

## 🔌 Dokumentasi JavaScript Bridge

Aplikasi ini menyediakan beberapa *handler* yang dapat dipanggil dari sisi React (Web) menggunakan `window.flutter_inappwebview.callHandler`:

| Nama Handler | Fungsi | Argument (Data) |
| :--- | :--- | :--- |
| `flutterPrintHandler` | Mencetak struk transaksi | `Map<String, dynamic>` (Data Struk) |
| `flutterShowPrinterList` | Membuka halaman daftar printer di Flutter | - |
| `flutterGetConnectedPrinter` | Mengecek printer yang sedang terhubung | - |
| `flutterDisconnectPrinter` | Memutuskan koneksi printer Bluetooth | - |

**Contoh Pemanggilan dari React:**
```javascript
// Memanggil daftar printer
window.flutter_inappwebview.callHandler('flutterShowPrinterList');

// Mendapatkan update nama printer di React
window.updatePrinterName = (name) => {
  console.log("Printer terhubung:", name);
};
