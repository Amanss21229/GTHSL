import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Microscope, Atom, Lock } from "lucide-react";
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
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/5 text-primary text-sm font-bold mb-8 border border-white/10 premium-shadow">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              #1 Platform for NEET & JEE
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-8 tracking-tighter leading-[0.9] text-white">
              Welcome to<br />
              <span className="text-gradient">Neet Jee Global Test Series</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Experience the most realistic computer-based testing platform 
              designed to elevate your preparation for 2026.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-32">
          {/* NEET Card */}
          <div className="group">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-card rounded-[2.5rem] p-10 h-full relative overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-primary/50 group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Microscope size={280} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <Microscope size={36} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">2026 Batch</span>
                </div>
                <h2 className="text-4xl font-display font-black mb-6 text-white group-hover:text-primary transition-colors">TEST SERIES For Neet 2026</h2>
                <p className="text-muted-foreground text-lg mb-10 flex-grow leading-relaxed font-medium">
                  Comprehensive test series covering all subjects with detailed analytics and performance tracking.
                </p>
                
                <div className="space-y-4 mb-10">
                  {["Year Wise Test (Last 10 year PYQs)", "PW Neet Test Series 2026", "Allen Neet Test Series 2026", "Akash Neet Test Series 2026"].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 text-sm font-semibold text-muted-foreground/80">
                      <span>{item}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  ))}
                </div>

                {user ? (
                  <Link href="/section/NEET">
                    <Button className="w-full py-8 rounded-2xl bg-primary text-white font-bold text-lg hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)] transition-all active:scale-[0.98]">
                      Start Preparation <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={signIn}
                    className="w-full py-8 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all active:scale-[0.98] border border-white/10"
                  >
                    <Lock className="mr-2 w-5 h-5" /> Login to Start
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* JEE Card */}
          <div className="group">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="glass-card rounded-[2.5rem] p-10 h-full relative overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-accent/50 group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Atom size={280} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent border border-accent/20">
                    <Atom size={36} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">2026 Batch</span>
                </div>
                <h2 className="text-4xl font-display font-black mb-6 text-white group-hover:text-accent transition-colors">TEST SERIES For Jee 2026</h2>
                <p className="text-muted-foreground text-lg mb-10 flex-grow leading-relaxed font-medium">
                  Comprehensive test series covering all subjects with detailed analytics and performance tracking.
                </p>

                <div className="space-y-4 mb-10">
                  {["Year Wise Test", "PW Jee Test Series 2026", "Allen Jee Test Series 2026", "Other Jee Test Series 2026"].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 text-sm font-semibold text-muted-foreground/80">
                      <span>{item}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  ))}
                </div>

                {user ? (
                  <Link href="/section/JEE">
                    <Button className="w-full py-8 rounded-2xl bg-accent text-white font-bold text-lg hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] transition-all active:scale-[0.98]">
                      Start Preparation <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={signIn}
                    className="w-full py-8 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all active:scale-[0.98] border border-white/10"
                  >
                    <Lock className="mr-2 w-5 h-5" /> Login to Start
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
          {[
            { icon: GraduationCap, title: "Real-time Simulation", desc: "Exact NTA pattern interface to make you exam ready." },
            { icon: Microscope, title: "All India Rank", desc: "Compete with thousands of students across the globe." },
            { icon: Atom, title: "Expert Curated", desc: "Questions designed by top faculties from Kota & Delhi." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-muted-foreground font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto text-center mb-20">
          {[
            { label: "Active Users", value: "500+" },
            { label: "Tests Available", value: "1000+" },
            { label: "Questions Solved", value: "50k+" },
            { label: "Success Rate", value: "92%" },
            { label: "Telegram Community", value: "20k+" },
            { label: "Monthly Reach", value: "1 Lakh+" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-4"
            >
              <h3 className="text-2xl md:text-3xl font-black text-gradient mb-2">{stat.value}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
