import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useTests } from "@/hooks/use-tests";
import { useAttempts } from "@/hooks/use-attempts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ChevronRight, 
  BookOpen, 
  School, 
  Building2, 
  Beaker, 
  PenTool,
  RotateCcw,
  BarChart2
} from "lucide-react";
import { useState } from "react";

const SUBSECTIONS = [
  { id: 'pyq', title: 'Year Wise PYQs', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'pw', title: 'PW Test Series', icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'allen', title: 'Allen Test Series', icon: Building2, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'akash', title: 'Akash Test Series', icon: School, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'other', title: 'Other Premium Tests', icon: Beaker, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

export default function Section() {
  const [, params] = useRoute("/section/:type");
  const type = params?.type || "NEET";
  const [activeSubsection, setActiveSubsection] = useState(SUBSECTIONS[0].title);
  
  const { tests, loading: loadingTests } = useTests(type, activeSubsection);
  const { attempts, loading: loadingAttempts } = useAttempts();

  const loading = loadingTests || loadingAttempts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="text-2xl font-display font-bold mb-6 px-2">{type} Sections</h2>
              <div className="space-y-2">
                {SUBSECTIONS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubsection(sub.title)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                      activeSubsection === sub.title 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeSubsection === sub.title ? 'bg-white/20' : sub.bg}`}>
                      <sub.icon className={`w-5 h-5 ${activeSubsection === sub.title ? 'text-white' : sub.color}`} />
                    </div>
                    <span className="font-semibold text-left flex-grow">{sub.title}</span>
                    {activeSubsection === sub.title && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">{activeSubsection}</h1>
              <p className="text-muted-foreground">Select a test to begin your assessment.</p>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Tests Found</h3>
                <p className="text-muted-foreground">Check back later for new tests in this section.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tests.map((test, idx) => {
                  const testAttempts = attempts.filter(a => a.testId === test.id);
                  const lastAttempt = testAttempts.length > 0 
                    ? testAttempts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)[0]
                    : null;

                  return (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                              {test.duration} MINS
                            </span>
                            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                              180 QUESTIONS
                            </span>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{test.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Physics, Chemistry, Biology • +4/-1 Marking
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          {lastAttempt ? (
                            <>
                              <Link href={`/result/${lastAttempt.id}`}>
                                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl font-semibold border-primary text-primary hover:bg-primary/5">
                                  <BarChart2 className="mr-2 w-4 h-4" /> View Result
                                </Button>
                              </Link>
                              <Link href={`/test/${test.id}`}>
                                <Button size="lg" className="w-full sm:w-auto rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30">
                                  <RotateCcw className="mr-2 w-4 h-4" /> Reattempt Test
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Link href={`/test/${test.id}`}>
                              <Button size="lg" className="w-full sm:w-auto rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30">
                                Attempt Test <ChevronRight className="ml-2 w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
