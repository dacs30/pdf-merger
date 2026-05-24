"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PDFFile, PDFPage } from "@/lib/pdf-types";

type PageItemProps = {
  page: PDFPage;
  file: PDFFile | undefined;
  index: number;
  onVisible: (id: string) => void;
  renderHighRes: (fileId: string, pageIndex: number, width: number) => Promise<string>;
};

function LargePageItem({ page, file, index, onVisible, renderHighRes }: PageItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hiResUrl, setHiResUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const hasRendered = useRef(false);

  const doRender = useCallback(async () => {
    if (hasRendered.current || rendering) return;
    hasRendered.current = true;
    setRendering(true);
    try {
      const el = containerRef.current;
      const dpr = window.devicePixelRatio ?? 1;
      // Use actual container width so the render matches the display exactly
      const cssWidth = el ? el.offsetWidth : 900;
      const pixelWidth = Math.round(cssWidth * dpr);
      const url = await renderHighRes(page.fileId, page.pageIndex, pixelWidth);
      setHiResUrl(url);
    } finally {
      setRendering(false);
    }
  }, [page.fileId, page.pageIndex, renderHighRes, rendering]);

  // Trigger render when this item scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(page.id);
          doRender();
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page.id, onVisible, doRender]);

  const displayUrl = hiResUrl ?? page.thumbnail;

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {/* page label */}
      <div className="flex items-center gap-2">
        {file && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: file.color }} />
        )}
        <span className="font-mono text-[11px] text-muted-foreground">
          p.{index + 1}
          {file && <span className="ml-1.5 font-sans opacity-70">· {file.name}</span>}
        </span>
        <AnimatePresence>
          {rendering && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-auto text-[10px] text-primary/70"
            >
              Rendering…
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* page image — hi-res fades in over the thumbnail */}
      <div className="relative overflow-hidden rounded-xl ring-1 ring-border shadow-sm bg-white">
        {/* low-res placeholder always underneath */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.thumbnail}
          alt={`Page ${index + 1}`}
          className="w-full object-contain"
          draggable={false}
        />

        {/* hi-res overlay fades in once ready */}
        <AnimatePresence>
          {hiResUrl && (
            <motion.img
              key={hiResUrl}
              src={hiResUrl}
              alt={`Page ${index + 1} hi-res`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 w-full object-contain"
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type Props = {
  pages: PDFPage[];
  files: PDFFile[];
  activePage: string | null;
  onPageVisible: (id: string) => void;
  renderHighRes: (fileId: string, pageIndex: number, width: number) => Promise<string>;
};

export function PDFLargeViewer({ pages, files, activePage, onPageVisible, renderHighRes }: Props) {
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const viewerRef = useRef<HTMLDivElement>(null);
  const fileMap = new Map(files.map((f) => [f.id, f]));

  // Scroll to page when filmstrip item is clicked
  useEffect(() => {
    if (!activePage) return;
    const el = pageRefs.current.get(activePage);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activePage]);

  return (
    <div
      ref={viewerRef}
      className="flex flex-col gap-6 overflow-y-auto pr-1"
      style={{ maxHeight: "calc(100vh - 220px)" }}
    >
      <AnimatePresence>
        {pages.map((page, i) => (
          <motion.div
            key={page.id}
            ref={(el) => {
              if (el) pageRefs.current.set(page.id, el);
              else pageRefs.current.delete(page.id);
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <LargePageItem
              page={page}
              file={fileMap.get(page.fileId)}
              index={i}
              onVisible={onPageVisible}
              renderHighRes={renderHighRes}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
