# Sistem Working Space Dago

Sistem manajemen terintegrasi untuk operasional *working space*, mencakup layanan penyewaan ruangan, pengelolaan kantor virtual (*Virtual Office*), sistem keanggotaan, sistem kasir (POS), hingga dasbor analitik untuk pemilik usaha. Proyek ini menggunakan arsitektur *decoupled* dengan **React** di sisi *frontend* dan **Flask** di sisi *backend*.

## 🚀 Fitur Utama Berdasarkan Peran (RBAC)

Aplikasi ini menerapkan kontrol akses berbasis peran untuk memastikan keamanan dan relevansi fitur bagi setiap pengguna:

### 1. Pelanggan (Customer)
* **Booking & Payment**: Pemesanan ruangan, *private office*, dan *event space* secara langsung melalui aplikasi.
* **Virtual Office**: Pendaftaran layanan kantor virtual beserta pemantauan masa aktif secara mandiri.
* **Membership**: Pendaftaran paket keanggotaan dan pengecekan sisa kredit membership.
* **Riwayat Transaksi**: Akses penuh ke histori transaksi dan layanan yang telah digunakan.

### 2. Kasir (Cashier)
* **Sistem POS (Point of Sales)**: Pembuatan order untuk penjualan produk F&B dan penyewaan ruangan di tempat (*walk-in*).
* **Manajemen Sesi**: Fitur buka/tutup sesi kerja kasir, serah terima saldo, dan *takeover* sesi aktif.
* **Laporan Pembayaran**: Rekapitulasi pembayaran harian dan histori sesi untuk audit.

### 3. Admin Dago
* **Manajemen Master Data**: Pengelolaan data pengguna, tenant, produk, kategori ruangan, hingga pengaturan promo.
* **Kalkulasi Bagi Hasil**: Sistem otomatis untuk menghitung pembagian pendapatan (30% Owner, 70% Tenant) dan pemotongan utang tenant.
* **Keuangan & Biaya**: Pencatatan utang/kasbon tenant serta monitoring pengeluaran operasional bulanan (*Cost Bulanan*).
* **Approval**: Validasi permintaan *Virtual Office* dan booking acara besar.

### 4. Tenant & Pemilik (Owner)
* **Tenant**: Monitoring pesanan masuk secara *real-time* dan pembaruan status ketersediaan stok produk secara mandiri.
* **Owner**: Dasbor laporan total pendapatan, profitabilitas, laporan pajak, serta analisis produk F&B dan Working Space terlaris.

## 🛠️ Teknologi yang Digunakan

### Frontend
* **Framework**: React 19 + Vite 7.
* **UI Library**: Ant Design (Antd) 5 & Tailwind CSS 4.
* **Visualisasi Data**: Chart.js & Ant Design Charts.
* **State & Auth**: Context API (AuthProvider), JWT Storage, & Encrypt Storage.

### Backend
* **Framework**: Flask (Python).
* **Database**: MySQL.
* **Autentikasi**: Flask-JWT-Extended (Token-based).
* **Keamanan**: Flask-Bcrypt (Password Hashing).

## ⚙️ Persiapan & Instalasi

### 1. Konfigurasi Backend (Flask)
1.  Masuk ke direktori API: `cd api`.
2.  Instal dependensi: `pip install -r requirements.txt`.
3.  Konfigurasi koneksi database pada `helper/db_helper.py`.
4.  Jalankan server: `python app.py`.

### 2. Konfigurasi Frontend (React)
1.  Masuk ke direktori utama: `cd sistem-working-space-dago`.
2.  Instal dependensi: `npm install`.
3.  Buat file `.env` di root folder dan tambahkan URL API:
    `VITE_BASE_URL=http://localhost:5000`
4.  Jalankan mode pengembangan: `npm run dev`.

## 🔐 Keamanan
* **Token JWT**: Semua akses ke endpoint admin dan fungsionalitas sensitif memerlukan header `Authorization: Bearer <token>`.
* **Ganti Password**: Pengguna kasir diwajibkan mengganti kata sandi pada login pertama untuk keamanan tambahan.

## 📂 Struktur Proyek
* `api/`: Berisi seluruh logika backend (auth, admin, transaksi, dll).
* `src/pages/`: Implementasi halaman antarmuka berdasarkan peran pengguna.
* `src/services/`: Berisi `service.js` sebagai jembatan integrasi API ke frontend.
* `src/components/`: Komponen UI modular dan *Route Guards* (SesiAktifGuard, PrivateRoute).
