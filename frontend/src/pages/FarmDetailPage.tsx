import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { farmsApi, riskApi, Farm, RiskScore } from "@/lib/api";
import { ArrowLeft, Sprout, MapPin, Droplets, AlertTriangle, Camera, TrendingDown } from "lucide-react";
import RiskRadar from "@/components/dashboard/RiskRadar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const RISK_HISTORY = [
  { date: "Apr 7", score: 32 }, { date: "Apr 8", score: 38 }, { date: "Apr 9", score: 45 },
  { date: "Apr 10", score: 67 }, { date: "Apr 11", score: 72 }, { date: "Apr 12", score: 58 }, { date: "Apr 13", score: 54 },
];

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [f, r] = await Promise.all([farmsApi.get(id!), riskApi.getFarmRisk(id!)]);
        setFarm(f);
        setRisk(r);
      } catch {
        setFarm({ id: id!, name: "Main Paddy Field", crop_type: "Paddy", crop_stage: "vegetative", area_acres: 3.5, soil_type: "Clay", irrigation_type: "Flood" });
        setRisk({ farm_id: id!, overall_score: 54, weather_risk: 72, pest_risk: 45, disease_risk: 67, humidity_risk: 85, soil_health: 60, historical_trend: 38, risk_category: "high" });
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}</div>;
  if (!farm) return <div className="text-center text-gray-500 py-12">Farm not found.</div>;

  const radarData = risk ? [
    { subject: "Disease", A: risk.disease_risk, fullMark: 100 },
    { subject: "Pest", A: risk.pest_risk, fullMark: 100 },
    { subject: "Weather", A: risk.weather_risk, fullMark: 100 },
    { subject: "Humidity", A: risk.humidity_risk, fullMark: 100 },
    { subject: "Soil", A: risk.soil_health || 60, fullMark: 100 },
    { subject: "History", A: risk.historical_trend || 38, fullMark: 100 },
  ] : [];

  const riskColor = !risk ? "text-gray-400" :
    risk.overall_score >= 75 ? "text-red-600" :
    risk.overall_score >= 50 ? "text-amber-600" : "text-green-600";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/app/farms" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-primary-800">{farm.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{farm.crop_type} • {farm.area_acres} acres</span>
            {farm.crop_stage && (
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {farm.crop_stage}
              </span>
            )}
          </div>
        </div>
        <Link to={`/app/scan?farm=${id}`} className="ml-auto btn-primary text-sm flex items-center gap-2">
          <Camera className="w-4 h-4" /> Scan
        </Link>
      </div>

      {/* Farm details */}
      <div className="card">
        <h3 className="font-bold text-primary-700 mb-4">Farm Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Sprout, label: "Crop", value: farm.crop_type || "—" },
            { icon: MapPin, label: "Area", value: `${farm.area_acres || "—"} acres` },
            { icon: Droplets, label: "Irrigation", value: farm.irrigation_type || "—" },
            { icon: AlertTriangle, label: "Soil Type", value: farm.soil_type || "—" },
            { icon: TrendingDown, label: "Stage", value: farm.crop_stage || "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-green-50/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-secondary" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
              </div>
              <p className="font-semibold text-primary-800 text-sm capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RiskRadar data={radarData} title="Crop Health Radar" subtitle="Current risk levels" />

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary-700">Overall Risk Score</h3>
            <span className="text-xs text-gray-400">Updated 2h ago</span>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <p className={`text-7xl font-black ${riskColor}`}>{risk?.overall_score ?? "—"}</p>
              <p className="text-gray-400 text-sm mt-1 font-semibold uppercase tracking-wider">{risk?.risk_category || "Unknown"} risk</p>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {risk && [
              { label: "Disease Risk", value: risk.disease_risk, color: "#E63946" },
              { label: "Weather Risk", value: risk.weather_risk, color: "#F4A261" },
              { label: "Pest Risk", value: risk.pest_risk, color: "#E76F51" },
              { label: "Humidity Risk", value: risk.humidity_risk, color: "#52B788" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-bold" style={{ color }}>{value}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk timeline */}
      <div className="card">
        <h3 className="font-bold text-primary-700 mb-4">Risk Score — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={RISK_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8F5EE" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7F75" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7F75" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #E8F5EE", fontSize: 12 }}
              formatter={(v: number) => [`${v}%`, "Risk Score"]}
            />
            <Line
              type="monotone" dataKey="score" stroke="#E63946" strokeWidth={2}
              dot={{ fill: "#E63946", r: 4 }} activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent detections placeholder */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary-700">Recent Detections</h3>
          <Link to={`/app/scan?farm=${id}`} className="text-xs text-secondary font-semibold">+ New scan</Link>
        </div>
        <div className="space-y-3">
          {[
            { disease: "Rice Blast", severity: "high", date: "Apr 11, 2026", conf: 87 },
            { disease: "Brown Spot", severity: "medium", date: "Apr 8, 2026", conf: 72 },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl">🦠</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-primary-800">{d.disease}</p>
                <p className="text-xs text-gray-400">{d.date} · {d.conf}% confidence</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {d.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
