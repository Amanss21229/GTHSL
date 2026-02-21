import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Microscope, Atom } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]" />

      <Navbar />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
              #1 Platform for Medical & Engineering Aspirants
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
              Master Your <span className="text-gradient">Future</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience the most advanced test series for NEET & JEE 2026. 
              Real exam simulation, detailed analytics, and AI-driven performance insights.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* NEET Card */}
          <Link href="/section/NEET" className="group">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-3xl p-8 h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Microscope size={200} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Microscope size={32} />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">NEET 2026</h2>
                <p className="text-muted-foreground mb-8 flex-grow">
                  Comprehensive biology, physics, and chemistry test series designed by top medical experts.
                </p>
                <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                  Start Preparation <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* JEE Card */}
          <Link href="/section/JEE" className="group">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-3xl p-8 h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/20 cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Atom size={200} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent">
                  <Atom size={32} />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">JEE 2026</h2>
                <p className="text-muted-foreground mb-8 flex-grow">
                  Advanced engineering entrance test series with complex problem solving and mathematical depth.
                </p>
                <div className="flex items-center text-accent font-semibold group-hover:gap-2 transition-all">
                  Start Preparation <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
          {[
            { label: "Active Users", value: "500+" },
            { label: "Tests Available", value: "1000+" },
            { label: "Questions Solved", value: "50k+" },
            { label: "Success Rate", value: "92%" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-4"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
