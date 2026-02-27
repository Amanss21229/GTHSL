import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto glass-card border-none">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/10">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl font-black">{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-black">{user.displayName}</CardTitle>
            <p className="text-muted-foreground">{user.email}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Account Status</p>
                <p className="text-xl font-black text-primary">Active</p>
              </div>
              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Member Since</p>
                <p className="text-xl font-black text-accent">2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
