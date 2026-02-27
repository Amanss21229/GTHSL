import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function Results() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Award className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black">My Performance</h1>
          </div>
          
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
        </div>
      </main>
    </div>
  );
}
