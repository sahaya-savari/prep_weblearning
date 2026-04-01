import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState } from "@/components/shared/StatusComponents";
import { generateMCQs, saveResult, AuthRequiredError, type MCQQuestion } from "@/services/api";
import { LoginModal } from "@/components/LoginModal";
import { BookOpen, CheckCircle2, XCircle, ArrowRight, RotateCcw, BrainCircuit, LogIn, CloudOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShareActions } from "@/components/ShareActions";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile, getUserProfile, getWeakTopics, getStrengthTopics } from "@/lib/profileStore";

export default function PracticePage() {
  const { selectedExam, updatePracticeStats, selectedAiModel } = useAppContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem("lastDifficulty") || "easy");
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);

  const currentQ = questions[currentIndex];

  // Timer logic
  useEffect(() => {
    if (loading || isFinished || !currentQ || revealed) return;
    
    if (timeLeft <= 0) {
      // Timeout auto-submit
      setRevealed(true);
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
           setCurrentIndex(i => i + 1);
           setSelectedAnswer(null);
           setRevealed(false);
           setTimeLeft(30);
        } else {
           handleFinish();
        }
      }, 2500); // Brief pause to see correct answer
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isFinished, currentQ, revealed, currentIndex, questions.length]);

  const handleGenerate = async () => {
    if (!selectedExam) return;
    setLoading(true);
    setError("");
    localStorage.setItem("lastDifficulty", difficulty);

    const cacheKey = `quiz_cache_${selectedExam}_${difficulty}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setRevealed(false);
          setScore({ correct: 0, total: 0 });
          setTimeLeft(30);
          setIsFinished(false);
          setSaved(false);
          setLoading(false);
          setIsFallback(false);
          return;
        }
      } catch (e) { /* ignore parse errors and fetch fresh */ }
    }

    try {
      const userProfile = getUserProfile();
      const weakList = getWeakTopics(userProfile);
      const strongList = getStrengthTopics(userProfile);

      const data = await generateMCQs({ 
         exam: selectedExam, 
         difficulty, 
         count: 5,
         weakTopics: weakList,
         strongTopics: strongList
      });
      setQuestions(data.questions);
      localStorage.setItem(cacheKey, JSON.stringify(data.questions));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setRevealed(false);
      setScore({ correct: 0, total: 0 });
      setTimeLeft(30);
      setIsFinished(false);
      setSaved(false);
      setIsFallback(data.fallback || false);
    } catch {
      setError("Backend connection failed. Feature coming soon.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !currentQ || submitted) return;
    setSubmitted(true);
    setRevealed(true);
    const isCorrect = selectedAnswer === currentQ.correctIndex;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    
    setTimeout(() => setSubmitted(false), 300);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
      setTimeLeft(30);
    }
  };

  const handleFinish = async () => {
    updatePracticeStats(score.correct, score.total);
    setIsFinished(true);

    const safeTotal = questions.length || score.total || 5;

    // Advanced Safe Merge Local Storage
    const profile = updateUserProfile(p => {
      p.history.push({
        topic: selectedExam,
        score: score.correct,
        total: safeTotal,
        difficulty: difficulty as "easy" | "medium" | "hard",
        date: new Date().toISOString()
      });

      if (!p.topics[selectedExam]) {
         p.topics[selectedExam] = { correct: 0, wrong: 0, lastScore: 0, lastAttempt: "" };
      }
      p.topics[selectedExam].correct += score.correct;
      p.topics[selectedExam].wrong += (safeTotal - score.correct);
      p.topics[selectedExam].lastScore = score.correct;
      p.topics[selectedExam].lastAttempt = new Date().toISOString();
    });

    // Adaptive Auto-Scaling logic using safe raw score math bounded limits
    const recentScores = profile.history.filter(h => h.topic === selectedExam && h.difficulty === difficulty).slice(-3);
    if (recentScores.length >= 3) {
       const avg = recentScores.reduce((acc, curr) => acc + (curr.total > 0 ? (curr.score / curr.total) * 5 : 0), 0) / 3;
       const levels = ["easy", "medium", "hard"];
       let index = levels.indexOf(difficulty);

       if (avg > 4 && index < 2) index++;
       else if (avg < 2 && index > 0) index--;

       const newDiff = levels[index] as "easy" | "medium" | "hard";
       if (newDiff !== difficulty) {
          setDifficulty(newDiff);
          localStorage.setItem("lastDifficulty", newDiff);
          toast({ title: "AI Adjusted Difficulty", description: `You were automatically moved to ${newDiff.toUpperCase()} mode based on your recent performance.` });
       }
    }

    // Auto-save for logged-in users
    if (user && selectedExam) {
      setSaving(true);
      try {
        await saveResult({ topic: selectedExam, score: score.correct });
        setSaved(true);
        toast({ title: "Result saved ✅", description: "Your score has been saved to your history." });
      } catch (err) {
        if (err instanceof AuthRequiredError) {
          // Shouldn't happen since we checked user — but handle gracefully
          setSaved(false);
        } else {
          toast({ title: "Save failed", description: "Could not save result. Try again later.", variant: "destructive" });
        }
      } finally {
        setSaving(false);
      }
    }
  };

  const getMarkdownReport = () => {
    let md = `# Practice Summary: ${selectedExam}\n\n**Score:** ${score.correct}/${score.total}\n\n---\n\n`;
    questions.forEach((q, i) => {
      md += `### Q${i + 1}: ${q.question}\n`;
      md += `*Correct Answer:* ${q.options[q.correctIndex]}\n\n`;
      md += `> **Explanation:** ${q.explanation}\n\n`;
    });
    return md;
  };

  if (!selectedExam) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No exam selected"
        description="Go to Home and select an exam to start practicing."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Practice
            <Badge variant="outline" className="text-[10px] ml-2 font-mono bg-accent/10 border-accent/20 text-accent">
              {selectedAiModel.toUpperCase()}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Context: <Badge variant="secondary" className="rounded-lg">{selectedExam}</Badge>
          </p>
          {isFallback && !loading && questions.length > 0 && (
            <p className="text-amber-500 text-xs mt-2 font-medium bg-amber-500/10 px-2 py-1 rounded w-fit">
              ⚠️ Showing offline questions (AI temporarily busy)
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
          <select 
            className="h-10 px-3 rounded-xl border border-border/40 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={loading}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <Button onClick={handleGenerate} disabled={loading} className="btn-glow px-4 rounded-xl">
            <RotateCcw className="mr-2 h-4 w-4" />
            {questions.length ? "New Set" : "Generate MCQs"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="py-12">
          <LoadingSpinner text={`⚙️ Generating questions via ${selectedAiModel}...`} />
        </div>
      )}
      
      {error && (
        <Card className="p-5 glass rounded-2xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">⚠️ {error}</p>
          <Button variant="secondary" size="sm" onClick={handleGenerate} className="rounded-xl">
            Try Again
          </Button>
        </Card>
      )}

      {!loading && !error && questions.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="py-12 flex flex-col items-center justify-center text-center opacity-50"
        >
          <div className="h-16 w-16 rounded-3xl bg-secondary/30 flex items-center justify-center mb-4 border border-border">
            <BrainCircuit className="h-8 w-8 text-foreground/40" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Ready to test your knowledge?</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Click Generate to get a fresh set of AI-crafted multiple choice questions.
          </p>
        </motion.div>
      )}

      {isFinished && !loading && (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-5 sm:p-8 glass rounded-2xl text-center space-y-5 border-gradient">
            <div className="h-16 w-16 mx-auto rounded-full bg-success/20 flex items-center justify-center ring-4 ring-success/10 mb-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Practice Complete!</h2>
              <p className="text-muted-foreground mt-1">You scored {score.correct} out of {score.total}</p>
            </div>

            {/* Save status / Login prompt */}
            {user ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                {saving && <span className="text-muted-foreground animate-pulse">Saving result…</span>}
                {saved && <span className="text-success font-medium">✅ Result saved to your history</span>}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/20 border border-dashed border-border/60">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CloudOff className="h-4 w-4" />
                  <span>Progress not saved — you're in guest mode</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-2 mt-1 border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => setShowLoginModal(true)}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to save your results
                </Button>
              </div>
            )}
            
            <div className="max-w-md mx-auto pt-2 flex flex-col gap-4 w-full">
               <ShareActions 
                 content={getMarkdownReport()} 
                 filename={`practice-${selectedExam.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.md`} 
                 subject={`My PrepMind Practice Score: ${score.correct}/${score.total}`} 
               />
               <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
                 <Button onClick={handleGenerate} className="flex-1 btn-glow rounded-xl">
                   Start a New Set
                 </Button>
                 {score.correct < score.total && (
                    <Button variant="secondary" onClick={() => handleGenerate()} className="flex-1 rounded-xl">
                      Retry Weak Areas
                    </Button>
                 )}
               </div>
            </div>
          </Card>
        </motion.div>
      )}

      {currentQ && !loading && !isFinished && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-5 sm:p-6 glass rounded-2xl space-y-5">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="rounded-lg font-mono">
                  Q{currentIndex + 1}/{questions.length}
                </Badge>
                <div className="text-sm font-bold flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-mono
                    ${timeLeft <= 5 ? "text-destructive border-destructive/30 bg-destructive/10 animate-pulse" : "text-primary border-primary/20 bg-primary/10"}
                  `}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </span>
                  Score: <span className="text-foreground ml-1">{score.correct}/{score.total}</span>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full transition-all"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <p className="text-base sm:text-lg font-medium leading-relaxed">{currentQ.question}</p>

              <div className="space-y-2.5">
                {currentQ.options.map((option, i) => {
                  const isCorrect = i === currentQ.correctIndex;
                  const isSelected = i === selectedAnswer;
                  let classes = "glass rounded-xl border-border/40 hover:bg-muted/30";

                  if (revealed) {
                    if (isCorrect) classes = "bg-success/10 border-success/30 rounded-xl";
                    else if (isSelected) classes = "bg-destructive/10 border-destructive/30 rounded-xl";
                    else classes = "opacity-50 glass rounded-xl border-border/40 pointer-events-none";
                  } else if (isSelected) {
                    classes = "border-primary/50 bg-primary/5 rounded-xl glow-primary";
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!revealed ? { scale: 1.01 } : undefined}
                      whileTap={!revealed ? { scale: 0.99 } : undefined}
                      onClick={() => handleSelect(i)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border transition-all duration-200 ${classes}`}
                    >
                      <span className="flex-shrink-0 h-7 w-7 rounded-sm bg-muted/50 flex items-center justify-center text-xs font-mono font-semibold text-muted-foreground border border-border/50">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm flex-1 font-medium">{option}</span>
                      {revealed && isCorrect && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {revealed && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl glass p-4 border-gradient bg-muted/20"
                >
                  <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-2">Explanation</p>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium">{currentQ.explanation}</p>
                </motion.div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {!revealed && (
                  <Button onClick={handleSubmit} disabled={selectedAnswer === null} className="btn-glow rounded-xl">
                    Submit Answer
                  </Button>
                )}
                {revealed && currentIndex < questions.length - 1 && (
                  <Button onClick={handleNext} className="btn-glow rounded-xl">
                    Next Question <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
                {revealed && currentIndex === questions.length - 1 && (
                  <Button onClick={handleFinish} className="btn-glow rounded-xl bg-success text-success-foreground hover:bg-success/90 glow-success">
                    Finish Practice <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
