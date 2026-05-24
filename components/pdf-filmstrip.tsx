"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { useState } from "react";
import type { PDFFile, PDFPage } from "@/lib/pdf-types";
import { cn } from "@/lib/utils";

type ItemProps = {
  page: PDFPage;
  file: PDFFile | undefined;
  index: number;
  isActive: boolean;
  dropIndicator: "above" | "below" | null;
  onClick: () => void;
  onRemove: (id: string) => void;
};

function FilmstripItem({ page, file, index, isActive, dropIndicator, onClick, onRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  return (
    <div className="relative">
      {/* drop line above */}
      <motion.div
        animate={{ opacity: dropIndicator === "above" ? 1 : 0, scaleY: dropIndicator === "above" ? 1 : 0.5 }}
        transition={{ duration: 0.1 }}
        className="absolute -top-1 left-4 right-4 z-20 h-0.5 rounded-full origin-center"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

      <motion.div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: isDragging ? 0.3 : 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.15 }}
        onClick={onClick}
        className={cn(
          "group relative flex cursor-pointer select-none items-start gap-2 rounded-xl p-1.5 transition-colors",
          isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60",
          isDragging && "z-50"
        )}
      >
        {/* drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </div>

        {/* thumbnail */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-lg ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.thumbnail}
              alt={`Page ${index + 1}`}
              className="w-full object-contain"
              draggable={false}
            />
          </div>
          <div className="mt-1 flex items-center gap-1">
            {file && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: file.color }} />
            )}
            <span className="font-mono text-[10px] text-muted-foreground">p.{index + 1}</span>
          </div>
        </div>

        {/* remove */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
          className="absolute right-1 top-1 z-10 flex size-5 cursor-pointer items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 backdrop-blur-sm"
        >
          <X className="size-3" />
        </button>
      </motion.div>

      {/* drop line below (only rendered on last item to avoid double lines) */}
      <motion.div
        animate={{ opacity: dropIndicator === "below" ? 1 : 0, scaleY: dropIndicator === "below" ? 1 : 0.5 }}
        transition={{ duration: 0.1 }}
        className="absolute -bottom-1 left-4 right-4 z-20 h-0.5 rounded-full origin-center"
        style={{ backgroundColor: "var(--color-primary)" }}
      />
    </div>
  );
}

type Props = {
  pages: PDFPage[];
  files: PDFFile[];
  activePage: string | null;
  onActivate: (id: string) => void;
  onReorder: (pages: PDFPage[]) => void;
  onRemovePage: (id: string) => void;
};

export function PDFFilmstrip({ pages, files, activePage, onActivate, onReorder, onRemovePage }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fileMap = new Map(files.map((f) => [f.id, f]));
  const draggingPage = pages.find((p) => p.id === draggingId);

  const activeIdx = pages.findIndex((p) => p.id === draggingId);
  const overIdx = pages.findIndex((p) => p.id === overId);

  // Which side of the over-item will the dragged item land?
  // dragged moves down → inserts after over → line below
  // dragged moves up   → inserts before over → line above
  const insertBelow = activeIdx < overIdx;

  function getDropIndicator(pageId: string): "above" | "below" | null {
    if (!draggingId || !overId || pageId === draggingId) return null;
    if (pageId !== overId) return null;
    return insertBelow ? "below" : "above";
  }

  function handleDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
    setOverId(null);
  }

  function handleDragOver(e: DragOverEvent) {
    setOverId(e.over ? String(e.over.id) : null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setDraggingId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = pages.findIndex((p) => p.id === active.id);
    const newIdx = pages.findIndex((p) => p.id === over.id);
    onReorder(arrayMove(pages, oldIdx, newIdx));
  }

  function handleDragCancel() {
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          <AnimatePresence>
            {pages.map((page, i) => (
              <FilmstripItem
                key={page.id}
                page={page}
                file={fileMap.get(page.fileId)}
                index={i}
                isActive={activePage === page.id}
                dropIndicator={getDropIndicator(page.id)}
                onClick={() => onActivate(page.id)}
                onRemove={onRemovePage}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {draggingPage && (
          <div className="rotate-2 opacity-95 shadow-2xl rounded-xl overflow-hidden w-28 ring-2 ring-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draggingPage.thumbnail}
              alt="dragging"
              className="w-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
