import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { LoadingSpinner, EmptyState } from "@/components/shared/StatusComponents";
import { 
  FileText, Target, TrendingUp, History, Clock, 
  BarChart2, AlertCircle, Lightbulb, Trophy 
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LocalScore {
  topic: string;
  score: number;
  total: number;
  difficulty: string;
  date: string;
}

interface TopicStat {
  correct: number;
  wrong: number;
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function Dashboard() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [docCount, setDocCount] = useState(0);
  
  // Local Analytics State
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [topicStats, setTopicStats] = useState<Record<string, TopicStat>>({});
  
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const { count } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id);
          
        if (isMounted) setDocCount(count || 0);

        // Load Local Analytics
        const localScores = JSON.parse(localStorage.getItem("scores") || "[]");
        const localTopicStats = JSON.parse(localStorage.getItem("topicStats") || "{}");
        
        if (isMounted) {
          setScores(localScores);
          setTopicStats(localTopicStats);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { isMounted = false; };
  }, [user]);

  if (!user) {
    return <EmptyState icon={Target} title="Dashboard Unavailable" description="Please sign in." />;
  }

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  // --- Analytics Computed ---
  const totalQuestions = scores.reduce((acc, curr) => acc + curr.total, 0);
  const totalCorrect = scores.reduce((acc, curr) => acc + curr.score, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestScoreObj = scores.reduce((prev, current) => (prev && prev.score > current.score) ? prev : current, null as LocalScore | null);
  const bestScore = bestScoreObj ? bestScoreObj.score : 0;
  const avgScore = scores.length > 0 ? Math.round(totalCorrect / scores.length) : 0;

  // Weak Topics Detection
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.wrong > stats.correct)
    .map(([topic]) => topic);

  // Recommendations
  let recommendation = { text: "Keep practicing! Explore new topics.", action: "Start Learning" };
  if (weakTopics.length > 0) {
    recommendation = { text: `We recommend focusing on your weak area: ${weakTopics[0]}`, action: "Review Topic" };
  } else if (accuracy > 80) {
    recommendation = { text: "You're consistently scoring high! Time to try Hard difficulty.", action: "Level Up" };
  }

  // Chart Data prep
  const chartData = scores.map((s, idx) => ({
    name: `Q${idx + 1}`,
    score: s.score,
    date: new Date(s.date).toLocaleDateString()
  })).slice(-10); // show last 10

  const recentHistory = [...scores].reverse().slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">AI Performance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Analytics driven by your practice history.</p>
      </div>

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-5 glass rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="rounded-xl bg-primary/10 p-2"><Target className="h-4 w-4 text-primary" /></div>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Accuracy</p>
            </div>
            <p className="text-3xl font-bold">{accuracy}%</p>
         </Card>
         <Card className="p-5 glass rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="rounded-xl bg-accent/10 p-2"><BarChart2 className="h-4 w-4 text-accent" /></div>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Average Score</p>
            </div>
            <p className="text-3xl font-bold">{avgScore} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
         </Card>
         <Card className="p-5 glass rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="rounded-xl bg-success/10 p-2"><Trophy className="h-4 w-4 text-success" /></div>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Best Score</p>
            </div>
            <p className="text-3xl font-bold">{bestScore}</p>
         </Card>
         <Card className="p-5 glass rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="rounded-xl bg-muted p-2"><FileText className="h-4 w-4 text-foreground" /></div>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Documents</p>
            </div>
            <p className="text-3xl font-bold">{docCount}</p>
         </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2">
          <Card className="p-6 glass rounded-2xl h-full flex flex-col justify-center">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              Score History
            </h2>
            {chartData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginBottom: "4px" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center opacity-50 text-center">
                <BarChart2 className="h-10 w-10 mb-3" />
                <p className="text-sm">Complete a practice quiz to view your trends.</p>
              </div>
            )}
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <Card className="p-6 glass rounded-2xl border-primary/20 bg-primary/5">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Smart Recommendation
                </h2>
                <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                  <p className="font-medium text-sm leading-relaxed">{recommendation.text}</p>
                  <div className="mt-3 inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg">
                    {recommendation.action}
                  </div>
                </div>
             </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
             <Card className="p-6 glass rounded-2xl">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Focus Areas
                </h2>
                {weakTopics.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {weakTopics.map(t => (
                      <div key={t} className="px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-medium flex justify-between items-center">
                        <span className="truncate">{t}</span>
                        <span className="text-xs bg-destructive text-destructive-foreground px-1.5 rounded-sm">Weak</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-muted/20 border border-dashed rounded-xl">
                    <p className="text-sm text-muted-foreground">No weak areas detected! 🎉</p>
                  </div>
                )}
             </Card>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
         <Card className="p-6 glass rounded-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              Recent Practice
            </h2>
            {recentHistory.length === 0 ? (
               <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No recent practice history.</p>
               </div>
            ) : (
               <div className="space-y-2">
                  {recentHistory.map((entry, i) => (
                     <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/40">
                        <div>
                           <div className="flex items-center gap-2">
                             <p className="font-semibold text-sm">{entry.topic}</p>
                             <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                               {entry.difficulty || "medium"}
                             </span>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                              entry.score >= 4 ? "bg-success/10 text-success" : 
                              entry.score <= 2 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                           }`}>
                              {entry.score} / {entry.total}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </Card>
      </motion.div>
    </div>
  );
}
