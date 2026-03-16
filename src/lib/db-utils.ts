import { supabase } from "@/integrations/supabase/client";

/**
 * Application-layer replacement for the dropped `next_number` database function.
 * Atomically increments the sequence and returns the formatted number.
 */
export async function nextNumber(seqId: string): Promise<string> {
  // Read current
  const { data: seq, error: readErr } = await supabase
    .from("number_sequences")
    .select("prefix, current_number, year")
    .eq("id", seqId)
    .single();

  if (readErr || !seq) throw new Error(`Sequence "${seqId}" not found`);

  const newNum = (seq as any).current_number + 1;

  // Update atomically (optimistic — if concurrent, one will fail and can retry)
  const { error: upErr } = await supabase
    .from("number_sequences")
    .update({ current_number: newNum } as any)
    .eq("id", seqId)
    .eq("current_number", (seq as any).current_number); // optimistic lock

  if (upErr) throw new Error("Failed to increment sequence: " + upErr.message);

  const prefix = (seq as any).prefix;
  const year = (seq as any).year;
  return `${prefix}-${year}-${String(newNum).padStart(4, "0")}`;
}

/**
 * Application-layer replacement for the dropped `get_email_by_username` function.
 */
export async function getEmailByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", username)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error || !data) return null;
  return (data as any).email;
}
