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
import { useAdminTests, useTests, Question } from "@/hooks/use-tests";
import { Plus, Trash2, AlertCircle, CheckCircle2, ShieldCheck, FileText, Upload, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createTest, deleteTest } = useAdminTests();
  const { tests: allTests, loading: loadingTestsList } = useTests();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'users' | 'stats' | 'manage'>('tests');

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
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [answerKeyRaw, setAnswerKeyRaw] = useState('');

  const parseAnswerKey = (raw: string) => {
    const key: Record<number, number> = {};
    const lines = raw.split(/[\n,;]/);
    lines.forEach(line => {
      // Improved regex to handle various formats like "1-1", "1 - a", "1:2", etc.
      const match = line.match(/(\d+)\s*[:\-\s]\s*([1-4a-dA-D])/);
      if (match) {
        const qNum = parseInt(match[1]);
        const ans = match[2].toLowerCase();
        const ansMap: Record<string, number> = { 'a': 1, 'b': 2, 'c': 3, 'd': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
        key[qNum] = ansMap[ans];
      }
    });
    return key;
  };

  const handleCreate = async () => {
    if (step !== 'authorized') return;
    setLoading(true);
    try {
      let finalPdfUrl = '';
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        finalPdfUrl = data.url;
      }

      const parsedKey = parseAnswerKey(answerKeyRaw);
      
      await createTest({
        title,
        section,
        subsection,
        duration: parseInt(duration),
        pdfUrl: finalPdfUrl,
        answerKey: parsedKey,
      }, []);
      
      toast({
        title: "Success",
        description: "Test series published successfully!"
      });
      setTitle('');
      setPdfFile(null);
      setAnswerKeyRaw('');
      setSubsection('');
    } finally {
      setLoading(false);
    }
  };

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
              variant={activeTab === 'manage' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('manage')}
            >
              Manage Existing Tests
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Create New Test
              </h2>

              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-end">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-1">Duration (Mins)</Label>
                  <Input 
                    type="number" 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)}
                    className="w-20 h-9 text-center font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">Test Title</Label>
                <Input 
                  placeholder="e.g. NEET Full Syllabus Test 01" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Question Paper (PDF)</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".pdf"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                    className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">Section</Label>
                <Select value={section} onValueChange={(v: any) => setSection(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="JEE">JEE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Category (Subsection)</Label>
                <Select value={subsection} onValueChange={setSubsection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Year Wise PYQs">Year Wise PYQs</SelectItem>
                    <SelectItem value="PW Test Series">PW Test Series</SelectItem>
                    <SelectItem value="Allen Test Series">Allen Test Series</SelectItem>
                    <SelectItem value="Akash Test Series">Akash Test Series</SelectItem>
                    <SelectItem value="Other Premium Tests">Other Premium Tests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-bold">Answer Key (180 Questions)</Label>
                <span className="text-[10px] text-muted-foreground">Format: 1-1, 2-a, 3:3...</span>
              </div>
              <textarea 
                className="w-full h-40 p-4 rounded-xl bg-black/20 border border-white/10 focus:ring-1 ring-primary/50 text-sm font-mono custom-scrollbar"
                placeholder="Paste answer key here. e.g.&#10;1-1&#10;2-4&#10;3-2&#10;4-a..."
                value={answerKeyRaw}
                onChange={e => setAnswerKeyRaw(e.target.value)}
              />
            </div>

            <Button 
              className="w-full py-8 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black text-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
              onClick={handleCreate}
              disabled={loading || !title || !pdfFile || !answerKeyRaw}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Publishing Test...
                </span>
              ) : "Publish Test Series Now"}
            </Button>
          </div>
        ) : activeTab === 'manage' ? (
          <div className="glass-card p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Existing Tests</h3>
            </div>
            
            <div className="space-y-4">
              {loadingTestsList ? (
                <div className="text-center py-10 text-muted-foreground">Loading tests...</div>
              ) : allTests?.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
                  <div className="flex flex-col">
                    <span className="font-bold">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.section} - {t.subsection}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{t.duration} Mins</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full gap-2"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${t.title}"?`)) {
                        await deleteTest(t.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              ))}
              {!loadingTestsList && allTests?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">No tests found.</div>
              )}
            </div>
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

