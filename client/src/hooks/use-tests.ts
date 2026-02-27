import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  doc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface Test {
  id: string;
  title: string;
  section: 'NEET' | 'JEE';
  subsection: string;
  duration: number; // in minutes
  pdfUrl?: string;
  answerKey?: Record<number, number>;
  createdAt: any;
}

export interface Question {
  id: string;
  testId: string;
  questionNumber: number;
  imageUrl: string;
  correctOption: 1 | 2 | 3 | 4;
}

export function useTests(section?: string, subsection?: string) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'tests'));
    
    if (section) {
      q = query(q, where('section', '==', section));
    }
    
    // Note: Firestore requires composite index for multiple where clauses
    // We filter subsection client-side for simplicity in this demo if needed, 
    // but here we'll assume basic querying.
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let results = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Test));
      
      if (subsection) {
        results = results.filter(t => t.subsection === subsection);
      }
      
      setTests(results);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [section, subsection]);

  return { tests, loading };
}

export function useTest(id: string) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchTest() {
      try {
        const testDoc = await getDoc(doc(db, 'tests', id));
        if (testDoc.exists()) {
          setTest({ id: testDoc.id, ...testDoc.data() } as Test);
          
          // Fetch questions
          const qQuery = query(collection(db, 'questions'), where('testId', '==', id));
          const qDocs = await getDocs(qQuery);
          const qs = qDocs.docs.map(d => ({ id: d.id, ...d.data() } as Question));
          setQuestions(qs.sort((a, b) => a.questionNumber - b.questionNumber));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchTest();
  }, [id]);

  return { test, questions, loading };
}

export function useAdminTests() {
  const { toast } = useToast();
  
  const createTest = async (data: Omit<Test, 'id' | 'createdAt'>, questions: Omit<Question, 'id' | 'testId'>[]) => {
    try {
      // 1. Create Test
      const testRef = await addDoc(collection(db, 'tests'), {
        ...data,
        createdAt: Timestamp.now()
      });
      
      // 2. Add Questions (if any)
      if (questions && questions.length > 0) {
        const promises = questions.map(q => 
          addDoc(collection(db, 'questions'), {
            ...q,
            testId: testRef.id
          })
        );
        await Promise.all(promises);
      }
      
      toast({
        title: "Success",
        description: "Test created successfully",
      });
      return testRef.id;
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create test",
      });
      throw error;
    }
  };

  return { createTest };
}
