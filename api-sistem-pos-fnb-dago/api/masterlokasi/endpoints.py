"""Routes for module masterlokasi"""
from flask import Blueprint, jsonify, request
from helper.db_helper import get_connection

masterlokasi_endpoints = Blueprint("masterlokasi_endpoints", __name__)

# --- GET (Ambil Data) & POST (Tambah Data) ---
@masterlokasi_endpoints.route("/master-lokasi", methods=["GET", "POST"])
def manage_lokasi():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. LOGIKA GET (AMBIL DATA)
        if request.method == "GET":
            # Tangkap parameter '?status=' dari URL (dikirim oleh pelanggan)
            status_filter = request.args.get("status")

            # Jika yang minta adalah Pelanggan (minta yang active saja)
            if status_filter == "active":
                query = "SELECT * FROM master_lokasi WHERE status = 'Active' ORDER BY id_lokasi DESC"
            # Jika yang minta Admin (tanpa parameter, tampilkan semua)
            else:
                query = "SELECT * FROM master_lokasi ORDER BY id_lokasi DESC"
            
            cursor.execute(query)
            results = cursor.fetchall()
            return jsonify({"message": "OK", "datas": results}), 200

        # 2. LOGIKA POST (TAMBAH DATA)
        elif request.method == "POST":
            data = request.json
            nama_lokasi = data.get("nama_lokasi")
            status = data.get("status", "Active")

            if not nama_lokasi:
                return jsonify({"message": "ERROR", "error": "Nama lokasi wajib diisi"}), 400

            query = "INSERT INTO master_lokasi (nama_lokasi, status) VALUES (%s, %s)"
            cursor.execute(query, (nama_lokasi, status))
            conn.commit()
            return jsonify({"message": "Lokasi berhasil ditambahkan"}), 201

    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# --- PUT (Edit Data) & DELETE (Hapus Data) ---
@masterlokasi_endpoints.route("/master-lokasi/<int:id_lokasi>", methods=["PUT", "DELETE"])
def update_delete_lokasi(id_lokasi):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 3. LOGIKA PUT (UPDATE DATA)
        if request.method == "PUT":
            data = request.json
            nama_lokasi = data.get("nama_lokasi")
            status = data.get("status")

            if not nama_lokasi:
                return jsonify({"message": "ERROR", "error": "Nama lokasi wajib diisi"}), 400

            query = "UPDATE master_lokasi SET nama_lokasi=%s, status=%s WHERE id_lokasi=%s"
            cursor.execute(query, (nama_lokasi, status, id_lokasi))
            conn.commit()
            return jsonify({"message": "Lokasi berhasil diperbarui"}), 200

        # 4. LOGIKA DELETE (HAPUS DATA)
        elif request.method == "DELETE":
            cursor.execute("DELETE FROM master_lokasi WHERE id_lokasi=%s", (id_lokasi,))
            conn.commit()
            return jsonify({"message": "Lokasi berhasil dihapus"}), 200

    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()