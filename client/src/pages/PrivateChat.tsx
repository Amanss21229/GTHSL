import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Search,
  MessageCircle,
  Lock,
  Users,
  CheckCheck,
  Check,
} from "lucide-react";
import { useContactSyncStatus } from "@/components/ContactSyncPopup";
import { useLocation } from "wouter";

interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: any;
  read: boolean;
}

interface Conversation {
  chatId: string;
  otherUser: FirestoreUser;
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
}

function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

function formatTime(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMsgTime(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PrivateChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAllowed, isDenied } = useContactSyncStatus();

  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contactStatus = localStorage.getItem("contact_sync_status");
  const chatAllowed = contactStatus !== null && contactStatus !== "denied";

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!user || !chatAllowed) return;
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const fetched: FirestoreUser[] = [];
        snap.forEach((d) => {
          if (d.id !== user.uid) {
            const data = d.data();
            fetched.push({
              uid: d.id,
              name: data.name || "Unknown",
              email: data.email || "",
              photoURL: data.photoURL,
              role: data.role,
            });
          }
        });
        setAllUsers(fetched);
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [user, chatAllowed]);

  useEffect(() => {
    if (!user || !chatAllowed || allUsers.length === 0) return;
    const q = query(
      collection(db, "privateChats"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const convs: Conversation[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const otherUid = data.participants.find((p: string) => p !== user.uid);
        const otherUser = allUsers.find((u) => u.uid === otherUid);
        if (otherUser) {
          convs.push({
            chatId: d.id,
            otherUser,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime,
            unread: data.unreadCount?.[user.uid] || 0,
          });
        }
      });
      convs.sort((a, b) => {
        const ta = a.lastMessageTime?.toMillis?.() || 0;
        const tb = b.lastMessageTime?.toMillis?.() || 0;
        return tb - ta;
      });
      setConversations(convs);
    });
    return () => unsub();
  }, [user, allUsers, chatAllowed]);

  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, "privateChats", selectedChat.chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() } as Message);
      });
      setMessages(msgs);
      if (user) {
        updateDoc(doc(db, "privateChats", selectedChat.chatId), {
          [`unreadCount.${user.uid}`]: 0,
        }).catch(() => {});
      }
    });
    return () => unsub();
  }, [selectedChat, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = async (otherUser: FirestoreUser) => {
    if (!user) return;
    const chatId = getChatId(user.uid, otherUser.uid);
    const chatRef = doc(db, "privateChats", chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, otherUser.uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        unreadCount: { [user.uid]: 0, [otherUser.uid]: 0 },
      });
    }
    const conv: Conversation = {
      chatId,
      otherUser,
      lastMessage: snap.data()?.lastMessage,
      lastMessageTime: snap.data()?.lastMessageTime,
    };
    setSelectedChat(conv);
    setShowUserList(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat || sending) return;
    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);
    try {
      await addDoc(
        collection(db, "privateChats", selectedChat.chatId, "messages"),
        {
          senderId: user.uid,
          senderName: user.displayName || "You",
          content: text,
          createdAt: serverTimestamp(),
          read: false,
        }
      );
      await updateDoc(doc(db, "privateChats", selectedChat.chatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${selectedChat.otherUser.uid}`]: (conversations.find(c => c.chatId === selectedChat.chatId)?.unread || 0) + 1,
      });
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter((c) =>
    c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Lock className="w-14 h-14 text-muted-foreground" />
          <p className="text-xl font-semibold">Sign in to use Private Chat</p>
          <p className="text-muted-foreground text-sm">You need to be signed in to message other users.</p>
        </div>
      </div>
    );
  }

  if (!chatAllowed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] gap-5 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold mb-2">Contact Access Required</p>
            <p className="text-muted-foreground text-sm max-w-xs">
              Private chat requires contact sync to be enabled. Please allow contact access to unlock this feature.
            </p>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem("contact_sync_status");
              window.location.reload();
            }}
            className="rounded-2xl px-6"
            data-testid="button-enable-contacts"
          >
            Enable Contact Sync
          </Button>
          <Button variant="ghost" onClick={() => setLocation("/")} className="text-muted-foreground">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background border-r border-border/40">
      <div className="p-4 border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowUserList(!showUserList)}
            title="New chat"
            data-testid="button-new-chat"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-muted/40 border-none"
            data-testid="input-search-chat"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {showUserList ? (
          <div>
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              All Users
            </p>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => startChat(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  data-testid={`button-chat-user-${u.uid}`}
                >
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {u.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {u.role === "owner" || u.role === "admin" ? (
                    <Badge variant="secondary" className="ml-auto text-xs shrink-0">{u.role}</Badge>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
            <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setShowUserList(true)}
            >
              Start a new chat
            </Button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.chatId}
              onClick={() => { setSelectedChat(conv); setShowUserList(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                selectedChat?.chatId === conv.chatId
                  ? "bg-primary/10"
                  : "hover:bg-muted/40"
              }`}
              data-testid={`button-conversation-${conv.chatId}`}
            >
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={conv.otherUser.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {conv.otherUser.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-sm truncate">{conv.otherUser.name}</p>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage || "Start a conversation"}
                  </p>
                  {conv.unread && conv.unread > 0 ? (
                    <span className="shrink-0 min-w-[1.2rem] h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center px-1">
                      {conv.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );

  const chatContent = selectedChat ? (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        {isMobile && (
          <Button variant="ghost" size="icon" className="rounded-full -ml-2 mr-1" onClick={() => setSelectedChat(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarImage src={selectedChat.otherUser.photoURL} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {selectedChat.otherUser.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{selectedChat.otherUser.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> End-to-end encrypted
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)/0.3) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-3 py-16"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Messages are end-to-end encrypted.
                <br />
                Say hello to {selectedChat.otherUser.name.split(" ")[0]}!
              </p>
            </motion.div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.senderId === user?.uid;
              const showDate =
                i === 0 ||
                (msg.createdAt?.toDate &&
                  messages[i - 1]?.createdAt?.toDate &&
                  msg.createdAt.toDate().toDateString() !==
                    messages[i - 1].createdAt.toDate().toDateString());

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {showDate && msg.createdAt?.toDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
                        {msg.createdAt.toDate().toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}>
                    <div
                      className={`max-w-[72%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/80 text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="leading-relaxed break-words">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatMsgTime(msg.createdAt)}
                        </span>
                        {isMine && (
                          msg.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-300" />
                          ) : (
                            <Check className="w-3 h-3 text-primary-foreground/50" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-border/40 bg-background/80 backdrop-blur-sm"
      >
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${selectedChat.otherUser.name.split(" ")[0]}...`}
          className="rounded-full bg-muted/40 border-border/40 h-11 px-5"
          data-testid="input-message"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newMessage.trim() || sending}
          className="rounded-full h-11 w-11 shrink-0 bg-primary hover:bg-primary/90 transition-all"
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8 bg-background">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <MessageCircle className="w-10 h-10 text-primary" />
      </div>
      <div>
        <p className="text-xl font-bold mb-1">NEET JEE Private Chat</p>
        <p className="text-muted-foreground text-sm">
          Select a conversation or start a new one to chat privately with other students.
        </p>
      </div>
      <Button
        onClick={() => setShowUserList(true)}
        className="rounded-2xl px-6"
        data-testid="button-start-new-chat"
      >
        <Users className="w-4 h-4 mr-2" /> Find Students
      </Button>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="w-3 h-3" /> Messages are private and secure
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        {isMobile ? (
          selectedChat ? chatContent : sidebarContent
        ) : (
          <>
            <div className="w-80 shrink-0 flex flex-col">{sidebarContent}</div>
            <div className="flex-1 flex flex-col">{chatContent}</div>
          </>
        )}
      </div>
    </div>
  );
}
