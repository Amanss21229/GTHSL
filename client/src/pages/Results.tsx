import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, Clock, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Results() {
  const { user } = useAuth();
  
  const { data: attempts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/attempts", user?.uid],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <Trophy className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-black">My Performance</h1>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : attempts && attempts.length > 0 ? (
            <div className="grid gap-4">
              {attempts.map((attempt) => (
                <Link key={attempt.id} href={`/result/${attempt.id}`}>
                  <Card className="glass-card border-none hover:bg-white/5 transition-all cursor-pointer group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {attempt.testTitle || `Test Attempt #${attempt.id}`}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(attempt.createdAt), "PPP")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-primary">
                            {attempt.score}<span className="text-sm text-muted-foreground font-medium ml-1">/ 720</span>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-none p-12 text-center">
              <CardHeader>
                <CardTitle className="text-2xl font-black">No results found yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Once you complete your tests, your detailed performance analysis and scorecards will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
