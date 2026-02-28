import { useRoute, Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useTests } from "@/hooks/use-tests";
import { useAttempts } from "@/hooks/use-attempts";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  Clock, 
  ChevronRight, 
  BookOpen, 
  School, 
  Building2, 
  Beaker, 
  PenTool,
  RotateCcw,
  BarChart2,
  Lock,
  ShieldCheck,
  X,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

const SUBSECTIONS = [
  { id: 'pyq', title: 'Year Wise PYQs', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'pw', title: 'PW Test Series', icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'allen', title: 'Allen Test Series', icon: Building2, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'akash', title: 'Akash Test Series', icon: School, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'other', title: 'Other Premium Tests', icon: Beaker, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

export function PremiumModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card border border-primary/20 rounded-[2.5rem] p-8 max-w-lg w-full relative shadow-2xl shadow-primary/20"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-3">Premium Feature</h2>
              <p className="text-muted-foreground">This feature is only for premium users. Get verified to unlock full access to all test series and advanced features.</p>
            </div>

            <div className="space-y-4">
              <a href="https://razorpay.me/@sansa" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full py-7 rounded-2xl text-lg font-bold bg-primary hover:shadow-lg hover:shadow-primary/20 transition-all">
                  Pay ₹199 for one month <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="https://razorpay.me/@sansa" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full py-7 rounded-2xl text-lg font-bold bg-accent hover:shadow-lg hover:shadow-accent/20 transition-all">
                  Pay ₹349 for two month <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="https://t.me/Aman_PersonalBot?text=Enquiry_about_GloBalTestSeries" target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full py-7 rounded-2xl text-lg font-bold border-2">
                  Contact Owner <MessageSquare className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Section() {
  const [, params] = useRoute("/section/:type");
  const [, setLocation] = useLocation();
  const { user, signIn, dbUser } = useAuth();
  const type = params?.type || "NEET";
  const [activeSubsection, setActiveSubsection] = useState(SUBSECTIONS[0].title);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const { tests, loading: loadingTests } = useTests(type, activeSubsection);
  const { attempts, loading: loadingAttempts } = useAttempts();

  useEffect(() => {
    async function checkVerification() {
      if (!user) {
        setIsVerified(false);
        return;
      }
      try {
        const res = await apiRequest("GET", "/api/users");
        const users = await res.json();
        const currentUser = users.find((u: any) => u.firebaseUid === user.uid);
        setIsVerified(currentUser?.isVerified || false);
      } catch (err) {
        console.error("Failed to check verification", err);
        setIsVerified(false);
      }
    }
    checkVerification();
  }, [user]);

  const loading = loadingTests || loadingAttempts || isVerified === null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto glass-card p-10 rounded-[2.5rem] border-primary/20">
            <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Please sign in to access the {type} test series and track your progress.
            </p>
            <Button onClick={signIn} size="lg" className="w-full py-7 rounded-2xl text-lg font-bold">
              Sign In with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      
      <div className="container mx-auto px-4 py-8">
        {!isVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center gap-4 text-amber-500"
          >
            <ShieldCheck className="w-8 h-8 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="font-bold text-lg">Account Verification Pending</h3>
              <p className="text-sm opacity-90 font-medium">Your account is currently in limited mode. Please contact admin to get verified for full access to premium features.</p>
            </div>
            <Button onClick={() => setShowPremiumModal(true)} variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 font-bold">
              Get Premium
            </Button>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="text-2xl font-display font-bold mb-6 px-2">{type} Sections</h2>
              <div className="space-y-2">
                {SUBSECTIONS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      if (!isVerified && sub.id !== 'pyq') {
                        setShowPremiumModal(true);
                        return;
                      }
                      setActiveSubsection(sub.title);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                      activeSubsection === sub.title 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    } ${!isVerified && sub.id !== 'pyq' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${activeSubsection === sub.title ? 'bg-white/20' : sub.bg}`}>
                      <sub.icon className={`w-5 h-5 ${activeSubsection === sub.title ? 'text-white' : sub.color}`} />
                    </div>
                    <span className="font-semibold text-left flex-grow">{sub.title}</span>
                    {!isVerified && sub.id !== 'pyq' ? <Lock className="w-4 h-4 opacity-50" /> : (activeSubsection === sub.title && <ChevronRight className="w-4 h-4" />)}
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
                    ? [...testAttempts].sort((a, b) => (b.id || 0) - (a.id || 0))[0]
                    : null;

                  // Limit for unverified users: Only first test in PYQ for both NEET and JEE
                  const canAttempt = isVerified || (activeSubsection === 'Year Wise PYQs' && idx === 0);

                  return (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className={`glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/50 transition-colors ${!canAttempt ? 'opacity-75' : ''}`}>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                              {test.duration} MINS
                            </span>
                            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                              180 QUESTIONS
                            </span>
                            {!canAttempt && (
                              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider">
                                <Lock className="w-3 h-3" /> Premium
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">{test.title}</h3>
                            {dbUser?.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Physics, Chemistry, Biology • +4/-1 Marking
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          {canAttempt ? (
                            lastAttempt ? (
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
                            )
                          ) : (
                            <Button 
                              onClick={() => setShowPremiumModal(true)} 
                              size="lg" 
                              className="w-full sm:w-auto rounded-xl font-semibold bg-muted text-muted-foreground border-dashed border-2 hover:bg-muted/80"
                            >
                              <Lock className="mr-2 w-4 h-4" /> Get Access
                            </Button>
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
