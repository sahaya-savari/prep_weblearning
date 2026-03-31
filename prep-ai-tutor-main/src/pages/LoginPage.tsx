import React, { useState } from "react";
import { Github, Mail, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginPageProps {
  onGuest: () => void;
}

export default function LoginPage({ onGuest }: LoginPageProps) {
  const { loginWithGoogle, loginWithGithub, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      await loginWithEmail(email);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await loginWithGoogle(); } catch { setGoogleLoading(false); }
  };

  const handleGithub = async () => {
    setGithubLoading(true);
    try { await loginWithGithub(); } catch { setGithubLoading(false); }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Grid overlay */}
      <div className="login-grid" />

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <Sparkles size={28} />
          </div>
          <span className="login-logo-text">
            Prep<span style={{ color: "var(--primary)" }}>Mind</span>
          </span>
          <div className="login-logo-badge">AI</div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">
              Sign in to sync your progress, notes &amp; AI history
            </p>
          </div>

          <div className="login-methods">
            {/* Google */}
            <button
              id="btn-login-google"
              className="login-oauth-btn login-google-btn"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="login-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" className="login-oauth-icon" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* GitHub */}
            <button
              id="btn-login-github"
              className="login-oauth-btn login-github-btn"
              onClick={handleGithub}
              disabled={githubLoading}
            >
              {githubLoading ? (
                <span className="login-spinner" />
              ) : (
                <Github size={20} className="login-oauth-icon" />
              )}
              <span>Continue with GitHub</span>
            </button>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <div className="login-divider-line" />
            </div>

            {/* Email */}
            {emailSent ? (
              <div className="login-email-sent">
                <div className="login-email-sent-icon">✉️</div>
                <p className="login-email-sent-title">Check your inbox!</p>
                <p className="login-email-sent-sub">
                  Magic link sent to <strong>{email}</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handleEmail} className="login-email-form">
                <div className="login-email-field">
                  <Mail size={16} className="login-email-icon" />
                  <input
                    id="input-login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-email-input"
                    disabled={emailLoading}
                  />
                </div>
                <button
                  id="btn-login-email"
                  type="submit"
                  className="login-email-submit"
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <span className="login-spinner login-spinner-dark" />
                  ) : (
                    <>
                      <span>Send magic link</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Guest mode */}
            <div className="login-guest-wrap">
              <button
                id="btn-login-guest"
                className="login-guest-btn"
                onClick={onGuest}
              >
                <Zap size={14} />
                <span>Try without an account</span>
              </button>
              <p className="login-guest-note">Progress won't be saved</p>
            </div>
          </div>

          <p className="login-terms">
            By continuing, you agree to our{" "}
            <a href="#" className="login-link">Terms</a> and{" "}
            <a href="#" className="login-link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
