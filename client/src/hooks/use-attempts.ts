import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  answers: Record<number, number>; // questionId -> option
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  timeSpent: number;
  createdAt: any;
}

export function useAttempts() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchAttempts() {
      const q = query(collection(db, 'attempts'), where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Attempt));
      setAttempts(results);
      setLoading(false);
    }

    fetchAttempts();
  }, []);

  return { attempts, loading };
}

export function useAttempt(id: string) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      try {
        const docRef = doc(db, 'attempts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAttempt({ id: docSnap.id, ...docSnap.data() } as Attempt);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  return { attempt, loading };
}

export function useSubmitTest() {
  const { toast } = useToast();
  
  const submitTest = async (testId: string, answers: Record<number, number>, questions: any[], timeSpent: number) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    questions.forEach(q => {
      const userAnswer = answers[q.questionNumber];
      if (!userAnswer) {
        unattempted++;
      } else if (userAnswer === q.correctOption) {
        correct++;
        score += 4;
      } else {
        wrong++;
        score -= 1;
      }
    });

    const attemptData = {
      userId: user.uid,
      testId,
      answers,
      score,
      correctCount: correct,
      wrongCount: wrong,
      unattemptedCount: unattempted,
      timeSpent,
      createdAt: Timestamp.now()
    };

    try {
      const ref = await addDoc(collection(db, 'attempts'), attemptData);
      return ref.id;
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit test",
      });
      throw e;
    }
  };

  return { submitTest };
}
