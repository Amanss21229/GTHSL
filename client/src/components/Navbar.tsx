import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, User as UserIcon, LogOut, Award, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user, signIn, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl shadow-2xl shadow-black/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-primary/20">
            N
          </div>
          <span className="font-display font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-accent">
            NEET JEE GLOBAL
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="gap-2 hidden md:flex font-bold hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
              <MessageSquare className="h-4 w-4" />
              Discussion
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 ring-primary/50 transition-all">
                  <Avatar className="h-10 w-10 border-2 border-white/10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black">
                      {user.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 glass-card mt-2 border-white/10" align="end" forceMount>
                <div className="flex items-center justify-start gap-3 p-3 border-b border-white/5">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-bold text-white">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-1">
                  <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-white/5 focus:text-white py-2.5">
                    <UserIcon className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-semibold">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-white/5 focus:text-white py-2.5">
                    <Award className="mr-3 h-4 w-4 text-accent" />
                    <span className="font-semibold">My Results</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2.5 mt-1" onClick={signOut}>
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-semibold">Log out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signIn} className="rounded-2xl px-8 h-12 font-black bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.8)] transition-all active:scale-95">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
