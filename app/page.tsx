"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Layers, FileText, LayoutGrid, Columns2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFUploader } from "@/components/pdf-uploader";
import { PDFFilmstrip } from "@/components/pdf-filmstrip";
import { PDFLargeViewer } from "@/components/pdf-large-viewer";
import { PDFPageGrid } from "@/components/pdf-page-grid";
import { FileList } from "@/components/file-list";
import { usePdfProcessor } from "@/hooks/use-pdf-processor";
import { cn } from "@/lib/utils";

type ViewMode = "split" | "grid";

export default function Home() {
  const { files, pages, isLoading, addFiles, removeFile, removePage, reorderPages, renderHighRes, mergePdfs } =
    usePdfProcessor();
  const [merging, setMerging] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const handleMerge = useCallback(async () => {
    if (!pages.length) return;
    setMerging(true);
    try {
      const bytes = await mergePdfs();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setMerging(false);
    }
  }, [mergePdfs, pages.length]);

  const hasContent = files.length > 0;
  const totalPages = pages.length;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                PDF Merger
              </span>
            </div>
          </div>

          <AnimatePresence>
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleMerge}
                  disabled={merging || isLoading || !totalPages}
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {merging ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  {merging ? "Merging…" : `Merge ${totalPages} pages`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {/* Upload zone */}
        <PDFUploader onFiles={addFiles} disabled={isLoading} />

        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mt-6 flex gap-5"
            >
              {/* ── Left sidebar: always visible ── */}
              <aside className="flex w-48 shrink-0 flex-col gap-4">
                <FileList files={files} onRemove={removeFile} />

                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0" />
                  {files.length} file{files.length !== 1 ? "s" : ""} · {totalPages} page{totalPages !== 1 ? "s" : ""}
                </div>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-primary"
                  >
                    <Loader2 className="size-3.5 animate-spin" />
                    Processing…
                  </motion.div>
                )}

                <Button
                  onClick={handleMerge}
                  disabled={merging || isLoading || !totalPages}
                  className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {merging ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {merging ? "Merging…" : "Merge & Download"}
                </Button>

                {/* Filmstrip — only in split view */}
                <AnimatePresence>
                  {viewMode === "split" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="eyebrow mb-2 mt-1">
                        Pages — drag to reorder
                      </p>
                      <div
                        className="overflow-y-auto pr-0.5"
                        style={{ maxHeight: "calc(100vh - 400px)" }}
                      >
                        <PDFFilmstrip
                          pages={pages}
                          files={files}
                          activePage={activePage}
                          onActivate={setActivePage}
                          onReorder={reorderPages}
                          onRemovePage={removePage}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </aside>

              {/* ── Right content: view-mode dependent ── */}
              <section className="min-w-0 flex-1">
                {/* Section header with view toggle */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="eyebrow">
                    {viewMode === "split" ? "Preview" : "Pages — drag to reorder"}
                  </p>

                  {/* Toggle pill */}
                  <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
                    {(["split", "grid"] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={cn(
                          "flex size-6 cursor-pointer items-center justify-center rounded-md transition-all",
                          viewMode === mode
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title={mode === "split" ? "Split view" : "Grid view"}
                      >
                        {mode === "split" ? (
                          <Columns2 className="size-3.5" />
                        ) : (
                          <LayoutGrid className="size-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animated view swap */}
                <AnimatePresence mode="wait">
                  {viewMode === "split" ? (
                    <motion.div
                      key="split"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <PDFLargeViewer
                        pages={pages}
                        files={files}
                        activePage={activePage}
                        onPageVisible={setActivePage}
                        renderHighRes={renderHighRes}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <PDFPageGrid
                        pages={pages}
                        files={files}
                        onReorder={reorderPages}
                        onRemovePage={removePage}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!hasContent && !isLoading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 text-center text-sm text-muted-foreground"
            >
              Upload PDF files above to get started
            </motion.p>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border py-5 text-center">
        <p className="eyebrow">Pages stay in your browser — nothing is uploaded</p>
        <p className="eyebrow mt-2 opacity-50">© 2026 Danilo Correia</p>
      </footer>
    </div>
  );
}
