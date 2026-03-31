import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { Settings as SettingsIcon, Save, Server, Sliders, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { selectedExam, setSelectedExam } = useAppContext();
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("prepmind_api_url") || "http://localhost:5000");
  const [questionCount, setQuestionCount] = useState(localStorage.getItem("prepmind_qcount") || "5");
  const [difficulty, setDifficulty] = useState(localStorage.getItem("prepmind_difficulty") || "medium");
  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem("prepmind_api_url", apiUrl);
    localStorage.setItem("prepmind_qcount", questionCount);
    localStorage.setItem("prepmind_difficulty", difficulty);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your PrepMind AI preferences.</p>
      </div>

      {/* Exam Settings */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          Exam
        </h2>
        <div className="space-y-2">
          <Label className="text-sm">Default Exam</Label>
          <Input
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            placeholder="e.g., GATE CS"
            className="bg-muted/30 border-border/40 rounded-xl"
          />
        </div>
      </Card>

      {/* Practice Settings */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-accent/10 p-1.5">
            <Sliders className="h-4 w-4 text-accent" />
          </div>
          Practice
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
            <Label className="text-sm">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>


      <Button onClick={handleSave} className="btn-glow rounded-xl w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" /> Save Settings
      </Button>
    </motion.div>
  );
}
