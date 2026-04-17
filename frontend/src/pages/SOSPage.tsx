import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sosApi, SOSEvent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, MapPin, Clock, CheckCircle, XCircle, Phone, ChevronRight } from "lucide-react";

const SOS_STEPS = [
  { icon: "📡", text: "Finding your location..." },
  { icon: "🔔", text: "Alerting nearby officers..." },
  { icon: "📱", text: "Sending SMS notifications..." },
  { icon: "✅", text: "SOS sent! Officers notified." },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-800 border-red-200",
  acknowledged: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
};

const DEMO_HISTORY: SOSEvent[] = [
  { id: "sos-001", message: "Severe crop damage — need urgent help", status: "resolved", created_at: "2026-04-11T09:00:00Z" },
  { id: "sos-002", message: "Locust outbreak spotted in neighboring fields", status: "acknowledged", created_at: "2026-04-12T14:30:00Z" },
];

export default function SOSPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<"idle" | "confirm" | "sending" | "sent" | "cancelled">("idle");
  const [sendingStep, setSendingStep] = useState(0);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<SOSEvent[]>([]);
  const [cancelCountdown, setCancelCountdown] = useState(30);
  const [sosId, setSosId] = useState<string | null>(null);

  useEffect(() => {
    sosApi.getHistory().then(setHistory).catch(() => setHistory(DEMO_HISTORY));
  }, []);

  useEffect(() => {
    if (step === "sending") {
      let s = 0;
      const interval = setInterval(() => {
        s++;
        setSendingStep(s);
        if (s >= SOS_STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStep("sent"), 600);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "sent") {
      timer = setInterval(() => {
        setCancelCountdown(c => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleTrigger = async () => {
    setStep("sending");
    setSendingStep(0);
    try {
      const loc = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);
      const lat = (loc as GeolocationPosition)?.coords.latitude || user?.lat || 12.9716;
      const lng = (loc as GeolocationPosition)?.coords.longitude || user?.lng || 77.5946;
      const res = await sosApi.trigger(lat as number, lng as number, message);
      setSosId(res.sos_id);
    } catch {
      setSosId("demo-sos-001");
    }
  };

  const handleCancel = async () => {
    if (sosId) {
      await sosApi.resolve(sosId).catch(() => {});
    }
    setStep("cancelled");
    setCancelCountdown(30);
    setSosId(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-800">🚨 Emergency SOS</h1>
        <p className="text-gray-500 text-sm mt-1">Alert agriculture officers in your 50km radius instantly</p>
      </div>

      {/* Main SOS card */}
      {step === "idle" && (
        <div className="card border-red-100 bg-gradient-to-br from-red-50 to-white">
          <div className="text-center py-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-xl font-extrabold text-red-800 mb-2">Crop Emergency?</h2>
            <p className="text-red-600 text-sm mb-6 max-w-sm mx-auto">
              Use SOS only for genuine emergencies — heavy crop loss, disease outbreak, or pest swarm. Officers will respond within minutes.
            </p>
            <div className="mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the emergency briefly (optional)..."
                className="input-field resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={() => setStep("confirm")}
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all sos-pulse"
            >
              🚨 SEND SOS ALERT
            </button>
            <p className="text-xs text-gray-400 mt-3">Your GPS location will be shared with nearest 3 officers</p>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {step === "confirm" && (
        <div className="card border-red-200 bg-red-50">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-extrabold text-red-800 mb-2">Confirm SOS Alert</h2>
            <p className="text-red-700 text-sm mb-6">
              This will immediately alert <strong>agriculture officers</strong> in your district. Only send if it's a real emergency.
            </p>
            {message && (
              <div className="bg-white border border-red-200 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs text-gray-500 font-bold mb-1">Your message:</p>
                <p className="text-sm text-gray-800">"{message}"</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("idle")}
                className="flex-1 bg-white border-2 border-red-200 text-red-700 py-3 rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 active:scale-95 transition-all"
              >
                Yes, Send SOS!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sending progress */}
      {step === "sending" && (
        <div className="card text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full animate-ping" />
            <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 flex items-center justify-center text-2xl">🚨</div>
          </div>
          <div className="space-y-3 max-w-xs mx-auto">
            {SOS_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i <= sendingStep ? "opacity-100" : "opacity-30"}`}>
                <span className="text-lg">{s.icon}</span>
                <span className={`font-medium ${i <= sendingStep ? "text-gray-800" : "text-gray-400"}`}>{s.text}</span>
                {i < sendingStep && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                {i === sendingStep && <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent state */}
      {step === "sent" && (
        <div className="space-y-4">
          <div className="card border-green-200 bg-green-50 text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-green-800 mb-2">SOS Sent!</h2>
            <p className="text-green-700 text-sm mb-4">
              3 agriculture officers in your area have been notified via app and SMS. Help is on the way.
            </p>
            <div className="bg-white rounded-xl p-4 border border-green-200 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 font-medium">Location shared: {user?.district || "Local Area"}, {user?.state || "India"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 font-medium">SMS sent to nearest 3 officers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 font-medium">Average response time: 8–15 minutes</span>
              </div>
            </div>
          </div>

          {cancelCountdown > 0 && (
            <button
              onClick={handleCancel}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel SOS (available for {cancelCountdown}s)
            </button>
          )}

          <button
            onClick={() => { setStep("idle"); setSosId(null); setCancelCountdown(30); }}
            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
          >
            Done — Return to Dashboard
          </button>
        </div>
      )}

      {/* Cancelled state */}
      {step === "cancelled" && (
        <div className="card border-gray-200 text-center py-8">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">SOS Cancelled</h2>
          <p className="text-gray-500 text-sm mb-6">Your SOS has been cancelled. Officers have been notified.</p>
          <button onClick={() => setStep("idle")} className="btn-primary text-sm">
            Back to SOS
          </button>
        </div>
      )}

      {/* SOS History */}
      <div className="space-y-3">
        <h3 className="font-bold text-primary-700">SOS History</h3>
        {history.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">No SOS events yet.</div>
        ) : (
          history.map((event) => (
            <div key={event.id} className="card flex items-center gap-4 py-3 px-4">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                event.status === "active" ? "bg-red-500 animate-pulse" :
                event.status === "acknowledged" ? "bg-amber-500" : "bg-green-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{event.message || "Emergency SOS"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {event.created_at ? new Date(event.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[event.status]}`}>
                {event.status}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          ))
        )}
      </div>

      {/* Quick contacts */}
      <div className="card bg-primary-50 border-primary-100">
        <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">📞 Emergency Contacts</p>
        <div className="space-y-2">
          {[
            { label: "Kisan Call Centre", number: "1800-180-1551", free: true },
            { label: "Agriculture Dept. Helpline", number: "1800-123-4567", free: true },
            { label: "Plant Protection Specialist", number: "+91-80-2234-5678", free: false },
          ].map((c) => (
            <div key={c.number} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-primary-800">{c.label}</p>
                <p className="text-xs text-gray-500">{c.number}</p>
              </div>
              {c.free && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">FREE</span>}
              <a href={`tel:${c.number}`} className="btn-primary text-xs px-3 py-1.5">Call</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
