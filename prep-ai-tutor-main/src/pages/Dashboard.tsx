import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { LoadingSpinner, EmptyState } from "@/components/shared/StatusComponents";
import { FileText, Target, TrendingUp, History, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/contexts/AppContext";

interface ActivityEntry {
  id: string;
  topic: string;
  score: number;
  created_at: string;
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { practiceStats } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [docCount, setDocCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        // Fetch docs count securely via RLS
        const { count } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id);
          
        if (isMounted) setDocCount(count || 0);

        // Fetch recent practice history
        const { data: history } = await supabase
          .from('practice_history')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (isMounted && history) setRecentActivity(history);
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
    return (
      <EmptyState
        icon={Target}
        title="Dashboard Unavailable"
        description="Please sign in to view your personalized dashboard."
      />
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." className="py-20" />;
  }

  const accuracy = practiceStats.total > 0 
    ? Math.round((practiceStats.correct / practiceStats.total) * 100) 
    : 0;

  const hasActivity = docCount > 0 || practiceStats.total > 0 || recentActivity.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Your Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your learning and practice progress.
        </p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={stagger.item}>
           <Card className="p-5 glass rounded-2xl hover-lift">
              <div className="flex items-center gap-3">
                 <div className="rounded-xl bg-primary/10 p-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                    <p className="text-2xl font-bold">{docCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Documents</p>
                 </div>
              </div>
           </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
           <Card className="p-5 glass rounded-2xl hover-lift">
              <div className="flex items-center gap-3">
                 <div className="rounded-xl bg-accent/10 p-2.5">
                    <Target className="h-5 w-5 text-accent" />
                 </div>
                 <div>
                    <p className="text-2xl font-bold">{practiceStats.total}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Questions Attempted</p>
                 </div>
              </div>
           </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
           <Card className="p-5 glass rounded-2xl hover-lift">
              <div className="flex items-center gap-3">
                 <div className="rounded-xl bg-success/10 p-2.5">
                    <TrendingUp className="h-5 w-5 text-success" />
                 </div>
                 <div>
                    <p className="text-2xl font-bold">{accuracy}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Accuracy</p>
                 </div>
              </div>
           </Card>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={stagger.item}
        initial="hidden"
        animate="show"
      >
         <Card className="p-6 glass rounded-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>

            {!hasActivity ? (
               <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/50">
                 <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                 <p className="text-sm text-muted-foreground font-medium">No activity yet</p>
                 <p className="text-xs text-muted-foreground/80 mt-1">Upload documents or take a practice test to see your history.</p>
               </div>
            ) : recentActivity.length === 0 ? (
               <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No recent practice history.</p>
               </div>
            ) : (
               <div className="space-y-3">
                  {recentActivity.map((entry) => (
                     <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/40">
                        <div>
                           <p className="font-semibold text-sm">{entry.topic}</p>
                           <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <div className="text-right">
                           <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                              Score: {entry.score}
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
