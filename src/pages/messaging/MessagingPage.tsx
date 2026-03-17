import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, MessageSquare, Check, CheckCheck, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  subject: string | null;
  updated_at: string;
  participants: { id: string; name: string; username: string | null; is_online: boolean; last_seen_at: string | null }[];
  latest_message: { message: string; sender_name: string } | null;
  unread_count: number;
}

interface MessageItem {
  id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: { id: string; name: string; username: string | null };
}

interface UserOption {
  id: string;
  name: string;
  username: string | null;
  is_online: boolean;
}

const MessagingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Update own online status via heartbeat
  useEffect(() => {
    if (!user) return;
    const updateOnline = () => {
      supabase
        .from("profiles")
        .update({ is_online: true, last_seen_at: new Date().toISOString() } as any)
        .eq("id", user.id)
        .then();
    };
    updateOnline();
    const interval = setInterval(updateOnline, 30000);
    return () => {
      clearInterval(interval);
      // Mark offline on unmount
      supabase
        .from("profiles")
        .update({ is_online: false, last_seen_at: new Date().toISOString() } as any)
        .eq("id", user.id)
        .then();
    };
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participantData || participantData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participantData.map((p: any) => p.conversation_id);
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convData) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convList: ConversationItem[] = [];
    for (const conv of convData as any[]) {
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id);

      const partIds = (parts as any[] || []).map((p: any) => p.user_id);
      const { data: partProfiles } = await supabase
        .from("profiles")
        .select("id, name, username, is_online, last_seen_at")
        .in("id", partIds);

      const { data: latestMsg } = await supabase
        .from("messages")
        .select("message, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      let latestMessage = null;
      if (latestMsg && latestMsg.length > 0) {
        const senderProfile = (partProfiles as any[] || []).find((p: any) => p.id === (latestMsg[0] as any).sender_id);
        latestMessage = {
          message: (latestMsg[0] as any).message,
          sender_name: senderProfile?.name || "Unknown",
        };
      }

      convList.push({
        id: conv.id,
        subject: conv.subject,
        updated_at: conv.updated_at,
        participants: (partProfiles as any[] || []).filter((p: any) => p.id !== user.id).map((p: any) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          is_online: p.is_online ?? false,
          last_seen_at: p.last_seen_at,
        })),
        latest_message: latestMessage,
        unread_count: unreadCount || 0,
      });
    }

    setConversations(convList);
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const senderIds = [...new Set((data as any[]).map((m: any) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username")
      .in("id", senderIds);

    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));

    const msgs: MessageItem[] = (data as any[]).map((m: any) => ({
      ...m,
      sender: profileMap.get(m.sender_id) || { id: m.sender_id, name: "Unknown", username: null },
    }));

    setMessages(msgs);

    // Mark unread messages as read
    const unreadIds = (data as any[])
      .filter((m: any) => m.sender_id !== user.id && !m.is_read)
      .map((m: any) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from("messages")
        .update({ is_read: true } as any)
        .in("id", unreadIds);
      fetchConversations(); // refresh unread counts
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [user, fetchConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) fetchMessages(selectedConvId);
  }, [selectedConvId, fetchMessages]);

  // Poll every 5 seconds
  useEffect(() => {
    const convInterval = setInterval(fetchConversations, 8000);
    const msgInterval = selectedConvId
      ? setInterval(() => fetchMessages(selectedConvId), 4000)
      : undefined;
    return () => {
      clearInterval(convInterval);
      if (msgInterval) clearInterval(msgInterval);
    };
  }, [selectedConvId, fetchConversations, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId || !user) return;
    setSending(true);
    try {
      await supabase.from("messages").insert({
        conversation_id: selectedConvId,
        sender_id: user.id,
        message: newMessage.trim(),
      } as any);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() } as any).eq("id", selectedConvId);
      setNewMessage("");
      fetchMessages(selectedConvId);
      fetchConversations();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    if (!selectedUserId || !user) return;
    setSending(true);
    try {
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const { data: theirParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", selectedUserId);

      const myConvIds = new Set((myParticipations as any[] || []).map((p: any) => p.conversation_id));
      const existingConvId = (theirParticipations as any[] || []).find((p: any) => myConvIds.has(p.conversation_id))?.conversation_id;

      let convId: string;
      if (existingConvId) {
        convId = existingConvId;
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ subject: null } as any)
          .select()
          .single();
        convId = (newConv as any).id;
        await supabase.from("conversation_participants").insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: selectedUserId },
        ] as any);
      }

      if (initialMessage.trim()) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: user.id,
          message: initialMessage.trim(),
        } as any);
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() } as any).eq("id", convId);
      }

      setNewDialogOpen(false);
      setSelectedUserId("");
      setInitialMessage("");
      setSelectedConvId(convId);
      setMobileShowChat(true);
      fetchConversations();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const openNewDialog = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, is_online")
      .is("deleted_at", null)
      .neq("id", user?.id || "")
      .order("name");
    setUsers((data as any[] || []).map((u: any) => ({ id: u.id, name: u.name, username: u.username, is_online: u.is_online ?? false })));
    setNewDialogOpen(true);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Unknown";
    const d = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherUser = selectedConv?.participants[0];

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c =>
        c.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; items: MessageItem[] }[]>((acc, msg) => {
    const dateStr = new Date(msg.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
    const last = acc[acc.length - 1];
    if (last && last.date === dateStr) {
      last.items.push(msg);
    } else {
      acc.push({ date: dateStr, items: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background overflow-hidden">
      {/* LEFT PANEL - Conversation List */}
      <div className={cn(
        "w-full md:w-[360px] lg:w-[400px] border-r border-border flex flex-col bg-card shrink-0",
        mobileShowChat && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
            <Button size="sm" onClick={openNewDialog} className="h-8 gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 h-9 bg-muted/50 border-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-24" />
                      <div className="h-2.5 bg-muted rounded w-40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin messaging</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.participants[0];
              const isActive = selectedConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setMobileShowChat(true);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-center gap-3 transition-all border-b border-border/50",
                    isActive
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : "hover:bg-accent/50"
                  )}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className={cn(
                        "text-sm font-semibold",
                        isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {other ? getInitials(other.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    {other?.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[hsl(var(--success))] border-2 border-card" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-sm truncate",
                        conv.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                      )}>
                        {other?.name || "Unknown"}
                      </span>
                      <span className={cn(
                        "text-[10px] shrink-0 ml-2",
                        conv.unread_count > 0 ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-xs truncate max-w-[200px]",
                        conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {conv.latest_message?.message || "No messages yet"}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 bg-primary text-primary-foreground rounded-full shrink-0 ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* RIGHT PANEL - Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-background",
        !mobileShowChat && "hidden md:flex"
      )}>
        {!selectedConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Welcome to Messages</p>
                <p className="text-sm text-muted-foreground mt-1">Select a conversation or start a new one</p>
              </div>
              <Button variant="outline" onClick={openNewDialog} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Start New Chat
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[60px] px-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden shrink-0"
                onClick={() => setMobileShowChat(false)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {otherUser ? getInitials(otherUser.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                {otherUser?.is_online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{otherUser?.name || "Unknown"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {otherUser?.is_online
                    ? <span className="text-[hsl(var(--success))] font-medium">Online</span>
                    : `Last seen ${formatLastSeen(otherUser?.last_seen_at || null)}`
                  }
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--muted)) 1px, transparent 0)", backgroundSize: "24px 24px" }}
            >
              <div className="max-w-3xl mx-auto space-y-1">
                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/80 px-3 py-1 rounded-full font-medium">
                        {group.date}
                      </span>
                    </div>
                    {group.items.map((msg, idx) => {
                      const isOwn = msg.sender_id === user?.id;
                      const showTail = idx === 0 || group.items[idx - 1]?.sender_id !== msg.sender_id;
                      return (
                        <div key={msg.id} className={cn("flex mb-1", isOwn ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] px-3 py-1.5 relative",
                              showTail ? "mt-1.5" : "",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl" + (showTail ? " rounded-br-sm" : " rounded-br-xl")
                                : "bg-card border border-border text-foreground rounded-r-xl rounded-tl-xl" + (showTail ? " rounded-bl-sm" : " rounded-bl-xl")
                            )}
                          >
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={cn("flex items-center gap-1 mt-0.5", isOwn ? "justify-end" : "justify-start")}>
                              <span className={cn("text-[10px]", isOwn ? "opacity-70" : "text-muted-foreground")}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isOwn && (
                                msg.is_read
                                  ? <CheckCheck className="w-3.5 h-3.5 opacity-90" />
                                  : <Check className="w-3 h-3 opacity-60" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-border bg-card shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2 max-w-3xl mx-auto"
              >
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-4 min-h-[40px] bg-muted/30 border-muted-foreground/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                  className="h-10 w-10 rounded-full shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">To</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          u.is_online ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/30"
                        )} />
                        <span>{u.name}</span>
                        {u.username && <span className="text-muted-foreground">@{u.username}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Message</label>
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your first message..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleNewConversation} disabled={!selectedUserId || sending}>
              {sending ? "Creating..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagingPage;
