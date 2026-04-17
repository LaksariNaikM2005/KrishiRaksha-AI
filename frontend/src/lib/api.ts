/**
 * KrishiRaksha AI — API Client
 * Wrapper for all backend API calls with auth token handling
 */

const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kr_token");
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("kr_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOTP: (phone: string) =>
    apiRequest<{ message: string; demo_otp?: string }>("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOTP: (phone: string, otp: string) =>
    apiRequest<{ access_token: string; user: UserProfile }>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),

  getMe: () => apiRequest<UserProfile>("/api/auth/me"),

  updateMe: (data: Partial<UserProfile>) =>
    apiRequest<{ message: string }>("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Farms ────────────────────────────────────────────────────────────────────
export const farmsApi = {
  list: () => apiRequest<Farm[]>("/api/farms"),
  get: (id: string) => apiRequest<Farm>(`/api/farms/${id}`),
  create: (data: Partial<Farm>) =>
    apiRequest<Farm>("/api/farms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Farm>) =>
    apiRequest<Farm>(`/api/farms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiRequest(`/api/farms/${id}`, { method: "DELETE" }),
};

// ─── Detection ────────────────────────────────────────────────────────────────
export const detectApi = {
  uploadImage: (file: File, farmId?: string, lat?: number, lng?: number) => {
    const fd = new FormData();
    fd.append("image", file);
    if (farmId) fd.append("farm_id", farmId);
    if (lat !== undefined) fd.append("lat", String(lat));
    if (lng !== undefined) fd.append("lng", String(lng));
    return apiRequest<DetectionResult>("/api/detect/image", { method: "POST", body: fd });
  },
};

// ─── Advisory ─────────────────────────────────────────────────────────────────
export const advisoryApi = {
  get: (id: string, lang?: string) =>
    apiRequest<Advisory>(`/api/advisory/${id}${lang ? `?lang=${lang}` : ""}`),
};

// ─── Risk ─────────────────────────────────────────────────────────────────────
export const riskApi = {
  getFarmRisk: (farmId: string) =>
    apiRequest<RiskScore>(`/api/risk/farm/${farmId}`),
  getRegional: (lat: number, lng: number, cropType?: string) =>
    apiRequest<GeoJSONFeatureCollection>(
      `/api/risk/regional?lat=${lat}&lng=${lng}${cropType ? `&crop_type=${cropType}` : ""}`
    ),
};

// ─── Location ─────────────────────────────────────────────────────────────────
export const locationApi = {
  getWeather: (lat: number, lng: number) =>
    apiRequest<WeatherData>(`/api/location/weather?lat=${lat}&lng=${lng}`),
  getAlerts: (lat: number, lng: number) =>
    apiRequest<{ alerts: Alert[] }>(`/api/location/alerts?lat=${lat}&lng=${lng}`),
};

// ─── SOS ──────────────────────────────────────────────────────────────────────
export const sosApi = {
  trigger: (lat: number, lng: number, message?: string) =>
    apiRequest<SOSResponse>("/api/sos/trigger", {
      method: "POST",
      body: JSON.stringify({ lat, lng, message }),
    }),
  acknowledge: (id: string) =>
    apiRequest(`/api/sos/${id}/acknowledge`, { method: "PUT" }),
  resolve: (id: string) =>
    apiRequest(`/api/sos/${id}/resolve`, { method: "PUT" }),
  getActive: () => apiRequest<SOSEvent[]>("/api/sos/active"),
  getHistory: () => apiRequest<SOSEvent[]>("/api/sos/history"),
};

// ─── Market ───────────────────────────────────────────────────────────────────
export const marketApi = {
  listProducts: (filters?: { category?: string; district?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string>);
    return apiRequest<MarketListing[]>(`/api/market/listings?${params}`);
  },
  getProduct: (id: string) => apiRequest<MarketListing>(`/api/market/listings/${id}`),
  getRecommended: (detectionId: string) =>
    apiRequest<{ recommended_products: RecommendedProduct[] }>(
      `/api/market/recommended?detection_id=${detectionId}`
    ),
  placeOrder: (listingId: string, quantity: number, address: Record<string, string>) =>
    apiRequest("/api/market/orders", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId, quantity, delivery_address: address }),
    }),
};

// ─── Forum ────────────────────────────────────────────────────────────────────
export const forumApi = {
  listPosts: (params?: { category?: string; sort?: string; page?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    return apiRequest<ForumPost[]>(`/api/forum/posts?${q}`);
  },
  getPost: (id: string) => apiRequest<ForumPost>(`/api/forum/posts/${id}`),
  createPost: (data: Partial<ForumPost>) =>
    apiRequest<ForumPost>("/api/forum/posts", { method: "POST", body: JSON.stringify(data) }),
  upvotePost: (id: string) =>
    apiRequest(`/api/forum/posts/${id}/upvote`, { method: "PUT" }),
  getComments: (postId: string) =>
    apiRequest<ForumComment[]>(`/api/forum/posts/${postId}/comments`),
  addComment: (postId: string, body: string) =>
    apiRequest<ForumComment>(`/api/forum/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  getTrending: () => apiRequest<ForumPost[]>("/api/forum/trending"),
};

// ─── Languages ────────────────────────────────────────────────────────────────
export const langApi = {
  list: () => apiRequest<{ languages: Language[] }>("/api/languages"),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  role: "farmer" | "officer" | "seller" | "admin";
  language_preference: string;
  state?: string;
  district?: string;
  lat?: number;
  lng?: number;
}

export interface Farm {
  id: string;
  name: string;
  crop_type?: string;
  crop_stage?: string;
  area_acres?: number;
  boundary?: Record<string, unknown>;
  soil_type?: string;
  irrigation_type?: string;
  created_at?: string;
}

export interface DetectionResult {
  detection_id: string;
  disease: string;
  disease_hi?: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  inference_source?: "yolo" | "demo" | "unknown";
  advisory_id?: string;
  affected_area_percent?: number;
  message?: string;
}

export interface Advisory {
  id: string;
  disease_name?: string;
  severity?: string;
  urgency?: string;
  text_en?: string;
  text_translated?: Record<string, string>;
  audio_url_map?: Record<string, string>;
  treatment_steps?: TreatmentStep[];
  organic_steps?: TreatmentStep[];
  prevention?: string[];
  escalation_triggers?: string[];
  estimated_cost_inr_per_acre?: number;
  created_at?: string;
}

export interface TreatmentStep {
  step: number;
  action: string;
  product?: string;
  dose?: string;
  timing?: string;
  estimated_cost_per_acre?: number;
}

export interface RiskScore {
  farm_id: string;
  overall_score: number;
  weather_risk: number;
  pest_risk: number;
  disease_risk: number;
  humidity_risk: number;
  soil_health?: number;
  historical_trend?: number;
  risk_category: string;
  computed_at?: string;
}

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    wind_speed_kmh: number;
    rainfall_mm: number;
    uv_index?: number;
    description: string;
    recorded_at?: string;
  };
  forecast: WeatherDay[];
  source?: string;
}

export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  description: string;
  icon?: string;
}

export interface Alert {
  id: string;
  type: "weather" | "pest" | "disease";
  severity: string;
  title: string;
  message: string;
  affected_crops?: string[];
  valid_till?: string;
}

export interface SOSEvent {
  id: string;
  lat?: number;
  lng?: number;
  message?: string;
  status: "active" | "acknowledged" | "resolved";
  created_at?: string;
}

export interface SOSResponse {
  sos_id: string;
  status: string;
  message: string;
  notified_officers: number;
}

export interface MarketListing {
  id: string;
  product_name: string;
  category?: string;
  description?: string;
  price: number;
  unit?: string;
  stock_quantity?: number;
  images?: string[];
  is_verified?: boolean;
  district?: string;
  diseases_treated?: string[];
}

export interface RecommendedProduct {
  rank: number;
  product_name: string;
  category: string;
  reason: string;
  recommended_dose: string;
  price_per_unit: number;
  unit: string;
  is_verified: boolean;
}

export interface ForumPost {
  id: string;
  author_id?: string;
  title: string;
  body?: string;
  category?: string;
  tags?: string[];
  upvotes?: number;
  is_expert_verified?: boolean;
  lat?: number;
  lng?: number;
  created_at?: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id?: string;
  body: string;
  upvotes?: number;
  created_at?: string;
}

export interface Language {
  code: string;
  name: string;
  native_name: string;
  tts_supported: boolean;
  stt_supported: boolean;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: Record<string, unknown>;
    properties: Record<string, unknown>;
  }>;
}
