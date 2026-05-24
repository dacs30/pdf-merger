import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfRenderAdapter } from "../application/ports";

const PDF_WORKER_SRC = "/pdf.worker.min.mjs";

export class PdfJsAdapter implements PdfRenderAdapter<PDFDocumentProxy> {
  private workerConfigured = false;

  private async loadPdfJs() {
    const pdfjsLib = await import("pdfjs-dist");
    if (!this.workerConfigured) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      this.workerConfigured = true;
    }
    return pdfjsLib;
  }

  async loadDocument(bytes: ArrayBuffer): Promise<{ document: PDFDocumentProxy; pageCount: number }> {
    const pdfjsLib = await this.loadPdfJs();
    const document = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    return { document, pageCount: document.numPages };
  }

  async renderPage(pdfDocument: PDFDocumentProxy, pageIndex: number, width: number): Promise<string> {
    const page = await pdfDocument.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const safeWidth = Math.max(1, Math.round(width));
    const scale = safeWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(scaledViewport.width));
    canvas.height = Math.max(1, Math.round(scaledViewport.height));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Failed to create canvas context");

    await page.render({ canvasContext: context, canvas, viewport: scaledViewport }).promise;
    return canvas.toDataURL("image/png");
  }
}
