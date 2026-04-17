import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { forumApi, ForumPost, ForumComment } from "@/lib/api";
import { ArrowLeft, ThumbsUp, CheckCircle, Send, MapPin, Loader } from "lucide-react";

const DEMO_POST: ForumPost = {
  id: "fp1",
  title: "Rice blast spreading fast in Mandya district — any prevention tips?",
  body: "I noticed yellow-brown diamond-shaped lesions on my paddy leaves. Started on the tips of leaves, now spreading to the whole leaf. Lost about 20% of my crop in 2 weeks. Other farmers in my taluk are also seeing this now. What should I do? The disease is spreading through the field very fast.\n\nMy paddy is at vegetative stage, 45 days old. Soil is clayey, flood irrigated. Humidity is very high this week.",
  category: "disease",
  tags: ["rice-blast", "paddy", "Karnataka"],
  upvotes: 47,
  is_expert_verified: true,
  lat: 12.5,
  lng: 76.9,
  created_at: "2026-04-11T10:00:00Z",
};

const DEMO_COMMENTS: ForumComment[] = [
  { id: "c1", post_id: "fp1", author_id: "officer1", body: "🌾 Expert Response: This is confirmed Rice Blast (Magnaporthe oryzae). Based on your description, it's at foliar stage. Immediately spray Tricyclazole 75% WP at 0.6g/L. Do NOT irrigate for 48 hours after spraying. Remove heavily infected plants from borders. Contact your local KVK for free advisory.", upvotes: 34, created_at: "2026-04-11T12:30:00Z" },
  { id: "c2", post_id: "fp1", author_id: "farmer1", body: "Same problem in my farm in Mysuru. I applied Propiconazole last week and it's helping. The new leaves look clean now. Try that if Tricyclazole is not available.", upvotes: 12, created_at: "2026-04-11T15:00:00Z" },
  { id: "c3", post_id: "fp1", author_id: "farmer2", body: "Avoid excess nitrogen fertilizer right now. High nitrogen makes the crop more susceptible. Switch to potassium-based fertilizer temporarily.", upvotes: 8, created_at: "2026-04-12T08:00:00Z" },
];

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postUpvoted, setPostUpvoted] = useState(false);
  const [upvotedComments, setUpvotedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([forumApi.getPost(id!), forumApi.getComments(id!)]);
        setPost(p);
        setComments(c);
      } catch {
        setPost(DEMO_POST);
        setComments(DEMO_COMMENTS);
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const comment = await forumApi.addComment(id!, commentText);
      setComments(prev => [...prev, comment]);
    } catch {
      setComments(prev => [...prev, {
        id: Date.now().toString(), post_id: id!, body: commentText, upvotes: 0, created_at: new Date().toISOString()
      }]);
    } finally {
      setCommentText("");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}</div>;
  if (!post) return <div className="text-center text-gray-500 py-12">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link to="/app/forum" className="p-2 rounded-xl hover:bg-green-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm text-gray-400">Community Forum</span>
      </div>

      {/* Post */}
      <div className="card">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${post.category === "disease" ? "bg-red-50" : "bg-blue-50"}`}>
            {post.category === "disease" ? "🦠" : post.category === "weather" ? "🌧️" : "💬"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 capitalize">{post.category}</span>
              {post.is_expert_verified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />Expert Verified
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {post.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
              {post.lat && " · Near your location"}
            </p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-primary-800 leading-tight mb-3">{post.title}</h1>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{post.body}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-semibold">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
          <button
            onClick={async () => { await forumApi.upvotePost(post.id).catch(() => {}); setPostUpvoted(true); setPost(p => p ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p); }}
            disabled={postUpvoted}
            className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl transition-all ${postUpvoted ? "bg-secondary/10 text-secondary" : "text-gray-400 hover:bg-green-50 hover:text-secondary"}`}
          >
            <ThumbsUp className="w-4 h-4" />{post.upvotes || 0} Helpful
          </button>
          <span className="text-sm text-gray-400">{comments.length} reply{comments.length !== 1 ? "ies" : ""}</span>
          <Link to="/app/sos" className="ml-auto text-xs text-red-500 font-semibold hover:underline">Need urgent help? SOS →</Link>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="font-bold text-primary-700">{comments.length} {comments.length === 1 ? "Reply" : "Replies"}</h3>
        {comments.map((comment, i) => (
          <div key={comment.id} className={`card ${i === 0 && post.is_expert_verified ? "border-green-200 bg-green-50/40" : ""}`}>
            {i === 0 && post.is_expert_verified && (
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">Agriculture Officer · Expert Response</span>
              </div>
            )}
            {i > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-secondary/20 rounded-full flex items-center justify-center text-xs font-bold text-secondary">F</div>
                <span className="text-xs font-semibold text-gray-500">Farmer</span>
                <span className="text-xs text-gray-300 ml-auto">
                  {comment.created_at ? new Date(comment.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => { setUpvotedComments(prev => new Set([...prev, comment.id])); setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c)); }}
                disabled={upvotedComments.has(comment.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${upvotedComments.has(comment.id) ? "text-secondary" : "text-gray-400 hover:text-secondary"}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />{comment.upvotes || 0} Helpful
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <div className="card border-secondary/20">
        <h3 className="font-bold text-primary-700 mb-3">💬 Add Your Reply</h3>
        <textarea
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Share your experience or advice..."
          className="input-field resize-none text-sm"
          rows={3}
        />
        <button
          onClick={handleSubmitComment}
          disabled={submitting || !commentText.trim()}
          className="mt-3 w-full flex items-center justify-center gap-2 btn-primary py-3 disabled:opacity-50"
        >
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? "Posting..." : "Post Reply"}
        </button>
      </div>
    </div>
  );
}
