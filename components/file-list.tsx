"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PDFFile } from "@/lib/pdf-types";

type Props = {
  files: PDFFile[];
  onRemove: (id: string) => void;
};

export function FileList({ files, onRemove }: Props) {
  if (!files.length) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${file.color}20`, color: file.color }}
            >
              <FileText className="size-3.5" />
            </span>
            <span className="flex-1 truncate text-sm font-medium text-foreground">
              {file.name}
            </span>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {file.pageCount}p
            </Badge>
            <button
              onClick={() => onRemove(file.id)}
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
