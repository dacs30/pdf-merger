import { PDFDocument } from "pdf-lib";
import type { PdfMergeAdapter } from "../application/ports";
import type { PdfFile, PdfPage } from "../domain/models";

export class PdfLibAdapter implements PdfMergeAdapter {
  async merge(files: PdfFile[], pages: PdfPage[]): Promise<Uint8Array> {
    const merged = await PDFDocument.create();

    const fileMap = new Map(files.map((file) => [file.id, file]));
    const sourceDocuments = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();

    for (const page of pages) {
      const file = fileMap.get(page.fileId);
      if (!file) continue;

      let sourceDocument = sourceDocuments.get(page.fileId);
      if (!sourceDocument) {
        sourceDocument = await PDFDocument.load(file.bytes);
        sourceDocuments.set(page.fileId, sourceDocument);
      }

      const [copiedPage] = await merged.copyPages(sourceDocument, [page.pageIndex]);
      merged.addPage(copiedPage);
    }

    return merged.save();
  }
}
