"use client";

import { useState, useCallback, useRef } from "react";
import type { PDFFile, PDFPage } from "@/lib/pdf-types";
import type { PDFDocumentProxy } from "pdfjs-dist";

const FILE_COLORS = [
  "#7a6248", /* walnut — primary */
  "#4a9eca", /* navy */
  "#c97a4a", /* rust */
  "#5ab05a", /* forest */
  "#9a6ac9", /* aubergine */
  "#e0a85a", /* ochre */
];

let colorIndex = 0;
function nextColor() {
  return FILE_COLORS[colorIndex++ % FILE_COLORS.length];
}

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

async function renderPage(doc: PDFDocumentProxy, pageIndex: number, width: number): Promise<string> {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = width / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  const ctx = canvas.getContext("2d")!;

  await page.render({ canvasContext: ctx, canvas, viewport: scaledViewport }).promise;
  return canvas.toDataURL("image/png");
}

export function usePdfProcessor() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Keep pdfjs document instances alive for high-res re-renders
  const pdfjsDocs = useRef<Map<string, PDFDocumentProxy>>(new Map());

  const addFiles = useCallback(async (fileList: File[]) => {
    const pdfjsLib = await loadPdfJs();

    for (const file of fileList) {
      if (!file.name.toLowerCase().endsWith(".pdf")) continue;

      const bytes = await file.arrayBuffer();
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const color = nextColor();

      setLoading((prev) => ({ ...prev, [id]: true }));

      const pdfDoc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      pdfjsDocs.current.set(id, pdfDoc);
      const pageCount = pdfDoc.numPages;

      const newFile: PDFFile = { id, name: file.name, bytes, pageCount, color };
      setFiles((prev) => [...prev, newFile]);

      const newPages: PDFPage[] = [];
      for (let i = 0; i < pageCount; i++) {
        // Filmstrip thumbnail — small enough to render fast
        const thumbnail = await renderPage(pdfDoc, i, 280);
        newPages.push({
          id: `${id}-page-${i}`,
          fileId: id,
          fileName: file.name,
          pageIndex: i,
          thumbnail,
        });
      }

      setPages((prev) => [...prev, ...newPages]);
      setLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    pdfjsDocs.current.delete(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setPages((prev) => prev.filter((p) => p.fileId !== fileId));
  }, []);

  const removePage = useCallback((pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  }, []);

  const reorderPages = useCallback((newPages: PDFPage[]) => {
    setPages(newPages);
  }, []);

  // Render a single page at the requested pixel width (for the large viewer)
  const renderHighRes = useCallback(
    async (fileId: string, pageIndex: number, width: number): Promise<string> => {
      const doc = pdfjsDocs.current.get(fileId);
      if (!doc) throw new Error("PDF document not loaded");
      return renderPage(doc, pageIndex, width);
    },
    []
  );

  const mergePdfs = useCallback(async (): Promise<Uint8Array> => {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();

    const fileMap = new Map(files.map((f) => [f.id, f]));
    const docCache = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();

    for (const page of pages) {
      const file = fileMap.get(page.fileId);
      if (!file) continue;

      let srcDoc = docCache.get(page.fileId);
      if (!srcDoc) {
        srcDoc = await PDFDocument.load(file.bytes);
        docCache.set(page.fileId, srcDoc);
      }

      const [copiedPage] = await merged.copyPages(srcDoc, [page.pageIndex]);
      merged.addPage(copiedPage);
    }

    return merged.save();
  }, [files, pages]);

  const isLoading = Object.keys(loading).length > 0;

  return {
    files,
    pages,
    isLoading,
    addFiles,
    removeFile,
    removePage,
    reorderPages,
    renderHighRes,
    mergePdfs,
  };
}
