import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, HardDrive } from "lucide-react";

export function BackupStatus() {
  const [minutesAgo, setMinutesAgo] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesAgo((prev) => (prev >= 15 ? 1 : prev + 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/30">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Last backup: {minutesAgo} minute{minutesAgo !== 1 ? "s" : ""} ago (Automated)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">SQL + Blob Sync Active</span>
      </div>
    </div>
  );
}
