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
import { Send, Image as ImageIcon, Trash2, Smile, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

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

  useEffect(() => {
    // Using a general collection for global discussion
    const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "global_chat"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL,
        content: newMessage,
        createdAt: serverTimestamp(),
        isVerified: isUserVerified(user.uid),
      });
      setNewMessage("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Safety check: Only allow images
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

      await addDoc(collection(db, "global_chat"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL,
        content: "[Image]",
        imageUrl: url,
        createdAt: serverTimestamp(),
        isVerified: isUserVerified(user.uid),
      });
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

  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Discussion Group</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to join the discussion.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-5rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden glass-card rounded-3xl border-primary/20 shadow-xl">
        <CardHeader className="border-b bg-background/50 backdrop-blur-sm p-4">
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.userId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[70%] flex gap-3 ${msg.userId === user?.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-8 h-8 shrink-0 mt-1 ring-2 ring-primary/10">
                      <AvatarImage src={msg.userPhoto} />
                      <AvatarFallback>{msg.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <span className="text-[10px] font-medium text-muted-foreground">{msg.userName}</span>
                        {(msg.isVerified || isUserVerified(msg.userId)) && (
                          <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-500/10" />
                        )}
                      </div>
                      <div className={`p-3 rounded-2xl relative group shadow-sm transition-all duration-200 ${
                        msg.userId === user?.uid 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted/80 backdrop-blur-sm rounded-tl-none'
                      }`}>
                        {msg.imageUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={msg.imageUrl} 
                              alt="upload" 
                              className="max-w-full rounded-xl cursor-zoom-in hover:opacity-95 transition-opacity" 
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          </div>
                        ) : (
                          <p className="text-sm md:text-base whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        {msg.userId === user?.uid && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteMessage(msg.id)}
                            data-testid={`delete-msg-${msg.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background/50 backdrop-blur-md">
            <form onSubmit={sendMessage} className="flex gap-2 items-center max-w-4xl mx-auto">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full hover:bg-primary/10 transition-colors"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-image"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0 rounded-full hover:bg-primary/10 transition-colors"
                    data-testid="button-emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-2xl" side="top" align="start">
                  <Picker 
                    data={data} 
                    onEmojiSelect={addEmoji} 
                    theme="light" 
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </PopoverContent>
              </Popover>

              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Discuss your doubts here..."
                className="flex-1 rounded-full bg-background border-primary/20 focus:ring-primary/30"
                data-testid="input-chat-message"
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || uploading} 
                className="shrink-0 rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                data-testid="button-send-chat"
              >
                <Send className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
