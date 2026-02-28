import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Microscope, Atom, Lock, Clock, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, signIn } = useAuth();

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
              The Gold Standard of <br />
              <span className="text-gradient drop-shadow-[0_10px_30px_rgba(139,92,246,0.3)]">Learning Excellence</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 mb-12 leading-relaxed max-w-3xl mx-auto font-semibold italic">
              "Precision in practice, excellence in results. Join the elite league of NEET & JEE aspirants."
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
                <span className="text-foreground">Trusted by 20,000+ Students</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500 text-lg">★</span>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-40">
          {/* NEET Card - Premium Redesign */}
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
              
              <h2 className="text-5xl font-display font-black mb-8 leading-tight">Master NEET <br /><span className="text-primary">Curriculum</span></h2>
              <p className="text-muted-foreground text-lg mb-12 font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                "Experience medical-grade precision in your preparation with our curated test modules."
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-12">
                {["10 Year PYQs", "PW Test Series", "Allen Modules", "Akash Tests"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-all">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-bold opacity-80">{item}</span>
                  </div>
                ))}
              </div>

              {user ? (
                <Link href="/section/NEET">
                  <Button className="w-full py-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(139,92,246,0.5)] transition-all active:scale-95 group-hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.7)]">
                    ENTER ARENA <ArrowRight className="ml-3 w-6 h-6 animate-pulse" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={signIn} className="w-full py-10 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black text-xl border border-white/10 transition-all active:scale-95">
                  <Lock className="mr-3 w-6 h-6" /> UNLOCK ACCESS
                </Button>
              )}
            </div>
          </motion.div>

          {/* JEE Card - Premium Redesign */}
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
              
              <h2 className="text-5xl font-display font-black mb-8 leading-tight">Crush JEE <br /><span className="text-accent">Advanced</span></h2>
              <p className="text-muted-foreground text-lg mb-12 font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                "Engineer your future with mathematical rigor and physics-driven test series."
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-12">
                {["Year Wise JEE", "PW Advanced", "Allen Elite", "Physics Galaxy"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:border-accent/20 transition-all">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm font-bold opacity-80">{item}</span>
                  </div>
                ))}
              </div>

              {user ? (
                <Link href="/section/JEE">
                  <Button className="w-full py-10 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(168,85,247,0.5)] transition-all active:scale-95 group-hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.7)]">
                    START CRUSADE <ArrowRight className="ml-3 w-6 h-6 animate-pulse" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={signIn} className="w-full py-10 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black text-xl border border-white/10 transition-all active:scale-95">
                  <Lock className="mr-3 w-6 h-6" /> UNLOCK ACCESS
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Feature Showcase - Unique Aesthetic Section */}
        <section className="mb-40 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-[4rem] p-16 border-white/10 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <h3 className="text-4xl md:text-5xl font-display font-black mb-16 tracking-tight">Why Elite Aspirants Choose Us?</h3>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: GraduationCap, title: "NTA Mirroring", desc: "Experience the exact testing environment used by NTA to build muscle memory." },
                { icon: Clock, title: "Nano-Analytics", desc: "Get feedback down to the millisecond spent on each question and concept." },
                { icon: Send, title: "Global Nexus", desc: "Connect with the brightest minds across India in our high-speed global chat." }
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary transition-all duration-500 group-hover:text-white">
                    <f.icon size={32} />
                  </div>
                  <h4 className="text-2xl font-black mb-4">{f.title}</h4>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Stats Grid - Premium Paid Look */}
        <div className="max-w-7xl mx-auto px-6 py-20 rounded-[4rem] bg-foreground/5 dark:bg-white/5 backdrop-blur-3xl border border-white/5 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 text-center">
            {[
              { label: "Elite Members", value: "20k+" },
              { label: "Daily Tests", value: "1500+" },
              { label: "Concepts Mastered", value: "1M+" },
              { label: "Expert Support", value: "24/7" },
              { label: "Selection Rate", value: "12X" },
              { label: "Community", value: "VIP" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-4xl font-black text-gradient mb-3 relative z-10">{stat.value}</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] relative z-10 opacity-70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
