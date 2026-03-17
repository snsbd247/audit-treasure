import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages(pollInterval = 5000) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get conversations this user participates in
      const { data: participantRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participantRows || participantRows.length === 0) {
        setUnreadCount(0);
        return;
      }

      const convIds = participantRows.map((r) => r.conversation_id);

      // Count unread messages not sent by current user
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count ?? 0);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, pollInterval);
    return () => clearInterval(interval);
  }, [fetchUnread, pollInterval]);

  return { unreadCount, refetch: fetchUnread };
}
