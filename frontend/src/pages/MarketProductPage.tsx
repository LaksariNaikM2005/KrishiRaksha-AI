import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { marketApi, MarketListing } from "@/lib/api";
import { ArrowLeft, ShoppingCart, CheckCircle, MapPin, Star, AlertCircle, Plus, Minus } from "lucide-react";

const DEMO_PRODUCT: MarketListing = {
  id: "m1",
  product_name: "Tricyclazole 75% WP (Rice Blast Fungicide)",
  category: "Fungicide",
  description: "Tricyclazole 75% WP is a highly effective systemic fungicide approved by CIB&RC for the control of Blast disease (Magnaporthe oryzae) in rice/paddy. It works by inhibiting melanin biosynthesis in the fungus, preventing penetration peg formation.",
  price: 450,
  unit: "250g packet",
  stock_quantity: 50,
  images: [],
  is_verified: true,
  district: "Bengaluru Urban",
  diseases_treated: ["Rice Blast", "Sheath Blight"],
};

export default function MarketProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    marketApi.getProduct(id!)
      .then(setProduct)
      .catch(() => setProduct(DEMO_PRODUCT))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("kr_cart") || "[]");
    const existing = cart.findIndex((i: { id: string }) => i.id === product?.id);
    if (existing >= 0) cart[existing].quantity += quantity;
    else cart.push({ id: product?.id, name: product?.product_name, price: product?.price, unit: product?.unit, quantity });
    localStorage.setItem("kr_cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}</div>;
  if (!product) return <div className="text-center text-gray-500 py-12">Product not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link to="/app/market" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-extrabold text-primary-800 text-lg line-clamp-1">{product.product_name}</h1>
      </div>

      {/* Product image */}
      <div className="card bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12">
        <div className="text-[100px]">🧪</div>
      </div>

      {/* Product info */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-primary-800 text-xl">{product.product_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">{product.category}</span>
              {product.is_verified && (
                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />CIB&RC Verified
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-accent">₹{product.price}</p>
            <p className="text-gray-400 text-sm">per {product.unit}</p>
          </div>
        </div>

        {product.district && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-secondary" />Seller location: {product.district}
          </div>
        )}

        {product.diseases_treated && product.diseases_treated.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Effective Against</p>
            <div className="flex flex-wrap gap-2">
              {product.diseases_treated.map(d => (
                <span key={d} className="text-xs bg-red-50 text-red-700 font-semibold px-2.5 py-1 rounded-full">{d}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Description</p>
          <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
        </div>

        {/* Stock */}
        <div className={`flex items-center gap-2 text-sm font-semibold ${(product.stock_quantity || 0) > 0 ? "text-green-600" : "text-red-500"}`}>
          {(product.stock_quantity || 0) > 0
            ? <><CheckCircle className="w-4 h-4" />In Stock ({product.stock_quantity} units available)</>
            : <><AlertCircle className="w-4 h-4" />Out of Stock</>
          }
        </div>
      </div>

      {/* Dosage guide */}
      <div className="card border-blue-100 bg-blue-50/30">
        <p className="font-bold text-blue-800 mb-3 flex items-center gap-2">📋 Dosage Guide</p>
        <div className="space-y-2">
          {[
            { label: "Application rate", value: "0.6g / litre of water" },
            { label: "Water volume", value: "500 litres / acre" },
            { label: "Spray interval", value: "Every 10–14 days" },
            { label: "Pre-harvest interval", value: "28 days" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Always use personal protective equipment (PPE) while spraying. Keep away from children.</p>
        </div>
      </div>

      {/* Add to cart */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <p className="font-semibold text-gray-700">Quantity:</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-secondary text-gray-600 hover:text-secondary transition-all">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-extrabold text-primary-800 w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-secondary text-gray-600 hover:text-secondary transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-accent">₹{(product.price * quantity).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${
              added ? "bg-green-600 text-white" : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {added ? "✓ Added to Cart!" : "Add to Cart"}
          </button>
          <Link to="/app/market/cart" className="flex items-center justify-center px-5 bg-accent text-white rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all">
            Buy Now
          </Link>
        </div>
      </div>

      {/* Seller ratings placeholder */}
      <div className="card">
        <p className="font-bold text-primary-700 mb-3">Customer Reviews</p>
        {[
          { name: "Ramu Reddy", rating: 5, comment: "Very effective! Rice blast was controlled in 5 days.", district: "Nalgonda" },
          { name: "Sita Devi", rating: 4, comment: "Good product, fast delivery. Slight improvement in 1 week.", district: "Karimnagar" },
        ].map((r) => (
          <div key={r.name} className="py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}</div>
            </div>
            <p className="text-gray-500 text-sm">{r.comment}</p>
            <p className="text-gray-400 text-xs mt-0.5">{r.district}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
