import React, { useState, useEffect } from "react";
import { sosApi, SOSEvent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import { AlertTriangle, CheckCircle, Users, Map, TrendingUp, Radio, FileText, ChevronRight } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });

const DEMO_SOS: SOSEvent[] = [
  { id: "sos1", message: "Heavy rice blast — need urgent expert visit. 3 acres affected.", status: "active", lat: 12.9716, lng: 77.5946, created_at: "2026-04-13T12:00:00Z" },
  { id: "sos2", message: "Locust swarm approaching from north field boundary.", status: "acknowledged", lat: 12.85, lng: 77.40, created_at: "2026-04-13T10:30:00Z" },
  { id: "sos3", message: "Flooding in low-lying plots — cotton crop at risk.", status: "resolved", lat: 13.0, lng: 77.7, created_at: "2026-04-12T08:00:00Z" },
];

const DEMO_DETECTIONS = [
  { disease: "Rice Blast", district: "Bengaluru Rural", lat: 12.97, lng: 77.59, severity: "high", cnt: 8 },
  { disease: "Leaf Blight", district: "Mysuru", lat: 12.3, lng: 76.65, severity: "medium", cnt: 5 },
  { disease: "Whitefly", district: "Tumkur", lat: 13.33, lng: 77.1, severity: "high", cnt: 11 },
  { disease: "Brown Spot", district: "Mandya", lat: 12.52, lng: 76.93, severity: "medium", cnt: 3 },
];

const STATUS_COLORS = { active: "text-red-600 bg-red-50 border-red-200", acknowledged: "text-amber-600 bg-amber-50 border-amber-200", resolved: "text-green-600 bg-green-50 border-green-200" };

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sos" | "map" | "registry">("sos");

  useEffect(() => {
    sosApi.getActive()
      .then(setSosEvents)
      .catch(() => setSosEvents(DEMO_SOS))
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (id: string) => {
    await sosApi.acknowledge(id).catch(() => {});
    setSosEvents(prev => prev.map(e => e.id === id ? { ...e, status: "acknowledged" } : e));
  };
  const handleResolve = async (id: string) => {
    await sosApi.resolve(id).catch(() => {});
    setSosEvents(prev => prev.map(e => e.id === id ? { ...e, status: "resolved" } : e));
  };

  const activeCount = sosEvents.filter(e => e.status === "active").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">🏛️</div>
            <h1 className="text-2xl font-extrabold text-primary-800">Officer Dashboard</h1>
          </div>
          <p className="text-gray-400 text-sm">Welcome, {user?.name || "Officer"} · {user?.district || "Your District"}, {user?.state || "India"}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">{activeCount} Active SOS</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🚨", label: "Active SOS", value: activeCount, color: "text-red-600", bg: "bg-red-50" },
          { icon: "🦠", label: "Disease Reports", value: 28, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: "👨‍🌾", label: "Registered Farmers", value: 1243, color: "text-primary-600", bg: "bg-green-50" },
          { icon: "📋", label: "Advisories Sent", value: 89, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} className="card text-center">
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2`}>{icon}</div>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {([
          { key: "sos", icon: <AlertTriangle className="w-4 h-4" />, label: "SOS Queue" },
          { key: "map", icon: <Map className="w-4 h-4" />, label: "Disease Map" },
          { key: "registry", icon: <Users className="w-4 h-4" />, label: "Farmer Registry" },
        ] as const).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {icon}{label}
            {key === "sos" && activeCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">{activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* SOS Queue */}
      {activeTab === "sos" && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)}</div>
          ) : sosEvents.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No active SOS events</p>
              <p className="text-gray-400 text-sm">All farmers in your area are safe</p>
            </div>
          ) : (
            sosEvents.map((sos) => (
              <div key={sos.id} className={`card border ${STATUS_COLORS[sos.status]}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${sos.status === "active" ? "bg-red-500 animate-pulse" : sos.status === "acknowledged" ? "bg-amber-500" : "bg-green-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-800 text-sm">{sos.message || "Emergency SOS"}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[sos.status]}`}>{sos.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {sos.lat && sos.lng ? `📍 ${sos.lat?.toFixed(3)}°N, ${sos.lng?.toFixed(3)}°E` : ""} ·{" "}
                      {sos.created_at ? new Date(sos.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {sos.status === "active" && (
                        <button onClick={() => handleAcknowledge(sos.id)} className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors active:scale-95">
                          <Radio className="w-3.5 h-3.5" />Acknowledge
                        </button>
                      )}
                      {(sos.status === "acknowledged" || sos.status === "active") && (
                        <button onClick={() => handleResolve(sos.id)} className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors active:scale-95">
                          <CheckCircle className="w-3.5 h-3.5" />Mark Resolved
                        </button>
                      )}
                      {sos.lat && sos.lng && (
                        <a href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                          📍 View Location
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Disease Map */}
      {activeTab === "map" && (
        <div className="card p-0 overflow-hidden" style={{ height: 450 }}>
          <MapContainer center={[13.0827, 77.5]}  zoom={7} style={{ width: "100%", height: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {DEMO_DETECTIONS.map((d, i) => (
              <CircleMarker key={i} center={[d.lat, d.lng]} radius={d.cnt + 8} fillColor={d.severity === "high" ? "#E63946" : "#F4A261"} fillOpacity={0.7} color={d.severity === "high" ? "#E63946" : "#F4A261"} weight={1.5}>
                <Popup>
                  <div className="text-sm font-sans">
                    <p className="font-bold text-gray-800">{d.disease}</p>
                    <p className="text-gray-600">{d.district}</p>
                    <p className="text-red-600 font-semibold">{d.cnt} reports · {d.severity} severity</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {sosEvents.filter(e => e.lat && e.lng && e.status === "active").map(s => (
              <CircleMarker key={s.id} center={[s.lat!, s.lng!]} radius={10} fillColor="#E63946" fillOpacity={0.9} color="#fff" weight={2}>
                <Popup><div className="text-sm font-bold text-red-700">🚨 Active SOS<br /><span className="font-normal text-gray-700">{s.message}</span></div></Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Farmer Registry */}
      {activeTab === "registry" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary-700">Farmers in Your District</h3>
            <button className="flex items-center gap-1.5 text-xs text-secondary font-bold">
              <FileText className="w-3.5 h-3.5" />Export PDF
            </button>
          </div>
          <div className="space-y-3">
            {[
              { name: "Ramu Reddy", phone: "+91-9000000001", crop: "Paddy", village: "Yelahanka", detections: 3 },
              { name: "Lakshmi Devi", phone: "+91-9000110002", crop: "Cotton", village: "Doddaballapur", detections: 1 },
              { name: "Venkat Rao", phone: "+91-9000220003", crop: "Tomato", village: "Hoskote", detections: 5 },
              { name: "Anjali Patil", phone: "+91-9000330004", crop: "Sugarcane", village: "Devanahalli", detections: 0 },
              { name: "Suresh Kumar", phone: "+91-9000440005", crop: "Wheat", village: "Nelamangala", detections: 2 },
            ].map(farmer => (
              <div key={farmer.phone} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700">
                  {farmer.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{farmer.name}</p>
                  <p className="text-xs text-gray-400">{farmer.village} · {farmer.crop}</p>
                </div>
                <div className="text-right">
                  {farmer.detections > 0 ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{farmer.detections} detections</span>
                  ) : (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Healthy</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{farmer.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "📢", label: "Broadcast Alert", color: "bg-amber-50 text-amber-800 border-amber-200" },
          { icon: "📋", label: "Issue Advisory", color: "bg-green-50 text-green-800 border-green-200" },
          { icon: "📊", label: "Generate Report", color: "bg-blue-50 text-blue-800 border-blue-200" },
        ].map(({ icon, label, color }) => (
          <button key={label} className={`card border-2 ${color} py-4 flex flex-col items-center gap-2 hover:opacity-80 active:scale-95 transition-all`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-bold text-center">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
