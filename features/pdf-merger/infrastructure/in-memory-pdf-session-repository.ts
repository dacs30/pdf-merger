import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfFile, PdfPage } from "../domain/models";
import type { PdfSessionRepository } from "../domain/repository";

export class InMemoryPdfSessionRepository implements PdfSessionRepository<PDFDocumentProxy> {
  private files: PdfFile[] = [];
  private pages: PdfPage[] = [];
  private readonly documents = new Map<string, PDFDocumentProxy>();

  getFiles(): PdfFile[] {
    return [...this.files];
  }

  getPages(): PdfPage[] {
    return [...this.pages];
  }

  appendFile(file: PdfFile): void {
    this.files = [...this.files, file];
  }

  appendPages(pages: PdfPage[]): void {
    this.pages = [...this.pages, ...pages];
  }

  replacePages(pages: PdfPage[]): void {
    this.pages = [...pages];
  }

  removeFile(fileId: string): void {
    this.files = this.files.filter((file) => file.id !== fileId);
    this.pages = this.pages.filter((page) => page.fileId !== fileId);
    this.documents.delete(fileId);
  }

  getDocument(fileId: string): PDFDocumentProxy | undefined {
    return this.documents.get(fileId);
  }

  setDocument(fileId: string, document: PDFDocumentProxy): void {
    this.documents.set(fileId, document);
  }
}
