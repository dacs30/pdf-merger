"use client";

import { useState, useCallback } from "react";
import type { PDFFile, PDFPage } from "@/lib/pdf-types";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfMergerFacade } from "@/features/pdf-merger/application/pdf-merger-facade";
import { InMemoryPdfSessionRepository } from "@/features/pdf-merger/infrastructure/in-memory-pdf-session-repository";
import { PdfJsAdapter } from "@/features/pdf-merger/infrastructure/pdfjs-adapter";
import { PdfLibAdapter } from "@/features/pdf-merger/infrastructure/pdflib-adapter";

export function usePdfProcessor() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [facade] = useState(
    () =>
      new PdfMergerFacade<PDFDocumentProxy>({
        repository: new InMemoryPdfSessionRepository(),
        renderer: new PdfJsAdapter(),
        merger: new PdfLibAdapter(),
      })
  );

  const syncStateFromRepository = useCallback(() => {
    setFiles(facade.getFiles());
    setPages(facade.getPages());
  }, [facade]);

  const addFiles = useCallback(
    async (fileList: File[]) => {
      await facade.addFiles(fileList, {
        onFileStart: (fileId) => {
          setLoading((prev) => ({ ...prev, [fileId]: true }));
        },
        onFileEnd: (fileId) => {
          setLoading((prev) => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        },
      });
      syncStateFromRepository();
    },
    [facade, syncStateFromRepository]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      facade.removeFile(fileId);
      syncStateFromRepository();
    },
    [facade, syncStateFromRepository]
  );

  const removePage = useCallback(
    (pageId: string) => {
      facade.removePage(pageId);
      syncStateFromRepository();
    },
    [facade, syncStateFromRepository]
  );

  const reorderPages = useCallback(
    (newPages: PDFPage[]) => {
      facade.reorderPages(newPages);
      syncStateFromRepository();
    },
    [facade, syncStateFromRepository]
  );

  const renderHighRes = useCallback(
    async (fileId: string, pageIndex: number, width: number): Promise<string> => {
      return facade.renderHighRes(fileId, pageIndex, width);
    },
    [facade]
  );

  const mergePdfs = useCallback(async (): Promise<Uint8Array> => {
    return facade.mergePdfs();
  }, [facade]);

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
