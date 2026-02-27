// src/services/api.js

const api_url = `${import.meta.env.VITE_BASE_URL}/api/v1/`

// --- 1. PROMO & TAX ---

export const getActivePromos = async () => {
    try {
        const response = await fetch(`${api_url}transaksi/promo/list-active`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal memuat promo');
        return data.datas || []; 
    } catch (error) {
        console.error("Error fetching promos:", error);
        return [];
    }
};

export const checkPromoCode = async (code) => {
    try {
        const response = await fetch(`${api_url}transaksi/promo/check?code=${code}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Kode promo tidak valid.');
        }
        
        return data; 
    } catch (error) {
        console.error("Error check promo:", error);
        throw error;
    }
};

export const getFnbTaxRate = async () => {
    try {
        const response = await fetch(api_url + 'transaksi/settings/tax-fnb', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Gagal mengambil pajak dari API:", data.error || response.statusText);
            return 10.0; 
        }
        const taxRate = parseFloat(data.taxRate);
        return !isNaN(taxRate) ? taxRate : 10.0; 

    } catch (error) {
        console.error("Error saat mengambil persentase pajak:", error);
        return 10.0; 
    }
};

// --- 2. PRODUK & MENU ---

export const getMenu = async () => {
    try {
        const response = await fetch(api_url + `produk/read`)
        const data = await response.json()
        return data
    } catch (error) {
        throw error
    }
}

export const getTenants = async () => {
    try {
        const response = await fetch(api_url + `produk/tenants`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export const getKategori = async (idTenant = null) => {
    try {
        let url = api_url + `produk/kategori`;
        if (idTenant) {
            url += `?id_tenant=${idTenant}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export const getMenuByCategory = async (idKategori) => {
    try {
        const response = await fetch(api_url + `produk/readByKategori?id_kategori=${idKategori}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

// --- 3. TRANSAKSI / ORDER ---

export const createOrder = async (orderDetails) => {
    try {
        const response = await fetch(api_url + 'produk/create', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderDetails), 
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Gagal membuat pesanan.');
        }
        return data;
    } catch (error) {
        console.error("Error saat membuat pesanan:", error);
        throw error;
    }
};

// --- 4. MASTER DATA LOKASI (BARU) ---
// Bagian ini digunakan untuk Dropdown di PaymentPelanggan & CRUD di Admin

// Helper untuk header Auth (Jika backend butuh token admin)
const getAuthHeaders = () => {
    // Sesuaikan dengan cara Mas menyimpan token login admin
    const token = localStorage.getItem('token'); 
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const getLocations = async () => {
    try {
        // Endpoint: /api/v1/master-lokasi
        const response = await fetch(api_url + 'master-lokasi', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Gagal mengambil data lokasi');
        
        // Mengembalikan array datas, atau array kosong jika null
        return data.datas || [];
    } catch (error) {
        console.error("Error getLocations:", error);
        return [];
    }
};

// 👇 Fungsi Baru Untuk Pelanggan (Hanya ambil yang Active) 👇
export const getActiveLocations = async () => {
    try {
        const response = await fetch(api_url + 'master-lokasi?status=active', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Gagal mengambil data lokasi aktif');
        
        return data.datas || [];
    } catch (error) {
        console.error("Error getActiveLocations:", error);
        return [];
    }
};

export const addLocation = async (payload) => {
    try {
        const response = await fetch(api_url + 'master-lokasi', {
            method: 'POST',
            headers: getAuthHeaders(), // Pakai auth header karena ini aksi admin
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal menambah lokasi');
        return data;
    } catch (error) {
        throw error;
    }
};

export const updateLocation = async (id, payload) => {
    try {
        const response = await fetch(api_url + `master-lokasi/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal update lokasi');
        return data;
    } catch (error) {
        throw error;
    }
};

export const deleteLocation = async (id) => {
    try {
        const response = await fetch(api_url + `master-lokasi/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal menghapus lokasi');
        return data;
    } catch (error) {
        throw error;
    }
};