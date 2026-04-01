import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, UserProfile, getWeakTopics } from "@/lib/profileStore";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/StatusComponents";
import { Target, TrendingUp, Lightbulb, AlertCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      setProfile(getUserProfile());
    }
  }, [user]);

  if (!user) {
    return <EmptyState icon={Target} title="Dashboard Unavailable" description="Please sign in to view analytics." />;
  }

  if (!profile) return null;

  // 1. Chart Data Prep
  const chartData = profile.history.map((s, idx) => ({
    name: `Q${idx + 1}`,
    score: s.score,
    date: new Date(s.date).toLocaleDateString()
  })).slice(-10);

  // 2. Weak Topics Engine
  const weakTopics = getWeakTopics(profile);

  // 3. Today's Plan Generator
  let todaysPlan: { topic: string, difficulty: string }[] = [];
  if (Object.keys(profile.topics || {}).length === 0) {
     todaysPlan = [{ topic: "Computer Science Basics", difficulty: "easy" }];
  } else if (weakTopics.length > 0) {
     todaysPlan = weakTopics.slice(0, 2).map(t => ({ topic: t, difficulty: profile.difficulty }));
  } else {
     const strong = Object.keys(profile.topics || {}).filter(t => !weakTopics.includes(t));
     if (strong.length > 0) {
        todaysPlan = strong.slice(0, 2).map(t => ({ topic: t, difficulty: "hard" }));
     }
  }

  // 4. Recommendation Engine
  const totalCorrect = profile.history.reduce((a, b) => a + b.score, 0);
  const totalQs = profile.history.reduce((a, b) => a + b.total, 0);
  const acc = totalQs > 0 ? (totalCorrect / totalQs) * 100 : 0;
  
  let rec = "Complete your first quiz to generate insights!";
  if (weakTopics.length > 0) rec = `You should focus on reviewing ${weakTopics[0]} immediately.`;
  else if (acc > 80) rec = "You're consistently scoring high! Keep pushing on Hard mode.";
  else if (profile.history.length > 0) rec = "Solid progress! Review your recent mistakes to level up.";

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">AI Performance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Adaptive insights tracking your performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Today's Plan */}
         <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 glass rounded-2xl h-full line-clamp-none border-primary/20">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                 <Calendar className="h-5 w-5 text-primary" />
                 Today's Plan
               </h2>
               <div className="space-y-3">
                 {todaysPlan.map((plan, i) => (
                    <div key={i} className="flex justify-between items-center bg-muted/30 border border-border/50 p-3 rounded-xl">
                      <span className="font-semibold text-sm">{plan.topic}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-secondary text-secondary-foreground">
                        {plan.difficulty}
                      </span>
                    </div>
                 ))}
               </div>
            </Card>
         </motion.div>

         {/* Recommendation Base */}
         <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 glass rounded-2xl h-full border-accent/20">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                 <Lightbulb className="h-5 w-5 text-accent" />
                 Smart Recommendation
               </h2>
               <div className="bg-background/50 rounded-xl p-4 border border-border/50 h-[80%] flex flex-col justify-center">
                 <p className="font-medium text-sm leading-relaxed text-center">{rec}</p>
               </div>
            </Card>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend */}
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
                <Target className="h-10 w-10 mb-3" />
                <p className="text-sm">Complete a practice quiz to view your trends.</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Weak Topics */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
           <Card className="p-6 glass rounded-2xl h-full">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Weak Topics
              </h2>
              {weakTopics.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {weakTopics.map(t => (
                    <div key={t} className="px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-medium flex justify-between items-center">
                      <span className="truncate">{t}</span>
                      <span className="text-xs font-bold uppercase">Focus</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center bg-muted/20 border border-dashed rounded-xl h-[80%] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground w-full">No weak areas detected! 🎉</p>
                </div>
              )}
           </Card>
        </motion.div>
      </div>
    </div>
  );
}
