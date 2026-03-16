import { useCallback, useState } from "react";
import { Attachment } from "@/types/voucher";
import { FileText, FileSpreadsheet, Upload, X } from "lucide-react";

interface FileDropzoneProps {
  attachments: Attachment[];
  onFilesAdded?: (files: File[]) => void;
  readOnly?: boolean;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf": return <FileText className="w-4 h-4 text-destructive" />;
    case "xlsx":
    case "xls": return <FileSpreadsheet className="w-4 h-4 text-success" />;
    default: return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileDropzone({ attachments, onFilesAdded, readOnly }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  }, [readOnly]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!readOnly && onFilesAdded) {
      const files = Array.from(e.dataTransfer.files);
      onFilesAdded(files);
    }
  }, [readOnly, onFilesAdded]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Attachments</h3>
      
      {/* Existing files */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors duration-200"
            >
              {getFileIcon(file.type)}
              <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatSize(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {!readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop files here or click to upload
          </p>
        </div>
      )}
    </div>
  );
}
