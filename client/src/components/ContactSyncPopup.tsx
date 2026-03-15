import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, X, Smartphone, Lock, CheckCircle2 } from "lucide-react";

interface Contact {
  name: string;
  phone: string;
}

const STORAGE_KEY = "contact_sync_status";

export function useContactSyncStatus() {
  const status = localStorage.getItem(STORAGE_KEY);
  return {
    isAllowed: status === "allowed",
    isDenied: status === "denied",
    isAsked: status !== null,
  };
}

export function ContactSyncPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"prompt" | "loading" | "done" | "denied" | "unsupported">("prompt");

  useEffect(() => {
    if (!user) return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const isContactsSupported = () => "contacts" in navigator && "ContactsManager" in window;

  const handleAllow = async () => {
    if (!user) return;
    setLoading(true);
    setStep("loading");

    if (!isContactsSupported()) {
      localStorage.setItem(STORAGE_KEY, "allowed_no_api");
      await setDoc(doc(db, "userContacts", user.uid), {
        uid: user.uid,
        synced: true,
        apiSupported: false,
        contacts: [],
        syncedAt: serverTimestamp(),
      });
      setStep("done");
      setLoading(false);
      return;
    }

    try {
      const contacts = await (navigator as any).contacts.select(["name", "tel"], { multiple: true });
      const parsed: Contact[] = [];
      for (const c of contacts) {
        const name = (c.name?.[0] || "Unknown").toString().trim();
        const phones: string[] = c.tel || [];
        for (const phone of phones) {
          const cleaned = phone.replace(/\D/g, "");
          if (cleaned.length >= 7) {
            parsed.push({ name, phone: cleaned });
          }
        }
      }

      await setDoc(doc(db, "userContacts", user.uid), {
        uid: user.uid,
        synced: true,
        apiSupported: true,
        contacts: parsed,
        contactCount: parsed.length,
        syncedAt: serverTimestamp(),
      });

      localStorage.setItem(STORAGE_KEY, "allowed");
      setStep("done");
    } catch (err: any) {
      if (err?.name === "SecurityError" || err?.message?.includes("cancelled")) {
        handleDeny();
      } else {
        localStorage.setItem(STORAGE_KEY, "allowed_no_api");
        await setDoc(doc(db, "userContacts", user.uid), {
          uid: user.uid,
          synced: true,
          apiSupported: false,
          contacts: [],
          syncedAt: serverTimestamp(),
        });
        setStep("done");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setStep("denied");
    setTimeout(() => setOpen(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== "loading") setOpen(false); }}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        {step === "prompt" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                  <Smartphone className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            <DialogHeader className="text-center space-y-2 mb-4">
              <DialogTitle className="text-xl font-bold">Find Friends on NEET JEE Global</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Allow contact access to see which of your contacts are already using the app and start private one-to-one chats with them.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mb-5">
              {[
                { icon: <Users className="w-4 h-4 text-primary" />, text: "See which contacts use the app" },
                { icon: <Lock className="w-4 h-4 text-green-500" />, text: "Your data is private and secure" },
                { icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />, text: "Required for private one-to-one chat" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5">
                  {item.icon}
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAllow}
                disabled={loading}
                className="w-full rounded-2xl h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                data-testid="button-allow-contacts"
              >
                Allow Contact Access
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeny}
                className="w-full rounded-2xl h-10 text-sm text-muted-foreground hover:text-foreground"
                data-testid="button-deny-contacts"
              >
                Not Now
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-3">
              You can change this anytime in your profile settings.
            </p>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-base font-medium">Syncing your contacts...</p>
            <p className="text-sm text-muted-foreground text-center">Please select your contacts in the popup</p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-base font-semibold">Contacts Synced!</p>
            <p className="text-sm text-muted-foreground text-center">Private chat is now unlocked. You can start chatting with friends.</p>
            <Button onClick={() => setOpen(false)} className="rounded-2xl px-6">
              Start Chatting
            </Button>
          </motion.div>
        )}

        {step === "denied" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-muted-foreground">Contact access denied</p>
            <p className="text-sm text-muted-foreground text-center">You can enable it from your profile later to unlock private chats.</p>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
