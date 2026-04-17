import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { advisoryApi, Advisory } from "@/lib/api";
import {
  Volume2, VolumeX, ChevronDown, ChevronUp,
  ArrowLeft, Share2, ShoppingBag, CheckSquare, Square,
  AlertCircle, Leaf, FlaskConical
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
  emergency: "bg-red-100 text-red-800 border-red-200",
  urgent: "bg-orange-100 text-orange-800 border-orange-200",
  routine: "bg-green-100 text-green-800 border-green-200",
};

const DEMO_ADVISORY: Advisory = {
  id: "demo",
  disease_name: "Rice Blast (Magnaporthe oryzae)",
  severity: "high",
  urgency: "urgent",
  text_en: `Rice Blast is a devastating fungal disease caused by Magnaporthe oryzae. It thrives in conditions of high humidity (>90%) combined with moderate temperatures (24–28°C) and nitrogen-rich soil. The pathogen spreads via wind-borne spores and water splash.`,
  treatment_steps: [
    { step: 1, action: "Immediately remove and destroy all infected plant parts. Do not compost them.", product: "None", timing: "Within 24 hours", estimated_cost_per_acre: 0 },
    { step: 2, action: "Apply Tricyclazole 75% WP at 0.6g/litre of water as foliar spray", product: "Beam / Trical", dose: "0.6g/L water, 500L/acre", timing: "Day 1–3", estimated_cost_per_acre: 450 },
    { step: 3, action: "Apply Propiconazole 25% EC as a second spray after 7 days", product: "Tilt / Propimax", dose: "1mL/litre, 500L/acre", timing: "Day 7–10", estimated_cost_per_acre: 380 },
    { step: 4, action: "Reduce nitrogen fertilization immediately. Switch to potassium-rich fertilizers.", product: "MOP (Muriate of Potash)", dose: "25 kg/acre", timing: "Week 2", estimated_cost_per_acre: 200 },
    { step: 5, action: "Monitor field every 3 days. If new lesions appear, repeat Step 2 spray cycle.", product: "Monitoring only", timing: "Ongoing", estimated_cost_per_acre: 0 },
  ],
  organic_steps: [
    { step: 1, action: "Spray Pseudomonas fluorescens bio-agent solution on leaves and soil", product: "Bio-Power / Pf-01", dose: "2.5kg in 500L water per acre", timing: "Day 1", estimated_cost_per_acre: 120 },
    { step: 2, action: "Apply neem seed kernel extract (NSKE 5%) spray to reduce sporulation", product: "Neem Kernel Extract", dose: "5% solution, 500L/acre", timing: "Day 3 & Day 10", estimated_cost_per_acre: 80 },
    { step: 3, action: "Mix compost tea with Trichoderma viride and apply at root zone", product: "Trichoderma Bio-fungicide", dose: "2.5kg/acre", timing: "Week 2", estimated_cost_per_acre: 150 },
  ],
  prevention: [
    "Use blast-resistant rice varieties (IR64, BPT 5204, Swarna Sub1)",
    "Maintain optimum plant spacing (20×15 cm) to ensure air circulation",
    "Avoid excess nitrogen application — split fertilizer doses",
    "Treat seeds with Carbendazim 50% WP (2g/kg) before sowing",
    "Drain flooded fields periodically during vegetative stage",
    "Remove weed hosts like barnyard grass from field boundaries",
  ],
  escalation_triggers: [
    "Disease spreads to more than 50% of the field despite treatment",
    "Panicle blast (neck rot) is observed — yields could be lost completely",
    "New lesions appear within 3 days of chemical spray",
    "Adjacent farms show infection — community outbreak risk",
  ],
  estimated_cost_inr_per_acre: 1030,
};

export default function AdvisoryPage() {
  const { id } = useParams<{ id: string }>();
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [organicMode, setOrganicMode] = useState(false);
  const [preventionOpen, setPreventionOpen] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const synthesisRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await advisoryApi.get(id!);
        setAdvisory(data);
      } catch {
        setAdvisory(DEMO_ADVISORY);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { window.speechSynthesis.cancel(); };
  }, [id]);

  const toggleStep = (step: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(step) ? next.delete(step) : next.add(step);
      return next;
    });
  };

  const toggleVoice = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const text = [
      `Advisory for ${advisory?.disease_name}.`,
      `Severity: ${advisory?.severity}.`,
      advisory?.text_en || "",
      "Treatment steps:",
      ...(advisory?.treatment_steps?.map(s => `Step ${s.step}: ${s.action}`) || []),
      "Prevention:",
      ...(advisory?.prevention?.slice(0, 3) || []),
    ].join(". ");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setPlaying(false);
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  const shareOnWhatsApp = () => {
    const text = `🌾 KrishiRaksha Advisory\nDisease: ${advisory?.disease_name}\nSeverity: ${advisory?.severity?.toUpperCase()}\nEstimated cost: ₹${advisory?.estimated_cost_inr_per_acre}/acre\n\nGet advisories: https://krishiraksha.ai`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}
      </div>
    );
  }

  if (!advisory) return <div className="text-center text-gray-500 py-12">Advisory not found.</div>;

  const steps = organicMode ? advisory.organic_steps : advisory.treatment_steps;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link to="/app/scan" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-extrabold text-primary-800 text-lg leading-tight">{advisory.disease_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${SEVERITY_COLORS[advisory.severity || "high"]}`}>
              {advisory.severity?.toUpperCase()} SEVERITY
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${SEVERITY_COLORS[advisory.urgency || "urgent"]}`}>
              {advisory.urgency?.toUpperCase()}
            </span>
          </div>
        </div>
        <button onClick={shareOnWhatsApp} className="p-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors" title="Share on WhatsApp">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Section 1: What happened */}
      <div className="card border-amber-100 bg-amber-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center text-lg">🦠</div>
          <h2 className="font-bold text-amber-900">What Happened?</h2>
        </div>
        <p className="text-amber-800 text-sm leading-relaxed">{advisory.text_en}</p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700">
          <span className="px-2 py-1 bg-amber-100 rounded-lg">💧 High humidity</span>
          <span className="px-2 py-1 bg-amber-100 rounded-lg">🌡️ 24–28°C ideal for spread</span>
          <span className="px-2 py-1 bg-amber-100 rounded-lg">💨 Wind-borne spores</span>
        </div>
      </div>

      {/* Section 2: Immediate action */}
      <div className="card border-red-100 bg-red-50/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-xl">⚡</div>
          <h2 className="font-bold text-red-800">Immediate Action (within 24 hours)</h2>
        </div>
        <div className="flex items-start gap-3 bg-red-600 text-white rounded-xl p-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{steps?.[0]?.action || "Remove infected plant parts immediately and isolate the area."}</p>
        </div>
      </div>

      {/* Section 3: Treatment plan */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-xl">{organicMode ? "🌿" : "⚗️"}</div>
            <h2 className="font-bold text-primary-800">Treatment Plan</h2>
          </div>
          {/* Organic toggle */}
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-1">
            <button
              onClick={() => setOrganicMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!organicMode ? "bg-white text-primary-700 shadow" : "text-gray-400"}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />Chemical
            </button>
            <button
              onClick={() => setOrganicMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${organicMode ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
            >
              <Leaf className="w-3.5 h-3.5" />Organic
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {steps?.map((step) => (
            <div
              key={step.step}
              className={`flex gap-3 p-3 rounded-xl border transition-all ${
                checkedSteps.has(step.step) ? "bg-green-50 border-green-200" : "bg-gray-50/50 border-gray-100"
              }`}
            >
              <button onClick={() => toggleStep(step.step)} className="flex-shrink-0 mt-0.5">
                {checkedSteps.has(step.step)
                  ? <CheckSquare className="w-5 h-5 text-secondary" />
                  : <Square className="w-5 h-5 text-gray-300" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Step {step.step}</span>
                    <p className={`text-sm font-medium mt-0.5 ${checkedSteps.has(step.step) ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {step.action}
                    </p>
                  </div>
                  {step.estimated_cost_per_acre != null && step.estimated_cost_per_acre > 0 && (
                    <span className="text-xs font-bold text-accent flex-shrink-0 bg-accent/10 px-2 py-0.5 rounded-lg">
                      ₹{step.estimated_cost_per_acre}/ac
                    </span>
                  )}
                </div>
                {step.product && step.product !== "None" && step.product !== "Monitoring only" && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                      📦 {step.product}
                    </span>
                    {step.dose && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        💊 {step.dose}
                      </span>
                    )}
                    {step.timing && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        🕐 {step.timing}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {advisory.estimated_cost_inr_per_acre && (
          <div className="mt-4 flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-primary-700">Total estimated cost</span>
            <span className="text-xl font-extrabold text-primary-800">₹{advisory.estimated_cost_inr_per_acre} / acre</span>
          </div>
        )}
      </div>

      {/* Section 4: Prevention */}
      {advisory.prevention?.length && (
        <div className="card">
          <button
            onClick={() => setPreventionOpen(!preventionOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h2 className="font-bold text-primary-800">Prevention for Next Season</h2>
            </div>
            {preventionOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {preventionOpen && (
            <ul className="mt-4 space-y-2">
              {advisory.prevention.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-secondary font-bold flex-shrink-0">✓</span> {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Section 5: Escalation triggers */}
      {advisory.escalation_triggers?.length && (
        <div className="card border-red-100 bg-red-50/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📞</span>
            <h2 className="font-bold text-red-800">When to Call an Expert</h2>
          </div>
          <ul className="space-y-2">
            {advisory.escalation_triggers.map((trigger, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                {trigger}
              </li>
            ))}
          </ul>
          <Link to="/app/sos" className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
            🚨 Trigger SOS Alert
          </Link>
        </div>
      )}

      {/* Marketplace section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-primary-800">Recommended Products</h2>
          </div>
          <Link to="/app/market" className="text-xs text-secondary font-semibold">View all →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[
            { name: "Tricyclazole 75% WP", price: 450, cat: "Fungicide", verified: true },
            { name: "Propiconazole 25% EC", price: 380, cat: "Fungicide", verified: true },
            { name: "Bio Power (Pseudomonas)", price: 120, cat: "Bio-agent", verified: false },
          ].map((p) => (
            <div key={p.name} className="min-w-[160px] border border-green-100 rounded-xl p-3 flex-shrink-0">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-xl mb-2">🧪</div>
              <p className="text-xs font-bold text-primary-800 leading-tight">{p.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{p.cat}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-extrabold text-accent">₹{p.price}</span>
                {p.verified && <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating voice button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleVoice}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${
            playing
              ? "bg-red-500 hover:bg-red-600 sos-pulse"
              : "bg-primary-600 hover:bg-primary-700"
          }`}
          title={playing ? "Stop reading" : "Read advisory aloud"}
        >
          {playing ? <VolumeX className="w-7 h-7 text-white" /> : <Volume2 className="w-7 h-7 text-white" />}
        </button>
        <p className="text-center text-[9px] font-bold text-gray-500 mt-1">{playing ? "Stop" : "Listen"}</p>
      </div>
    </div>
  );
}
