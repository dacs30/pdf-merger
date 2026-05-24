import type { PdfFile, PdfPage } from "../domain/models";

export interface PdfRenderAdapter<TDocument> {
  loadDocument(bytes: ArrayBuffer): Promise<{ document: TDocument; pageCount: number }>;
  renderPage(document: TDocument, pageIndex: number, width: number): Promise<string>;
}

export interface PdfMergeAdapter {
  merge(files: PdfFile[], pages: PdfPage[]): Promise<Uint8Array>;
}
