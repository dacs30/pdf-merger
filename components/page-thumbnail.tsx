"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PDFPage, PDFFile } from "@/lib/pdf-types";

type Props = {
  page: PDFPage;
  file: PDFFile | undefined;
  index: number;
  isDropTarget: boolean;
  onRemove: (id: string) => void;
};

export function PageThumbnail({ page, file, index, isDropTarget, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative rounded-xl bg-card ring-1 overflow-hidden select-none transition-all",
        isDragging
          ? "shadow-2xl ring-primary z-50"
          : isDropTarget
          ? "ring-2 ring-primary shadow-md scale-[1.03]"
          : "ring-border shadow-sm hover:shadow-md hover:ring-primary/30"
      )}
    >
      {/* drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1.5 z-10 flex size-6 cursor-grab items-center justify-center rounded-lg bg-background/80 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing backdrop-blur-sm"
      >
        <GripVertical className="size-3.5" />
      </div>

      {/* remove button */}
      <button
        onClick={() => onRemove(page.id)}
        className="absolute right-1.5 top-1.5 z-10 flex size-6 cursor-pointer items-center justify-center rounded-lg bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 backdrop-blur-sm"
      >
        <X className="size-3.5" />
      </button>

      {/* thumbnail */}
      <div className="bg-muted/30 p-2 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.thumbnail}
          alt={`Page ${index + 1}`}
          className="w-full rounded-lg object-contain shadow-sm"
          draggable={false}
        />
      </div>

      {/* footer */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {file && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: file.color }}
          />
        )}
        <span className="font-mono truncate text-[10px] text-muted-foreground">
          p.{page.pageIndex + 1}
        </span>
      </div>
    </motion.div>
  );
}
