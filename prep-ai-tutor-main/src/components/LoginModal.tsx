import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Github, Mail, Sparkles } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { loginWithGoogle, loginWithGithub, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-xl border-border/50">
        <DialogHeader className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 glow-primary ring-1 ring-primary/30">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-center">
            Welcome to Prep<span className="text-primary">Mind</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to securely cloud-sync your progress, learning notes, and AI test history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <Button
            variant="outline"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 h-11 text-base transition-all hover:bg-secondary/50 group"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            onClick={loginWithGithub}
            className="w-full flex items-center justify-center gap-2 h-11 text-base transition-all hover:bg-secondary/50 group"
          >
            <Github className="h-5 w-5 transition-transform group-hover:scale-110" />
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="flex space-x-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary/30 h-11 focus-visible:ring-primary focus-visible:border-primary border-transparent"
              disabled={loading || sent}
            />
            <Button
              type="submit"
              disabled={loading || sent}
              className="h-11 px-6 bg-white shrink-0 hover:bg-gray-100 text-black shadow-lg glow-primary/20"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : sent ? (
                "Sent!"
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          </form>

          {sent && (
            <p className="text-center text-sm text-green-500 font-medium pt-2">
              Check your email for the magic link!
            </p>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          By clicking continue, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
