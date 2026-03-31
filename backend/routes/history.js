const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase");

// ── Middleware: require login ─────────────────────────
function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// ── POST /api/save-result ─────────────────────────────
// Body: { topic, score }
router.post("/save-result", requireAuth, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const { topic, score } = req.body;
  if (!topic || score === undefined) {
    return res.status(400).json({ error: "topic and score are required" });
  }

  // Get Supabase user id from session (attached during OAuth callback)
  const userId = req.user?.dbUser?.id;
  if (!userId) {
    return res.status(400).json({ error: "User not found in database" });
  }

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
  if (!supabase) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const userId = req.user?.dbUser?.id;
  if (!userId) {
    return res.status(400).json({ error: "User not found in database" });
  }

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
