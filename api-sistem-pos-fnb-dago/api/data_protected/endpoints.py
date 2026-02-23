"""Routes for module protected endpoints"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from helper.jwt_helper import get_roles
from helper.db_helper import get_connection

protected_endpoints = Blueprint('data_protected', __name__)

@protected_endpoints.route('/data', methods=['GET'])
@jwt_required()
def get_data():
    """
    Route to demonstrate protected data endpoint,
    requires JWT to access and includes id_tenant.
    """
    # --- PERBAIKAN DI SINI ---
    # 1. Identity sekarang adalah STRING (ID User saja), bukan Dictionary lagi
    id_user = get_jwt_identity()
    
    # 2. Untuk ambil email & roles, kita ambil dari claims tambahan
    claims = get_jwt()
    user_email = claims.get("email")
    roles = claims.get("roles")
    # -------------------------

    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # Gunakan LEFT JOIN untuk mengambil id_tenant
        query = """
        SELECT 
            u.id_user, 
            u.nama, 
            u.email, 
            u.role,
            t.id_tenant  -- Mengambil ID Tenant yang diperlukan
        FROM users u
        LEFT JOIN tenants t ON u.id_user = t.id_user
        WHERE u.id_user = %s
        """

        cursor.execute(query, (id_user,))
        user_detail = cursor.fetchone()

        # Pastikan user_detail tidak None (jika user ditemukan)
        if not user_detail:
             return jsonify({"msg": "User not found"}), 404

        # Return payload
        return jsonify({
            "message": "OK",
            "user_logged": user_email, # Ambil dari claims
            "roles": roles,            # Ambil dari claims
            "id_user": id_user,        # ID User String
            "detail": user_detail      # Detail lengkap dari Database
        }), 200

    except Exception as e:
        print(f"🔥 Database Error in get_data: {e}")
        return jsonify({"msg": f"Database error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()