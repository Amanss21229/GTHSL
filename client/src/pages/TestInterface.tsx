import { useRoute, useLocation } from "wouter";
import { useTest } from "@/hooks/use-tests";
import { useState, useEffect } from "react";
import Countdown from "react-countdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Clock, 
  AlertCircle,
  Menu
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function TestInterface() {
  const [, params] = useRoute("/test/:id");
  const testId = params?.id || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { test, questions, loading } = useTest(testId);
  const { submitTest } = useSubmitTest();

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
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

  if (!test || !questions.length) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <h2 className="text-2xl font-bold">Test Not Found</h2>
      <Button onClick={() => setLocation('/')} variant="outline">Return Home</Button>
    </div>
  );

  const currentQ = questions[currentQIndex];

  const handleOptionSelect = (optIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.questionNumber]: optIndex
    }));
  };

  const toggleReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentQ.questionNumber)) next.delete(currentQ.questionNumber);
      else next.add(currentQ.questionNumber);
      return next;
    });
  };

  const clearResponse = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.questionNumber];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // seconds
      const attemptId = await submitTest(testId, answers, questions, timeSpent);
      setLocation(`/result/${attemptId}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const QuestionPalette = () => (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((q, idx) => {
        const isAnswered = answers[q.questionNumber] !== undefined;
        const isMarked = markedForReview.has(q.questionNumber);
        const isCurrent = idx === currentQIndex;
        
        let bgClass = "bg-muted text-muted-foreground";
        if (isCurrent) bgClass = "ring-2 ring-primary ring-offset-2";
        if (isMarked) bgClass = "bg-purple-500 text-white";
        else if (isAnswered) bgClass = "bg-green-500 text-white";
        else if (isCurrent) bgClass = "bg-primary text-white"; // current but not answered

        return (
          <button
            key={q.id}
            onClick={() => setCurrentQIndex(idx)}
            className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${bgClass}`}
          >
            {q.questionNumber}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-white dark:bg-black flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg hidden md:block truncate max-w-xs">{test.title}</h1>
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
              <Button variant="destructive" className="hidden md:flex">Submit Test</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have attempted {Object.keys(answers).length} out of {questions.length} questions.
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
          
          {/* Mobile Menu for Palette */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="mt-6">
                <h3 className="font-bold mb-4">Question Palette</h3>
                <QuestionPalette />
                <Button className="w-full mt-8" variant="destructive" onClick={handleSubmit}>
                  Submit Test
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-medium text-muted-foreground">
                Question {currentQIndex + 1} of {questions.length}
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded font-semibold">+4 Correct</span>
                <span className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded font-semibold">-1 Wrong</span>
              </div>
            </div>

            {/* Question Content */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 flex-grow overflow-y-auto">
               {/* Image container with strict height limit and object-contain to prevent overflow */}
               <div className="w-full h-[400px] flex items-center justify-center bg-white/50 rounded-xl mb-6 border-2 border-dashed border-muted-foreground/10 overflow-hidden">
                  {currentQ.imageUrl ? (
                    <img 
                      src={currentQ.imageUrl} 
                      alt={`Question ${currentQ.questionNumber}`} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-muted-foreground">Question Image Placeholder</div>
                  )}
               </div>

               {/* Options */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[1, 2, 3, 4].map((opt) => (
                   <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      answers[currentQ.questionNumber] === opt
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                   >
                     <span className="font-bold mr-2 text-muted-foreground">Option {opt}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQIndex(p => Math.max(0, p - 1))}
                  disabled={currentQIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQIndex(p => Math.min(questions.length - 1, p + 1))}
                  disabled={currentQIndex === questions.length - 1}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="secondary"
                  className={markedForReview.has(currentQ.questionNumber) ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : ""}
                  onClick={toggleReview}
                >
                  <Flag className="w-4 h-4 mr-2" /> 
                  {markedForReview.has(currentQ.questionNumber) ? "Unmark" : "Mark for Review"}
                </Button>
                <Button variant="ghost" className="text-muted-foreground" onClick={clearResponse}>
                  Clear Response
                </Button>
              </div>
            </div>

          </div>
        </main>

        {/* Desktop Sidebar Palette */}
        <aside className="w-80 border-l bg-card hidden md:flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-bold">Question Palette</h3>
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div> Answered</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-500"></div> Marked</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted"></div> Unvisited</div>
            </div>
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            <QuestionPalette />
          </div>
        </aside>
      </div>
    </div>
  );
}
