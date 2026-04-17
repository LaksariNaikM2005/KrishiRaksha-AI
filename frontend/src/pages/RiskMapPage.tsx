import { useEffect, useState } from "react";
import { riskApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, MapPin } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet icon fix for React
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface RiskPoint { lat: number; lng: number; score: number; crop: string; district: string; }

const DEMO_POINTS: RiskPoint[] = [
  { lat: 12.9716, lng: 77.5946, score: 72, crop: "Paddy", district: "Bengaluru Urban" },
  { lat: 13.0827, lng: 80.2707, score: 45, crop: "Tomato", district: "Chennai" },
  { lat: 17.385, lng: 78.4867, score: 85, crop: "Cotton", district: "Hyderabad" },
  { lat: 18.5204, lng: 73.8567, score: 60, crop: "Sugarcane", district: "Pune" },
  { lat: 11.0168, lng: 76.9558, score: 38, crop: "Banana", district: "Coimbatore" },
  { lat: 10.8505, lng: 76.2711, score: 55, crop: "Coconut", district: "Kerala" },
  { lat: 15.3173, lng: 75.7139, score: 78, crop: "Wheat", district: "Dharwad" },
  { lat: 21.1702, lng: 72.8311, score: 42, crop: "Groundnut", district: "Surat" },
  { lat: 22.5726, lng: 88.3639, score: 91, crop: "Rice", district: "Kolkata" },
  { lat: 26.8467, lng: 80.9462, score: 65, crop: "Mustard", district: "Lucknow" },
];

const riskColor = (score: number) => {
  if (score >= 75) return "#E63946";
  if (score >= 50) return "#F4A261";
  return "#40916C";
};

const riskLabel = (score: number) => score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";


export default function RiskMapPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState<RiskPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "low">("all");

  const center: [number, number] = [user?.lat || 15.9129, user?.lng || 79.7400];

  useEffect(() => {
    async function load() {
      try {
        const data = await riskApi.getRegional(center[0], center[1]);
        const pts = data.features.map((f) => ({
          lat: (f.geometry as { coordinates: number[] }).coordinates[1],
          lng: (f.geometry as { coordinates: number[] }).coordinates[0],
          score: (f.properties.risk_score as number) || 0,
          crop: (f.properties.crop_type as string) || "Unknown",
          district: (f.properties.district as string) || "Unknown",
        }));
        setPoints(pts);
      } catch {
        setPoints(DEMO_POINTS);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const filteredPoints = points.filter(p => {
    if (filter === "critical") return p.score >= 75;
    if (filter === "high") return p.score >= 50 && p.score < 75;
    if (filter === "low") return p.score < 50;
    return true;
  });

  return (
    <div className="space-y-4 -mx-4 -mt-6">
      {/* Controls bar */}
      <div className="px-4 pt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold text-primary-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-secondary" /> Risk Heatmap
        </h1>
        <div className="flex gap-2 ml-auto">
          {(["all", "critical", "high", "low"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === f ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-secondary"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" /> Legend
        </button>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: "calc(100vh - 230px)" }}>
        {loading ? (
          <div className="shimmer w-full h-full" />
        ) : (
          <MapContainer
            center={center}
            zoom={6}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OSM</a>'
            />
            {filteredPoints.map((point, i) => (
              <CircleMarker
                key={i}
                center={[point.lat, point.lng]}
                radius={point.score / 5 + 8}
                fillColor={riskColor(point.score)}
                fillOpacity={0.7}
                color={riskColor(point.score)}
                weight={1.5}
              >
                <Popup>
                  <div className="text-sm font-sans min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: riskColor(point.score) }} />
                      <span className="font-bold text-gray-800">{riskLabel(point.score)} Risk</span>
                    </div>
                    <p className="text-gray-700 font-semibold">{point.district}</p>
                    <p className="text-gray-500 text-xs mb-1">Crop: {point.crop}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">Risk Score</span>
                      <span className="font-extrabold text-lg" style={{ color: riskColor(point.score) }}>{point.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-full rounded-full" style={{ width: `${point.score}%`, background: riskColor(point.score) }} />
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-green-50 p-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Risk Level</p>
            {[
              { color: "#E63946", label: "Critical (75–100)", cnt: points.filter(p => p.score >= 75).length },
              { color: "#F4A261", label: "High (50–74)", cnt: points.filter(p => p.score >= 50 && p.score < 75).length },
              { color: "#40916C", label: "Low (0–49)", cnt: points.filter(p => p.score < 50).length },
            ].map(({ color, label, cnt }) => (
              <div key={label} className="flex items-center gap-2.5 mb-2">
                <div className="w-4 h-4 rounded-full opacity-70 flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-gray-700 flex-1">{label}</span>
                <span className="text-xs font-bold text-gray-500">{cnt}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-[10px] text-gray-400">{filteredPoints.length} districts shown</p>
            </div>
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          {[
            { icon: "🔴", count: points.filter(p => p.score >= 75).length, label: "Critical" },
            { icon: "🟡", count: points.filter(p => p.score >= 50 && p.score < 75).length, label: "High" },
            { icon: "🟢", count: points.filter(p => p.score < 50).length, label: "Safe" },
          ].map(({ icon, count, label }) => (
            <div key={label} className="bg-white/95 backdrop-blur rounded-xl shadow px-3 py-2 text-center border border-gray-100">
              <p className="text-lg font-extrabold text-gray-800">{icon} {count}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
