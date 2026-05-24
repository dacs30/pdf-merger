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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { PDFFile, PDFPage } from "@/lib/pdf-types";
import { PageThumbnail } from "./page-thumbnail";

type Props = {
  pages: PDFPage[];
  files: PDFFile[];
  onReorder: (pages: PDFPage[]) => void;
  onRemovePage: (id: string) => void;
};

export function PDFPageGrid({ pages, files, onReorder, onRemovePage }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fileMap = new Map(files.map((f) => [f.id, f]));
  const activePage = pages.find((p) => p.id === activeId);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setOverId(null);
  }

  function handleDragOver(e: DragOverEvent) {
    setOverId(e.over ? String(e.over.id) : null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    onReorder(arrayMove(pages, oldIndex, newIndex));
  }

  function handleDragCancel() {
    setActiveId(null);
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
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          <AnimatePresence>
            {pages.map((page, i) => (
              <PageThumbnail
                key={page.id}
                page={page}
                file={fileMap.get(page.fileId)}
                index={i}
                isDropTarget={overId === page.id && activeId !== page.id}
                onRemove={onRemovePage}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {activePage && (
          <div className="rotate-2 opacity-90 shadow-2xl rounded-xl overflow-hidden">
            <PageThumbnail
              page={activePage}
              file={fileMap.get(activePage.fileId)}
              index={pages.indexOf(activePage)}
              isDropTarget={false}
              onRemove={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
