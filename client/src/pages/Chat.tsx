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
  doc,
  updateDoc,
  setDoc,
  where
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
  const [chatBg, setChatBg] = useState<string | null>(localStorage.getItem("chat_bg"));
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track online presence
  useEffect(() => {
    if (!user) return;
    const presenceRef = doc(db, "presence", user.uid);
    const setOnline = async () => {
      try {
        await setDoc(presenceRef, {
          uid: user.uid,
          lastSeen: serverTimestamp(),
        });
      } catch (e) { console.error(e); }
    };
    setOnline();
    const interval = setInterval(setOnline, 30000); // Update every 30s
    
    // Cleanup on disconnect is tricky with web, usually handled by functions or heartbeats
    // For now, we'll just query recently active users
    return () => clearInterval(interval);
  }, [user]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!storage) throw new Error("Firebase Storage is not initialized.");
      const storageRef = ref(storage, `backgrounds/${user.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setChatBg(url);
      localStorage.setItem("chat_bg", url);
      toast({ title: "Success", description: "Chat background updated" });
    } catch (error: any) {
      console.error("Background upload error:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const qPresence = query(
      collection(db, "presence"),
      where("lastSeen", ">", new Date(Date.now() - 60000)) // Active in last minute
    );
    const unsubscribePresence = onSnapshot(qPresence, (snapshot) => {
      setOnlineCount(snapshot.size);
    });
    return () => unsubscribePresence();
  }, []);

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
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const msgRef = doc(db, "global_chat", messageId);
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const currentReactions = msg.reactions || {};
      const usersWhoReacted = currentReactions[emoji] || [];
      
      let newUsers;
      if (usersWhoReacted.includes(user.uid)) {
        newUsers = usersWhoReacted.filter((uid: string) => uid !== user.uid);
      } else {
        newUsers = [...usersWhoReacted, user.uid];
      }

      const newReactions = { ...currentReactions, [emoji]: newUsers };
      if (newUsers.length === 0) {
        delete newReactions[emoji];
      }

      await updateDoc(msgRef, { reactions: newReactions });
    } catch (error: any) {
      console.error("Reaction error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const isOwner = user.email === import.meta.env.VITE_ADMIN_MAIL;
      const messageData: any = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userPhoto: user.photoURL || null,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
        isVerified: !!verifiedUsers?.includes(user.uid),
        role: isOwner ? 'owner' : (user.role || 'student'),
        reactions: {}
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          content: replyingTo.content,
          userName: replyingTo.userName,
          userId: replyingTo.userId,
          imageUrl: replyingTo.imageUrl || null
        };
        
        // Mention notification for the person being replied to
        if (replyingTo.userId !== user.uid) {
          messageData.mention = replyingTo.userId;
        }
      }

      await addDoc(collection(db, "global_chat"), messageData);
      setNewMessage("");
      setReplyingTo(null);
    } catch (error: any) {
      toast({ title: "Send Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat/${user.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const messageData: any = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userPhoto: user.photoURL,
        content: newMessage.trim() || "[Image]",
        imageUrl: url,
        createdAt: serverTimestamp(),
        isVerified: !!verifiedUsers?.includes(user.uid),
        role: user.email === import.meta.env.VITE_ADMIN_MAIL ? 'owner' : (user.role || 'student'),
        reactions: {}
      };

      await addDoc(collection(db, "global_chat"), messageData);
      setReplyingTo(null);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
  };

  const handleTriggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center p-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Secure Discussion</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">Join our global community.</p>
              <Button onClick={() => window.location.reload()} className="w-full">Sign In to Join</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-2 md:p-6 overflow-hidden flex flex-col max-w-6xl">
        <Card className="flex-1 flex flex-col overflow-hidden glass-card rounded-[2.5rem] border-primary/10 premium-shadow relative">
          <header className="px-8 py-5 border-b bg-background/60 backdrop-blur-xl flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl">N</div>
              <div>
                <h2 className="font-display font-black text-xl">NEET JEE <span className="text-primary">GLOBAL</span></h2>
                <span className="text-xs text-green-500 font-bold">{onlineCount} Online</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="file" className="hidden" id="chat-bg-input" accept="image/*" onChange={handleBgUpload} />
              <Button variant="ghost" size="icon" onClick={() => document.getElementById('chat-bg-input')?.click()}>
                <ImageIcon className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </header>

          <CardContent 
            className="flex-1 flex flex-col p-0 overflow-hidden relative"
            style={{ 
              backgroundImage: chatBg ? `url(${chatBg})` : 'none', 
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 pointer-events-none" />
            <ScrollArea ref={scrollRef} className="flex-1 h-full px-4 md:px-8 relative z-0">
              <div className="space-y-2 py-6 max-w-4xl mx-auto">
                {messages.map((msg, index) => {
                  const isOwn = msg.userId === user?.uid;
                  const isAdmin = msg.role === 'admin';
                  const isOwner = msg.role === 'owner';
                  const isMentioned = msg.mention === user?.uid;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={msg.id} 
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-1 ${isMentioned ? 'bg-primary/5 rounded-lg py-1 px-2 border-l-2 border-primary' : ''}`}
                    >
                      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className="relative group/msg">
                          {msg.replyTo && (
                            <div className={`mb-[-12px] pb-4 pt-2 px-3 rounded-t-2xl text-[11px] border-l-4 border-primary/60 bg-primary/10 backdrop-blur-md opacity-90 max-w-full truncate cursor-pointer hover:bg-primary/20 transition-colors`} onClick={() => {
                              const el = document.getElementById(`msg-${msg.replyTo.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}>
                              <span className="font-bold block text-primary/80 text-[10px] uppercase tracking-wider">{msg.replyTo.userName}</span>
                              <span className="opacity-70">{msg.replyTo.content}</span>
                            </div>
                          )}
                          <div 
                            id={`msg-${msg.id}`}
                            className={`px-4 py-2.5 rounded-2xl shadow-md transition-all duration-200 ${
                            isOwner
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl border-2 border-amber-300/50 shadow-amber-500/20'
                              : isOwn 
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none hover:shadow-primary/20' 
                                : 'bg-card/95 backdrop-blur-sm border border-border/40 rounded-tl-none hover:border-primary/30 shadow-sm'
                          }`}>
                            {!isOwn && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-bold text-primary/90 uppercase tracking-tighter">
                                  {isOwner ? "👑 OWNER" : msg.userName}
                                </span>
                                {msg.isVerified && <CheckCircle2 className="h-3 w-3 text-blue-400 fill-blue-400/10" />}
                                {isAdmin && <Shield className="h-3 w-3 text-red-500 fill-red-500/10" />}
                                {isOwner && <Shield className="h-3 w-3 text-amber-300 fill-amber-300/10" />}
                              </div>
                            )}

                            {msg.imageUrl ? (
                              <div className="space-y-2 py-1">
                                <img 
                                  src={msg.imageUrl} 
                                  className="rounded-xl max-w-full md:max-w-sm cursor-zoom-in hover:brightness-105 transition-all shadow-inner border border-white/10" 
                                  onClick={() => window.open(msg.imageUrl, '_blank')}
                                  onLoad={() => {
                                    if (scrollRef.current) {
                                      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                                      viewport?.scrollTo({ top: viewport.scrollHeight });
                                    }
                                  }}
                                />
                                {msg.content !== "[Image]" && <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>}
                              </div>
                            ) : (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">{msg.content}</p>
                            )}
                            
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <div className="flex -space-x-1 items-center">
                                {msg.reactions && Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, uids]) => (
                                  <button 
                                    key={emoji} 
                                    onClick={() => toggleReaction(msg.id, emoji)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all transform hover:scale-110 active:scale-95 border ${
                                      uids.includes(user.uid) 
                                        ? 'bg-primary/20 text-primary border-primary/30 z-10' 
                                        : 'bg-muted/80 text-muted-foreground border-transparent'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    {uids.length > 1 && <span className="font-bold">{uids.length}</span>}
                                  </button>
                                ))}
                              </div>
                              <span className={`text-[9px] font-medium tracking-widest ${isOwn || isOwner ? 'text-white/70' : 'text-muted-foreground/60'}`}>
                                {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Action Bar - Styled like modern apps */}
                          <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-full mr-3' : 'left-full ml-3'} opacity-0 group-hover/msg:opacity-100 transition-all duration-300 flex items-center gap-1.5 pointer-events-none group-hover/msg:pointer-events-auto scale-90 group-hover/msg:scale-100`}>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border border-border/50 bg-background/95 backdrop-blur-md" onClick={() => setReplyingTo(msg)}>
                              <Send className="h-4 w-4 rotate-180 text-primary" />
                            </Button>
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border border-border/50 bg-background/95 backdrop-blur-md">
                                  <Smile className="h-4 w-4 text-orange-400" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent side="top" align="center" className="w-auto p-1.5 rounded-2xl border-border/40 shadow-2xl bg-background/98 backdrop-blur-xl animate-in zoom-in-95">
                                <div className="flex gap-1">
                                  {['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '🙏'].map(emoji => (
                                    <Button key={emoji} variant="ghost" className="h-9 w-9 p-0 text-xl hover:bg-primary/10 transition-colors rounded-xl" onClick={() => toggleReaction(msg.id, emoji)}>
                                      {emoji}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>

                            {(isOwn || isAdmin || user.role === 'owner') && (
                              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border border-border/50 bg-background/95 backdrop-blur-md text-destructive hover:bg-destructive/10" onClick={() => deleteMessage(msg.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-6 py-2 bg-primary/5 border-t border-primary/10 flex items-center justify-between backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 border-l-4 border-primary pl-3 py-1 overflow-hidden">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Replying to {replyingTo.userName}</span>
                      <p className="text-xs text-muted-foreground truncate max-w-md">{replyingTo.content}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setReplyingTo(null)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="p-4 bg-background/80 backdrop-blur-2xl flex items-center gap-3 border-t border-border/40">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 text-primary transition-colors h-11 w-11" onClick={handleTriggerImageUpload} disabled={uploading}>
                  <ImageIcon className="h-6 w-6" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 text-primary transition-colors h-11 w-11">
                      <Smile className="h-6 w-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-auto p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                    <Picker data={data} onEmojiSelect={addEmoji} theme="dark" set="apple" />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1 relative group">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  disabled={user.isMuted && user.role !== 'owner'}
                  placeholder={user.isMuted && user.role !== 'owner' ? "You are muted" : "Message..."}
                  className="w-full bg-muted/40 border-border/40 rounded-3xl h-11 pl-5 pr-12 focus-visible:ring-primary/30 transition-all group-hover:bg-muted/60" 
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim() && !uploading}
                  className={`absolute right-1 top-1 h-9 w-9 rounded-full transition-all duration-300 transform ${
                    newMessage.trim() ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
