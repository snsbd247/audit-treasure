import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Hash, Save, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Sequence {
  id: string;
  prefix: string;
  year: number;
  current_number: number;
  description: string | null;
}

const DocumentNumberingPage = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedPrefixes, setEditedPrefixes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetDialog, setResetDialog] = useState<Sequence | null>(null);
  const { toast } = useToast();

  const fetchSequences = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("number_sequences")
      .select("*")
      .order("id");
    if (error) {
      toast({ title: "Error loading sequences", description: error.message, variant: "destructive" });
    } else {
      setSequences((data || []) as Sequence[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSequences(); }, []);

  const handlePrefixChange = (id: string, value: string) => {
    setEditedPrefixes((prev) => ({ ...prev, [id]: value.toUpperCase() }));
  };

  const getDisplayPrefix = (seq: Sequence) => {
    return editedPrefixes[seq.id] !== undefined ? editedPrefixes[seq.id] : seq.prefix;
  };

  const getPreviewNumber = (seq: Sequence) => {
    const prefix = getDisplayPrefix(seq);
    const next = seq.current_number + 1;
    return `${prefix}-${seq.year}-${String(next).padStart(5, "0")}`;
  };

  const hasChanges = Object.keys(editedPrefixes).some(
    (id) => editedPrefixes[id] !== sequences.find((s) => s.id === id)?.prefix
  );

  const handleSaveAll = async () => {
    const changes = Object.entries(editedPrefixes).filter(
      ([id, prefix]) => prefix !== sequences.find((s) => s.id === id)?.prefix
    );
    if (changes.length === 0) return;

    setSaving(true);
    try {
      for (const [id, prefix] of changes) {
        if (!prefix.trim()) {
          toast({ title: "Prefix cannot be empty", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { error } = await supabase
          .from("number_sequences")
          .update({ prefix } as any)
          .eq("id", id);
        if (error) throw error;
      }
      toast({ title: "Prefixes updated successfully" });
      setEditedPrefixes({});
      fetchSequences();
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetCounter = async () => {
    if (!resetDialog) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("number_sequences")
        .update({ current_number: 0 } as any)
        .eq("id", resetDialog.id);
      if (error) throw error;
      toast({ title: `Counter reset for ${resetDialog.description || resetDialog.id}` });
      setResetDialog(null);
      fetchSequences();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Document Numbering</h1>
            <p className="text-sm text-muted-foreground">Configure automatic document number prefixes and sequences</p>
          </div>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveAll} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Number Sequences</CardTitle>
          <CardDescription>
            Format: <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">PREFIX-YEAR-SERIAL</code> — Each sequence auto-increments and resets per financial year.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead className="w-28">Prefix</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Last #</TableHead>
                <TableHead>Next Number Preview</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                </TableRow>
              ) : sequences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sequences configured</TableCell>
                </TableRow>
              ) : (
                sequences.map((seq) => (
                  <TableRow key={seq.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-foreground">{seq.description || seq.id}</span>
                        <span className="block text-xs text-muted-foreground font-mono">{seq.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={getDisplayPrefix(seq)}
                        onChange={(e) => handlePrefixChange(seq.id, e.target.value)}
                        className="w-20 h-8 text-sm font-mono uppercase"
                        maxLength={5}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{seq.year}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {String(seq.current_number).padStart(5, "0")}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-primary">
                        {getPreviewNumber(seq)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Reset counter"
                        onClick={() => setResetDialog(seq)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-foreground mb-2">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Each transaction module uses its own sequence to generate unique document numbers.</li>
            <li>Numbers follow the format <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">PREFIX-YEAR-SERIAL</code> (e.g., SI-2026-00001).</li>
            <li>The serial resets when you start a new financial year by updating the year value.</li>
            <li>Prefixes are configurable — change them above to match your organization's requirements.</li>
            <li>Counter reset will set the serial back to 00000 — use with caution.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={!!resetDialog} onOpenChange={() => setResetDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Counter</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the counter for <strong>{resetDialog?.description || resetDialog?.id}</strong>?
              This will set the serial number back to 00000. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetCounter} disabled={saving}>
              {saving ? "Resetting..." : "Reset Counter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentNumberingPage;
