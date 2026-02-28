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
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from "lucide-react";
import { Worker, Viewer, ToolbarProps, ToolbarSlot } from '@react-pdf-viewer/core';
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
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary">{qNum}.</span>
              {answers[qNum] && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            <div className="flex gap-3 justify-end flex-1 max-w-[240px]">
              {[1, 2, 3, 4].map(opt => (
                <button
                  key={opt}
                  onClick={(e) => { e.preventDefault(); onAnswer(qNum, opt); }}
                  className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all flex items-center justify-center ${
                    answers[qNum] === opt ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'border-muted-foreground/30 hover:border-primary/50 bg-background/50'
                  }`}
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

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOmrMobile, setShowOmrMobile] = useState(false);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    renderToolbar: (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
      <Toolbar>
        {(slot: ToolbarSlot) => {
          const { ZoomIn: PdfZoomIn, ZoomOut: PdfZoomOut, Zoom, EnterFullScreen } = slot;
          return (
            <div className="flex items-center w-full justify-between px-4 py-2 bg-background/80 backdrop-blur border-b">
              <div className="flex items-center gap-2">
                <PdfZoomOut>
                  {(props) => (
                    <Button variant="ghost" size="icon" onClick={props.onClick} className="rounded-full h-8 w-8">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  )}
                </PdfZoomOut>
                <Zoom>
                  {(props) => <span className="text-xs font-bold w-12 text-center">{Math.round(props.scale * 100)}%</span>}
                </Zoom>
                <PdfZoomIn>
                  {(props) => (
                    <Button variant="ghost" size="icon" onClick={props.onClick} className="rounded-full h-8 w-8">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  )}
                </PdfZoomIn>
              </div>
              <div className="flex items-center gap-2">
                <EnterFullScreen>
                  {(props) => (
                    <Button variant="ghost" size="icon" onClick={props.onClick} className="rounded-full h-8 w-8">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </EnterFullScreen>
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!test) return <div className="h-screen flex flex-col items-center justify-center gap-4"><AlertCircle className="w-12 h-12 text-destructive" /><Button onClick={() => setLocation('/')}>Return Home</Button></div>;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const attemptId = await submitTest(testId, answers, [], timeSpent);
      setLocation(`/result/${attemptId}`);
    } catch (e) {
      setIsSubmitting(false);
      setLocation("/");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="md:hidden"><ChevronLeft className="w-5 h-5" /></Button>
          <h1 className="font-bold truncate max-w-xs">{test.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-primary/20">
            <Clock className="w-4 h-4 text-primary" />
            <Countdown date={startTime + test.duration * 60 * 1000} onComplete={handleSubmit} renderer={({ hours, minutes, seconds }) => (
              <span className="font-mono font-bold">{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
            )} />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">Submit</Button>
        </div>
      </header>
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        <main className={`flex-[2] p-2 md:p-4 flex flex-col gap-4 border-r overflow-hidden transition-all duration-300 ${showOmrMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-grow bg-white/5 rounded-2xl overflow-hidden border relative">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <div className="h-full w-full flex flex-col overflow-hidden">
                <Viewer fileUrl={test.pdfUrl} plugins={[defaultLayoutPluginInstance]} theme={{ theme: 'light' }} />
              </div>
            </Worker>
          </div>
        </main>
        <aside className={`flex-1 p-4 flex flex-col gap-4 overflow-hidden ${showOmrMobile ? 'flex absolute inset-0 z-40 md:relative' : 'hidden md:flex'}`}>
          <h3 className="font-bold flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" /> OMR Sheet</h3>
          <div className="flex-grow overflow-hidden">
            <OmrSheet answers={answers} onAnswer={(qNum, opt) => setAnswers(prev => ({ ...prev, [qNum]: opt }))} />
          </div>
        </aside>
      </div>
    </div>
  );
}
