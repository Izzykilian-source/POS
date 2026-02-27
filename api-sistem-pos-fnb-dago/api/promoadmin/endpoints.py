"""Routes for module promoadmin"""
import os
import json  # <--- TAMBAHAN PENTING UNTUK MENANGANI JSON
from flask import Blueprint, jsonify, request
from helper.db_helper import get_connection
from helper.form_validation import get_form_data
from flask_jwt_extended import jwt_required
from helper.year_operation import diff_year
from helper.year_operation import check_age_book
from werkzeug.utils import secure_filename
from decimal import Decimal
from datetime import datetime, timedelta

promoadmin_endpoints = Blueprint("promoadmin_endpoints", __name__)

# folder penyimpanan upload
UPLOAD_FOLDER = "img"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ READ promo
@promoadmin_endpoints.route('/readPromo', methods=['GET'])
def read_promo():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM promo ORDER BY id_promo DESC"
        cursor.execute(query)
        results = cursor.fetchall()
        
        for row in results:
            for key, value in row.items():
                if isinstance(value, (bytes, bytearray)):
                    row[key] = value.decode('utf-8')
                elif hasattr(value, 'isoformat'): 
                    row[key] = value.isoformat()
                elif isinstance(value, timedelta):
                    row[key] = str(value)
        return jsonify({"message": "OK", "datas": results}), 200
    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
        
# ✅ CREATE promo
@promoadmin_endpoints.route('/createPromo', methods=['POST'])
def create_promo():
    connection = None
    cursor = None
    try:
        data = request.get_json()
        
        kode_promo = data.get("kode_promo")
        deskripsi_promo = data.get("deskripsi_promo")
        nilai_diskon = data.get("nilai_diskon")
        tanggal_mulai = data.get("tanggal_mulai")
        tanggal_selesai = data.get("tanggal_selesai")
        
        waktu_mulai = data.get("waktu_mulai") or None 
        waktu_selesai = data.get("waktu_selesai") or None
        
        # --- PERBAIKAN PENANGANAN SYARAT (JSON DICT -> STRING) ---
        syarat_raw = data.get("syarat")
        if isinstance(syarat_raw, dict):
            syarat = json.dumps(syarat_raw) # Ubah objek menjadi String JSON
        elif isinstance(syarat_raw, str) and syarat_raw.strip() == "":
            syarat = None
        else:
            syarat = syarat_raw
            
        status_aktif = data.get("status_aktif", "inaktif")
        kategori_promo = data.get("kategori_promo", "all") 

        if not all([kode_promo, nilai_diskon, tanggal_mulai, tanggal_selesai]):
            return jsonify({"message": "ERROR", "error": "Field wajib harus diisi"}), 400

        connection = get_connection()
        cursor = connection.cursor()
        
        query = """
            INSERT INTO promo (
                kode_promo, deskripsi_promo, nilai_diskon, 
                tanggal_mulai, tanggal_selesai, waktu_mulai, 
                waktu_selesai, status_aktif, syarat, kategori_promo
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            kode_promo, deskripsi_promo, nilai_diskon, 
            tanggal_mulai, tanggal_selesai, waktu_mulai, 
            waktu_selesai, status_aktif, syarat, kategori_promo
        ))
        
        connection.commit()
        return jsonify({"message": "Promo berhasil ditambahkan"}), 201

    except Exception as e:
        print(f"Error Create Promo: {e}") 
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

# ✅ UPDATE promo
@promoadmin_endpoints.route('/updatePromo/<int:id_promo>', methods=['PUT'])
def update_promo(id_promo):
    connection = None
    cursor = None
    try:
        data = request.get_json()
        
        kode_promo = data.get("kode_promo")
        deskripsi_promo = data.get("deskripsi_promo")
        nilai_diskon = data.get("nilai_diskon")
        tanggal_mulai = data.get("tanggal_mulai")
        tanggal_selesai = data.get("tanggal_selesai")
        status_aktif = data.get("status_aktif")
        
        waktu_mulai = data.get("waktu_mulai") or None
        waktu_selesai = data.get("waktu_selesai") or None
        
        # --- PERBAIKAN PENANGANAN SYARAT (JSON DICT -> STRING) ---
        syarat_raw = data.get("syarat")
        if isinstance(syarat_raw, dict):
            syarat = json.dumps(syarat_raw) 
        elif isinstance(syarat_raw, str) and syarat_raw.strip() == "":
            syarat = None
        else:
            syarat = syarat_raw
            
        kategori_promo = data.get("kategori_promo", "all") 

        if not all([kode_promo, nilai_diskon, tanggal_mulai, tanggal_selesai, status_aktif]):
            return jsonify({"message": "ERROR", "error": "Semua field wajib diisi"}), 400

        connection = get_connection()
        cursor = connection.cursor()
        
        query = """
            UPDATE promo 
            SET kode_promo = %s, 
                deskripsi_promo = %s, 
                nilai_diskon = %s, 
                tanggal_mulai = %s, 
                tanggal_selesai = %s, 
                waktu_mulai = %s, 
                waktu_selesai = %s, 
                status_aktif = %s,
                syarat = %s,
                kategori_promo = %s
            WHERE id_promo = %s
        """
        
        cursor.execute(query, (
            kode_promo, deskripsi_promo, nilai_diskon, 
            tanggal_mulai, tanggal_selesai, waktu_mulai, 
            waktu_selesai, status_aktif, syarat, kategori_promo,
            id_promo
        ))
        
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "ERROR", "error": "Promo tidak ditemukan"}), 404

        return jsonify({"message": "Promo berhasil diperbarui"}), 200

    except Exception as e:
        print(f"Error Update Promo: {e}") 
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
        
# ✅ DELETE promo
@promoadmin_endpoints.route('/deletePromo/<int:id_promo>', methods=['DELETE'])
def delete_promo(id_promo):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        query = "DELETE FROM promo WHERE id_promo = %s"
        cursor.execute(query, (id_promo,))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "ERROR", "error": "Promo tidak ditemukan"}), 404

        return jsonify({"message": "Promo berhasil dihapus"}), 200
    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()