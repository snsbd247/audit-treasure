import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the currently active financial year.
 * Returns { id, name, start_date, end_date } or null.
 */
export async function getActiveFinancialYear() {
  const { data } = await supabase
    .from("financial_years")
    .select("id, name, start_date, end_date, is_active")
    .eq("is_active", true)
    .limit(1)
    .single();
  return data;
}

/**
 * Validate that a given date falls within the active financial year.
 */
export async function validateFinancialYear(date: string): Promise<{ valid: boolean; yearId: string | null; error?: string }> {
  const fy = await getActiveFinancialYear();
  if (!fy) return { valid: false, yearId: null, error: "No active financial year found. Please configure one in Administration." };
  if (date < fy.start_date || date > fy.end_date) {
    return { valid: false, yearId: fy.id, error: `Date ${date} is outside the active financial year (${fy.start_date} to ${fy.end_date}).` };
  }
  return { valid: true, yearId: fy.id };
}
