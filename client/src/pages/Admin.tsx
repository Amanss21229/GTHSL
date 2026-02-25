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
  const [activeTab, setActiveTab] = useState<'tests' | 'users'>('tests');
  const [uploadMode, setUploadMode] = useState<'manual' | 'ai'>('manual');

  const { data: allUsers, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [questionPdf, setQuestionPdf] = useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  
  // ... rest of state ...

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

      const res = await fetch('/api/admin/extract-questions', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Extraction failed");

      const data = await res.json();
      setQuestions(data.questions);
      toast({
        title: "AI Extraction Successful",
        description: `Extracted ${data.questions.length} questions.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: err.message
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
            <div className="flex gap-4 p-1 bg-muted rounded-lg w-fit">
              <Button 
                variant={uploadMode === 'manual' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setUploadMode('manual')}
              >
                Manual Entry
              </Button>
              <Button 
                variant={uploadMode === 'ai' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setUploadMode('ai')}
              >
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                AI PDF Import
              </Button>
            </div>

            {uploadMode === 'ai' && (
              <div className="grid md:grid-cols-2 gap-6 p-6 border-2 border-dashed rounded-2xl bg-primary/5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Question Paper PDF
                  </Label>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setQuestionPdf(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Answer Key PDF
                  </Label>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setAnswerPdf(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  className="md:col-span-2" 
                  onClick={handleAiExtract}
                  disabled={extracting || !questionPdf || !answerPdf}
                >
                  {extracting ? "Analyzing PDFs with AI..." : "Start AI Extraction"}
                </Button>
              </div>
            )}
            {/* ... rest of test management code ... */}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Main Section</Label>
              <Select value={section} onValueChange={(v: any) => setSection(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEET">NEET 2026</SelectItem>
                  <SelectItem value="JEE">JEE 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subsection</Label>
              <Select value={subsection} onValueChange={setSubsection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
            <Label>Test Title</Label>
            <Input 
              placeholder="e.g. Full Syllabus Mock Test 1" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration (Minutes)</Label>
            <Input 
              type="number" 
              value={duration} 
              onChange={e => setDuration(e.target.value)}
            />
          </div>

          <div className="h-px bg-border my-6" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Questions</h3>
              <Button onClick={handleAddQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="p-4 border rounded-xl bg-card/50 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="font-bold">Q{q.questionNumber}</span>
                   {questions.length > 1 && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="text-destructive"
                       onClick={() => {
                         const newQs = questions.filter((_, i) => i !== idx);
                         setQuestions(newQs.map((item, i) => ({ ...item, questionNumber: i + 1 })));
                       }}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Image</Label>
                    <div className="flex gap-2">
                      {q.imageUrl ? (
                        <div className="relative w-full h-20 border rounded-lg overflow-hidden bg-muted">
                          <img src={q.imageUrl} alt="Question" className="w-full h-full object-contain" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => updateQuestion(idx, 'imageUrl', '')}
                          >
                            <Plus className="w-3 h-3 rotate-45" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              try {
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                });
                                const data = await res.json();
                                updateQuestion(idx, 'imageUrl', data.url);
                              } catch (err) {
                                console.error("Upload failed", err);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Option</Label>
                    <Select 
                      value={String(q.correctOption)} 
                      onValueChange={v => updateQuestion(idx, 'correctOption', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                        <SelectItem value="2">Option 2</SelectItem>
                        <SelectItem value="3">Option 3</SelectItem>
                        <SelectItem value="4">Option 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCreate} 
            disabled={loading || step !== 'authorized'}
          >
            {loading ? "Creating Test..." : step === 'authorized' ? "Publish Test Series" : "Unlock to Publish"}
          </Button>
        </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}

