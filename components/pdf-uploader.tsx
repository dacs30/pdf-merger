"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

export function PDFUploader({ onFiles, disabled }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const pdfs = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      if (pdfs.length) onFiles(pdfs);
    },
    [onFiles]
  );

  return (
    <label
      className={cn(
        "group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200",
        dragging
          ? "border-primary bg-primary/8 scale-[1.01]"
          : "border-border bg-card hover:border-primary/50 hover:bg-primary/4",
        disabled && "pointer-events-none opacity-60"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept=".pdf"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={dragging ? "drag" : "idle"}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl transition-colors duration-200",
              dragging
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
            )}
          >
            <UploadCloud className="size-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {dragging ? "Drop PDFs here" : "Upload PDF files"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag & drop or click to browse — multiple files supported
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </label>
  );
}
