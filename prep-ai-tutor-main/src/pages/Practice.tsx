import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState } from "@/components/shared/StatusComponents";
import { generateMCQs, type MCQQuestion } from "@/services/api";
import { BookOpen, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticePage() {
  const { selectedExam, updatePracticeStats } = useAppContext();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQ = questions[currentIndex];

  const handleGenerate = async () => {
    if (!selectedExam) return;
    setLoading(true);
    setError("");
    try {
      const data = await generateMCQs({ exam: selectedExam, count: 5 });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setRevealed(false);
      setScore({ correct: 0, total: 0 });
    } catch {
      setError("Backend not connected yet. Feature coming soon.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !currentQ) return;
    setRevealed(true);
    const isCorrect = selectedAnswer === currentQ.correctIndex;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  };

  const handleFinish = () => {
    updatePracticeStats(score.correct, score.total);
    handleGenerate();
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">MCQ Practice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exam: <Badge variant="secondary" className="rounded-lg">{selectedExam}</Badge>
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="btn-glow self-start sm:self-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          {questions.length ? "New Set" : "Generate"}
        </Button>
      </div>

      {loading && <LoadingSpinner text="Generating questions..." />}
      {error && (
        <Card className="p-5 glass rounded-2xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">⚠️ {error}</p>
          <Button variant="secondary" size="sm" onClick={handleGenerate} className="rounded-xl">
            Try Again
          </Button>
        </Card>
      )}

      {!loading && !error && questions.length === 0 && (
        <EmptyState icon={BookOpen} title="Ready to practice?" description="Click Generate to get AI-powered MCQs." />
      )}

      {currentQ && !loading && (
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
                <Badge variant="secondary" className="rounded-lg">
                  Score: {score.correct}/{score.total}
                </Badge>
              </div>

              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
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
                  let classes = "glass rounded-xl border-border/40";

                  if (revealed) {
                    if (isCorrect) classes = "bg-success/10 border-success/30 rounded-xl";
                    else if (isSelected) classes = "bg-destructive/10 border-destructive/30 rounded-xl";
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
                      <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-mono font-semibold text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm flex-1">{option}</span>
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
                  className="rounded-xl glass p-4 border-gradient"
                >
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Explanation</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
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
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
                {revealed && currentIndex === questions.length - 1 && (
                  <Button onClick={handleFinish} className="btn-glow rounded-xl">
                    New Set <RotateCcw className="ml-1.5 h-4 w-4" />
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
