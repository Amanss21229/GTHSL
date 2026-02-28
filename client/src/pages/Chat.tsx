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
  updateDoc
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
  const [onlineCount, setOnlineCount] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: verifiedUsers } = useQuery<string[]>({
    queryKey: ["/api/users/verified"],
  });

  const isUserVerified = (uid: string) => {
    return verifiedUsers?.includes(uid);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
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
    if (newUsers.length === 0) delete newReactions[emoji];

    try {
      await updateDoc(msgRef, { reactions: newReactions });
    } catch (error) {
      console.error("Reaction error:", error);
    }
  };

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
    if (!user) return;
    const qPresence = query(collection(db, "presence"));
    const unsubscribePresence = onSnapshot(qPresence, (snapshot) => {
      setOnlineCount(Math.max(1, snapshot.size));
    });
    return () => unsubscribePresence();
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
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messageData: any = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userPhoto: user.photoURL || null,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
        isVerified: !!verifiedUsers?.includes(user.uid),
        reactions: {}
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          content: replyingTo.content,
          userName: replyingTo.userName,
          imageUrl: replyingTo.imageUrl || null
        };
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
        content: "[Image]",
        imageUrl: url,
        createdAt: serverTimestamp(),
        isVerified: !!verifiedUsers?.includes(user.uid),
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
            style={{ backgroundImage: chatBg ? `url(${chatBg})` : 'none', backgroundSize: 'cover' }}
          >
            <ScrollArea ref={scrollRef} className="flex-1 h-full px-4 md:px-8">
              <div className="space-y-6 py-6 max-w-4xl mx-auto">
                {messages.map((msg, index) => {
                  const isOwn = msg.userId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{msg.userName}</span>
                          {msg.isVerified && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${isOwn ? 'bg-primary text-white' : 'bg-muted'}`}>
                          {msg.imageUrl ? <img src={msg.imageUrl} className="rounded-lg max-w-xs" /> : <p>{msg.content}</p>}
                          <div className="flex gap-1 mt-2">
                            {msg.reactions && Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, uids]) => (
                              <Button key={emoji} variant="ghost" size="sm" className="h-6 px-2 text-[10px] bg-white/10" onClick={() => toggleReaction(msg.id, emoji)}>
                                {emoji} {uids.length}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <form onSubmit={sendMessage} className="p-4 border-t bg-background/60 backdrop-blur-xl flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Button type="button" variant="ghost" size="icon" onClick={handleTriggerImageUpload} disabled={uploading}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none"><Picker data={data} onEmojiSelect={addEmoji} theme="dark" /></PopoverContent>
              </Popover>
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full" />
              <Button type="submit" size="icon" className="rounded-full"><Send className="h-5 w-5" /></Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
