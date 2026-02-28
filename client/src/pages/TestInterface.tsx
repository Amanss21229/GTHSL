import { useRoute, useLocation } from "wouter";
import { useTest } from "@/hooks/use-tests";
import { useState, useEffect } from "react";
import Countdown from "react-countdown";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  FileText,
  PenTool,
  X,
  CheckCircle2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useSubmitTest } from "@/hooks/use-attempts";

function OmrSheet({ answers, onAnswer }: { answers: Record<number, number>, onAnswer: (qNum: number, opt: number) => void }) {
  return (
    <div className="flex flex-col gap-0 p-4 overflow-y-auto h-full bg-white/5 rounded-2xl border custom-scrollbar">
      {Array.from({ length: 180 }).map((_, i) => {
        const qNum = i + 1;
        return (
          <div key={qNum} className="flex items-center justify-between py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors group shrink-0">
            <div className="flex items-center gap-3 min-w-[60px]">
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {qNum}.
              </span>
              {answers[qNum] && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            <div className="flex gap-3 justify-end flex-1 max-w-[240px]">
              {[1, 2, 3, 4].map(opt => (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.preventDefault();
                    onAnswer(qNum, opt);
                  }}
                  className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all flex items-center justify-center shadow-sm ${
                    answers[qNum] === opt 
                    ? 'bg-primary border-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' 
                    : 'border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:scale-105 active:scale-95'
                  }`}
                  data-testid={`button-option-${qNum}-${opt}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TestInterface() {
  const [, params] = useRoute("/test/:id");
  const testId = params?.id || "";
  const [, setLocation] = useLocation();
  const { user, dbUser } = useAuth();
  const { test, loading } = useTest(testId);
  const { submitTest } = useSubmitTest();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [pdfPage, setPdfPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOmrMobile, setShowOmrMobile] = useState(false);

  // Auto-scroll prevention: Store scroll position
  useEffect(() => {
    const omrContainer = document.querySelector('.custom-scrollbar');
    if (omrContainer) {
      const handleScroll = () => {
        localStorage.setItem(`test_scroll_${testId}`, omrContainer.scrollTop.toString());
      };
      omrContainer.addEventListener('scroll', handleScroll);
      
      const savedScroll = localStorage.getItem(`test_scroll_${testId}`);
      if (savedScroll) {
        omrContainer.scrollTop = parseInt(savedScroll);
      }
      
      return () => omrContainer.removeEventListener('scroll', handleScroll);
    }
  }, [testId]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Test Environment...</p>
      </div>
    </div>
  );

  if (!test) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <h2 className="text-2xl font-bold">Test Not Found</h2>
      <Button onClick={() => setLocation('/')} variant="outline">Return Home</Button>
    </div>
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      localStorage.removeItem(`test_scroll_${testId}`);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const attemptId = await submitTest(testId, answers, [], timeSpent);
      setLocation(`/result/${attemptId}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setLocation("/");
    }
  };

  const OmrSheet = () => (
    <div className="flex flex-col gap-0 p-4 overflow-y-auto h-full bg-white/5 rounded-2xl border custom-scrollbar">
      {Array.from({ length: 180 }).map((_, i) => {
        const qNum = i + 1;
        return (
          <div key={qNum} className="flex items-center justify-between py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors group shrink-0">
            <div className="flex items-center gap-3 min-w-[60px]">
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {qNum}.
              </span>
              {answers[qNum] && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            <div className="flex gap-3 justify-end flex-1 max-w-[240px]">
              {[1, 2, 3, 4].map(opt => (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.preventDefault();
                    setAnswers(prev => ({ ...prev, [qNum]: opt }));
                  }}
                  className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all flex items-center justify-center shadow-sm ${
                    answers[qNum] === opt 
                    ? 'bg-primary border-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' 
                    : 'border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:scale-105 active:scale-95'
                  }`}
                  data-testid={`button-option-${qNum}-${opt}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
            <h1 className="font-bold text-sm md:text-lg truncate max-w-[150px] md:max-w-xs">{test.title}</h1>
            <span className="hidden md:inline-block text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-md font-bold uppercase tracking-wider">
              {test.section}
            </span>
          </div>
        </div>

          <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2 bg-muted/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-primary/20">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary animate-pulse" />
            <Countdown 
              date={startTime + test.duration * 60 * 1000}
              onComplete={handleSubmit}
              renderer={({ hours, minutes, seconds }) => (
                <span className="font-mono font-bold text-sm md:text-lg tabular-nums">
                  {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
              )}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold">{user?.displayName}</span>
                {dbUser?.isVerified && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Candidate</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="font-bold shadow-lg shadow-destructive/20 active:scale-95 transition-transform">Submit</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Final Submission?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have attempted {Object.keys(answers).length} out of 180 questions.
                    Double check your responses before submitting.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl bg-primary">
                    {isSubmitting ? "Submitting..." : "Yes, Submit Test"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        <main className={`flex-[2] p-2 md:p-4 flex flex-col gap-2 md:gap-4 border-r overflow-hidden transition-all duration-300 ${showOmrMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-grow bg-white/5 rounded-2xl overflow-hidden border relative group shadow-inner">
            {test.pdfUrl ? (
              <div className="w-full h-full flex flex-col bg-white">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <div className="h-full w-full">
                    <Viewer
                      fileUrl={test.pdfUrl}
                      plugins={[defaultLayoutPluginInstance]}
                      initialPage={pdfPage - 1}
                    />
                  </div>
                </Worker>
                <div className="absolute inset-0 pointer-events-none border-4 border-primary/5 rounded-2xl z-10" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Question paper not available</p>
                </div>
              </div>
            )}
            
            <div className="absolute top-4 right-4 md:hidden">
               <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full shadow-lg border bg-background/80 backdrop-blur"
                onClick={() => setShowOmrMobile(true)}
              >
                Open OMR Sheet
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center px-2 py-2 md:py-3 bg-card/50 rounded-2xl border backdrop-blur-sm">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setPdfPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setPdfPage(p => p + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="text-[10px] md:text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full border">
              Tip: Use desktop for best experience
            </div>
          </div>
        </main>

        <aside className={`flex-1 p-3 md:p-4 flex flex-col gap-3 md:gap-4 overflow-hidden bg-background md:bg-transparent transition-all duration-300 ${showOmrMobile ? 'flex absolute inset-0 z-40 md:relative md:flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <PenTool className="w-4 h-4 text-primary" />
              OMR Sheet
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">
                {Object.keys(answers).length}/180
              </span>
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-full"
              onClick={() => setShowOmrMobile(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-grow overflow-hidden">
            <OmrSheet 
              answers={answers} 
              onAnswer={(qNum, opt) => setAnswers(prev => ({ ...prev, [qNum]: opt }))} 
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
