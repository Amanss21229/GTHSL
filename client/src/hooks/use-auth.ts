import { useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { User as DbUser } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { data: dbUser, refetch: refetchDbUser } = useQuery<DbUser>({
    queryKey: ["/api/users", user?.uid],
    enabled: !!user,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync with PostgreSQL
        try {
          await apiRequest("POST", "/api/users", {
            firebaseUid: u.uid,
            name: u.displayName || "Anonymous",
            email: u.email || "",
            role: "student"
          });
          refetchDbUser();
        } catch (err) {
          console.error("Failed to sync user with PostgreSQL", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [refetchDbUser]);

  const signIn = async () => {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration Missing",
        description: "Firebase credentials are not set in environment variables. Please check the README or replit.md for setup instructions.",
      });
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save user to Firestore
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'student'
        });
      }
      
      toast({
        title: "Welcome back!",
        description: `Signed in as ${user.displayName}`,
      });
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Failed to sign in";
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-in is not enabled in your Firebase Console.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized in your Firebase Console.";
      }

      toast({
        variant: "destructive",
        title: "Sign-in Blocked",
        description: errorMessage,
      });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "Come back soon!",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return { user, dbUser, loading, signIn, signOut };
}
