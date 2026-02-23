import React, { useState } from "react";
import { Button, Input } from "antd";

const PosKasir = () => {
  const [cart, setCart] = useState([]);
  const products = [
    { id: 1, name: "Nasgor Ngejengit", price: 15000, available: true },
    { id: 2, name: "Danish", price: 15000, available: false },
    { id: 3, name: "Rice Bowls Cabe Garam", price: 15000, available: true },
  ];

  const addToCart = (p) => {
    if (!p.available) return;
    setCart([...cart, p]);
  };

  const subtotal = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT PRODUCT LIST */}
      <div className="flex-1 bg-white p-4 overflow-y-auto">
        <Input.Search placeholder="Search" className="mb-4" />

        <div className="grid grid-cols-3 gap-3">
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 text-center shadow-sm">
              <h4 className="font-semibold">{p.name}</h4>
              <p>Rp {p.price.toLocaleString("id-ID")}</p>
              {p.available ? (
                <Button type="primary" onClick={() => addToCart(p)}>Add</Button>
              ) : (
                <Button danger disabled>Not Available</Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CART */}
      <div className="w-80 bg-gray-50 p-4 space-y-4 shadow-lg">
        <div className="flex space-x-2">
          <Button type="primary">Dine In</Button>
          <Button>Takeout</Button>
          <Button>Pick Up</Button>
        </div>

        <div>
          <h3 className="font-semibold">Order</h3>
          <div className="space-y-2">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between bg-white p-2 rounded">
                <span>{item.name}</span>
                <span>Rp {item.price.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </p>
          <p className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button danger>Cancel</Button>
          <Button type="primary">Payment & Print</Button>
          <Button>Cash</Button>
          <Button>QRIS</Button>
          <Button>Debit Card</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default PosKasir;
