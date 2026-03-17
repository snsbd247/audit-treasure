import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Mail, MailOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  subject: string | null;
  updated_at: string;
  participants: { id: string; name: string; username: string | null }[];
  latest_message: { message: string; sender: { name: string } } | null;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    // Get conversations where user is participant via Supabase
    // For Supabase-based implementation, we query directly
    const { data: participantData } = await supabase
      .from("conversation_participants" as any)
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participantData || participantData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = (participantData as any[]).map((p: any) => p.conversation_id);
    const { data: convData } = await supabase
      .from("conversations" as any)
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convData) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch all participants and latest messages
    const convList: ConversationItem[] = [];
    for (const conv of convData as any[]) {
      const { data: parts } = await supabase
        .from("conversation_participants" as any)
        .select("user_id")
        .eq("conversation_id", conv.id);

      const partIds = (parts as any[] || []).map((p: any) => p.user_id);
      const { data: partProfiles } = await supabase
        .from("profiles")
        .select("id, name, username")
        .in("id", partIds);

      const { data: latestMsg } = await supabase
        .from("messages" as any)
        .select("message, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Count unread
      const { count: unreadCount } = await supabase
        .from("messages" as any)
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      let latestMessage = null;
      if (latestMsg && latestMsg.length > 0) {
        const senderProfile = (partProfiles as any[] || []).find((p: any) => p.id === (latestMsg[0] as any).sender_id);
        latestMessage = {
          message: (latestMsg[0] as any).message,
          sender: { name: senderProfile?.name || "Unknown" },
        };
      }

      convList.push({
        id: conv.id,
        subject: conv.subject,
        updated_at: conv.updated_at,
        participants: (partProfiles as any[] || []).filter((p: any) => p.id !== user.id),
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
      .from("messages" as any)
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!data) return;

    // Get sender profiles
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
        .from("messages" as any)
        .update({ is_read: true })
        .in("id", unreadIds);
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) fetchMessages(selectedConvId);
  }, [selectedConvId, fetchMessages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConvId) return;
    const interval = setInterval(() => fetchMessages(selectedConvId), 5000);
    return () => clearInterval(interval);
  }, [selectedConvId, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId || !user) return;
    setSending(true);
    try {
      await supabase.from("messages" as any).insert({
        conversation_id: selectedConvId,
        sender_id: user.id,
        message: newMessage.trim(),
      });
      // Update conversation timestamp
      await supabase.from("conversations" as any).update({ updated_at: new Date().toISOString() }).eq("id", selectedConvId);
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
      // Check for existing conversation
      const { data: myParticipations } = await supabase
        .from("conversation_participants" as any)
        .select("conversation_id")
        .eq("user_id", user.id);

      const { data: theirParticipations } = await supabase
        .from("conversation_participants" as any)
        .select("conversation_id")
        .eq("user_id", selectedUserId);

      const myConvIds = new Set((myParticipations as any[] || []).map((p: any) => p.conversation_id));
      const existingConvId = (theirParticipations as any[] || []).find((p: any) => myConvIds.has(p.conversation_id))?.conversation_id;

      let convId: string;
      if (existingConvId) {
        convId = existingConvId;
      } else {
        const { data: newConv } = await supabase
          .from("conversations" as any)
          .insert({ subject: null })
          .select()
          .single();
        convId = (newConv as any).id;
        await supabase.from("conversation_participants" as any).insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: selectedUserId },
        ]);
      }

      if (initialMessage.trim()) {
        await supabase.from("messages" as any).insert({
          conversation_id: convId,
          sender_id: user.id,
          message: initialMessage.trim(),
        });
        await supabase.from("conversations" as any).update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }

      setNewDialogOpen(false);
      setSelectedUserId("");
      setInitialMessage("");
      setSelectedConvId(convId);
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
      .select("id, name, username")
      .is("deleted_at", null)
      .neq("id", user?.id || "")
      .order("name");
    setUsers((data as UserOption[] || []));
    setNewDialogOpen(true);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Messages</h2>
          <Button size="sm" variant="outline" onClick={openNewDialog} className="h-8">
            <Plus className="w-3.5 h-3.5 mr-1" />New
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={cn(
                  "w-full text-left p-3 border-b border-border hover:bg-accent/50 transition-colors",
                  selectedConvId === conv.id && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {conv.participants.map((p) => p.name).join(", ") || "Unknown"}
                  </span>
                  {conv.unread_count > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5 min-w-5 flex items-center justify-center">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {conv.latest_message?.message || "No messages yet"}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{formatTime(conv.updated_at)}</span>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Select a conversation or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">
                  {selectedConv?.participants.map((p) => p.name).join(", ")}
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {!isOwn && (
                          <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.sender.name}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
                          {isOwn && (
                            msg.is_read
                              ? <MailOpen className="w-3 h-3 opacity-60" />
                              : <Mail className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border bg-card">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={!newMessage.trim() || sending}>
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
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">To</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.username ? `(${u.username})` : ""}
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
                placeholder="Type your message..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleNewConversation} disabled={!selectedUserId || sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagingPage;
