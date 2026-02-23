// utils/parseFeatures.js
export function parseFeatures(featureString) {
  if (!featureString || typeof featureString !== "string") return [];

  return featureString
    .split("#")       // pisah berdasarkan "#"
    .map(f => f.trim()) // hapus spasi
    .filter(f => f);    // buang string kosong
}

// contoh:
// parseFeatures("#fitur1 #fitur2 #fitur3")
// hasil: ["fitur1", "fitur2", "fitur3"]
