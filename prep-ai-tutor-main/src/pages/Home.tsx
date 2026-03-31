import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, MessageSquare, GraduationCap, Brain, ArrowRight, Sparkles, FolderOpen } from "lucide-react";

const POPULAR_EXAMS = ["TCS NQT", "GATE CS", "CAT", "JEE Main", "NEET", "UPSC"];

const features = [
  { icon: BookOpen, title: "MCQ Practice", description: "AI-generated questions tailored to your exam", href: "/practice", color: "from-primary/20 to-primary/5" },
  { icon: MessageSquare, title: "Chat with AI", description: "Ask doubts and get instant explanations", href: "/chat", color: "from-accent/20 to-accent/5" },
  { icon: GraduationCap, title: "Teach Mode", description: "Deep explanations on any topic", href: "/teach", color: "from-primary/15 to-accent/10" },
  { icon: Brain, title: "Learn Mode", description: "Structured syllabus-based learning", href: "/learn", color: "from-accent/15 to-primary/10" },
  { icon: FolderOpen, title: "Knowledge Base", description: "Upload notes & ask from your documents", href: "/knowledge", color: "from-primary/10 to-accent/15" },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function HomePage() {
  const { selectedExam, setSelectedExam, examHistory } = useAppContext();
  const [examInput, setExamInput] = useState(selectedExam);
  const navigate = useNavigate();

  const handleSelect = (exam: string) => {
    setExamInput(exam);
    setSelectedExam(exam);
  };

  const handleContinue = () => {
    if (examInput.trim()) {
      setSelectedExam(examInput.trim());
      navigate("/practice");
    }
  };

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl space-y-8 sm:space-y-10"
    >
      {/* Hero */}
      <motion.div variants={stagger.item} className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground mb-2">
          <Sparkles className="h-3 w-3 text-primary" />
          AI-Powered Exam Prep
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          Welcome to{" "}
          <span className="text-gradient">PrepMind AI</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Practice MCQs, chat with AI, learn structured topics, and build your own knowledge base.
        </p>
      </motion.div>

      {/* Exam Selector */}
      <motion.div variants={stagger.item}>
        <Card className="p-5 sm:p-6 glass hover-lift rounded-2xl space-y-4">
          <h2 className="text-base sm:text-lg font-semibold">Select your exam</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="e.g., GATE CS, TCS NQT, CAT..."
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="flex-1 bg-muted/30 border-border/40"
            />
            <Button onClick={handleContinue} disabled={!examInput.trim()} className="btn-glow whitespace-nowrap">
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_EXAMS.map((exam) => (
              <Button
                key={exam}
                variant={examInput === exam ? "default" : "secondary"}
                size="sm"
                onClick={() => handleSelect(exam)}
                className={`rounded-xl transition-all duration-200 ${
                  examInput === exam ? "glow-primary" : "hover:scale-105"
                }`}
              >
                {exam}
              </Button>
            ))}
          </div>

          {examHistory.length > 0 && (
            <div className="pt-3 border-t border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {examHistory.slice(0, 5).map((exam) => (
                  <Button
                    key={exam}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelect(exam)}
                    className="text-xs rounded-lg h-7"
                  >
                    {exam}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {features.map((feature) => (
          <motion.div key={feature.title} variants={stagger.item}>
            <Card
              className="p-5 glass hover-lift cursor-pointer rounded-2xl group relative overflow-hidden"
              onClick={() => navigate(feature.href)}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10 flex items-start gap-4">
                <div className="rounded-xl bg-muted/50 p-2.5 group-hover:bg-primary/10 transition-all duration-300 group-hover:scale-110">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
