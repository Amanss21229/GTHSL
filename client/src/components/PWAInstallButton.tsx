import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Apple } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("pwa_install_dismissed") === "true"
  );

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone || dismissed) return;

    if (isIOS) {
      setShowButton(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowButton(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed, isIOS, isStandalone]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowButton(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (isStandalone || installed || (!showButton && !showIOSGuide)) return null;

  return (
    <>
      <AnimatePresence>
        {showButton && !showIOSGuide && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
          >
            <div className="relative bg-background/95 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-2xl shadow-black/20 p-4 flex items-center gap-3">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-dismiss-install"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                {isIOS ? (
                  <Apple className="w-6 h-6 text-white" />
                ) : (
                  <Smartphone className="w-6 h-6 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <p className="font-bold text-sm">Install NEET JEE Global</p>
                <p className="text-xs text-muted-foreground">
                  {isIOS ? "Add to Home Screen for app experience" : "Get the app for faster access"}
                </p>
              </div>

              <Button
                onClick={handleInstall}
                size="sm"
                className="rounded-2xl shrink-0 h-9 px-4 bg-primary hover:bg-primary/90 font-bold text-xs gap-1.5"
                data-testid="button-install-pwa"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-background rounded-3xl p-6 shadow-2xl border border-border/40 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-lg">Install on iPhone/iPad</p>
                <button onClick={() => setShowIOSGuide(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { step: "1", text: 'Tap the Share button at the bottom of your browser (the square with an arrow)' },
                  { step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
                  { step: "3", text: 'Tap "Add" in the top right corner' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-muted-foreground">
                  After adding, the app will appear on your Home Screen like any native app.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
