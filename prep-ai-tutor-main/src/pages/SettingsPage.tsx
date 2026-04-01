import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Sliders, GraduationCap, UserCircle, LogOut, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { selectedExam, setSelectedExam } = useAppContext();
  const { user, signOut } = useAuth();
  const [questionCount, setQuestionCount] = useState(localStorage.getItem("prepmind_qcount") || "5");
  const [difficulty, setDifficulty] = useState(localStorage.getItem("prepmind_difficulty") || "medium");
  const [theme, setTheme] = useState(localStorage.getItem("prepmind_theme") || "dark");
  const { toast } = useToast();

  useEffect(() => {
    // Apply theme changes to document root unconditionally during preview
    document.documentElement.className = theme;
  }, [theme]);

  const handleSave = () => {
    localStorage.setItem("prepmind_qcount", questionCount);
    localStorage.setItem("prepmind_difficulty", difficulty);
    localStorage.setItem("prepmind_theme", theme);
    document.documentElement.className = theme; // Persist class
    
    toast({ title: "Settings saved", description: "Your preferences and theme have been updated." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6 lg:pb-12"
    >
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your PrepMind AI and Profile preferences.</p>
      </div>

      {/* Account Security Settings (Protective Settings) */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5 border-l-4 border-l-primary/50">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <UserCircle className="h-4 w-4 text-primary" />
          </div>
          Account Profile
        </h2>
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
            <div>
              <p className="font-medium text-sm">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Signed in via {user.app_metadata.provider || 'Email'}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => signOut()} className="rounded-xl ring-offset-background transition-transform hover:scale-105">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">
            You are currently using PrepMind locally as a guest. Sign in using the sidebar to save your progress permanently.
          </div>
        )}
      </Card>

      {/* Appearance Settings */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-accent/10 p-1.5">
            <Palette className="h-4 w-4 text-accent" />
          </div>
          Appearance
        </h2>
        <div className="space-y-2">
          <Label className="text-sm">App Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light (Optimized Visibility)</SelectItem>
              <SelectItem value="dark">Dark (Default Workspace)</SelectItem>
              <SelectItem value="midnight">Midnight (High Contrast AMOLED)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Exam Settings */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          Knowledge Focus
        </h2>
        <div className="space-y-2">
          <Label className="text-sm">Default Target Exam / Subject</Label>
          <Input
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            placeholder="e.g., GATE CS, Next.js Concepts"
            className="bg-muted/30 border-border/40 rounded-xl"
          />
        </div>
      </Card>

      {/* Practice Settings */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-warning/10 p-1.5">
            <Sliders className="h-4 w-4 text-warning" />
          </div>
          Practice Tuning
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Questions per Set</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy (Fundamentals)</SelectItem>
                <SelectItem value="medium">Medium (Standard)</SelectItem>
                <SelectItem value="hard">Hard (Advanced)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} className="btn-glow rounded-xl w-full sm:w-auto mt-4 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
        <Save className="mr-2 h-4 w-4" /> Apply Changes Globally
      </Button>
    </motion.div>
  );
}
