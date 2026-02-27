import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAdminTests, Question } from "@/hooks/use-tests";
import { Plus, Trash2, AlertCircle, CheckCircle2, ShieldCheck, FileText, Upload, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createTest } = useAdminTests();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'users' | 'stats'>('tests');
  const [uploadMode, setUploadMode] = useState<'manual' | 'ai'>('manual');

  const { data: adminStats, isLoading: loadingStats } = useQuery<{
    totalUsers: number,
    totalTests: number,
    totalAttempts: number,
    attempts: (any)[]
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: activeTab === 'stats'
  });

  const { data: allUsers, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ uid, isVerified }: { uid: string, isVerified: boolean }) => {
      await apiRequest("PATCH", `/api/users/${uid}/verify`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/verified"] });
      toast({ title: "Success", description: "User verification status updated" });
    }
  });
  
  // Auth State
  const [step, setStep] = useState<'pass1' | 'checking' | 'dashboard_preview' | 'pass2' | 'authorized'>('pass1');
  const [passInput, setPassInput] = useState("");
  
  // Form State
  const [section, setSection] = useState<'NEET' | 'JEE'>('NEET');
  const [subsection, setSubsection] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('180');
  
  // Questions State
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'testId'>[]>([
    { questionNumber: 1, imageUrl: '', correctOption: 1 }
  ]);

  const [questionPdf, setQuestionPdf] = useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  
  const ADMIN_PASS1 = import.meta.env.VITE_ADMIN_PASS1;
  const ADMIN_PASS2 = import.meta.env.VITE_ADMIN_PASS2;

  useEffect(() => {
    if (step === 'dashboard_preview') {
      const timer = setTimeout(() => {
        setStep('pass2');
        setPassInput("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handlePass1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS1) {
      setStep('dashboard_preview');
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect primary password."
      });
      setPassInput("");
    }
  };

  const handlePass2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS2) {
      setStep('authorized');
    } else {
      toast({
        variant: "destructive",
        title: "Security Violation",
        description: "Incorrect final password. Logging out..."
      });
      setTimeout(() => setLocation("/"), 1500);
    }
  };

  if (step === 'pass1') {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 rounded-2xl w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Admin Portal</h2>
            <p className="text-muted-foreground text-sm">Enter primary access password</p>
          </div>
          <form onSubmit={handlePass1Submit} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Primary Password" 
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'pass2') {
    return (
      <div className="h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm fixed inset-0 z-50 p-4">
        <div className="glass-card p-8 rounded-2xl w-full max-w-md space-y-6 border-destructive/50">
          <div className="flex justify-center">
            <div className="bg-destructive/10 p-3 rounded-full">
              <AlertCircle className="w-8 h-8 text-destructive animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-destructive">Error Occurred</h2>
            <p className="text-muted-foreground text-sm">A security check is required. Enter final verification password.</p>
          </div>
          <form onSubmit={handlePass2Submit} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Final Password" 
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="destructive" className="w-full">Verify & Repair</Button>
          </form>
        </div>
      </div>
    );
  }

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev, 
      { questionNumber: prev.length + 1, imageUrl: '', correctOption: 1 }
    ]);
  };

  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], [field]: value };
    setQuestions(newQs);
  };

  const handleCreate = async () => {
    if (step !== 'authorized') return;
    setLoading(true);
    try {
      await createTest({
        title,
        section,
        subsection,
        duration: parseInt(duration),
      }, questions);
      toast({
        title: "Success",
        description: "Test series published successfully!"
      });
      setTitle('');
      setQuestions([{ questionNumber: 1, imageUrl: '', correctOption: 1 }]);
      setQuestionPdf(null);
      setAnswerPdf(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAiExtract = async () => {
    if (!questionPdf || !answerPdf) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload both question paper and answer key PDFs"
      });
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('questionPaper', questionPdf);
      formData.append('answerKey', answerPdf);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const res = await fetch('/api/admin/extract-questions', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Extraction failed" }));
        throw new Error(errorData.message || "Extraction failed");
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions could be extracted. Please check the PDF quality.");
      }
      
      setQuestions(data.questions);
      toast({
        title: "AI Extraction Successful",
        description: `Extracted ${data.questions.length} questions.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: err.name === 'AbortError' ? "Request timed out. Try smaller PDFs." : err.message
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background pb-20 ${step === 'dashboard_preview' ? 'pointer-events-none opacity-80' : ''}`}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'tests' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('tests')}
            >
              Manage Tests
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </Button>
            <Button 
              variant={activeTab === 'stats' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('stats')}
            >
              Stats & Reports
            </Button>
          </div>
          {step === 'dashboard_preview' && (
            <div className="flex items-center gap-2 text-amber-500 animate-pulse bg-amber-500/10 px-3 py-1 rounded-full text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Initializing system...
            </div>
          )}
        </div>
        
        {activeTab === 'tests' ? (
          <div className="glass-card p-8 rounded-2xl space-y-8">
            {/* ... existing tests content ... */}
          </div>
        ) : activeTab === 'users' ? (
          <div className="glass-card p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">User Verification</h3>
            </div>
            
            <div className="space-y-4">
              {loadingUsers ? (
                <div className="text-center py-10 text-muted-foreground">Loading users...</div>
              ) : allUsers?.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold flex items-center gap-1">
                        {u.name}
                        {u.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">UID: {u.firebaseUid}</span>
                    </div>
                  </div>
                  <Button
                    variant={u.isVerified ? "destructive" : "default"}
                    size="sm"
                    className="rounded-full"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ uid: u.firebaseUid, isVerified: !u.isVerified })}
                  >
                    {u.isVerified ? "Remove Verification" : "Verify User"}
                  </Button>
                </div>
              ))}
              {!loadingUsers && allUsers?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">No users found in database.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-2xl border-none">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Users</p>
                <h3 className="text-3xl font-black text-primary">{adminStats?.totalUsers || 0}</h3>
              </div>
              <div className="glass-card p-6 rounded-2xl border-none">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Tests</p>
                <h3 className="text-3xl font-black text-accent">{adminStats?.totalTests || 0}</h3>
              </div>
              <div className="glass-card p-6 rounded-2xl border-none">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Attempts</p>
                <h3 className="text-3xl font-black text-blue-500">{adminStats?.totalAttempts || 0}</h3>
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl border-none overflow-hidden">
              <h3 className="text-xl font-bold mb-6">Recent Test Attempts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground text-sm">
                      <th className="pb-4 font-bold">User</th>
                      <th className="pb-4 font-bold">Test</th>
                      <th className="pb-4 font-bold">Score</th>
                      <th className="pb-4 font-bold">Accuracy</th>
                      <th className="pb-4 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loadingStats ? (
                      <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Loading reports...</td></tr>
                    ) : adminStats?.attempts.map((a, i) => (
                      <tr key={i} className="text-sm group hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{a.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{a.userEmail}</span>
                          </div>
                        </td>
                        <td className="py-4 font-medium">{a.testTitle}</td>
                        <td className="py-4 font-bold text-primary">{a.score}</td>
                        <td className="py-4">
                          {Math.round((a.correctCount / (a.correctCount + a.wrongCount + a.unattemptedCount || 1)) * 100)}%
                        </td>
                        <td className="py-4 text-muted-foreground">{Math.floor(a.timeSpent / 60)}m {a.timeSpent % 60}s</td>
                      </tr>
                    ))}
                    {!loadingStats && adminStats?.attempts.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No attempt data available yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

