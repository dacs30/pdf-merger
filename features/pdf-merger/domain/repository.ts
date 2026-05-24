import type { PdfFile, PdfPage } from "./models";

export interface PdfSessionRepository<TDocument = unknown> {
  getFiles(): PdfFile[];
  getPages(): PdfPage[];
  appendFile(file: PdfFile): void;
  appendPages(pages: PdfPage[]): void;
  replacePages(pages: PdfPage[]): void;
  removeFile(fileId: string): void;
  getDocument(fileId: string): TDocument | undefined;
  setDocument(fileId: string, document: TDocument): void;
}
