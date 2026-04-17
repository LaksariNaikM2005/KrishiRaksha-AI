import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { forumApi, ForumPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, ThumbsUp, MessageSquare, MapPin, CheckCircle, TrendingUp, Users, Sprout } from "lucide-react";

const CATEGORIES = ["All", "Disease", "Weather", "Technique", "Market", "SOS", "General"];

const DEMO_POSTS: ForumPost[] = [
  { id: "fp1", title: "Rice blast spreading fast in Mandya district — any prevention tips?", body: "I noticed yellow-brown diamond-shaped lesions on my paddy leaves. Lost about 20% yield in 2 weeks. Other farmers in my taluk also seeing this. What should I do?", category: "disease", tags: ["rice-blast", "paddy", "Karnataka"], upvotes: 47, is_expert_verified: true, lat: 12.5, lng: 76.9, created_at: "2026-04-11T10:00:00Z" },
  { id: "fp2", title: "IMD forecast: heavy rainfall expected in Hyderabad region next week", body: "The IMD has forecast heavy rainfall from April 15–18. Cotton farmers should apply preventive fungicide before rains. Also avoid irrigation.", category: "weather", tags: ["IMD", "Hyderabad", "cotton"], upvotes: 31, is_expert_verified: true, lat: 17.38, lng: 78.48, created_at: "2026-04-12T08:00:00Z" },
  { id: "fp3", title: "Found 3 effective organic methods for controlling aphids on tomato", body: "After trying many things, I found neem oil spray + sticky traps work best together. Here is my complete protocol...", category: "technique", tags: ["organic", "tomato", "aphids"], upvotes: 23, is_expert_verified: false, lat: 13.08, lng: 80.27, created_at: "2026-04-10T14:00:00Z" },
  { id: "fp4", title: "Anyone facing whitefly problem in cotton near Nagpur?", body: "Whiteflies are destroying my cotton crop. Tried imidacloprid but not working anymore. Need alternative recommendation.", category: "disease", tags: ["whitefly", "cotton", "Maharashtra"], upvotes: 18, is_expert_verified: false, lat: 21.14, lng: 79.08, created_at: "2026-04-12T16:00:00Z" },
  { id: "fp5", title: "Best price for Tricyclazole in Karnataka — share if you know", body: "Getting quotes from dealers. One in Belgaum is offering ₹420 for 250g, another in Hubli ₹390. Is there a better source?", category: "market", tags: ["price", "fungicide", "Karnataka"], upvotes: 12, is_expert_verified: false, lat: 15.85, lng: 74.49, created_at: "2026-04-13T09:00:00Z" },
];

const CATEGORY_COLORS: Record<string, string> = {
  disease: "bg-red-50 text-red-700",
  weather: "bg-blue-50 text-blue-700",
  technique: "bg-green-50 text-green-700",
  market: "bg-amber-50 text-amber-700",
  sos: "bg-red-100 text-red-800",
  general: "bg-gray-50 text-gray-700",
};

const CATEGORY_ICONS: Record<string, string> = {
  disease: "🦠", weather: "🌧️", technique: "🔧", market: "💰", sos: "🚨", general: "💬",
};

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"recent" | "trending">("recent");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    forumApi.listPosts({ sort })
      .then(setPosts)
      .catch(() => setPosts(DEMO_POSTS))
      .finally(() => setLoading(false));
  }, [sort]);

  const filtered = posts.filter(p => {
    const matchCat = category === "All" || p.category?.toLowerCase() === category.toLowerCase();
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.body || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleUpvote = async (id: string) => {
    await forumApi.upvotePost(id).catch(() => {});
    setUpvoted(prev => new Set([...prev, id]));
    setPosts(prev => prev.map(p => p.id === id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-800">💬 Community Forum</h1>
          <p className="text-gray-400 text-sm">Ask experts, share knowledge, help each other</p>
        </div>
        <Link to="/app/forum/new" className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="w-4 h-4" /> Post
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discussions..." className="input-field pl-11" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-1.5 flex-shrink-0">
          {([
            { key: "recent", icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Recent" },
            { key: "trending", icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Trending" },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${sort === key ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${category === cat ? "bg-secondary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-secondary"}`}
          >
            {cat !== "All" && CATEGORY_ICONS[cat.toLowerCase()]} {cat}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Users className="w-4 h-4 text-blue-500" />, label: "Members", value: "12,340" },
          { icon: <MessageSquare className="w-4 h-4 text-green-500" />, label: "Posts", value: "8,921" },
          { icon: <Sprout className="w-4 h-4 text-amber-500" />, label: "Expert Answers", value: "1,204" },
        ].map(({ icon, label, value }) => (
          <div key={label} className="card text-center py-3">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="font-extrabold text-primary-800">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 shimmer rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No posts found</p>
          <Link to="/app/forum/new" className="btn-primary text-sm mt-4 inline-block">Start a Discussion</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <Link key={post.id} to={`/app/forum/${post.id}`} className="card group block hover:border-secondary hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${CATEGORY_COLORS[post.category || "general"] || "bg-gray-50"}`}>
                  {CATEGORY_ICONS[post.category || "general"] || "💬"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-primary-800 leading-snug group-hover:text-secondary transition-colors line-clamp-2">{post.title}</h3>
                    {post.is_expert_verified && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle className="w-3 h-3" />Expert
                      </span>
                    )}
                  </div>
                  {post.body && <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{post.body}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <button
                      onClick={e => { e.preventDefault(); handleUpvote(post.id); }}
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${upvoted.has(post.id) ? "text-secondary" : "text-gray-400 hover:text-secondary"}`}
                    >
                      <ThumbsUp className="w-4 h-4" />{post.upvotes || 0}
                    </button>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageSquare className="w-3.5 h-3.5" />3 comments
                    </span>
                    {post.lat && post.lng && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />~12 km away
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-300 ml-auto">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
