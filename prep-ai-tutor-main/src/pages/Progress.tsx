import { Card } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { Target, TrendingUp, Clock, BookOpen, CheckCircle, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function ProgressPage() {
  const { practiceStats, completedTopics, documents } = useAppContext();
  const accuracy = practiceStats.total > 0 ? Math.round((practiceStats.correct / practiceStats.total) * 100) : 0;

  const stats = [
    { icon: Target, value: String(practiceStats.total), label: "Questions Attempted" },
    { icon: TrendingUp, value: `${accuracy}%`, label: "Accuracy" },
    { icon: BookOpen, value: String(practiceStats.sessions), label: "Practice Sessions" },
    { icon: CheckCircle, value: String(completedTopics.size), label: "Topics Completed" },
    { icon: FolderOpen, value: String(documents.length), label: "Documents Uploaded" },
    { icon: Clock, value: `${practiceStats.sessions * 3}m`, label: "Est. Time Spent" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={stagger.item}>
            <Card className="p-5 glass rounded-2xl hover-lift">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {practiceStats.total === 0 && completedTopics.size === 0 && (
        <Card className="p-8 glass rounded-2xl text-center">
          <p className="text-muted-foreground text-sm">Start practicing MCQs or learning topics to see your progress here.</p>
        </Card>
      )}
    </div>
  );
}
