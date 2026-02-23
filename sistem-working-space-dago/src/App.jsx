import React from "react";
import { Router, Routes, Route } from "react-router-dom";
import DashboardWS from "./pages/DashboardWS/DashboardWS/DashboardWS";
import RoomDetail from "./pages/Pelanggan/RoomDetail/RoomDetail";
import BookingRuangan from "./pages/Pelanggan/BookingRuangan/BookingRuangan";
import BookingPayment from "./pages/Pelanggan/BookingPayment/BookingPayment";
import BookingSukses from "./pages/Pelanggan/BookingSukses/BookingSukses";
import DaftarMember from "./pages/Pelanggan/DaftarMember/DaftarMember";
import DashboardAdmin from "./pages/Admin/DashboardAdmin/DashboardAdmin";
import DaftarAkun from "./pages/Pelanggan/DaftarAkun/DaftarAkun";
import Login from "./pages/Login/Login";
import AuthProvider from "./providers/AuthProvider";
import PrivateRoute from "./components/layout/PrivateRoute";
import MengelolaOrderF_B from "./pages/Kasir/MengelolaOrderF&B/MengelolaOrderF&B";
import MainKasir from "./components/layout/MainKasir";
import MengelolaBookingRuangan from "./pages/Kasir/MengelolaBookingRuangan/MengelolaBookingRuangan";
import DaftarVO from "./pages/Pelanggan/DaftarVO/DaftarVO";
import RiwayatTransaksi from "./pages/Pelanggan/RiwayatTransaksi/RiwayatTransaksi";
import CekKreditMembership from "./pages/Pelanggan/CekKreditMembership/CekKreditMembership";
import CekMasaVO from "./pages/Pelanggan/CekMasaVO/CekMasaVO";
import DashboardPengguna from "./pages/Pelanggan/DashboardPengguna/DashboardPengguna";
import InformasiRuangan from "./pages/Pelanggan/InformasiRuangan/InformasiRuangan";
import VirtualOffice from "./pages/Pelanggan/VirtualOffice/VirtualOffice";
import DetailPaket from "./pages/Pelanggan/DetailPaket/DetailPaket";
import InformasiWS from "./pages/DashboardWS/InformasiWS/InformasiWS";
import InformasiVO from "./pages/DashboardWS/InformasiVO/InformasiVO";
import Membership from "./pages/Pelanggan/Membership/Membership";
import SpaceRental from "./pages/Admin/SpaceRental/SpaceRental";
import { TranslationOutlined } from "@ant-design/icons";
import MasterData from "./pages/Admin/MasterData/MasterData";
import SidebarAdmin from "./pages/Admin/DashboardAdmin/SidebarAdmin";
import DashboardAdmins from "./pages/Admin/DashboardAdmin/DashboardAdmins";
import TransaksiAdmin from "./pages/Admin/TransaksiAdmin/TransaksiAdmin";
import SidebarTenant from "./pages/Tenant/SidebarTenant/SidebarTenant";
import DashboardTenant from "./pages/Tenant/DashboardTenant/DashboardTenant";
import SettingTenant from "./pages/Tenant/SettingTenant/SettingTenant";
import KelolaStok from "./pages/Tenant/KelolaStok/KelolaStok";
import SidebarKasir from "./pages/Kasir/SidebarKasir/SidebarKasir";
import TransaksiKasir from "./pages/Kasir/TransaksiKasir/TransaksiKasir";
import MerchantKasir from "./pages/Kasir/MerchantKasir/MerchantKasir";
import ProductKasir from "./pages/Kasir/ProductKasir/ProductKasir";
import HistoryKasir from "./pages/Kasir/HistoryKasir/HistoryKasir";
import SpaceKasir from "./pages/Kasir/SpaceKasir/SpaceKasir";
import SettingsKasir from "./pages/Kasir/SettingsKasir/SettingsKasir";
import Laporan from "./pages/Owner/Laporan/Laporan";
import SidebarOwner from "./pages/Owner/SidebarOwner/SidebarOwner";
import BagiHasil from "./pages/Owner/BagiHasil/BagiHasil";
import ReportKasir from "./pages/Kasir/ReportKasir/ReportKasir";
import EventSpaces from "./pages/DashboardWS/EventSpaces/EventSpaces";
import EventSpacesAdmin from "./pages/Admin/EventSpaces/EventSpaces";
import FNBDashboard from "./pages/Owner/FnbDashboard/FnbDashboard";
import WorkingSpace from "./pages/Owner/WorkingSpace/WorkingSpace";
import EventSpacesPelanggan from "./pages/Pelanggan/EventSpacesPelanggan/EventSpacesPelanggan";
import DetailEventSpaces from "./pages/Pelanggan/DetailEventSpaces/DetailEventSpaces";
import PromoPelanggan from "./pages/Pelanggan/PromoPelanggan/PromoPelanggan";
import { useNavigate } from "react-router-dom";
import Forbidden from "./pages/Forbidden/Forbidden";
import OrderKasir from "./pages/Kasir/OrderKasir/OrderKasir";
import BuatOrderKasir from "./pages/Kasir/BuatOrderKasir/BuatOrderKasir";
import CostBulanan from "./pages/Admin/CostBulanan/CostBulanan";
import VirtualOfficeApproval from "./pages/Admin/VirtualOfficeApproval/VirtualOfficeApproval";
import HutangAdmin from "./pages/Admin/HutangAdmin/HutangAdmin";
import LaporanPembayaran from "./pages/Kasir/LaporanPembayaran/LaporanPembayaran";
import PrivateOffice from "./pages/Pelanggan/PrivateOffice/PrivateOffice";
import InformasiAcara from "./pages/Pelanggan/InformasiAcara/InformasiAcara";
import KasirSession from "./pages/Kasir/KasirSession/KasirSession";
import BukaSesi from "./pages/Kasir/BukaSesi/BukaSesi";
import SesiKasirGuard from "./components/SesiKasirGuard";
import LaporanPajak from "./pages/Owner/LaporanPajak/LaporanPajak";
import InformasiAcaraLogin from "./pages/Pelanggan/InformasiAcaraLogin/InformasiAcaraLogin";
import GantiPasswordKasir from "./pages/Kasir/GantiPasswordKasir/GantiPasswordKasir";
import SesiAktifGuard from "./components/SesiAktifGuard";
import AboutUs from "./pages/Pelanggan/AboutUs/AboutUs";
import FAQPage from "./pages/Pelanggan/FAQPage/FAQPage";
import RiwayatSesiDetail from "./pages/Kasir/RiwayatSesiDetail/RiwayatSesiDetail";

const App = () => {
  const Navigate = useNavigate();
  return (
    <AuthProvider>
      <Routes>
        <Route path="/forbidden" element={<Forbidden />} />



        <Route path="/" element={<Login />} />

        {/* <Route path='/dashboardws' element={<DashboardWS/>}/> */}

        <Route path="/roomdetail/:id" element={<RoomDetail />} />

        <Route
          path="/kasir-session"
          element={

            <KasirSession />

          }
        />

        <Route
          path="/dashboard-pengguna"
          element={
            <PrivateRoute>
              <DashboardPengguna />
            </PrivateRoute>
          }
        />

        <Route path="/daftar-vo/:id" element={<DaftarVO />} />

        {/* <Route
          path="/booking/:id"
          element={
            <PrivateRoute>
              {" "}
              <BookingRuangan />{" "}
            </PrivateRoute>
          }
        />

        <Route
          path="/payment/:id"
          element={
            <PrivateRoute>
              {" "}
              <BookingPayment />{" "}
            </PrivateRoute>
          }
        /> */}

        <Route
          path="/booking-sukses"
          element={
            <PrivateRoute>
              {" "}
              <BookingSukses />
            </PrivateRoute>
          }
        />


        <Route
          path="/detail-paket"
          element={
            <PrivateRoute>
              <DetailPaket />
            </PrivateRoute>
          }
        />

        <Route
          path="/detail-paket/:id"
          element={
            <PrivateRoute>
              <DetailPaket />
            </PrivateRoute>
          }
        />

        <Route
          path="/event-spaces-pelanggan"
          element={
            <PrivateRoute>
              <EventSpacesPelanggan />
            </PrivateRoute>
          }
        />

        <Route
          path="/detail-event-spaces"
          element={
            <PrivateRoute>
              <DetailEventSpaces />
            </PrivateRoute>
          }
        />

        {/* <Route
          path="/detail-event-spaces/:id" // <-- UBAH DI SINI
          element={
            <PrivateRoute>
              <DetailEventSpaces />
            </PrivateRoute>
          }
        /> */}




        <Route path="/daftar-member/:id" element={<DaftarMember />} />


        <Route path="/daftar-vo" element={<DaftarVO />} />

        <Route path="/login" element={<Login />} />

        <Route path="/daftar-akun" element={<DaftarAkun />} />

        <Route path="/informasiws" element={<InformasiWS />} />

        <Route path="/informasivo" element={<InformasiVO />} />

        <Route path="/eventspaces" element={<EventSpaces />} />

        <Route path="/informasi-acara" element={<InformasiAcara />} />

        {/* ===================== */}
        {/* === RUTE ADMIN DAGO (REVISED) === */}
        {/* ===================== */}
        <Route element={<PrivateRoute allowedRoles={['admin_dago']} />}> {/* 1. Cek Login & Role */}
          <Route element={<SidebarAdmin />}> {/* 2. Tampilkan Layout Sidebar Admin */}

            {/* 3. Halaman-halaman Admin di dalam Outlet SidebarAdmin */}
            <Route path="/virtualofficeadmin" element={<VirtualOfficeApproval />} />
            <Route path="/eventspacesadmin" element={<EventSpacesAdmin />} />
            <Route path="/transaksiadmin" element={<TransaksiAdmin />} />

            {/* --- PERBAIKAN RUTE MASTER DATA --- */}
            {/* Rute ini menangani /masterdataadmin (tanpa tabKey) */}
            <Route path="/masterdataadmin" element={<MasterData />} />
            {/* Rute ini menangani /masterdataadmin/:tabKey */}
            <Route path="/masterdataadmin/:tabKey" element={<MasterData />} />
            {/* --- AKHIR PERBAIKAN --- */}

            <Route path="/costbulananadmin" element={<CostBulanan />} />
            <Route path="/hutangadmin" element={<HutangAdmin />} />

            {/* Tambahkan rute admin lain di sini */}

            {/* Hapus redirect <Navigate> yang sebelumnya ada di sini */}

          </Route>
        </Route>




        {/* ======================= */}
        {/* === RUTE ADMIN TENANT === */}
        {/* ======================= */}
        <Route element={<PrivateRoute allowedRoles={['admin_tenant']} />}>

          {/* 1. Halaman Buka Sesi (Tanpa Sidebar) */}
          <Route path="/tenant/buka-sesi" element={<BukaSesi />} />

          {/* 2. ROUTE KHUSUS RIWAYAT (PENTING!)
      - Ditaruh DI LUAR 'SesiAktifGuard' agar bisa diakses dari BukaSesi tanpa start shift.
      - Menggunakan SidebarTenant agar UI tetap konsisten.
      - Mengarah ke 'DashboardTenant' yang sudah kita modifikasi (Dual Mode).
        */}
          <Route element={<SidebarTenant />}>
            <Route path="/ordertenant/:id" element={<DashboardTenant />} />
          </Route>

          {/* 3. Halaman Operasional (Wajib Sesi Aktif) */}
          <Route element={<SesiAktifGuard />}>
            <Route element={<SidebarTenant />}>
              {/* Route Live Dashboard */}
              <Route path="/ordertenant" element={<DashboardTenant />} />

              {/* Route Tenant Lainnya */}
              <Route path="/stoktenant" element={<KelolaStok />} />
              <Route path="/settingstenant" element={<SettingTenant />} />
              {/* Tambahkan rute tenant lain di sini */}
            </Route>
          </Route>

        </Route>



        {/* Kasir */}
        {/* ======================= */}
        {/* === RUTE KASIR BARU === */}
        {/* ======================= */}
        {/* RUTE 1: HALAMAN BUKA SESI
            Ini adalah rute untuk /kasir/buka-sesi.
            - Dibungkus PrivateRoute (cek login)
            - TIDAK DIBUNGKUS SidebarKasir
        */}
        <Route element={<PrivateRoute allowedRoles={['kasir']} />}>

          {/* HALAMAN BUKA SESI */}
          <Route path="/kasir/buka-sesi" element={<BukaSesi />} />

          {/* --- PERUBAHAN YANG DITAMBAHKAN ---
            HALAMAN GANTI PASSWORD (UNTUK LOGIN PERTAMA KALI)
          */}
          <Route
            path="/kasir/ganti-password"
            element={<GantiPasswordKasir />}
          />
          {/* --- AKHIR PERUBAHAN --- */}

        </Route>
        {/* RUTE 2: SEMUA HALAMAN KASIR LAINNYA
            Rute-rute ini memerlukan:
            1. Login & Role yang benar (PrivateRoute)
            2. Sesi kasir yang aktif (SesiKasirGuard)
            3. Tampilan Sidebar (SidebarKasir)
          */}
        {/* ======================= */}
        {/* === RUTE KASIR === */}
        {/* ======================= */}
        <Route element={<PrivateRoute allowedRoles={['kasir']} />}>

          {/* 1. Halaman Buka Sesi (Tanpa Sidebar) */}
          <Route path="/kasir/buka-sesi" element={<BukaSesi />} />

          {/* 2. ROUTE KHUSUS RIWAYAT (PENTING!)
      - Menggunakan SidebarKasir agar UI konsisten (ada sidebar kiri).
      - Ditaruh DI LUAR 'SesiKasirGuard' agar bisa dibuka walau belum Start Shift.
      - Mengarah ke 'TransaksiKasir' agar tampilan Chart & Tabel sama persis.
  */}
          <Route element={<SidebarKasir />}>
            <Route path="/kasir/riwayat-sesi/:id" element={<TransaksiKasir />} />
          </Route>

          {/* 3. Halaman Operasional (Wajib Sesi Aktif) */}
          <Route element={<SesiKasirGuard />}>
            <Route element={<SidebarKasir />}>

              {/* Route Live POS */}
              <Route path="/transaksikasir" element={<TransaksiKasir />} />

              {/* Route Kasir Lainnya */}
              <Route path="/merchantkasir" element={<MerchantKasir />} />
              <Route path="/productkasir" element={<ProductKasir />} />
              <Route path="/historykasir" element={<HistoryKasir />} />
              <Route path="/spacekasir" element={<SpaceKasir />} />
              <Route path="/laporanpembayarankasir" element={<LaporanPembayaran />} />
              <Route path="/settingskasir" element={<SettingsKasir />} />
              <Route path="/buatorderkasir" element={<BuatOrderKasir />} />
              <Route path="/orderkasir" element={<OrderKasir />} />
              <Route path="/reportkasir" element={<ReportKasir />} />

            </Route>
          </Route>

        </Route>

        {/* ======================= */}
        {/* === AKHIR RUTE KASIR === */}
        {/* ======================= */}

        {/* (Pastikan Anda MENGHAPUS semua rute kasir duplikat lainnya) */}

        {/* ... (Rute Admin, Pelanggan, Owner Anda) ... */}




        <Route
          path="/orderkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <OrderKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/buatorderkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <BuatOrderKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/transaksikasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <TransaksiKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/merchantkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <MerchantKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/productkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <ProductKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/historykasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <HistoryKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/spacekasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <SpaceKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />

        <Route
          path="/reportkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <ReportKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/settingskasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <SettingsKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />

        {/* Kasir End */}



        {/* ... (Rute publik, Admin, Tenant, Kasir Anda) ... */}

        {/* ========================== */}
        {/* === RUTE PELANGGAN BARU === */}
        {/* ========================== */}

        <Route element={<PrivateRoute allowedRoles={['pelanggan']} />}>
          <Route path="/booking/:id" element={<BookingRuangan />} />
          <Route path="/payment/:id" element={<BookingPayment />} />
          {/* Tambahkan rute lain yang tidak pakai DashboardPengguna di sini */}
          <Route
            path="/detail-event-spaces/:id" // <-- UBAH DI SINI
            element={
              <DetailEventSpaces />
            }
          />
        </Route>

        {/* Grup rute ini dilindungi oleh PrivateRoute (hanya role 'pelanggan')
            dan menggunakan layout DashboardPengguna */}
        <Route element={<PrivateRoute allowedRoles={['pelanggan']} />}> {/* 1. Cek Login & Role */}
          <Route element={<DashboardPengguna />}> {/* 2. Tampilkan Layout (harus punya <Outlet/>) */}

            {/* 3. Halaman-halaman ini akan dirender di dalam <Outlet/> DashboardPengguna */}
            <Route path="/informasi-ruangan" element={<InformasiRuangan />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/virtual-office" element={<VirtualOffice />} />
            <Route path="/cek-kredit-membership" element={<CekKreditMembership />} />
            <Route path="/cek-masa-vo" element={<CekMasaVO />} />
            <Route path="/private-office" element={<PrivateOffice />} />
            <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
            <Route path="/informasi-acara-pelanggan" element={<InformasiAcaraLogin />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faq" element={<FAQPage />} />

            <Route path="/event-spaces" element={<EventSpacesPelanggan />} />

            <Route path="/promo-pelanggan" element={<PromoPelanggan />} />

            {/* Jika ada halaman pelanggan lain di dalam DashboardPengguna, tambahkan di sini */}

          </Route>

        </Route>

        {/* ========================== */}
        {/* === AKHIR RUTE PELANGGAN === */}
        {/* ========================== */}

        {/* Pelanggan End */}
        {/* (HAPUS SEMUA RUTE PELANGGAN DUPLIKAT YANG LAMA) */}




        {/* Pelanggan End */}
        <Route element={<PrivateRoute allowedRoles={['owner']} />}> {/* 1. Cek Login & Role 'owner' */}
          <Route element={<SidebarOwner />}> {/* 2. Tampilkan Layout Sidebar Owner (harus punya <Outlet />) */}

            {/* 3. Halaman-halaman Owner di dalam Outlet SidebarOwner */}
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/fnbdashboard" element={<FNBDashboard />} />
            <Route path="/workingspace" element={<WorkingSpace />} />
            <Route path="/bagihasil" element={<BagiHasil />} />
            <Route path="/laporanpajak" element={<LaporanPajak />} />

            {/* Tambahkan rute owner lain di sini jika ada */}

          </Route>
        </Route>
        {/* ===================== */}
        {/* === AKHIR RUTE OWNER === */}
        {/* ===================== */}
      </Routes>
    </AuthProvider>
  );
};

export default App;
