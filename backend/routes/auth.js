const passport = require("passport");
const { Strategy: GitHubStrategy } = require("passport-github2");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const express = require("express");
const router = express.Router();

// ── Passport GitHub Strategy ──────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // For now just pass the profile (no DB yet)
      return done(null, profile);
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
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
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

// Current user (optional — handy for frontend to check session)
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName,
        profileUrl: req.user.profileUrl,
        avatar: req.user.photos?.[0]?.value ?? null,
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
