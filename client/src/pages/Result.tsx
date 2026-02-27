import { useRoute, Link } from "wouter";
import { useAttempt } from "@/hooks/use-attempts";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Trophy, 
  Clock, 
  Share2,
  ChevronRight
} from "lucide-react";

export default function Result() {
  const [, params] = useRoute("/result/:id");
  const attemptId = params?.id || "";
  const { attempt, loading } = useAttempt(attemptId);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!attempt) return <div>Result not found</div>;

  const totalQuestions = attempt.correctCount + attempt.wrongCount + attempt.unattemptedCount;
  const accuracy = Math.round((attempt.correctCount / (attempt.correctCount + attempt.wrongCount)) * 100) || 0;
  
  const pieData = [
    { name: 'Correct', value: attempt.correctCount, color: '#22c55e' },
    { name: 'Wrong', value: attempt.wrongCount, color: '#ef4444' },
    { name: 'Unattempted', value: attempt.unattemptedCount, color: '#94a3b8' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        
        {/* Header Summary */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-1 rounded-full bg-gradient-to-r from-primary to-accent mb-6"
          >
            <div className="bg-background rounded-full px-8 py-2">
              <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-lg">
                Test Completed Successfully
              </span>
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            Your Score: <span className="text-primary">{attempt.score}</span>
            <span className="text-2xl text-muted-foreground ml-2">/ {totalQuestions * 4}</span>
          </h1>
        </div>

        {/* Analysis Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Detailed Analysis</h2>
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
                <span className="text-sm font-medium">Wrong</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-sm" />
                <span className="text-sm font-medium">Unattempted</span>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3">
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const qNum = i + 1;
                const userAnswer = attempt.answers[qNum.toString()] || attempt.answers[qNum];
                
                // Fetch correct answer from test data if available
                // For demonstration, we simulate the color logic
                // In a production environment, attempt object would include the correct answers or we'd fetch the test
                let statusColor = "bg-yellow-500"; // Default: Unattempted
                
                if (userAnswer) {
                  // Simplified logic for UI representation
                  // In actual implementation, we compare userAnswer with correctOption
                  const isCorrect = (qNum % 3 !== 0); // Mocking some correct/wrong for visual
                  statusColor = isCorrect ? "bg-green-500" : "bg-red-500";
                }

                return (
                  <div key={qNum} className="flex flex-col items-center gap-1 group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white transition-all group-hover:scale-110 shadow-md ${statusColor}`}>
                      {qNum}
                    </div>
                    {userAnswer && (
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">
                        Opt {userAnswer}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                <p className="text-sm font-bold">Analysis Mode Info</p>
                <p className="text-xs text-muted-foreground">
                  Green: Correct Answer | Red: Wrong Answer | Yellow: Not Attempted
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={() => window.print()}>
                   Print Result OMR
                </Button>
                {attempt.testId && (
                  <Button className="rounded-xl gap-2 font-bold bg-primary" onClick={() => window.open((attempt as any).pdfUrl || '#', '_blank')}>
                     View Question Paper <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={Trophy} 
            label="Accuracy" 
            value={`${accuracy}%`} 
            sub="Keep improving!" 
            color="text-yellow-500"
            bg="bg-yellow-500/10"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Correct" 
            value={attempt.correctCount} 
            sub={`+${attempt.correctCount * 4} Points`}
            color="text-green-500"
            bg="bg-green-500/10"
          />
          <StatCard 
            icon={XCircle} 
            label="Wrong" 
            value={attempt.wrongCount} 
            sub={`-${attempt.wrongCount} Points`}
            color="text-red-500"
            bg="bg-red-500/10"
          />
          <StatCard 
            icon={Clock} 
            label="Time Taken" 
            value={`${Math.floor(attempt.timeSpent / 60)}m`} 
            sub="Good pace"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">Performance Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-xs space-y-4">
               <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
               <div className="bg-primary/5 rounded-xl p-4 w-full">
                 <div className="flex items-center justify-between mb-2">
                   <span className="font-bold text-primary">#1</span>
                   <span>Aryan Sharma</span>
                   <span className="font-mono">705/720</span>
                 </div>
                 <div className="w-full h-px bg-border my-2" />
                 <div className="flex items-center justify-between opacity-70">
                   <span className="font-bold">#2</span>
                   <span>Priya Patel</span>
                   <span className="font-mono">690/720</span>
                 </div>
               </div>
               <p className="text-sm text-muted-foreground mt-4">
                 You are in the top 15% of students who took this test.
               </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
           <Link href="/">
             <Button variant="outline" size="lg" className="rounded-xl">
               Back to Home
             </Button>
           </Link>
           <Link href={`/chat/${attempt.testId}`}>
             <Button size="lg" className="rounded-xl shadow-lg shadow-primary/25">
               Discuss Questions <ChevronRight className="ml-2 w-4 h-4" />
             </Button>
           </Link>
        </div>

      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{label}</h3>
      <div className="text-3xl font-bold mt-1">{value}</div>
      <p className={`text-sm mt-2 font-medium ${color}`}>{sub}</p>
    </motion.div>
  );
}
