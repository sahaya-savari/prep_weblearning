const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase");

// ── Middleware: verify Supabase JWT ───────────────────
// Frontend sends: Authorization: Bearer <supabase_access_token>
async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.supabaseUser = user; // { id, email, ... }
  next();
}

// ── POST /api/save-result ─────────────────────────────
// Body: { topic, score }
router.post("/save-result", requireAuth, async (req, res) => {
  const { topic, score } = req.body;

  if (!topic || score === undefined) {
    return res.status(400).json({ error: "topic and score are required" });
  }

  const userId = req.supabaseUser.id;

  const { data, error } = await supabase
    .from("practice_history")
    .insert([{ user_id: userId, topic, score }])
    .select()
    .single();

  if (error) {
    console.error("[Supabase] save-result error:", error.message);
    return res.status(500).json({ error: "Failed to save result" });
  }

  return res.json({ success: true, result: data });
});

// ── GET /api/history ──────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  const userId = req.supabaseUser.id;

  const { data, error } = await supabase
    .from("practice_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[Supabase] history fetch error:", error.message);
    return res.status(500).json({ error: "Failed to fetch history" });
  }

  return res.json({ success: true, history: data });
});

module.exports = router;
