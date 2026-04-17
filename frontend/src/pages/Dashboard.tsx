import React, { useEffect, useState } from "react";
import { 
  Sprout, 
  CloudRain, 
  Wind, 
  Thermometer, 
  ArrowRight, 
  CircleAlert, 
  TrendingUp,
  MapPin,
  Camera,
  MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import RiskRadar from "@/components/dashboard/RiskRadar";
import { riskApi, locationApi, farmsApi, Farm, WeatherData, RiskScore } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const DEMO_DETECTIONS = [
  { id: '1', disease: 'Rice Blast', field: 'Main Paddy Plot', time: '2h ago', severity: 'high', img: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=400' },
  { id: '2', disease: 'Leaf Blight', field: 'Cotton Field B', time: '5h ago', severity: 'medium', img: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=400' },
  { id: '3', disease: 'Stem Borer', field: 'Sugarcane North', time: 'Yesterday', severity: 'low', img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=400' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [farmList, weatherData] = await Promise.all([
          farmsApi.list().catch(() => []),
          locationApi.getWeather(user?.lat || 12.9716, user?.lng || 77.5946).catch(() => null)
        ]);
        setFarms(farmList);
        setWeather(weatherData);
        
        if (farmList.length > 0) {
          const riskData = await riskApi.getFarmRisk(farmList[0].id).catch(() => null);
          setRisk(riskData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const radarData = risk ? [
    { subject: "Disease", A: risk.disease_risk, fullMark: 100 },
    { subject: "Pest", A: risk.pest_risk, fullMark: 100 },
    { subject: "Weather", A: risk.weather_risk, fullMark: 100 },
    { subject: "Humidity", A: risk.humidity_risk, fullMark: 100 },
    { subject: "Soil", A: risk.soil_health || 65, fullMark: 100 },
    { subject: "History", A: risk.historical_trend || 40, fullMark: 100 },
  ] : [
    { subject: "Disease", A: 0, fullMark: 100 },
    { subject: "Pest", A: 0, fullMark: 100 },
    { subject: "Weather", A: 0, fullMark: 100 },
    { subject: "Humidity", A: 0, fullMark: 100 },
    { subject: "Soil", A: 65, fullMark: 100 },
    { subject: "History", A: 40, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Top Stats & Weather ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather card */}
        <div className="lg:col-span-2 card bg-primary-700 text-white overflow-hidden relative group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold text-green-200 uppercase tracking-widest">
                  {user?.district || "Local Area"}, {user?.state || "India"}
                </span>
              </div>
              <h2 className="text-5xl font-black mb-2 flex items-center gap-4">
                {weather?.current.temperature}°C
                <CloudRain className="w-10 h-10 text-secondary animate-pulse" />
              </h2>
              <p className="text-lg text-green-100 font-medium">
                {weather?.current.description || "Partly Cloudy"}
              </p>
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg"><CloudRain className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] text-green-400 font-bold uppercase">Humidity</p>
                    <p className="font-bold">{weather?.current.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg"><Wind className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] text-green-400 font-bold uppercase">Wind</p>
                    <p className="font-bold">{weather?.current.wind_speed_kmh} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg"><Thermometer className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] text-green-400 font-bold uppercase">Rainfall</p>
                    <p className="font-bold">{weather?.current.rainfall_mm} mm</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 md:mt-0 md:text-right flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs font-bold text-green-300 uppercase tracking-tight">Today's Outlook</p>
                <p className="text-white text-sm bg-white/10 p-3 rounded-xl backdrop-blur">
                  High humidity detected. <br/>Risk of <span className="text-secondary font-bold underline">Leaf Blast</span> is high.
                </p>
              </div>
              <Link to="/app/risk-map" className="btn-accent text-xs px-4 py-2 mt-4 inline-flex items-center gap-2 self-start md:self-end text-white">
                View Heatmap <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          {/* Decorative background leaf */}
          <div className="absolute -bottom-10 -right-10 text-[180px] opacity-10 rotate-12 pointer-events-none">🌿</div>
        </div>

        {/* SOS Quick Action */}
        <div className="card bg-red-600 border-red-500 text-white flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🚨
            </div>
            <h3 className="text-2xl font-black">Emergency SOS</h3>
            <p className="text-red-100 mt-2 text-sm leading-relaxed">
              Facing heavy crop loss or disease outbreak? 
              Click to alert regional officers immediately.
            </p>
          </div>
          <Link to="/app/sos" className="w-full bg-white text-red-600 font-bold py-4 rounded-xl text-center shadow-lg hover:bg-gray-50 active:scale-95 transition-all mt-6 sos-pulse">
            TRIGGER SOS ALERT
          </Link>
        </div>
      </section>

      {/* ─── Middle Section ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Radar */}
        <RiskRadar 
          data={radarData} 
          title="Crop Health Radar" 
          subtitle={farms.length > 0 ? `Showing risk for ${farms[0].name}` : "Aggregate Farm Risk"} 
        />

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/app/scan" className="card flex flex-col justify-center items-center text-center gap-3 border-green-100 hover:border-secondary transition-colors group">
            <div className="w-16 h-16 bg-secondary-100 text-secondary rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-primary-800">Scan Crop</h4>
            <p className="text-[10px] text-gray-400">Identify 38+ Diseases</p>
          </Link>

          <Link to="/app/risk-map" className="card flex flex-col justify-center items-center text-center gap-3 border-orange-100 hover:border-accent transition-colors group">
            <div className="w-16 h-16 bg-accent-50 text-accent rounded-2xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
              <CircleAlert className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-primary-800">Alerts</h4>
            <p className="text-[10px] text-gray-400">District Outbreaks</p>
          </Link>

          <Link to="/app/forum" className="card flex flex-col justify-center items-center text-center gap-3 border-blue-50 hover:border-blue-500 transition-colors group">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-primary-800">Expert Advice</h4>
            <p className="text-[10px] text-gray-400">Ask the Community</p>
          </Link>

          <Link to="/app/market" className="card flex flex-col justify-center items-center text-center gap-3 border-purple-50 hover:border-purple-500 transition-colors group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-primary-800">Marketplace</h4>
            <p className="text-[10px] text-gray-400">Buy Fungicides</p>
          </Link>
        </div>
      </section>

      {/* ─── Recent Detections ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-primary-800 tracking-tight">Recent Detections</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Activity in your fields</p>
          </div>
          <Link to="/app/scan" className="text-secondary font-black text-xs uppercase tracking-widest hover:underline px-3 py-1 bg-green-50 rounded-lg">View All</Link>
        </div>
        
        <div className="overflow-x-auto pb-4 -mx-4 px-4 flex gap-5 no-scrollbar">
          {DEMO_DETECTIONS.map((det) => (
            <div key={det.id} className="min-w-[300px] bg-white border border-green-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group cursor-pointer">
              <div 
                className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden bg-cover bg-center ring-2 ring-gray-50 flex-shrink-0" 
                style={{ backgroundImage: `url(${det.img})` }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    det.severity === 'high' ? 'bg-red-50 text-red-500' : 
                    det.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {det.severity} Risk
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{det.time}</span>
                </div>
                <h4 className="font-black text-primary-900 truncate leading-tight">{det.disease}</h4>
                <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                  <Sprout className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[10px] font-bold truncate">{det.field}</span>
                </div>
                <Link to={`/app/advisory/${det.id}`} className="text-primary-600 text-[10px] font-black mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                  Treat Now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
          <div className="min-w-[200px] border-2 border-dashed border-green-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:bg-green-50 transition-colors cursor-pointer" onClick={() => navigate('/app/scan')}>
            <Camera className="w-8 h-8 text-green-200 mb-2" />
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">New Scan</p>
          </div>
        </div>
      </section>
    </div>
  );
}
