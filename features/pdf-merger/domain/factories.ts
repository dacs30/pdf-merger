import type { PdfFile, PdfPage } from "./models";

export function createPdfFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createPdfFile(input: PdfFile): PdfFile {
  return input;
}

export function createPdfPage(input: PdfPage): PdfPage {
  return input;
}

export function isPdfFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}
