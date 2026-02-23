// utils/formatRupiah.js

export function formatRupiahPerJam(value) {
  if (typeof value !== "number") {
    throw new Error("Value harus berupa number");
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(value)
    .replace("Rp", "Rp.") + "/jam";
}

// // Contoh penggunaan:
// console.log(formatRupiahPerJam(10000)); // Output: Rp.10.000/jam
// console.log(formatRupiahPerJam(250000)); // Output: Rp.250.000/jam

// utils/formatRupiah.js

// Hanya format rupiah (tanpa "/jam")
export function formatRupiah(value) {
  if (typeof value !== "number") {
    throw new Error("Value harus berupa number");
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value).replace("Rp", "Rp.");
}