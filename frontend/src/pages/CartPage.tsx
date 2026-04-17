import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MapPin, CheckCircle } from "lucide-react";

interface CartItem { id: string; name: string; price: number; unit: string; quantity: number; }

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState({ name: "", phone: "", village: "", district: "", state: "Karnataka", pincode: "" });
  const [step, setStep] = useState<"cart" | "address" | "confirm">("cart");
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("kr_cart") || "[]");
    if (stored.length === 0) {
      setItems([
        { id: "m1", name: "Tricyclazole 75% WP", price: 450, unit: "250g", quantity: 2 },
        { id: "m2", name: "Propiconazole 25% EC", price: 380, unit: "250mL", quantity: 1 },
      ]);
    } else { setItems(stored); }
  }, []);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal > 2000 ? 0 : 80;
  const total = subtotal + delivery;

  const handleOrder = () => {
    localStorage.removeItem("kr_cart");
    setOrdered(true);
  };

  if (ordered) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-primary-800 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-6">Your order has been placed successfully. Seller will confirm within 2 hours.</p>
        <div className="card mb-4 text-left">
          <p className="text-sm font-bold text-gray-600 mb-1">Order Total</p>
          <p className="text-2xl font-extrabold text-accent">₹{total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-400 mt-1">Expected delivery: 2–5 business days</p>
        </div>
        <Link to="/app/market" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/market" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-extrabold text-primary-800">🛒 My Cart</h1>
        <span className="ml-auto text-sm text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {["Cart", "Address", "Confirm"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${i === ["cart","address","confirm"].indexOf(step) ? "text-primary-700" : i < ["cart","address","confirm"].indexOf(step) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${i === ["cart","address","confirm"].indexOf(step) ? "bg-primary-600 text-white" : i < ["cart","address","confirm"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < ["cart","address","confirm"].indexOf(step) ? "✓" : i + 1}
              </div>
              {s}
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 rounded" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Cart */}
      {step === "cart" && (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="card flex gap-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🧪</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-primary-800 text-sm leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-gray-400">{item.unit}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-secondary transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-secondary transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-extrabold text-accent">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="card text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">Your cart is empty</p>
              <Link to="/app/market" className="btn-primary text-sm mt-4 inline-block">Browse Products</Link>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className={`font-semibold ${delivery === 0 ? "text-green-600" : ""}`}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span></div>
                {delivery === 0 && <p className="text-xs text-green-600 font-semibold">Free delivery on orders above ₹2,000!</p>}
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-extrabold text-xl text-accent">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button onClick={() => setStep("address")} className="w-full btn-primary py-4 text-base">
                Proceed to Delivery Address →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Address */}
      {step === "address" && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-bold text-primary-700 flex items-center gap-2"><MapPin className="w-4 h-4" />Delivery Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-bold text-gray-500 mb-1 block">Full Name *</label><input className="input-field" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} placeholder="Your name" /></div>
              <div className="col-span-2"><label className="text-xs font-bold text-gray-500 mb-1 block">Phone *</label><input className="input-field" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" /></div>
              <div className="col-span-2"><label className="text-xs font-bold text-gray-500 mb-1 block">Village / Town</label><input className="input-field" value={address.village} onChange={e => setAddress(a => ({ ...a, village: e.target.value }))} placeholder="Village name" /></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">District</label><input className="input-field" value={address.district} onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} placeholder="District" /></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">Pin Code</label><input className="input-field" value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} placeholder="560001" /></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("cart")} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold">← Back</button>
            <button onClick={() => setStep("confirm")} disabled={!address.name || !address.phone} className="flex-1 btn-primary py-3 disabled:opacity-50">Review Order →</button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-bold text-primary-700">Order Summary</h3>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-bold">Total</span><span className="font-extrabold text-accent text-xl">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <p className="text-xs font-bold text-gray-500 mb-1">Delivering to</p>
            <p className="font-bold text-primary-800">{address.name}</p>
            <p className="text-sm text-gray-600">{address.village}, {address.district}, {address.pincode}</p>
            <p className="text-sm text-gray-600">{address.phone}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("address")} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold">← Back</button>
            <button
              onClick={handleOrder}
              className="flex-1 bg-accent text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" /> Place Order (₹{total.toLocaleString("en-IN")})
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">Pay on delivery or via UPI. No advance payment required for demo.</p>
        </div>
      )}
    </div>
  );
}
