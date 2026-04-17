import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { farmsApi, Farm } from "@/lib/api";
import { Plus, Sprout, MapPin, Droplets, ChevronRight, Trash2, Edit, Loader } from "lucide-react";

const CROP_STAGES = ["sowing", "vegetative", "flowering", "fruiting", "harvest"] as const;
const CROP_TYPES = ["Paddy", "Wheat", "Maize", "Cotton", "Sugarcane", "Tomato", "Chilli", "Brinjal", "Onion", "Groundnut", "Soybean", "Mustard", "Banana", "Mango"];
const SOIL_TYPES = ["Clay", "Sandy", "Loam", "Silt", "Clayey loam", "Red laterite", "Black cotton"];
const IRRIGATION_TYPES = ["Drip", "Sprinkler", "Flood", "Furrow", "Rain-fed"];

const STAGE_COLORS: Record<string, string> = {
  sowing: "bg-amber-100 text-amber-800",
  vegetative: "bg-green-100 text-green-800",
  flowering: "bg-pink-100 text-pink-800",
  fruiting: "bg-orange-100 text-orange-800",
  harvest: "bg-primary-100 text-primary-800",
};

const CROP_EMOJIS: Record<string, string> = {
  "Paddy": "🌾", "Wheat": "🌾", "Maize": "🌽", "Cotton": "🪔", "Sugarcane": "🎋",
  "Tomato": "🍅", "Chilli": "🌶️", "Brinjal": "🍆", "Onion": "🧅", "Groundnut": "🥜",
  "Soybean": "🫘", "Mustard": "🌻", "Banana": "🍌", "Mango": "🥭",
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", crop_type: "Paddy", crop_stage: "vegetative",
    area_acres: "", soil_type: "Loam", irrigation_type: "Rain-fed",
  });

  const load = async () => {
    try {
      const data = await farmsApi.list();
      setFarms(data);
    } catch {
      setFarms([
        { id: "demo-farm-1", name: "Main Paddy Field", crop_type: "Paddy", crop_stage: "vegetative", area_acres: 3.5, soil_type: "Clay", irrigation_type: "Flood", created_at: "2026-04-01T00:00:00Z" },
        { id: "demo-farm-2", name: "Cotton Block A", crop_type: "Cotton", crop_stage: "flowering", area_acres: 2, soil_type: "Black cotton", irrigation_type: "Drip", created_at: "2026-03-15T00:00:00Z" },
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await farmsApi.create({ ...form, area_acres: parseFloat(form.area_acres) || 1 });
      await load();
      setShowForm(false);
      setForm({ name: "", crop_type: "Paddy", crop_stage: "vegetative", area_acres: "", soil_type: "Loam", irrigation_type: "Rain-fed" });
    } catch {
      // demo mode
      setFarms(prev => [...prev, { id: `demo-${Date.now()}`, name: form.name, crop_type: form.crop_type, crop_stage: form.crop_stage, area_acres: parseFloat(form.area_acres) || 1, soil_type: form.soil_type, irrigation_type: form.irrigation_type }]);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this farm?")) return;
    await farmsApi.delete(id).catch(() => {});
    setFarms(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-800">🌱 My Farms</h1>
          <p className="text-gray-400 text-sm">{farms.length} farm{farms.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Farm
        </button>
      </div>

      {/* Add Farm Form */}
      {showForm && (
        <div className="card border-secondary bg-green-50/30">
          <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> New Farm</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Farm Name *</label>
              <input className="input-field" placeholder="e.g. North Field, Plot B" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Crop Type</label>
              <select className="input-field" value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}>
                {CROP_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Crop Stage</label>
              <select className="input-field" value={form.crop_stage} onChange={e => setForm(f => ({ ...f, crop_stage: e.target.value }))}>
                {CROP_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Area (Acres)</label>
              <input className="input-field" type="number" placeholder="e.g. 2.5" value={form.area_acres} onChange={e => setForm(f => ({ ...f, area_acres: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Soil Type</label>
              <select className="input-field" value={form.soil_type} onChange={e => setForm(f => ({ ...f, soil_type: e.target.value }))}>
                {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Irrigation Type</label>
              <select className="input-field" value={form.irrigation_type} onChange={e => setForm(f => ({ ...f, irrigation_type: e.target.value }))}>
                {IRRIGATION_TYPES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Save Farm</>}
            </button>
          </div>
        </div>
      )}

      {/* Farm list */}
      {loading ? (
        <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-36 shimmer rounded-2xl" />)}</div>
      ) : farms.length === 0 ? (
        <div className="card text-center py-16">
          <Sprout className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-500 mb-2">No farms yet</h3>
          <p className="text-gray-400 text-sm mb-4">Add your first farm to start monitoring crop health</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Your First Farm</button>
        </div>
      ) : (
        <div className="space-y-4">
          {farms.map((farm) => (
            <div key={farm.id} className="card group hover:border-secondary transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  {CROP_EMOJIS[farm.crop_type || ""] || "🌱"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-primary-800 text-lg">{farm.name}</h3>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => handleDelete(farm.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-secondary" />{farm.crop_type}
                    </span>
                    {farm.area_acres && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />{farm.area_acres} acres
                      </span>
                    )}
                    {farm.irrigation_type && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />{farm.irrigation_type}
                      </span>
                    )}
                    {farm.crop_stage && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_COLORS[farm.crop_stage] || "bg-gray-100 text-gray-600"}`}>
                        {farm.crop_stage}
                      </span>
                    )}
                  </div>
                  {farm.soil_type && (
                    <p className="text-xs text-gray-400 mt-1.5">Soil: {farm.soil_type}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to={`/app/farms/${farm.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-100 transition-colors"
                >
                  View Details <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to={`/app/scan?farm=${farm.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary/10 text-secondary py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary/20 transition-colors"
                >
                  🔬 Scan Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
