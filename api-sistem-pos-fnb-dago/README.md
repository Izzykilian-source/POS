# Sistem Working Space Dago

Sistem manajemen terintegrasi untuk pengelolaan *working space*, mencakup layanan penyewaan ruangan, keanggotaan, kantor virtual (*Virtual Office*), sistem kasir (POS), hingga dasbor analitik untuk pemilik. Proyek ini terdiri dari *Frontend* berbasis **React + Vite** dan *Backend* berbasis **Flask API**.

## 🚀 Fitur Berdasarkan Peran (RBAC)

Aplikasi ini mengimplementasikan kontrol akses berbasis peran untuk memastikan keamanan dan relevansi fitur bagi setiap pengguna:

### 1. Pelanggan (Customer)
* **Booking & Payment**: Pemesanan ruangan, *private office*, dan *event space* secara langsung.
* **Membership**: Pendaftaran paket keanggotaan dan pengecekan sisa kredit.
* **Virtual Office**: Layanan pendaftaran kantor virtual beserta pemantauan masa aktif.
* **Riwayat**: Akses penuh ke histori transaksi dan layanan yang telah digunakan.

### 2. Kasir (Cashier)
* **Manajemen Sesi**: Fitur buka/tutup sesi kerja dan *takeover* sesi aktif.
* **Point of Sales (POS)**: Transaksi harian untuk produk F&B dan penyewaan ruangan di tempat (*walk-in*).
* **Laporan Kasir**: Rekapitulasi pembayaran harian dan riwayat sesi kasir.

### 3. Admin Dago
* **Manajemen Data Master**: Pengelolaan data pengguna, tenant, produk fnb, kategori ruangan, dan promo.
* **Persetujuan (Approval)**: Validasi permintaan *Virtual Office* dan booking acara besar.
* **Manajemen Hutang**: Pencatatan hutang/kasbon tenant dan pengelolaan biaya operasional bulanan.

### 4. Admin Tenant
* **Dashboard Operasional**: Pemantauan pesanan masuk secara *real-time*.
* **Kelola Stok**: Pembaruan status ketersediaan produk tenant secara mandiri.

### 5. Pemilik (Owner)
* **Analitik Bisnis**: Dasbor pendapatan total, profit, dan statistik produk terlaris.
* **Laporan Pajak**: Pencatatan dan monitoring kewajiban pajak operasional.
* **Bagi Hasil**: Laporan rekapitulasi pembagian hasil antara pengelola dan tenant.

## 🛠️ Teknologi yang Digunakan

### Frontend
* **Framework**: React 19 + Vite 7
* **UI Library**: Ant Design 5 & Tailwind CSS 4
* **State Management**: Context API (AuthProvider)
* **Visualisasi**: Chart.js & Ant Design Charts

### Backend
* **Framework**: Flask
* **Autentikasi**: Flask-JWT-Extended (JWT Bearer Token)
* **Keamanan**: Flask-Bcrypt (Hasing Password)
* **Database**: MySQL (Connector Python)

## ⚙️ Persiapan & Instalasi

### 1. Backend (Flask)
```bash
# Masuk ke direktori API
cd api

# Install dependensi (disarankan menggunakan virtual environment)
pip install -r requirements.txt

# Jalankan server
python app.py
