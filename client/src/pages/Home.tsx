import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Microscope, Atom, Lock, Clock, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, signIn } = useAuth();
  const lang = localStorage.getItem('lang') || 'en';

  const t = {
    en: {
      hero: "The Gold Standard of Learning Excellence",
      sub: "\"Precision in practice, excellence in results. Join the elite league of NEET & JEE aspirants.\"",
      trusted: "Trusted by 20,000+ Students",
      neet: "Master NEET Curriculum",
      jee: "Crush JEE Advanced",
      enter: "ENTER ARENA",
      start: "START CRUSADE",
      unlock: "UNLOCK ACCESS"
    },
    hi: {
      hero: "सीखने की उत्कृष्टता का स्वर्ण मानक",
      sub: "\"अभ्यास में सटीकता, परिणामों में उत्कृष्टता। NEET और JEE उम्मीदवारों की विशिष्ट लीग में शामिल हों।\"",
      trusted: "20,000+ छात्रों द्वारा भरोसेमंद",
      neet: "NEET पाठ्यक्रम में महारत हासिल करें",
      jee: "JEE एडवांस्ड को क्रश करें",
      enter: "मैदान में प्रवेश करें",
      start: "धर्मयुद्ध शुरू करें",
      unlock: "पहुंच अनलॉक करें"
    }
  }[lang as 'en' | 'hi'];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="hero-glow -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full" />
      <div className="hero-glow top-[20%] -right-[10%] w-[40%] h-[40%] bg-accent/10 rounded-full" />
      <div className="hero-glow -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full" />

      <Navbar />

      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-24 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full -z-10" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-primary/10 text-primary text-xs font-black mb-10 border border-primary/20 backdrop-blur-md uppercase tracking-[0.2em] animate-bounce-subtle">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,1)]" />
              Empowering Future Leaders
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black mb-10 tracking-tighter leading-[0.85] text-foreground dark:text-white">
              {t.hero.split('Excellence')[0]} <br />
              <span className="text-gradient drop-shadow-[0_10px_30px_rgba(139,92,246,0.3)]">{lang === 'hi' ? t.hero : 'Excellence'}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 mb-12 leading-relaxed max-w-3xl mx-auto font-semibold italic">
              {t.sub}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-background bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xl relative z-10">
                  +20k
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <span className="text-foreground">{t.trusted}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500 text-lg">★</span>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-40">
          {/* NEET Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative glass-card rounded-[3rem] p-12 h-full border-white/10 premium-shadow overflow-hidden transition-all duration-500 hover:-translate-y-4">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors" />
              
              <div className="flex items-center justify-between mb-12">
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-primary/40 group-hover:rotate-6 transition-transform">
                  <Microscope size={42} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Elite Batch</span>
                  <span className="text-xs font-bold bg-white/5 py-1.5 px-4 rounded-full border border-white/10 backdrop-blur-md">NEET 2026</span>
                </div>
              </div>
              
              <h2 className="text-5xl font-display font-black mb-8 leading-tight">{t.neet.split('Curriculum')[0]} <br /><span className="text-primary">{lang === 'hi' ? '' : 'Curriculum'}</span></h2>
              
              {user ? (
                <Link href="/section/NEET">
                  <Button className="w-full py-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(139,92,246,0.5)] transition-all active:scale-95 group-hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.7)]">
                    {t.enter} <ArrowRight className="ml-3 w-6 h-6 animate-pulse" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={signIn} className="w-full py-10 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black text-xl border border-white/10 transition-all active:scale-95">
                  <Lock className="mr-3 w-6 h-6" /> {t.unlock}
                </Button>
              )}
            </div>
          </motion.div>

          {/* JEE Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative glass-card rounded-[3rem] p-12 h-full border-white/10 premium-shadow overflow-hidden transition-all duration-500 hover:-translate-y-4">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/20 transition-colors" />
              
              <div className="flex items-center justify-between mb-12">
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white shadow-2xl shadow-accent/40 group-hover:-rotate-6 transition-transform">
                  <Atom size={42} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-1">Pro Series</span>
                  <span className="text-xs font-bold bg-white/5 py-1.5 px-4 rounded-full border border-white/10 backdrop-blur-md">JEE 2026</span>
                </div>
              </div>
              
              <h2 className="text-5xl font-display font-black mb-8 leading-tight">{t.jee.split('Advanced')[0]} <br /><span className="text-accent">{lang === 'hi' ? '' : 'Advanced'}</span></h2>
              
              {user ? (
                <Link href="/section/JEE">
                  <Button className="w-full py-10 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(168,85,247,0.5)] transition-all active:scale-95 group-hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.7)]">
                    {t.start} <ArrowRight className="ml-3 w-6 h-6 animate-pulse" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={signIn} className="w-full py-10 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black text-xl border border-white/10 transition-all active:scale-95">
                  <Lock className="mr-3 w-6 h-6" /> {t.unlock}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
