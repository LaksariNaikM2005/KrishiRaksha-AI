import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forumApi } from "@/lib/api";
import { ArrowLeft, Image, X, Tag, Loader } from "lucide-react";

const CATEGORIES = ["disease", "weather", "technique", "market", "sos", "general"];
const CROP_TAGS = ["paddy", "wheat", "cotton", "tomato", "sugarcane", "maize", "chilli", "onion", "groundnut", "banana"];
const DISEASE_TAGS = ["rice-blast", "leaf-blight", "powdery-mildew", "aphids", "whitefly", "brown-spot", "anthracnose"];

export default function ForumNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", body: "", category: "disease", tags: [] as string[] });
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    setForm(f => ({ ...f, tags: [...f.tags, customTag.trim().toLowerCase()] }));
    setCustomTag("");
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const post = await forumApi.createPost(form);
      navigate(`/app/forum/${post.id}`);
    } catch {
      // Demo mode
      navigate("/app/forum");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/forum" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-extrabold text-primary-800">✍️ New Post</h1>
      </div>

      <div className="card space-y-5">
        {/* Category */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Category *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${form.category === cat ? "bg-primary-600 text-white shadow-sm" : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-secondary"}`}
              >
                {cat === "disease" ? "🦠" : cat === "weather" ? "🌧️" : cat === "technique" ? "🔧" : cat === "market" ? "💰" : cat === "sos" ? "🚨" : "💬"} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Question / Title *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="E.g. What is the best remedy for rice blast in my paddy field?"
            className="input-field text-base"
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/200</p>
        </div>

        {/* Body */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Details *</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Describe your problem in detail. Include: symptoms you see, how long, how many plants affected, what you've tried..."
            className="input-field resize-none text-sm"
            rows={6}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />Tags (select all that apply)
          </label>
          <div className="mb-3">
            <p className="text-[11px] text-gray-400 mb-1.5 font-semibold">Crop Type</p>
            <div className="flex flex-wrap gap-1.5">
              {CROP_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${form.tags.includes(tag) ? "bg-secondary text-white" : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-secondary"}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1.5 font-semibold">Disease / Pest</p>
            <div className="flex flex-wrap gap-1.5">
              {DISEASE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${form.tags.includes(tag) ? "bg-red-500 text-white" : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-red-300"}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 font-semibold px-2.5 py-1 rounded-lg">
                  #{tag}
                  <button onClick={() => toggleTag(tag)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomTag()}
              placeholder="Add custom tag..."
              className="input-field py-2 text-sm flex-1"
            />
            <button onClick={addCustomTag} className="bg-secondary text-white px-4 rounded-xl font-bold text-sm">Add</button>
          </div>
        </div>

        {/* Image upload placeholder */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400 cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
          <Image className="w-6 h-6 mx-auto mb-1" />
          <p>Attach photos (optional) — Tap to upload</p>
        </div>
      </div>

      {/* Guidelines */}
      <div className="card bg-green-50 border-green-100">
        <p className="text-xs font-bold text-primary-700 mb-2">📌 Community Guidelines</p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Be specific: describe symptoms, location, and what you've tried</li>
          <li>• Include photos when possible — helps experts diagnose faster</li>
          <li>• Respect others: this is a farming community, not a debate forum</li>
          <li>• Mark as SOS only if it's a genuine emergency</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link to="/app/forum" className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors">Cancel</Link>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title.trim() || !form.body.trim()}
          className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Posting..." : "Post to Community →"}
        </button>
      </div>
    </div>
  );
}
