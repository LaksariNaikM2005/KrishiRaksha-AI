import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  lang?: string;
  timestamp: Date;
}

const LANGUAGES = [
  { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "kn-IN", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ்", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी", flag: "🇮🇳" },
];

const SUGGESTIONS: Record<string, string[]> = {
  "hi-IN": ["मेरी फसल में क्या बीमारी है?", "आज का मौसम कैसा रहेगा?", "कौनसा कीटनाशक उपयोग करें?"],
  "en-IN": ["What disease is in my crop?", "How is the weather today?", "Which pesticide should I use?"],
  "kn-IN": ["ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ಯಾವ ರೋಗ ಇದೆ?", "ಇಂದಿನ ಹವಾಮಾನ ಹೇಗಿರುತ್ತದೆ?", "ಯಾವ ಕ್ರಿಮಿನಾಶಕ ಬಳಸಬೇಕು?"],
  "te-IN": ["నా పంటలో ఏ వ్యాధి ఉంది?", "నేటి వాతావరణం ఎలా ఉంటుంది?", "ఏ పురుగుమందు వాడాలి?"],
  "ta-IN": ["என் பயிரில் என்ன நோய் உள்ளது?", "இன்று வானிலை எப்படி இருக்கும்?", "எந்த பூச்சிக்கொல்லி பயன்படுத்த வேண்டும்?"],
  "mr-IN": ["माझ्या पिकात कोणता रोग आहे?", "आजचे हवामान कसे असेल?", "कोणते कीटकनाशक वापरावे?"],
};

const DEMO_ANSWERS: Record<string, string> = {
  default: "KrishiRaksha AI suggests: Based on high humidity and temperature patterns in your region, your crop may be at risk for fungal diseases. I recommend spraying Trifloxystrobin + Tebuconazole (0.5ml/L) as a preventive measure. Monitor leaf surfaces for early lesions.",
  weather: "Today's weather shows temperature of 28°C with 85% humidity and light winds at 12 km/h. This creates high risk conditions for Rice Blast and Leaf Blight. Consider applying preventive fungicide today.",
  pesticide: "For Rice Blast, use Tricyclazole 75% WP (0.6g/L) or Propiconazole 25% EC (1mL/L) as chemical options. For organic treatment, try Pseudomonas fluorescens bio-agent (2.5kg/acre). Apply in early morning for best results.",
};

export default function VoicePage() {
  const { user } = useAuth();
  const [lang, setLang] = useState<string>("hi-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition not supported in this browser. Please use Chrome.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      setTranscript(interim);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
  }, [lang]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    if (transcript.trim()) handleSubmit(transcript);
  };

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, lang, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTranscript("");
    setLoading(true);

    try {
      const response = await fetch("/api/voice/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("kr_token")}` },
        body: JSON.stringify({ text, language: lang }),
      });
      const data = await response.json();
      const answer = data.text_answer || generateDemoAnswer(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: answer, lang, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(answer);
    } catch {
      const answer = generateDemoAnswer(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(answer);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoAnswer = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("weather") || lower.includes("mausam") || lower.includes("hawa")) return DEMO_ANSWERS.weather;
    if (lower.includes("pesticide") || lower.includes("keetnashak") || lower.includes("spray")) return DEMO_ANSWERS.pesticide;
    return DEMO_ANSWERS.default;
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS["en-IN"];

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-800">🎙️ Voice Assistant</h1>
          <p className="text-gray-400 text-sm">Ask anything about your crops — in any language</p>
        </div>
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 bg-white border border-green-100 rounded-xl px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-green-50 transition-colors shadow-sm"
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-green-50 py-2 z-20 min-w-[160px]">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${l.code === lang ? "text-primary-700 font-bold" : "text-gray-600"}`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {l.code === lang && <span className="ml-auto text-secondary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSubmit(q)}
                className="text-sm bg-white border border-green-100 text-gray-700 px-3 py-1.5 rounded-xl hover:border-secondary hover:text-primary-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === "user"
                ? "bg-primary-600 text-white rounded-br-sm"
                : "bg-white border border-green-50 text-gray-800 rounded-bl-sm"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">🌾</span>
                  <span className="text-xs font-bold text-secondary">KrishiRaksha AI</span>
                </div>
              )}
              <p className="leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-green-200" : "text-gray-400"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-green-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span>🌾</span>
                <span className="text-xs font-bold text-secondary">KrishiRaksha AI</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="waveform-bar" style={{ height: 4, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Microphone section */}
      <div className="bg-white border border-green-50 rounded-3xl p-6 shadow-lg flex-shrink-0">
        {/* Waveform / transcript */}
        <div className="min-h-[48px] mb-4 flex items-center justify-center">
          {listening ? (
            <div className="flex items-center gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ animationDelay: `${i * 0.06}s`, height: 4 + Math.random() * 20 + "px" }}
                />
              ))}
            </div>
          ) : transcript ? (
            <p className="text-center text-gray-700 text-sm font-medium italic">"{transcript}"</p>
          ) : (
            <p className="text-center text-gray-400 text-sm">
              {listening ? "Listening..." : "Tap the microphone to start speaking"}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* Mic button */}
          <div className="relative">
            {listening && (
              <div className="absolute inset-0 rounded-full bg-secondary/30 animate-ping" />
            )}
            <button
              onClick={listening ? stopListening : startListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                listening
                  ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                  : "bg-primary-600 hover:bg-primary-700 shadow-primary-200"
              }`}
            >
              {listening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>
          </div>

          {/* Stop speaking */}
          {playing && (
            <button
              onClick={stopSpeaking}
              className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg hover:bg-amber-600 transition-colors"
            >
              <VolumeX className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <p className="text-center text-gray-400 text-xs mt-3">
          {listening ? "🔴 Recording... tap to send" : "Tap mic to speak"}
          {playing && " · 🔊 Speaking..."}
        </p>

        {/* Text input fallback */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(transcript)}
            placeholder={`Type your question in ${currentLang.label}...`}
            className="flex-1 input-field py-2 text-sm"
          />
          <button
            onClick={() => handleSubmit(transcript)}
            disabled={!transcript.trim()}
            className="bg-secondary text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-secondary/90 transition-colors"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
