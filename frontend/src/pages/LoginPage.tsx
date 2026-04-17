import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setError("");
    setLoading(true);
    try {
      const result = await authApi.sendOTP(phone.trim());
      setStep("otp");
      if (result.demo_otp) {
        setDemoOtp(result.demo_otp);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError("Please enter the OTP"); return; }
    setError("");
    setLoading(true);
    try {
      const result = await authApi.verifyOTP(phone.trim(), otp.trim());
      login(result.access_token, result.user);
      navigate("/app/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 border border-white/20 shadow-xl">
              🌾
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-white">KrishiRaksha AI</h1>
          <p className="text-green-300 text-sm mt-1">कृषिरक्षा • Apni Fasal Ka Raksha Karo</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">
            {step === "phone" ? "Welcome, Farmer! 👋" : "Enter your OTP"}
          </h2>
          <p className="text-green-300 text-sm mb-6">
            {step === "phone"
              ? "Sign in with your mobile number"
              : `OTP sent to ${phone}`}
          </p>

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-green-200 text-sm font-medium block mb-2">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <span className="bg-white/10 border border-white/20 text-white px-3 py-3 rounded-xl text-sm flex-shrink-0">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9000000001"
                    className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 text-lg"
                    maxLength={15}
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-secondary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "⏳ Sending OTP..." : "📱 Get OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {demoOtp && (
                <div className="bg-accent/20 border border-accent/40 rounded-xl p-3 text-center">
                  <p className="text-accent text-xs font-semibold">🎮 Demo Mode</p>
                  <p className="text-white text-3xl font-extrabold tracking-widest mt-1">{demoOtp}</p>
                  <p className="text-green-300 text-xs mt-1">Click the OTP to auto-fill</p>
                  <button
                    type="button"
                    onClick={() => setOtp(demoOtp)}
                    className="mt-2 text-xs bg-white/10 text-white px-3 py-1 rounded-lg"
                  >
                    Use {demoOtp}
                  </button>
                </div>
              )}

              <div>
                <label className="text-green-200 text-sm font-medium block mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-4 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 text-3xl tracking-widest text-center"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full btn-secondary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "⏳ Verifying..." : "✅ Verify & Login"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); setOtp(""); }}
                className="w-full text-green-300 text-sm hover:text-white transition-colors"
              >
                ← Change number
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-green-400 text-xs text-center mb-2 font-semibold">🎮 Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "🌾 Farmer", phone: "9000000001" },
                { role: "👮 Officer", phone: "9000000002" },
                { role: "🏪 Seller", phone: "9000000003" },
                { role: "⚙️ Admin", phone: "9000000004" },
              ].map((d) => (
                <button
                  key={d.phone}
                  type="button"
                  onClick={() => { setPhone(d.phone); setStep("phone"); }}
                  className="text-left bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                >
                  <p className="text-white text-xs font-medium">{d.role}</p>
                  <p className="text-green-400 text-xs">{d.phone}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
