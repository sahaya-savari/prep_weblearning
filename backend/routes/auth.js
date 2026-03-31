const passport = require("passport");
const { Strategy: GitHubStrategy } = require("passport-github2");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase");

// ── Shared helper: upsert user into Supabase ──────────
async function upsertUser(profile, provider) {
  const email =
    profile.emails?.[0]?.value ??
    `${profile.id}@${provider}.noemail`; // fallback if no email

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (existing) return existing;

  const { data: inserted, error } = await supabase
    .from("users")
    .insert([{
      name: profile.displayName || profile.username || "User",
      email,
      avatar_url: profile.photos?.[0]?.value ?? null,
      provider,
    }])
    .select()
    .single();

  if (error) {
    console.error(`[Supabase] upsertUser error (${provider}):`, error.message);
    return null;
  }
  return inserted;
}

// ── Passport GitHub Strategy ──────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (supabase) {
          const dbUser = await upsertUser(profile, "github");
          if (dbUser) profile.dbUser = dbUser; // attach DB record to session
        }
        return done(null, profile);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── Passport Google Strategy ──────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (supabase) {
          const dbUser = await upsertUser(profile, "google");
          if (dbUser) profile.dbUser = dbUser;
        }
        return done(null, profile);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ── Routes ────────────────────────────────────────────

// Start GitHub login
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    // On success → redirect to the practice page
    res.redirect("https://prep-weblearning.vercel.app/practice");
  }
);

// ── Google Routes ─────────────────────────────────────

// Start Google login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("https://prep-weblearning.vercel.app/practice");
  }
);

// Current user — returns both OAuth profile + Supabase DB record
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    const db = req.user.dbUser ?? null;
    return res.json({
      authenticated: true,
      user: {
        // OAuth profile fields
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName,
        avatar: req.user.photos?.[0]?.value ?? null,
        // Supabase DB fields (null if Supabase not configured)
        dbId: db?.id ?? null,
        email: db?.email ?? null,
        provider: db?.provider ?? null,
      },
    });
  }
  return res.json({ authenticated: false });
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

module.exports = router;
