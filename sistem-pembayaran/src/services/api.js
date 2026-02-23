const api_url = `${import.meta.env.VITE_BASE_URL}/api/v1/`
const api_url_localhost = 'http://localhost:5000/api/v1/'

// Tambahkan function ini
export const getActivePromos = async () => {
    try {
        // Backend sekarang otomatis hanya mengirimkan promo F&B atau All
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
        // Panggil endpoint baru: /promo/check?code=XXX
        const response = await fetch(`${api_url}transaksi/promo/check?code=${code}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // TIDAK ADA Authorization Header di sini
            },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Lempar error agar bisa ditangkap di PaymentPelanggan.jsx
            throw new Error(data.error || 'Kode promo tidak valid.');
        }
        
        return data; // Mengembalikan object promo
    } catch (error) {
        console.error("Error check promo:", error);
        throw error;
    }
};

export const getFnbTaxRate = async () => {
    try {
        // Tidak perlu token jika setting pajak ini publik
        const response = await fetch(api_url + 'transaksi/settings/tax-fnb', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Tambahkan Authorization header jika endpoint memerlukan login
            },
        });
        const data = await response.json();
        if (!response.ok) {
            // Gunakan default 10 jika ada error, tapi log pesannya
            console.error("Gagal mengambil pajak dari API:", data.error || response.statusText);
            return 10.0; // Fallback default tax rate
        }
        // Pastikan data.taxRate ada dan merupakan angka
        const taxRate = parseFloat(data.taxRate);
        return !isNaN(taxRate) ? taxRate : 10.0; // Return 10 jika parsing gagal

    } catch (error) {
        console.error("Error saat mengambil persentase pajak:", error);
        return 10.0; // Fallback default tax rate jika fetch gagal
    }
};



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



// COBA COBA LAGI
// export const getKategori = async () => {
//     try {
//         const response = await fetch(api_url + `menu/kategori`);
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         throw error;
//     }
// };
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


export const createOrder = async (orderDetails) => {
    try {
        const response = await fetch(api_url + 'produk/create', { // Memanggil endpoint baru
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderDetails), // Mengirim data pesanan
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
