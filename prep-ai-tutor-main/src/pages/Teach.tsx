import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/StatusComponents";
import { teachTopic, type TeachResponse } from "@/services/api";
import { GraduationCap, Search, Lightbulb, List, FlaskConical, BookOpen, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function TeachPage() {
  const { selectedExam } = useAppContext();
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<TeachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTeach = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await teachTopic({ topic: topic.trim(), exam: selectedExam || undefined });
      setResult(data);
    } catch {
      setError("Backend not connected yet. Feature coming soon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teach Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter a topic for a deep AI-powered explanation.</p>
      </div>

      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="e.g., Binary Search Trees, Ohm's Law..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTeach()}
            className="bg-muted/30 border-border/40 rounded-xl"
          />
          <Button
            onClick={handleTeach}
            disabled={!topic.trim() || loading}
            className="btn-glow rounded-xl whitespace-nowrap"
          >
            <Search className="mr-2 h-4 w-4" /> Explain
          </Button>
        </div>
        {selectedExam && (
          <Badge variant="secondary" className="rounded-lg">Context: {selectedExam}</Badge>
        )}
      </Card>

      {loading && <LoadingSpinner text="Generating explanation..." />}
      {error && (
        <Card className="p-5 glass rounded-2xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">⚠️ {error}</p>
          <Button variant="secondary" size="sm" onClick={handleTeach} className="rounded-xl">
            Try Again
          </Button>
        </Card>
      )}

      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <Card className="p-5 sm:p-6 glass rounded-2xl hover-lift">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              Explanation
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
          </Card>

          {result.keyPoints.length > 0 && (
            <Card className="p-5 sm:p-6 glass rounded-2xl hover-lift">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-accent/10 p-1.5">
                  <List className="h-4 w-4 text-accent" />
                </div>
                Key Points
              </h3>
              <ul className="space-y-2.5">
                {result.keyPoints.map((point, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-3 items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-md bg-muted flex items-center justify-center text-xs font-mono text-primary font-semibold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.examples.length > 0 && (
            <Card className="p-5 sm:p-6 glass rounded-2xl hover-lift">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <FlaskConical className="h-4 w-4 text-primary" />
                </div>
                Examples
              </h3>
              <div className="space-y-2">
                {result.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 p-4 text-sm font-mono border border-border/30">
                    {ex}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/chat")} className="rounded-xl hover:scale-105 transition-transform">
              <MessageSquare className="mr-2 h-4 w-4" /> Ask AI about this
            </Button>
            <Button variant="secondary" onClick={() => navigate("/practice")} className="rounded-xl hover:scale-105 transition-transform">
              <BookOpen className="mr-2 h-4 w-4" /> Practice this topic
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
