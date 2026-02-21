import { useAuth } from "@/hooks/use-auth";
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
import { useState } from "react";
import { useAdminTests, Question } from "@/hooks/use-tests";
import { Plus, Trash2, Upload } from "lucide-react";

export default function Admin() {
  const { user, signIn } = useAuth();
  const { createTest } = useAdminTests();
  const [loading, setLoading] = useState(false);

  // Form State
  const [section, setSection] = useState<'NEET' | 'JEE'>('NEET');
  const [subsection, setSubsection] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('180');
  
  // Questions State
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'testId'>[]>([
    { questionNumber: 1, imageUrl: '', correctOption: 1 }
  ]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-bold">Admin Access Required</h2>
        <Button onClick={signIn}>Login as Admin</Button>
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
    setLoading(true);
    try {
      await createTest({
        title,
        section,
        subsection,
        duration: parseInt(duration),
      }, questions);
      // Reset form (simplified)
      setTitle('');
      setQuestions([{ questionNumber: 1, imageUrl: '', correctOption: 1 }]);
    } finally {
      setLoading(false);
    }
  };

  // Note: Image upload is simulated by text input for URL in this demo version
  // In a real app, you'd use Firebase Storage uploadBytes() here.

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="glass-card p-8 rounded-2xl space-y-8">
          
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
                    <Label>Image URL (from Storage)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://..." 
                        value={q.imageUrl}
                        onChange={e => updateQuestion(idx, 'imageUrl', e.target.value)}
                      />
                      <Button size="icon" variant="secondary">
                        <Upload className="w-4 h-4" />
                      </Button>
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
            disabled={loading}
          >
            {loading ? "Creating Test..." : "Publish Test Series"}
          </Button>

        </div>
      </main>
    </div>
  );
}
