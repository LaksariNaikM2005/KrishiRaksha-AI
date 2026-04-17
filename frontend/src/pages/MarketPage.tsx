import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { marketApi, MarketListing } from "@/lib/api";
import { Search, ShoppingBag, Star, MapPin, CheckCircle, Filter, ChevronRight, Loader } from "lucide-react";

const CATEGORIES = ["All", "Pesticide", "Fungicide", "Fertilizer", "Herbicide", "Equipment", "Bio-agent"];

const DEMO_LISTINGS: MarketListing[] = [
  { id: "m1", product_name: "Tricyclazole 75% WP (Rice Blast Fungicide)", category: "Fungicide", description: "Most effective for rice blast. CIB&RC approved. Suitable for paddy at all stages.", price: 450, unit: "250g packet", stock_quantity: 50, images: [], is_verified: true, district: "Bengaluru Urban", diseases_treated: ["Rice Blast", "Sheath Blight"] },
  { id: "m2", product_name: "Propiconazole 25% EC (Tilt)", category: "Fungicide", description: "Systemic fungicide for leaf spot, brown spot, and blast in paddy, maize.", price: 380, unit: "250mL bottle", stock_quantity: 30, images: [], is_verified: true, district: "Mysuru", diseases_treated: ["Brown Spot", "Rice Blast"] },
  { id: "m3", product_name: "Imidacloprid 17.8% SL (Confidor)", category: "Pesticide", description: "Systemic insecticide against sucking pests. Highly effective on BPH and Aphids.", price: 520, unit: "250mL bottle", stock_quantity: 20, images: [], is_verified: true, district: "Tumkur" },
  { id: "m4", product_name: "DAP Fertilizer (18:46:00)", category: "Fertilizer", description: "Diammonium Phosphate for basal application. Best for all seasonal crops.", price: 1350, unit: "50kg bag", stock_quantity: 100, images: [], is_verified: false, district: "Mandya" },
  { id: "m5", product_name: "Pseudomonas Fluorescens Bio-agent", category: "Bio-agent", description: "PGPR bio-agent effective against soil-borne and foliar fungal diseases. Safe for organic farming.", price: 120, unit: "500g pack", stock_quantity: 200, images: [], is_verified: true, district: "Hassan" },
  { id: "m6", product_name: "Power Sprayer (Knapsack 16L)", category: "Equipment", description: "Motorized knapsack sprayer. 16L tank, 3-5 bar pressure, 2-stroke engine.", price: 4500, unit: "piece", stock_quantity: 10, images: [], is_verified: true, district: "Shimogga" },
];

const DISEASE_PRODUCT_MAP: Record<string, string[]> = {
  "Rice Blast": ["m1", "m2", "m5"],
  "Brown Spot": ["m2", "m5"],
};

const PRODUCT_ICONS: Record<string, string> = {
  "Fungicide": "🧪", "Pesticide": "🔬", "Fertilizer": "🌱", "Herbicide": "🌿", "Equipment": "⚙️", "Bio-agent": "🦠",
};

export default function MarketPage() {
  const location = useLocation();
  const queryDisease = new URLSearchParams(location.search).get("disease");

  const [products, setProducts] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    marketApi.listProducts()
      .then(setProducts)
      .catch(() => setProducts(DEMO_LISTINGS))
      .finally(() => setLoading(false));
  }, []);

  const recommended = queryDisease
    ? products.filter(p => DISEASE_PRODUCT_MAP[queryDisease]?.includes(p.id))
    : [];

  const filtered = products.filter(p => {
    const matchCat = category === "All" || p.category?.toLowerCase() === category.toLowerCase();
    const matchSearch = !search || p.product_name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-800">🛒 Agri Marketplace</h1>
        <p className="text-gray-400 text-sm">Verified products from local sellers in your district</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search fungicides, fertilizers, equipment..."
          className="input-field pl-11"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
              category === cat
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Picks for disease */}
      {queryDisease && recommended.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h3 className="font-bold text-amber-800">AI Picks for <span className="text-red-700">{queryDisease}</span></h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {recommended.map(p => (
              <Link
                key={p.id}
                to={`/app/market/${p.id}`}
                className="min-w-[200px] bg-white border border-amber-200 rounded-2xl p-3 flex-shrink-0 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">{PRODUCT_ICONS[p.category || ""] || "📦"}</div>
                <p className="font-bold text-primary-800 text-sm leading-tight line-clamp-2">{p.product_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-extrabold text-accent">₹{p.price}</span>
                  <span className="text-[10px] text-gray-400">{p.unit}</span>
                </div>
                {p.is_verified && <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-bold"><CheckCircle className="w-3 h-3" />Verified</div>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No products found</p>
          <p className="text-gray-400 text-sm">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(product => (
            <Link key={product.id} to={`/app/market/${product.id}`} className="card group hover:border-secondary hover:shadow-lg transition-all flex gap-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-secondary/10 transition-colors">
                {PRODUCT_ICONS[product.category || ""] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-primary-800 text-sm leading-tight line-clamp-2">{product.product_name}</h3>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-secondary transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">{product.category}</span>
                  {product.is_verified && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />Verified
                    </span>
                  )}
                </div>
                {product.district && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />{product.district}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-extrabold text-accent">₹{product.price}</span>
                  <span className="text-[10px] text-gray-400">per {product.unit}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
