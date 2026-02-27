"""Routes for module promo"""
import os
from flask import Blueprint, jsonify, request
from helper.db_helper import get_connection
from helper.form_validation import get_form_data
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta, date
import math
import traceback

promo_endpoints = Blueprint('promo', __name__)
UPLOAD_FOLDER = "img"

# ✅ GET ACTIVE PROMOS (Untuk Pelanggan & Kasir)
@promo_endpoints.route('/active', methods=['GET'])
def get_active_promos():
    """Mengambil semua promo yang aktif dari database."""
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        
        today = date.today()
        
        # SELECT * agar ID dan Syarat ikut terkirim ke frontend
        query = """
            SELECT *
            FROM promo
            WHERE LOWER(status_aktif) IN ('aktif', 'active') 
            AND tanggal_selesai >= %s
            ORDER BY tanggal_mulai DESC;
        """
        
        cursor.execute(query, (today,))
        promos = cursor.fetchall()

        for promo in promos:
            # Pastikan nilai_diskon berbentuk string angka murni agar bisa dihitung frontend
            promo['nilai_diskon'] = str(promo['nilai_diskon'])

            # Format tanggal agar bisa dibaca oleh JSON
            for key, value in promo.items():
                if isinstance(value, timedelta):
                    promo[key] = str(value)
                elif isinstance(value, date) and not isinstance(value, datetime):
                    promo[key] = value.strftime('%Y-%m-%d')
                elif isinstance(value, datetime):
                    promo[key] = value.strftime('%Y-%m-%d %H:%M:%S')
            
        return jsonify({"message": "OK", "datas": promos}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

# ✅ GET WORKSPACES
@promo_endpoints.route('/workspaces', methods=['GET'])
def get_workspaces_summary():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT 
                kr.id_kategori_promo,
                kr.nama_kategori AS title,
                kr.deskripsi AS `desc`,
                kr.gambar_kategori_promo AS img_filename, 
                (SELECT SUM(r.kapasitas) FROM promo r WHERE r.id_kategori_promo = kr.id_kategori_promo) AS total_capacity,
                (SELECT MIN(r.harga_per_jam) FROM promo r WHERE r.id_kategori_promo = kr.id_kategori_promo AND r.harga_per_jam > 0) AS min_price,
                (SELECT r.fitur_promo FROM promo r WHERE r.id_kategori_promo = kr.id_kategori_promo LIMIT 1) AS fasilitas_sample
            FROM kategori_promo kr
            WHERE kr.nama_kategori IN ('Space Monitor', 'Open Space', 'Room Meeting'); 
        """
        cursor.execute(query)
        workspaces = cursor.fetchall()
        
        formatted_workspaces = []
        for ws in workspaces:
            fasilitas_list = ws['fasilitas_sample'].strip().split('\n') if ws['fasilitas_sample'] else []
            price_str = f"Rp{ws['min_price']:,}".replace(',', '.') if ws['min_price'] else "N/A"

            formatted_workspaces.append({
                "category": "Working Space",
                "title": ws['title'],
                "desc": ws['desc'],
                "img": ws['img_filename'],
                "capacity": int(ws['total_capacity']) if ws['total_capacity'] else 0,
                "time": "08:00 - 22:00",
                "date": datetime.now().strftime("%d %b %Y"),
                "price": price_str,
                "features": ["Wifi", "Refill Water", "AC"],
                "fasilitas": fasilitas_list,
            })
            
        formatted_workspaces.append({
             "category": "Working Space",
             "title": "Space Lesehan",
             "desc": "Space lesehan dengan dudukan bantal dan meja.",
             "img": "space-lesehan1.jpeg",
             "capacity": 8,
             "time": "09:00 - 21:00",
             "date": datetime.now().strftime("%d %b %Y"),
             "price": "FREE",
             "features": ["Wifi", "Refill Water"],
             "fasilitas": ["Meja lesehan & bantal duduk", "Akses Wi-Fi", "Colokan listrik"],
             "note": "*Dengan syarat melakukan pemesanan F&B di lokasi",
        })

        return jsonify({"message": "OK", "datas": formatted_workspaces}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
        
# ✅ GET BOOKED HOURS
@promo_endpoints.route('/promo/<int:id_promo>/booked_hours/<string:tanggal>', methods=['GET'])
def get_booked_hours(id_promo, tanggal):
    connection = None
    cursor = None
    try:
        try:
            selected_date = datetime.strptime(tanggal, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "ERROR", "error": "Format tanggal salah. Gunakan YYYY-MM-DD."}), 400

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT waktu_mulai, waktu_selesai
            FROM booking_promo
            WHERE id_promo = %s AND DATE(waktu_mulai) = %s
        """
        cursor.execute(query, (id_promo, selected_date))
        bookings = cursor.fetchall()

        booked_hours = set()
        for booking in bookings:
            start_hour = booking['waktu_mulai'].hour
            end_hour = booking['waktu_selesai'].hour
            for hour in range(start_hour, end_hour):
                booked_hours.add(hour)

        return jsonify({"message": "OK", "datas": {"booked_hours": list(booked_hours)}}), 200

    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
            
# ✅ READ MEMBERSHIPS
@promo_endpoints.route('/readMembership', methods=['GET'])
def readMembership():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
        SELECT 
            pm.id_paket_membership,
            pm.nama_paket,
            pm.harga,
            pm.durasi,
            pm.kuota,
            pm.deskripsi_benefit,
            kr.id_kategori_promo,
            kr.nama_kategori
        FROM paket_membership pm
        JOIN kategori_promo kr 
            ON pm.id_kategori_promo = kr.id_kategori_promo
        """
        cursor.execute(query)
        results = cursor.fetchall()

        return jsonify({"message": "OK", "datas": results}), 200
    except Exception as e:
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

# ✅ GET EVENT SPACES
@promo_endpoints.route('/event-spaces', methods=['GET'])
def get_all_event_spaces():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT id_event_space, nama_event_space, deskripsi_event_space, 
                   harga_paket, kapasitas, gambar_promo, fitur_promo
            FROM event_spaces
            WHERE status_ketersediaan = 'Tersedia'
        """
        cursor.execute(query)
        event_spaces = cursor.fetchall()
        return jsonify(event_spaces), 200
    except Exception as e:
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'connection' in locals() and connection: connection.close()

@promo_endpoints.route('/event-spaces/<int:space_id>', methods=['GET'])
def get_event_space_by_id(space_id):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT id_event_space, nama_event_space, deskripsi_event_space, 
                   harga_paket, kapasitas, gambar_promo, fitur_promo
            FROM event_spaces
            WHERE id_event_space = %s
        """
        cursor.execute(query, (space_id,))
        event_space = cursor.fetchone()

        if not event_space:
            return jsonify({"msg": "Event space not found"}), 404
        return jsonify(event_space), 200
    except Exception as e:
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'connection' in locals() and connection: connection.close()
            
# ✅ CREATE BOOKING EVENT
@promo_endpoints.route('/bookingEvent', methods=['POST'])
def create_booking():
    data = request.get_json()
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # 1. Insert transaksi
        transaksi_query = """
            INSERT INTO transaksi (id_user, total_harga_final, status_pembayaran, status_order)
            VALUES (%s, %s, 'Belum Lunas', 'Baru')
        """
        cursor.execute(transaksi_query, (data.get("id_user"), data.get("total_harga_final")))
        id_transaksi = cursor.lastrowid

        # 2. Insert booking_event
        booking_query = """
            INSERT INTO booking_event (
                id_event_space, id_user, id_transaksi, tanggal_event, 
                waktu_mulai, waktu_selesai, status_booking,
                nama_acara, deskripsi, jumlah_peserta, kebutuhan_tambahan
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'Baru', %s, %s, %s, %s)
        """
        cursor.execute(
            booking_query,
            (
                data.get("id_event_space"), data.get("id_user"), id_transaksi,
                data.get("tanggal_event"), data.get("waktu_mulai"), data.get("waktu_selesai"),
                data.get("nama_acara"), data.get("deskripsi"), data.get("jumlah_peserta"), data.get("kebutuhan_tambahan")
            )
        )
        id_booking = cursor.lastrowid
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Booking berhasil dibuat",
            "data": { "id_booking_event": id_booking, "id_transaksi": id_transaksi }
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ✅ BOOK PROMO WORKSPACE
@promo_endpoints.route('/bookpromo', methods=['POST'])
def book_promo():
    connection = None
    cursor = None
    try:
        data = request.json
        id_user = data.get("id_user")
        nama_guest = data.get("nama_guest")
        id_promo = data["id_promo"]
        
        tanggal_mulai_str = data["tanggal_mulai"] 
        tanggal_selesai_str = data["tanggal_selesai"] 
        jam_mulai = int(data["jam_mulai"]) 
        jam_selesai = int(data["jam_selesai"]) 

        metode_pembayaran = data.get("metode_pembayaran", "Tunai")
        total_harga = data["total_harga_final"]

        tanggal_mulai = datetime.strptime(tanggal_mulai_str, "%Y-%m-%d").date()
        tanggal_selesai = datetime.strptime(tanggal_selesai_str, "%Y-%m-%d").date()
        durasi_per_hari = jam_selesai - jam_mulai

        connection = get_connection()
        cursor = connection.cursor()
        connection.start_transaction()

        current_date_check = tanggal_mulai
        while current_date_check <= tanggal_selesai:
            waktu_mulai_check = datetime.combine(current_date_check, datetime.min.time()).replace(hour=jam_mulai)
            waktu_selesai_check = datetime.combine(current_date_check, datetime.min.time()).replace(hour=jam_selesai)
            
            check_query = """
                SELECT id_booking FROM booking_promo 
                WHERE id_promo = %s 
                AND (waktu_mulai < %s AND waktu_selesai > %s)
            """
            cursor.execute(check_query, (id_promo, waktu_selesai_check, waktu_mulai_check))
            if cursor.fetchone():
                connection.rollback()
                return jsonify({"message": "ERROR", "error": f"Slot pada tanggal {current_date_check.strftime('%d-%m-%Y')} sudah terisi."}), 409
            
            current_date_check += timedelta(days=1)

        insert_transaksi = """
        INSERT INTO transaksi (id_user, nama_guest, total_harga_final, metode_pembayaran, status_pembayaran, status_order, lokasi_pemesanan) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_transaksi, (id_user, nama_guest, total_harga, metode_pembayaran, "Lunas", "Baru", f"promo_{id_promo}"))
        id_transaksi = cursor.lastrowid

        current_date_insert = tanggal_mulai
        while current_date_insert <= tanggal_selesai:
            waktu_mulai_db = datetime.combine(current_date_insert, datetime.min.time()).replace(hour=jam_mulai)
            waktu_selesai_db = datetime.combine(current_date_insert, datetime.min.time()).replace(hour=jam_selesai)
            
            insert_booking = """
            INSERT INTO booking_promo (id_transaksi, id_promo, waktu_mulai, waktu_selesai, durasi)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_booking, (id_transaksi, id_promo, waktu_mulai_db, waktu_selesai_db, durasi_per_hari))
            
            current_date_insert += timedelta(days=1)

        connection.commit()
        return jsonify({"message": "Booking multi-hari berhasil", "id_transaksi": id_transaksi}), 201

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"message": "ERROR", "error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()