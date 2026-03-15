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
import { Moon, Sun, User as UserIcon, LogOut, Award, MessageSquare, HeadphonesIcon, Send, MessageCircle, CheckCircle2, Calendar, Globe, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export function Navbar() {
  const { user, dbUser, signIn, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'hi'>(localStorage.getItem('lang') as 'en' | 'hi' || 'en');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.location.reload();
  };

  const t = {
    en: { discussion: "Discussion", privateChat: "DMs", support: "Support", signIn: "Sign In", profile: "Profile", results: "My Results", logout: "Log out" },
    hi: { discussion: "चर्चा", privateChat: "DMs", support: "सहायता", signIn: "साइन इन", profile: "प्रोफ़ाइल", results: "मेरे परिणाम", logout: "लॉग आउट" }
  }[lang];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-background/60 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary via-accent to-blue-500 flex items-center justify-center text-white font-black text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] overflow-hidden">
              <span className="relative z-10">N</span>
              <div className="absolute inset-0 bg-white/20 blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-sm" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="font-display font-black text-2xl tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              NEET JEE <span className="text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">GLOBAL</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 pl-0.5">Premium Learning</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="gap-2 flex font-bold hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors h-10 px-3">
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">{t.discussion}</span>
            </Button>
          </Link>

          <Link href="/private-chat">
            <Button variant="ghost" size="sm" className="gap-2 flex font-bold hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors h-10 px-3">
              <Lock className="h-5 w-5" />
              <span className="hidden sm:inline">{t.privateChat}</span>
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLang}
            className="gap-2 font-bold hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors h-10 px-3"
          >
            <Globe className="h-5 w-5" />
            <span className="uppercase text-xs font-black">{lang === 'en' ? 'HI' : 'EN'}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-bold hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors h-10 px-3">
                <HeadphonesIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t.support}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-card mt-2 border-black/5 dark:border-white/10" align="end">
              <a href="https://t.me/Aman_PersonalBot?text=🫠❤️‍🩹" target="_blank" rel="noopener noreferrer">
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  <Send className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="font-semibold">Connect on Telegram</span>
                </DropdownMenuItem>
              </a>
              <a href="https://wa.me/9153021229" target="_blank" rel="noopener noreferrer">
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5">
                  <MessageCircle className="mr-3 h-4 w-4 text-green-500" />
                  <span className="font-semibold">WhatsApp Us</span>
                </DropdownMenuItem>
              </a>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors h-10 w-10"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 ring-primary/50 transition-all p-0">
                  <Avatar className="h-10 w-10 border-2 border-black/10 dark:border-white/10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black">
                      {user.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 glass-card mt-2 border-black/5 dark:border-white/10" align="end" forceMount>
                <div className="flex items-center justify-start gap-3 p-3 border-b border-black/5 dark:border-white/5">
                  <Avatar className="h-10 w-10 border border-black/10 dark:border-white/10">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-foreground dark:text-white">{user.displayName}</p>
                      {dbUser?.isVerified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {dbUser?.createdAt && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70 font-medium">
                        <Calendar className="h-2.5 w-2.5" />
                        Joined {format(new Date(dbUser.createdAt), "MMM yyyy")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-1">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-black/5 dark:focus:bg-white/5 focus:text-foreground dark:focus:text-white py-2.5">
                      <UserIcon className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-semibold">{t.profile}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/results">
                    <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-black/5 dark:focus:bg-white/5 focus:text-foreground dark:focus:text-white py-2.5">
                      <Award className="mr-3 h-4 w-4 text-accent" />
                      <span className="font-semibold">{t.results}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2.5 mt-1" onClick={signOut}>
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-semibold">{t.logout}</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signIn} className="rounded-2xl px-6 md:px-8 h-12 font-black bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.8)] transition-all active:scale-95">
              {t.signIn}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
