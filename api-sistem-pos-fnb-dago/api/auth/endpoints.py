"""Routes for authentication module"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, decode_token, jwt_required, get_jwt, get_jwt_identity
from flask_bcrypt import Bcrypt
from helper.db_helper import get_connection

bcrypt = Bcrypt()
auth_endpoints = Blueprint('auth', __name__)

# --- 1. ROUTE LOGIN (FIXED: Identity Must Be String) ---
@auth_endpoints.route('/login', methods=['POST'])
def login():
    """Route for authentication with Debug & JSON Support"""
    
    # Ambil data (Hybrid: Form / JSON)
    identifier = request.form.get('identifier')
    password = request.form.get('password')

    if not identifier or not password:
        data_json = request.get_json(silent=True)
        if data_json:
            identifier = data_json.get('identifier')
            password = data_json.get('password')

    # --- DEBUG PRINT ---
    print(f"\n--- [DEBUG] LOGIN REQUEST ---")
    print(f"Input Identifier: {identifier}")

    if not identifier or not password:
        return jsonify({"msg": "Email/Username and password are required"}), 400

    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # Cari user
        query = "SELECT * FROM users WHERE email = %s OR nama = %s"
        cursor.execute(query, (identifier, identifier))
        user = cursor.fetchone()

        if user:
            print(f">>> User Ditemukan: ID={user.get('id_user')}, Nama={user.get('nama')}")
            pass_check = bcrypt.check_password_hash(user.get('password'), password)
            print(f">>> Hasil Pencocokan Password: {pass_check}")
        else:
            print(">>> User TIDAK ditemukan di database.")

    except Exception as e:
        print(f">>> [ERROR] Database: {e}")
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

    # Validasi Akhir
    if not user or not bcrypt.check_password_hash(user.get('password'), password):
        return jsonify({"msg": "Bad email/username or password"}), 401

    # --- PEMBUATAN TOKEN (VERSI PERBAIKAN) ---
    try:
        # 1. Pastikan semua data adalah STRING
        user_id_str = str(user.get('id_user'))
        user_email_str = str(user.get('email'))
        # Jika role kosong, default ke 'pelanggan'
        user_role_str = str(user.get('role')) if user.get('role') else 'pelanggan' 
        
        print(f">>> [DEBUG] Membuat Token... Identity: {user_id_str}")

        # 2. FIX UTAMA: identity HARUS String (ID User saja)
        # Data lain (email, roles) masukkan ke additional_claims
        access_token = create_access_token(
            identity=user_id_str,  # <--- INI KUNCINYA (Harus String)
            additional_claims={
                'email': user_email_str,
                'roles': user_role_str,
                'id_user': user_id_str
            }
        )
        
        decoded_token = decode_token(access_token)
        expires = decoded_token['exp']

        print(">>> [DEBUG] Token Berhasil Dibuat!")

        return jsonify({
            "access_token": access_token,
            "expires_in": expires,
            "type": "Bearer",
            "is_first_login": user.get('is_first_login'),
            "role": user_role_str
        })

    except Exception as e:
        print(f">>> [ERROR] Gagal Membuat Token: {e}")
        return jsonify({"msg": "Failed to generate token", "error": str(e)}), 500


# --- 2. ROUTE REGISTER ---
@auth_endpoints.route('/register', methods=['POST'])
def register():
    """Route for user registration"""
    nama = request.form.get('nama')
    email = request.form.get('email')
    password = request.form.get('password')

    if not nama or not email or not password:
        data_json = request.get_json(silent=True)
        if data_json:
            nama = data_json.get('nama')
            email = data_json.get('email')
            password = data_json.get('password')

    if not nama or not email or not password:
        return jsonify({"message": "Nama, email, dan password wajib diisi"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    connection = None
    cursor = None
    
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT 1 FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email ini sudah terdaftar."}), 409

        cursor.execute("SELECT 1 FROM users WHERE nama = %s", (nama,))
        if cursor.fetchone():
            return jsonify({"message": "Username ini sudah terpakai."}), 409

        cursor.close() 
        cursor = connection.cursor() 

        # Default role='pelanggan', is_first_login=1
        insert_query = "INSERT INTO users (nama, email, password, role, is_first_login) VALUES (%s, %s, %s, 'pelanggan', 1)"
        cursor.execute(insert_query, (nama, email, hashed_password))
        connection.commit()
        new_id = cursor.lastrowid

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

    if new_id:
        return jsonify({"message": "OK", "description": "User created", "email": email}), 201

    return jsonify({"message": "Gagal mendaftarkan pengguna"}), 501


# --- 3. ROUTE CHANGE PASSWORD ---
@auth_endpoints.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Route for user to change their own password"""
    current_user_identity = get_jwt_identity()
    # Handle jika identity String (ID) atau Dict (Legacy)
    if isinstance(current_user_identity, dict):
        user_id = current_user_identity.get('id_user')
    else:
        user_id = current_user_identity # Karena identity sekarang cuma ID (String)

    old_password = request.form.get('old_password')
    new_password = request.form.get('new_password')
    
    if not old_password or not new_password:
        data_json = request.get_json(silent=True)
        if data_json:
            old_password = data_json.get('old_password')
            new_password = data_json.get('new_password')

    if not old_password or not new_password:
        return jsonify({"msg": "Old password and new password are required"}), 400

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        query_select = "SELECT password FROM users WHERE id_user = %s"
        cursor.execute(query_select, (user_id,))
        user = cursor.fetchone()

        if not user: return jsonify({"msg": "User not found"}), 404
        if not bcrypt.check_password_hash(user.get('password'), old_password):
            return jsonify({"msg": "Invalid old password"}), 401

        hashed_new_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        query_update = "UPDATE users SET password = %s, is_first_login = 0 WHERE id_user = %s"
        cursor.execute(query_update, (hashed_new_password, user_id))
        connection.commit()

        return jsonify({"msg": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()


# --- 4. ROUTE PROFILE ---
@auth_endpoints.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Route for getting user profile info"""
    # Ambil ID User dari Token (Sekarang pasti string)
    user_id = get_jwt_identity() 
    
    # Ambil data tambahan dari claims
    claims = get_jwt()
    email = claims.get("email")
    roles = claims.get("roles")

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        query = "SELECT is_first_login FROM users WHERE id_user = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
    except Exception as e:
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

    if not user: return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "user_logged": True,
        "id_user": user_id,
        "email": email,
        "roles": roles,
        "is_first_login": user.get('is_first_login')
    })