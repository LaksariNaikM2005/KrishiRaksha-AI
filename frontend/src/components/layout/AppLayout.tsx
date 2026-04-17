import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Camera, MapPin, Mic, AlertTriangle,
  ShoppingBag, MessageSquare, Settings, ChevronLeft,
  Bell, LogOut, Menu, X, Shield, Sprout, Map,
  ChevronRight, Wifi, WifiOff, CheckCircle, Info
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/scan",      label: "Scan Crop",  icon: Camera },
  { path: "/app/farms",     label: "My Farms",   icon: Sprout },
  { path: "/app/risk-map",  label: "Risk Map",   icon: Map },
  { path: "/app/voice",     label: "Voice AI",   icon: Mic },
  { path: "/app/sos",       label: "SOS",        icon: AlertTriangle, danger: true },
  { path: "/app/market",    label: "Marketplace",icon: ShoppingBag },
  { path: "/app/forum",     label: "Community",  icon: MessageSquare },
  { path: "/app/settings",  label: "Settings",   icon: Settings },
];

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "hi", flag: "🇮🇳", label: "हि" },
];

const DEMO_NOTIFS = [
  { id: 1, type: 'alert', title: 'Pest Alert', body: 'Locust swarm reported in Nalgonda.', time: '2h ago' },
  { id: 2, type: 'info', title: 'New Advisory', body: 'Diagnosis for Paddy Field 1 is ready.', time: '5h ago' },
];

export default function AppLayout() {
  const { user, logout, isLoading } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [online, setOnline] = useState(navigator.onLine);
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    
    return () => { 
      window.removeEventListener("online", on); 
      window.removeEventListener("offline", off);
      document.removeEventListener("mousedown", clickOutside);
    };
  }, []);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    success("Logged out successfully");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌾</div>
          <p className="text-primary-600 font-semibold text-sm">Loading KrishiRaksha AI...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : user.phone.slice(-2);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`
      ${mobile ? "w-72" : collapsed ? "w-18" : "w-64"}
      flex flex-col bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700
      text-white transition-all duration-300 ease-in-out flex-shrink-0 h-full
    `}>
      {/* Logo */}
      <div className={`flex items-center ${collapsed && !mobile ? "justify-center px-2" : "px-5"} py-5 border-b border-white/10`}>
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-xl flex-shrink-0">
          🌾
        </div>
        {(!collapsed || mobile) && (
          <div className="ml-3 overflow-hidden">
            <p className="font-extrabold text-sm leading-tight text-white">KrishiRaksha AI</p>
            <p className="text-green-300 text-[10px] leading-tight font-semibold">कृषिरक्षा</p>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => mobile && setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200
                ${active
                  ? "bg-secondary text-white shadow-lg shadow-secondary/30"
                  : item.danger
                    ? "text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    : "text-green-100 hover:bg-white/10 hover:text-white"
                }
                ${collapsed && !mobile ? "justify-center" : ""}
              `}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${item.danger && !active ? "text-red-400" : ""}`} />
              {(!collapsed || mobile) && (
                <span className={item.danger && !active ? "text-red-300" : ""}>{item.label}</span>
              )}
              {item.danger && (!collapsed || mobile) && (
                <span className="ml-auto text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">SOS</span>
              )}
            </Link>
          );
        })}

        {(user.role === "officer" || user.role === "admin") && (
          <Link
            to="/app/officer"
            onClick={() => mobile && setMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all
              ${location.pathname.startsWith("/app/officer")
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "text-amber-300 hover:bg-amber-500/20"}
              ${collapsed && !mobile ? "justify-center" : ""}
            `}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || mobile) && <span>Officer Hub</span>}
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className={`p-3 border-t border-white/10 ${collapsed && !mobile ? "flex justify-center" : ""}`}>
        {collapsed && !mobile ? (
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 text-red-300" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center text-sm font-black flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black leading-tight text-white truncate">{user.name || "Farmer"}</p>
              <p className="text-green-400 text-[10px] font-bold uppercase truncate">{user.phone}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-neutral overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden flex"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 flex h-full shadow-2xl"
            >
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-green-50 flex items-center px-6 gap-4 flex-shrink-0 z-40">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2.5 rounded-xl bg-green-50 text-primary-600 hover:bg-green-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block">
            <h2 className="text-lg font-black text-primary-800 tracking-tight">
              {NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || "KrishiRaksha AI"}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Status indicators */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              online ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {online ? "System Active" : "No Connection"}
            </div>

            {/* Language switch */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    lang === l.code
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-gray-400 hover:text-primary-600"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  notifOpen ? "bg-green-50 text-primary-600 shadow-inner" : "hover:bg-green-50 text-gray-400"
                }`}
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <div className="relative">
                  <Bell className="w-5.5 h-5.5" />
                  {notifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                      {notifs.length}
                    </span>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-green-50 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="px-5 py-4 border-b border-green-50 flex items-center justify-between bg-green-50/30">
                      <p className="font-black text-primary-800 text-sm">Notifications</p>
                      <button 
                        onClick={() => setNotifs([])}
                        className="text-[10px] font-black text-secondary uppercase hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto py-2">
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center px-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-gray-200" />
                          </div>
                          <p className="text-gray-400 text-xs font-bold">No new notifications</p>
                        </div>
                      ) : (
                        notifs.map(n => (
                          <div key={n.id} className="px-5 py-3 hover:bg-green-50/50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 group">
                            <div className="flex gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                n.type === 'alert' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                              }`}>
                                {n.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className="text-sm font-black text-gray-800">{n.title}</p>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">{n.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.body}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifs.length > 0 && (
                      <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors">
                          View Activity Log
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Emergency SOS Shortcut */}
            <Link
              to="/app/sos"
              className="hidden xs:flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 sos-pulse tracking-wide"
            >
              <AlertTriangle className="w-4 h-4" />
              SOS
            </Link>
          </div>
        </header>

        {/* Offline banner */}
        {!online && (
          <div className="bg-amber-500 text-white text-xs font-black text-center py-2 flex items-center justify-center gap-2 z-30 tracking-widest uppercase">
            <WifiOff className="w-4 h-4 animate-bounce" />
            Connection Lost — Working Offline
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFB] custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
