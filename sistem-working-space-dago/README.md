# Sistem Working Space Dago

Sistem manajemen terintegrasi untuk pengelolaan *working space*, mencakup layanan penyewaan ruangan, keanggotaan, kantor virtual (*Virtual Office*), hingga sistem kasir (POS) dan dasbor pemilik (*Owner*). Proyek ini dibangun menggunakan **React** dan **Vite**.

## 🚀 Fitur Utama

Aplikasi ini menggunakan sistem kontrol akses berbasis peran (*Role-Based Access Control*) dengan pembagian fitur sebagai berikut:

### 1. Modul Pelanggan (Customer)
* **Booking Ruangan**: Pemesanan berbagai tipe ruangan secara *real-time*.
* **Membership**: Pendaftaran dan pengecekan kredit keanggotaan.
* **Virtual & Private Office**: Layanan pendaftaran kantor virtual dan kantor pribadi.
* **Event Spaces**: Informasi dan pemesanan area untuk acara.
* **Riwayat Transaksi**: Pelacakan histori pembayaran dan layanan.

### 2. Modul Kasir (Cashier)
* **Manajemen Sesi**: Fitur buka/tutup sesi kerja dan *takeover* sesi.
* **Sistem POS**: Transaksi penjualan produk F&B dan layanan ruangan secara langsung.
* **Laporan Pembayaran**: Rekapitulasi transaksi harian dan riwayat sesi.

### 3. Modul Admin (Admin Dago)
* **Master Data**: Pengelolaan data pengguna, tenant, produk, kategori ruangan, dan promo.
* **Approval**: Persetujuan permintaan *Virtual Office* dan booking acara.
* **Keuangan Admin**: Pencatatan biaya bulanan, pengelolaan hutang tenant, dan rekap bagi hasil.

### 4. Modul Tenant
* **Manajemen Order**: Pengelolaan pesanan masuk dari pelanggan atau kasir.
* **Kelola Stok**: Pemantauan dan pembaruan ketersediaan produk secara mandiri.

### 5. Modul Owner
* **Laporan Komprehensif**: Dasbor total pendapatan, profit, dan penjualan harian.
* **Analisis Bisnis**: Statistik produk F&B terbaik dan penggunaan *Working Space*.
* **Laporan Pajak**: Pencatatan dan monitoring kewajiban pajak.

## 🛠️ Teknologi & Library

* **Frontend Framework**: React 19.
* **Build Tool**: Vite 7.
* **Styling**: Tailwind CSS 4 & Ant Design (Antd).
* **Routing**: React Router DOM 7.
* **Visualisasi Data**: Chart.js & Ant Design Charts.
* **Ikon**: Lucide React, React Icons, & Ant Design Icons.
* **Ekspor Data**: `exceljs` & `xlsx`.

## ⚙️ Persiapan Instalasi

1.  **Clone Repositori**:
    ```bash
    git clone [url-repositori-anda]
    cd sistem-working-space-dago
    ```

2.  **Instal Dependensi**:
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**:
    Buat file `.env` di root folder dan tambahkan URL API backend:
    ```env
    VITE_BASE_URL=[https://api-backend-anda.com](https://api-backend-anda.com)
    ```

4.  **Menjalankan Mode Pengembangan**:
    ```bash
    npm run dev
    ```

5.  **Build untuk Produksi**:
    ```bash
    npm run build
    ```

## 📂 Struktur Folder Penting

* `src/pages`: Halaman aplikasi yang dikelompokkan berdasarkan peran.
* `src/services`: Kumpulan fungsi integrasi API (`service.js`).
* `src/components`: Komponen UI modular (Sidebar, Navbar, Guard).
* `src/providers`: Manajemen state global seperti `AuthProvider`.
* `src/utils`: Utilitas fungsi seperti format mata uang dan penyimpanan JWT.
