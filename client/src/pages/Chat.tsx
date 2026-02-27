import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Trash2, Smile, CheckCircle2, Shield, Info, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: verifiedUsers } = useQuery<string[]>({
    queryKey: ["/api/users/verified"],
  });

  const isUserVerified = (uid: string) => {
    return verifiedUsers?.includes(uid);
  };

  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    // Presence logic
    if (!user) return;
    
    const presenceRef = doc(collection(db, "presence"), user.uid);
    const setOnline = async () => {
      try {
        await addDoc(collection(db, "presence"), {
          uid: user.uid,
          lastSeen: serverTimestamp()
        });
      } catch (e) {
        console.error("Presence error:", e);
      }
    };

    // For simplicity in this environment, we'll just count documents in a presence collection
    // that were updated recently. Real-world would use onDisconnect.
    const qPresence = query(collection(db, "presence"));
    const unsubscribePresence = onSnapshot(qPresence, (snapshot) => {
      setOnlineCount(Math.max(1, snapshot.size));
    });

    setOnline();

    return () => {
      unsubscribePresence();
    };
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: (doc.data() as any).createdAt?.toDate() || new Date()
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messageData: any = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL,
        content: newMessage,
        createdAt: serverTimestamp(),
        isVerified: isUserVerified(user.uid),
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id || "",
          content: replyingTo.content || "",
          userName: replyingTo.userName || "Anonymous",
          imageUrl: replyingTo.imageUrl || null
        };
      }

      console.log("Sending text message:", messageData);
      await addDoc(collection(db, "global_chat"), messageData);
      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Only image files are allowed", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const messageData: any = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL,
        content: "[Image]",
        imageUrl: url,
        createdAt: serverTimestamp(),
        isVerified: isUserVerified(user.uid),
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id || "",
          content: replyingTo.content || "",
          userName: replyingTo.userName || "Anonymous",
          imageUrl: replyingTo.imageUrl || null
        };
      }

      console.log("Sending image message:", messageData);
      await addDoc(collection(db, "global_chat"), messageData);
      setReplyingTo(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "global_chat", id));
      toast({ title: "Success", description: "Message deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    }
  };

  const reportMessage = async (msg: any) => {
    try {
      await addDoc(collection(db, "reports"), {
        messageId: msg.id,
        content: msg.content,
        reportedUserId: msg.userId,
        reporterUserId: user?.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Reported", description: "Message has been reported for review" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to report message" });
    }
  };

  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Navbar />
        <div className="flex items-center justify-center p-4 mt-20">
          <Card className="w-full max-w-md glass-card rounded-3xl border-primary/20 premium-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display font-bold">Secure Discussion</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">Join our global community of NEET & JEE aspirants. Share doubts, resources, and grow together.</p>
              <Button onClick={() => window.location.reload()} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white">
                Sign In to Join
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-secondary/30 dark:from-background dark:to-black/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto p-2 md:p-6 overflow-hidden flex flex-col max-w-6xl">
        <Card className="flex-1 flex flex-col overflow-hidden glass-card rounded-[2rem] border-primary/10 premium-shadow relative">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

          {/* Chat Header */}
          <header className="px-6 py-4 border-b bg-background/40 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  N
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background ring-1 ring-green-500/20" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg md:text-xl leading-tight tracking-tight">
                  NEET JEE GLOBAL <span className="text-primary/60 font-medium ml-1">Live</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{onlineCount} Users Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full md:flex hidden hover:bg-primary/5">
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </header>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-background/20 relative">
            <ScrollArea ref={scrollRef} className="flex-1 h-full px-4 md:px-8">
              <div className="space-y-6 py-6 max-w-4xl mx-auto">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, index) => {
                    const isOwn = msg.userId === user?.uid;
                    const showName = index === 0 || messages[index-1].userId !== msg.userId;
                    
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isOwn && (
                            <div className="flex flex-col justify-end pb-1">
                              <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-background shadow-md">
                                <AvatarImage src={msg.userPhoto} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{msg.userName[0]}</AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {showName && (
                              <div className="flex items-center gap-1.5 mb-1.5 px-2">
                                <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wide uppercase">
                                  {isOwn ? 'You' : msg.userName}
                                </span>
                                {(msg.isVerified || isUserVerified(msg.userId)) && (
                                  <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-500/10" />
                                )}
                              </div>
                            )}
                            
                            <div className={`relative group/msg px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
                              isOwn 
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-[4px] premium-shadow hover:shadow-primary/20' 
                                : 'bg-background/80 dark:bg-black/40 backdrop-blur-md border border-primary/5 rounded-tl-[4px] hover:border-primary/20'
                            }`}>
                              {msg.replyTo && (
                                <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 ${
                                  isOwn ? 'bg-white/10 border-white/40' : 'bg-primary/5 border-primary/40'
                                }`}>
                                  <p className="font-bold opacity-70">{msg.replyTo.userName}</p>
                                  <p className="truncate opacity-60">{msg.replyTo.content}</p>
                                </div>
                              )}
                              {msg.imageUrl ? (
                                <div className="space-y-2">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="upload" 
                                    className="max-w-full rounded-xl cursor-zoom-in hover:opacity-95 transition-opacity border border-white/10" 
                                    onClick={() => window.open(msg.imageUrl, '_blank')}
                                  />
                                </div>
                              ) : (
                                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              )}
                              
                              <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[9px] opacity-60 font-medium ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {msg.createdAt instanceof Date ? msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>

                              <div className={`absolute top-0 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-40 p-1" align={isOwn ? "end" : "start"}>
                                    <div className="flex flex-col gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="justify-start text-xs h-8" 
                                        onClick={() => {
                                          setReplyingTo(msg);
                                          document.querySelector<HTMLInputElement>('[data-testid="input-chat-message"]')?.focus();
                                        }}
                                      >
                                        Reply
                                      </Button>
                                      {isOwn ? (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                          onClick={() => deleteMessage(msg.id)}
                                        >
                                          Delete
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start text-xs h-8 text-orange-500 hover:text-orange-500 hover:bg-orange-50"
                                          onClick={() => reportMessage(msg)}
                                        >
                                          Report
                                        </Button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Input Section */}
            <div className="p-4 md:p-6 border-t bg-background/60 backdrop-blur-xl z-10">
              {replyingTo && (
                <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between bg-primary/5 p-2 rounded-xl border border-primary/10">
                  <div className="flex flex-col text-xs overflow-hidden">
                    <span className="font-bold text-primary">Replying to {replyingTo.userName}</span>
                    <span className="truncate opacity-70">{replyingTo.content}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyingTo(null)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 items-center max-w-4xl mx-auto bg-background/80 dark:bg-black/40 p-1.5 md:p-2 rounded-3xl border border-primary/10 shadow-lg focus-within:ring-2 ring-primary/20 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                
                <div className="flex gap-1 md:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-image"
                  >
                    <ImageIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90"
                        data-testid="button-emoji"
                      >
                        <Smile className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden" side="top" align="start">
                      <Picker 
                        data={data} 
                        onEmojiSelect={addEmoji} 
                        theme="light" 
                        previewPosition="none"
                        skinTonePosition="none"
                        perLine={8}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-base h-10 md:h-12"
                  data-testid="input-chat-message"
                />

                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || uploading} 
                  className="shrink-0 rounded-2xl h-10 md:h-12 px-4 md:px-6 bg-gradient-to-br from-primary to-primary/80 hover:shadow-primary/30 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-white"
                  data-testid="button-send-chat"
                >
                  <Send className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline font-bold">Send</span>
                </Button>
              </form>
              <p className="text-[10px] text-center mt-3 text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40">
                End-to-End Community Support
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
