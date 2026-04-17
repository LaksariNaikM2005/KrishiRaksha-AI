import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { detectApi, DetectionResult } from "@/lib/api";
import { Camera, Upload, X, Zap, ArrowRight, AlertCircle, Mic } from "lucide-react";

const LOADING_MESSAGES = [
  "Examining leaf patterns...",
  "Checking against 38 diseases...",
  "Analyzing color, texture, and lesions...",
  "Generating your advisory...",
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
  critical: "badge-critical",
};

const DISEASE_NAMES_HI: Record<string, string> = {
  "Rice Blast": "चावल का झुलसा रोग",
  "Leaf Blight": "पत्ती अंगमारी",
  "Brown Spot": "भूरा धब्बा रोग",
  "Powdery Mildew": "चूर्णिल आसिता",
  "Anthracnose": "एन्थ्राक्नोज",
  "Early Blight": "अगेती झुलसा",
  "Late Blight": "पछेती झुलसा",
  "Fusarium Wilt": "उकटा रोग",
};

const INFERENCE_LABELS: Record<string, string> = {
  yolo: "Source: YOLOv8 model",
  demo: "Source: Demo fallback",
  unknown: "Source: Unknown",
};

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeWithFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingMsg(0);

    const interval = setInterval(() => setLoadingMsg(m => (m + 1) % LOADING_MESSAGES.length), 1200);

    try {
      const res = await detectApi.uploadImage(file);
      setResult(res);
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(ms);
      setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch {
      setError("Camera access denied. Please use file upload instead.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setImage(canvas.toDataURL("image/jpeg"));
      stopCamera();
      void analyzeWithFile(file);
    }, "image/jpeg", 0.9);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
    void analyzeWithFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (!imageFile) return;
    await analyzeWithFile(imageFile);
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-800">🔬 Scan Your Crop</h1>
        <p className="text-gray-500 text-sm mt-1">Take or upload a photo of a diseased leaf to get instant diagnosis</p>
      </div>

      {/* Camera / Upload Area */}
      {!image && (
        <div className="space-y-4">
          {cameraActive ? (
            <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full" style={{ maxHeight: 400 }} />
              {/* Guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-48 border-2 border-secondary border-dashed rounded-2xl opacity-80" />
                <div className="absolute bottom-20 text-center">
                  <p className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                    Place leaf inside the frame
                  </p>
                </div>
              </div>
              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  aria-label="Close camera"
                  title="Close camera"
                  className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  aria-label="Capture photo"
                  title="Capture photo"
                  className="w-16 h-16 bg-white rounded-full shadow-2xl border-4 border-secondary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  <Camera className="w-7 h-7 text-primary-700" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Upload zone */}
              <div
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver ? "border-secondary bg-secondary/5 scale-105" : "border-green-200 bg-white hover:border-secondary hover:bg-green-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-secondary mx-auto mb-4" />
                <p className="font-bold text-primary-700 text-lg">Drop a leaf photo here</p>
                <p className="text-gray-400 text-sm mt-1">or click to select from gallery</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload crop image"
                  title="Upload crop image"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-3 bg-primary-600 text-white rounded-2xl py-4 font-semibold hover:bg-primary-700 active:scale-95 transition-all shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </button>
                <Link
                  to="/app/voice"
                  className="flex items-center justify-center gap-3 bg-white border-2 border-secondary text-secondary rounded-2xl py-4 font-semibold hover:bg-secondary/5 active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  Describe by Voice
                </Link>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Image preview */}
      {image && !loading && !result && (
        <div className="space-y-4">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img src={image} alt="Crop scan" className="w-full object-cover max-h-80" />
            <button
              onClick={reset}
              aria-label="Remove selected image"
              title="Remove selected image"
              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={analyze}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-98 transition-all shadow-xl shadow-primary-600/30"
          >
            <Zap className="w-6 h-6" />
            Analyze Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-12">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-secondary/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 border-4 border-primary-300/30 rounded-full" />
            <div className="absolute inset-3 border-4 border-primary-300 border-b-transparent rounded-full animate-spin animate-reverse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🔬</div>
          </div>
          <p className="text-primary-700 font-bold text-lg transition-all">{LOADING_MESSAGES[loadingMsg]}</p>
          <p className="text-gray-400 text-sm mt-2">Our YOLOv8 AI is inspecting your crop</p>
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-100 bg-red-50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {image && (
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img src={image} alt="Analyzed crop" className="w-full object-cover max-h-48 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className={SEVERITY_COLORS[result.severity] || "badge-high"}>
                  {result.severity.toUpperCase()} SEVERITY
                </span>
              </div>
            </div>
          )}

          {/* Detection result card */}
          <div className="card border-0 bg-gradient-to-br from-white to-green-50/50 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-primary-800">{result.disease}</h2>
                {(result.disease_hi || DISEASE_NAMES_HI[result.disease]) && (
                  <p className="text-gray-500 text-sm">{result.disease_hi || DISEASE_NAMES_HI[result.disease]}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {INFERENCE_LABELS[result.inference_source || "unknown"]}
                </p>
              </div>
              <span className={`${SEVERITY_COLORS[result.severity] || "badge-high"} text-xs`}>
                {result.severity}
              </span>
            </div>

            {/* Confidence bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-500">Detection Confidence</span>
                <span className="text-primary-700">{result.confidence.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${result.confidence}%`,
                    background: result.confidence > 80 ? "#40916C" : result.confidence > 60 ? "#F4A261" : "#E63946",
                  }}
                />
              </div>
            </div>

            {result.affected_area_percent != null && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                Estimated affected area: <span className="font-bold text-red-600">{result.affected_area_percent}%</span>
              </div>
            )}

            {/* Low confidence warning */}
            {result.confidence < 60 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-sm font-semibold">Low confidence detection</p>
                  <p className="text-amber-600 text-xs mt-0.5">Try taking another photo in better light, or describe symptoms by voice.</p>
                </div>
              </div>
            )}

            {/* Action chips */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Link
                to={`/app/advisory/${result.advisory_id || result.detection_id}`}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 active:scale-95 transition-all"
              >
                View Full Advisory <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/app/market?disease=${encodeURIComponent(result.disease)}`}
                className="flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Find Products 🛒
              </Link>
              <Link
                to="/app/forum/new"
                className="flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-600 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 active:scale-95 transition-all"
              >
                Share on Forum
              </Link>
              <Link
                to="/app/sos"
                className="flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-3 rounded-xl font-semibold text-sm hover:bg-red-50 active:scale-95 transition-all"
              >
                Call Officer 🚨
              </Link>
            </div>
          </div>

          <button onClick={reset} className="w-full text-gray-400 text-sm hover:text-gray-600 py-2 transition-colors">
            ↩ Scan another crop
          </button>
        </div>
      )}

      {/* Tips */}
      {!image && !loading && !result && (
        <div className="card bg-green-50 border-green-100">
          <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">📸 Tips for best results</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-secondary mt-0.5">✓</span> Photograph in bright natural light</li>
            <li className="flex items-start gap-2"><span className="text-secondary mt-0.5">✓</span> Fill the frame with a single diseased leaf</li>
            <li className="flex items-start gap-2"><span className="text-secondary mt-0.5">✓</span> Avoid blurry or dark images</li>
            <li className="flex items-start gap-2"><span className="text-secondary mt-0.5">✓</span> Include the affected spots clearly</li>
          </ul>
        </div>
      )}
    </div>
  );
}
