import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/shared/StatusComponents";
import { teachTopic, type TeachResponse } from "@/services/api";
import { useAppContext } from "@/contexts/AppContext";
import { Brain, ChevronRight, ChevronDown, BookOpen, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SYLLABUS = [
  {
    category: "Cybersecurity",
    topics: ["AI & ML in Cybersecurity", "Cloud-native Security", "Blockchain Security", "Incident Response"],
  },
  {
    category: "Data Structures",
    topics: ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Hash Tables", "Stacks & Queues"],
  },
  {
    category: "Algorithms",
    topics: ["Sorting & Searching", "Dynamic Programming", "Greedy Algorithms", "Graph Algorithms"],
  },
  {
    category: "Networking",
    topics: ["OSI Model", "TCP/IP", "DNS & DHCP", "Firewalls & VPNs"],
  },
];

export default function LearnPage() {
  const { selectedExam, completedTopics, toggleTopicComplete } = useAppContext();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<TeachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTopicClick = async (topic: string) => {
    if (activeTopic === topic) {
      setActiveTopic(null);
      setTopicData(null);
      return;
    }
    setActiveTopic(topic);
    setTopicData(null);
    setLoading(true);
    setError("");
    try {
      const data = await teachTopic({ topic, exam: selectedExam || undefined });
      setTopicData(data);
    } catch {
      setError("Backend not connected yet. Feature coming soon.");
    } finally {
      setLoading(false);
    }
  };

  const totalTopics = SYLLABUS.reduce((a, c) => a + c.topics.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Learn Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">Structured syllabus-based learning</p>
        </div>
        <Badge variant="secondary" className="rounded-lg self-start sm:self-auto">
          {completedTopics.size}/{totalTopics} completed
        </Badge>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: `${totalTopics > 0 ? (completedTopics.size / totalTopics) * 100 : 0}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-3 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-2">
          {SYLLABUS.map((group) => (
            <Collapsible key={group.category} defaultOpen>
              <Card className="glass rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
                  <span className="font-semibold text-sm">{group.category}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-0.5">
                    {group.topics.map((topic) => (
                      <motion.button
                        key={topic}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTopicClick(topic)}
                        className={`w-full text-left text-sm px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-200 ${
                          activeTopic === topic
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {completedTopics.has(topic) ? (
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${
                            activeTopic === topic ? "rotate-90 text-primary" : ""
                          }`} />
                        )}
                        <span className="truncate">{topic}</span>
                      </motion.button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!activeTopic && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl bg-muted/30 p-6 border-gradient mb-4">
                <Brain className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-medium">Select a topic</p>
              <p className="text-sm text-muted-foreground mt-1">Choose from the syllabus to start learning</p>
            </div>
          )}

          {activeTopic && loading && <LoadingSpinner text="Loading topic..." />}
          {activeTopic && error && (
            <Card className="p-5 glass rounded-2xl text-center">
              <p className="text-sm text-muted-foreground">⚠️ {error}</p>
            </Card>
          )}

          {activeTopic && topicData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <Card className="p-5 sm:p-6 glass rounded-2xl">
                <h2 className="text-xl font-bold mb-4 text-gradient">{activeTopic}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {topicData.explanation}
                </p>
              </Card>

              {topicData.keyPoints.length > 0 && (
                <Card className="p-5 sm:p-6 glass rounded-2xl hover-lift">
                  <h3 className="font-semibold mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {topicData.keyPoints.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-3 items-start">
                        <span className="flex-shrink-0 h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-mono text-primary font-semibold">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{p}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {topicData.examples.length > 0 && (
                <Card className="p-5 sm:p-6 glass rounded-2xl hover-lift">
                  <h3 className="font-semibold mb-3">Examples</h3>
                  {topicData.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl bg-muted/50 p-4 text-sm font-mono mb-2 border border-border/30">
                      {ex}
                    </div>
                  ))}
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => toggleTopicComplete(activeTopic)}
                  variant={completedTopics.has(activeTopic) ? "secondary" : "default"}
                  className="btn-glow rounded-xl"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {completedTopics.has(activeTopic) ? "Completed ✓" : "Mark Complete"}
                </Button>
                <Button variant="secondary" onClick={() => navigate("/practice")} className="rounded-xl hover:scale-105 transition-transform">
                  <BookOpen className="mr-2 h-4 w-4" /> Practice
                </Button>
                <Button variant="secondary" onClick={() => navigate("/chat")} className="rounded-xl hover:scale-105 transition-transform">
                  <MessageSquare className="mr-2 h-4 w-4" /> Ask AI
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
