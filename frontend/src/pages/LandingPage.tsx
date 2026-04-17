import { Link } from "react-router-dom";
import { useState } from "react";

const FEATURES = [
  {
    icon: "🔬",
    title: "AI Disease Detection",
    desc: "Scan your crops with your phone camera. Our YOLOv8 AI identifies 38 diseases across 14 crops instantly.",
  },
  {
    icon: "🎯",
    title: "Crop Health Radar",
    desc: "6-dimension risk dashboard: disease, weather, pest, humidity, soil, and historical trend — all in one radial view.",
  },
  {
    icon: "🗣️",
    title: "Voice Advisory in Hindi",
    desc: "Get expert crop advisories read aloud in your language. Works in Hindi, Kannada, Telugu, Tamil, and 7 more languages.",
  },
  {
    icon: "🗺️",
    title: "Live Risk Heatmap",
    desc: "See real-time disease outbreaks and risk levels across your district on an interactive satellite map.",
  },
  {
    icon: "🚨",
    title: "SOS Emergency Alert",
    desc: "One tap to alert Agriculture Officers in 50km radius. Works even on slow 2G connections.",
  },
  {
    icon: "🛒",
    title: "AI Marketplace",
    desc: "Auto-recommended pesticides and fertilizers based on your disease detection, from verified local sellers.",
  },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pb", label: "પંજાબી" },
  { code: "bn", label: "বাংলা" },
];

const STEPS = [
  { num: "01", title: "Scan Your Crop", desc: "Take a photo of diseased leaves or describe symptoms by voice" },
  { num: "02", title: "AI Analyzes", desc: "YOLOv8 model checks against 38 diseases in under 3 seconds" },
  { num: "03", title: "Get Advisory", desc: "Receive detailed treatment plan in your language, read aloud" },
  { num: "04", title: "Buy & Act", desc: "AI recommends and connects you to local agri-input sellers" },
];

export default function LandingPage() {
  const [lang, setLang] = useState("en");

  return (
    <div className="min-h-screen bg-neutral font-mukta">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl backdrop-blur">
              🌾
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">KrishiRaksha AI</p>
              <p className="text-green-300 text-xs">कृषिरक्षा • Protect Your Crop</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-1 bg-white/10 rounded-lg p-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    lang === l.code ? "bg-white text-primary-700" : "text-white/80 hover:text-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Link to="/login" className="btn-accent text-sm px-4 py-2 !rounded-lg">
              Login / Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-screen flex items-center pt-20 pb-16 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Ministry of Agriculture Hackathon 2024
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Apni Fasal Ka<br />
              <span className="text-secondary">Raksha Karo</span>
            </h1>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              AI-powered crop disease detection, risk monitoring, and expert advisories 
              for <strong className="text-white">140 million</strong> Indian farming households.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="btn-accent text-lg px-8 py-4">
                🚀 Try Live Demo
              </Link>
              <Link
                to="/app/dashboard"
                className="bg-white/15 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/25 transition-all border border-white/20"
              >
                👁️ View Dashboard
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-green-200">
              <span>✅ Works offline</span>
              <span>✅ 11 Indian languages</span>
              <span>✅ Voice powered</span>
              <span>✅ 38 crop diseases</span>
            </div>
          </div>

          {/* Hero illustration — mock phone mockup */}
          <div className="flex justify-center">
            <div className="relative w-72 animate-fade-in">
              <div className="bg-gray-900 rounded-[3rem] p-2 shadow-2xl border-4 border-gray-700">
                <div className="bg-gray-800 rounded-[2.5rem] overflow-hidden" style={{ height: "540px" }}>
                  {/* Mock scan screen */}
                  <div className="h-full flex flex-col">
                    <div className="bg-primary-800 px-4 py-3 flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">🔬 Scan Crop</span>
                      <span className="ml-auto text-green-400 text-xs">● Live</span>
                    </div>
                    <div className="flex-1 bg-green-900 relative flex items-center justify-center">
                      <div className="absolute inset-6 border-2 border-secondary border-dashed rounded-2xl opacity-60" />
                      <div className="text-6xl">🌿</div>
                    </div>
                    <div className="bg-gray-900 p-4">
                      <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-3 mb-3">
                        <p className="text-red-400 font-bold text-sm">⚠️ Rice Blast Detected</p>
                        <p className="text-gray-400 text-xs mt-1">Confidence: 87.3% • High Severity</p>
                      </div>
                      <div className="bg-primary-700 rounded-xl py-3 text-center text-white text-sm font-semibold">
                        🎙️ Advisory सुनें (Listen)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-6 bg-white rounded-2xl px-4 py-2 shadow-xl text-xs font-bold text-primary-700">
                87% accurate ✓
              </div>
              <div className="absolute -bottom-4 -left-6 bg-accent text-white rounded-2xl px-4 py-2 shadow-xl text-xs font-bold">
                ₹1,200/acre saved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────────────────────────── */}
      <section className="bg-primary-700 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { n: "38", label: "Diseases Detected" },
            { n: "14", label: "Crops Supported" },
            { n: "11", label: "Indian Languages" },
            { n: "3s", label: "Detection Speed" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-secondary">{s.n}</p>
              <p className="text-sm text-green-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-primary-700 mb-3">
              Everything a Farmer Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From AI disease detection to expert advisory, marketplace, and emergency SOS — 
              KrishiRaksha has it all in one app.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card group cursor-default">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-primary-700 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-neutral">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-primary-700 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">Simple steps, powerful results</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {STEPS.map((step, i) => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-card-hover">
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary-200 -translate-y-px z-0" />
                )}
                <h3 className="font-bold text-primary-700 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className="hero-gradient py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to protect your harvest?
          </h2>
          <p className="text-green-200 text-lg mb-8">
            Join thousands of farmers using KrishiRaksha AI to save crops and increase yield.
          </p>
          <Link to="/login" className="btn-accent text-xl px-12 py-5 inline-block">
            🌾 Start for Free — No Payment Required
          </Link>
          <p className="text-green-300 text-sm mt-4">
            Demo: Phone +91-9000000001 • OTP 123456
          </p>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-primary-900 text-green-300 py-8 px-4 text-center text-sm">
        <p className="font-bold text-white text-lg mb-1">🌾 KrishiRaksha AI</p>
        <p>कृषिरक्षा — Apni Fasal Ka Raksha Karo</p>
        <p className="mt-2 text-green-500">
        Precision Agriculture for a Resilient India • Smart Farming Now 🌾
        </p>
      </footer>
    </div>
  );
}
