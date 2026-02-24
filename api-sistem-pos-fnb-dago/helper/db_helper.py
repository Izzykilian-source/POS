"""DB Helper"""
import os
from mysql.connector.pooling import MySQLConnectionPool

# Mengambil variabel dengan nilai default (fallback) agar aman jika lupa isi .env
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 4000)) # TiDB pakai port 4000
DB_NAME = os.environ.get('DB_NAME')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_POOLNAME = os.environ.get('DB_POOLNAME', 'pos_pool')
POOL_SIZE = int(os.environ.get('POOL_SIZE', 5))

# Konfigurasi Pool
db_pool = MySQLConnectionPool(
    host=DB_HOST,            # Sudah tidak hardcoded 'localhost'
    port=DB_PORT,            # Tambahan Port
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    pool_size=POOL_SIZE,     # define pool size connection
    pool_name=DB_POOLNAME,
    # 2 Baris di bawah ini WAJIB untuk TiDB Cloud (SSL)
    ssl_verify_identity=True,
    ssl_ca="/etc/ssl/certs/ca-certificates.crt" 
)

def get_connection():
    """
    Get connection db connection from db pool
    """
    connection = db_pool.get_connection()
    connection.autocommit = True
    return connection