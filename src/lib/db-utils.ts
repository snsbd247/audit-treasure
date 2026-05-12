import { supabase } from "@/integrations/supabase/client";

/**
 * Application-layer replacement for the dropped `next_number` database function.
 * Atomically increments the sequence and returns the formatted number.
 */
export async function nextNumber(seqId: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    // Read current
    const { data: seq, error: readErr } = await supabase
      .from("number_sequences")
      .select("prefix, current_number, year")
      .eq("id", seqId)
      .single();

    if (readErr || !seq) throw new Error(`Sequence "${seqId}" not found`);

    const currentNum = (seq as any).current_number;
    const newNum = currentNum + 1;

    // Update atomically with optimistic lock
    const { data: updated, error: upErr } = await supabase
      .from("number_sequences")
      .update({ current_number: newNum } as any)
      .eq("id", seqId)
      .eq("current_number", currentNum)
      .select("id") as any;

    if (upErr) throw new Error("Failed to increment sequence: " + upErr.message);

    // If no row was updated, another request incremented first — retry
    if (!updated || updated.length === 0) {
      if (attempt < retries - 1) continue;
      throw new Error("Could not acquire sequence lock after retries");
    }

    const prefix = (seq as any).prefix;
    const year = (seq as any).year;
    return `${prefix}-${year}-${String(newNum).padStart(5, "0")}`;
  }
  throw new Error("Unexpected: exhausted retries");
}

/**
 * Application-layer replacement for the dropped `get_email_by_username` function.
 */
export async function getEmailByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_email_by_username", { _username: username });
  if (error || !data) return null;
  return data as string;
}
