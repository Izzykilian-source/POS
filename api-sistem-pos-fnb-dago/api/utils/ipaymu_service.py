import requests
import json
import hashlib
import hmac
import os
import datetime

def create_payment_link(id_transaksi, total_harga, buyer_name, buyer_phone):
    va = os.getenv('IPAYMU_VA')
    api_key = os.getenv('IPAYMU_API_KEY')
    url = os.getenv('IPAYMU_URL')

    # Alamat IP Laptop Anda (Sesuaikan jika berubah)
    base_ip = "http://172.16.80.51"

    body = {
        "product": [f"Order POS Dago #{id_transaksi}"],
        "qty": ["1"],
        "price": [str(int(total_harga))],
        "description": ["Pembayaran Pesanan F&B"],
        "returnUrl": f"{base_ip}:5174/success", # Ke web pelanggan
        "cancelUrl": f"{base_ip}:5174/cancel",
        "notifyUrl": f"{base_ip}:5000/api/callback/ipaymu", # Ke Flask
        "referenceId": str(id_transaksi),
        "buyerName": buyer_name,
        "buyerPhone": buyer_phone,
        "paymentMethod": "qris" # Langsung tembak ke QRIS
    }

    data_body = json.dumps(body, separators=(',', ':'))
    signature = hmac.new(
        api_key.encode(), 
        f"POST:{va}:{hashlib.sha256(data_body.encode()).hexdigest().lower()}:{api_key}".encode(), 
        hashlib.sha256
    ).hexdigest().lower()

    headers = {
        'Content-Type': 'application/json',
        'signature': signature,
        'va': va,
        'timestamp': datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    }

    try:
        response = requests.post(url, headers=headers, data=data_body)
        return response.json()
    except Exception as e:
        return {"status": 500, "message": str(e)}