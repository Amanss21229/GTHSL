import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react";

export default function Profile() {
  const { user, dbUser } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto glass-card border-none premium-shadow overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-blue-500" />
          <CardHeader className="text-center pt-12">
            <div className="relative inline-block mx-auto mb-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                  {user.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {dbUser?.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-xl">
                  <CheckCircle2 className="h-8 w-8 text-blue-500 fill-blue-500/10" />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-4xl font-black tracking-tight">{user.displayName}</CardTitle>
              {dbUser?.isVerified && (
                <CheckCircle2 className="h-6 w-6 text-blue-500 fill-blue-500/10" />
              )}
            </div>
            <p className="text-muted-foreground font-medium text-lg">{user.email}</p>
            
            <div className="flex justify-center mt-4">
              {dbUser?.isVerified ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-bold animate-pulse">
                  <ShieldCheck className="h-4 w-4" />
                  VERIFIED ELITE USER
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-sm font-bold">
                  <ShieldAlert className="h-4 w-4" />
                  STANDARD ACCOUNT
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-12">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mb-2">Account Type</p>
                <p className="text-2xl font-black text-primary">{dbUser?.isVerified ? "Premium Elite" : "Standard Student"}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors">
                <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mb-2">Member Rank</p>
                <p className="text-2xl font-black text-accent">#1204</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
