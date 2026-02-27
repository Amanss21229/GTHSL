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
  AlertCircle
} from "lucide-react";
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

export default function TestInterface() {
  const [, params] = useRoute("/test/:id");
  const testId = params?.id || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { test, loading } = useTest(testId);
  const { submitTest } = useSubmitTest();

  const [pdfPage, setPdfPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const attemptId = await submitTest(testId, answers, [], timeSpent);
      setLocation(`/result/${attemptId}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const OmrSheet = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 overflow-y-auto h-full bg-white/5 rounded-2xl border">
      {Array.from({ length: 180 }).map((_, i) => {
        const qNum = i + 1;
        return (
          <div key={qNum} className="flex flex-col gap-2 p-2 border-b border-white/5">
            <span className="text-xs font-bold text-muted-foreground">Q{qNum}</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(opt => (
                <button
                  key={opt}
                  onClick={() => setAnswers(prev => ({ ...prev, [qNum]: opt }))}
                  className={`w-8 h-8 rounded-full border-2 text-[10px] font-bold transition-all ${
                    answers[qNum] === opt 
                    ? 'bg-primary border-primary text-white scale-110 shadow-lg' 
                    : 'border-muted-foreground/30 hover:border-primary/50'
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b bg-white dark:bg-black flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg truncate max-w-xs">{test.title}</h1>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-bold">
            {test.section}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border">
            <Clock className="w-4 h-4 text-primary" />
            <Countdown 
              date={startTime + test.duration * 60 * 1000}
              onComplete={handleSubmit}
              renderer={({ hours, minutes, seconds }) => (
                <span className="font-mono font-bold text-lg">
                  {hours}:{minutes}:{seconds}
                </span>
              )}
            />
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Submit Test</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have attempted {Object.keys(answers).length} questions.
                  Once submitted, you cannot change your answers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        <main className="flex-[2] p-4 flex flex-col gap-4 border-r overflow-hidden">
          <div className="flex-grow bg-white/5 rounded-2xl overflow-hidden border">
            {test.pdfUrl ? (
              <iframe 
                src={`${test.pdfUrl}#page=${pdfPage}`} 
                className="w-full h-full border-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No PDF Uploaded
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 p-2 bg-card rounded-xl border">
            <Button variant="outline" onClick={() => setPdfPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous Page
            </Button>
            <Button variant="outline" onClick={() => setPdfPage(p => p + 1)}>
              Next Page <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </main>

        <aside className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
          <h3 className="font-bold flex items-center gap-2">
            Virtual OMR Sheet
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              180 Questions
            </span>
          </h3>
          <OmrSheet />
        </aside>
      </div>
    </div>
  );
}
