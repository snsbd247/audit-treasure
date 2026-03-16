import { motion } from "framer-motion";
import { ActivityLogEntry } from "@/types/voucher";
import { FileText, CheckCircle, XCircle, Send, Plus } from "lucide-react";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
}

function getIcon(action: string) {
  switch (action) {
    case "created": return <Plus className="w-3.5 h-3.5" />;
    case "attachment": return <FileText className="w-3.5 h-3.5" />;
    case "submitted": return <Send className="w-3.5 h-3.5" />;
    case "approved": return <CheckCircle className="w-3.5 h-3.5 text-success" />;
    case "rejected": return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    default: return <Plus className="w-3.5 h-3.5" />;
  }
}

function formatTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ActivityLog({ entries }: ActivityLogProps) {
  return (
    <div className="space-y-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Activity Log</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.3, delay: i * 0.05 }}
              className="relative flex items-start gap-3 py-3"
            >
              {/* Dot */}
              <div className="relative z-10 flex items-center justify-center w-[15px] h-[15px] rounded-full bg-background border border-border">
                {getIcon(entry.action)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-tight text-foreground">
                  <span className="font-medium">{entry.user}</span>{" "}
                  <span className="text-muted-foreground">{entry.detail}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {formatTime(entry.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
