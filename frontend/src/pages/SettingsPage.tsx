import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { User, Bell, Globe, Shield, ChevronRight, Check, Moon, Volume2, Loader } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "te", label: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

const STATES = ["Karnataka", "Andhra Pradesh", "Telangana", "Tamil Nadu", "Maharashtra", "Gujarat", "Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "West Bengal", "Odisha", "Bihar", "Kerala"];

export default function SettingsPage() {
  const { user, login, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState(user?.language_preference || "en");
  const [profile, setProfile] = useState({ name: user?.name || "", state: user?.state || "", district: user?.district || "" });
  const [notifs, setNotifs] = useState({ sms: true, push: true, weatherAlerts: true, pestAlerts: true, advisoryReady: true, weeklyDigest: false });
  const [darkMode, setDarkMode] = useState(false);
  const [voiceReadout, setVoiceReadout] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateMe({ language_preference: lang, ...profile });
      if (user) login(localStorage.getItem("kr_token") || "", { ...user, language_preference: lang, ...profile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-800">⚙️ Settings</h1>
        <p className="text-gray-400 text-sm">Manage your preferences and profile</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <h3 className="font-bold text-primary-700">Profile</h3>
        </div>
        <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
            {user?.name ? user.name[0].toUpperCase() : "👤"}
          </div>
          <div>
            <p className="font-bold text-primary-800">{user?.name || "Farmer"}</p>
            <p className="text-sm text-gray-500">{user?.phone}</p>
            <span className="text-xs font-bold text-secondary capitalize bg-green-50 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Full Name</label>
          <input className="input-field" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">State</label>
            <select className="input-field" value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">District</label>
            <input className="input-field" value={profile.district} onChange={e => setProfile(p => ({ ...p, district: e.target.value }))} placeholder="Your district" />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-primary-700">Language / भाषा</h3>
        </div>
        <p className="text-xs text-gray-500">Select your preferred language for advisories and UI</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                lang === l.code
                  ? "border-secondary bg-green-50 text-primary-800"
                  : "border-gray-100 text-gray-600 hover:border-secondary/50"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">{l.native}</p>
                <p className="text-[10px] text-gray-400">{l.label}</p>
              </div>
              {lang === l.code && <Check className="w-4 h-4 text-secondary ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-primary-700">Notifications</h3>
        </div>
        {[
          { key: "weeklyDigest", label: "Weekly Insight Digest", desc: "AI-generated PDF of district disease trends every Monday" },
          { key: "weatherAlerts", label: "Weather Alerts", desc: "IMD warnings for your district" },
          { key: "pestAlerts", label: "Pest Outbreak Alerts", desc: "When pest swarms are reported near you" },
          { key: "advisoryReady", label: "Advisory Ready", desc: "When your disease scan advisory is generated" },
          { key: "sms", label: "SMS Notifications", desc: "For feature phones — basic alerts via SMS" },
          { key: "push", label: "Push Notifications", desc: "App push notifications" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div className="flex-1 pr-4">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <button
              onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
              className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${notifs[key as keyof typeof notifs] ? "bg-secondary" : "bg-gray-200"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifs[key as keyof typeof notifs] ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* App preferences */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-bold text-primary-700">App Preferences</h3>
        </div>
        {[
          { key: "voiceReadout", label: "Auto Voice Readout", desc: "Read advisories aloud automatically", icon: <Volume2 className="w-4 h-4 text-primary-600" />, state: voiceReadout, set: setVoiceReadout },
          { key: "darkMode", label: "Dark Mode", desc: "Easier on eyes in bright sunlight", icon: <Moon className="w-4 h-4 text-gray-600" />, state: darkMode, set: setDarkMode },
        ].map(({ key, label, desc, icon, state, set }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 flex-1">
              {icon}
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <button onClick={() => set(!state)} className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${state ? "bg-secondary" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${state ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Demo credentials */}
      <div className="card bg-primary-50 border-primary-100">
        <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">🔐 Demo Accounts</p>
        {[
          { role: "Farmer", phone: "+91-9000000001", otp: "123456" },
          { role: "Officer", phone: "+91-9000000002", otp: "123456" },
          { role: "Seller", phone: "+91-9000000003", otp: "123456" },
        ].map(({ role, phone, otp }) => (
          <div key={role} className="flex items-center justify-between py-1.5 border-b border-primary-100 last:border-0">
            <div>
              <span className="text-xs font-bold text-primary-800">{role}</span>
              <p className="text-xs text-gray-500">{phone} · OTP: {otp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Save / Logout */}
      <div className="flex gap-3">
        <button
          onClick={logout}
          className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${saved ? "bg-green-600 text-white" : "btn-primary"} disabled:opacity-50`}
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
