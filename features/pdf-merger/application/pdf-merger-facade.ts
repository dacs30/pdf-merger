import { RemovePageCommand, ReorderPagesCommand } from "../domain/commands";
import { FileColorPalette } from "../domain/color-palette";
import { FILE_COLORS, THUMBNAIL_RENDER_WIDTH } from "../domain/constants";
import { createPdfFile, createPdfFileId, createPdfPage, isPdfFileName } from "../domain/factories";
import type { PdfSessionRepository } from "../domain/repository";
import type { PdfMergeAdapter, PdfRenderAdapter } from "./ports";
import type { PdfPage } from "../domain/models";

type AddFilesLifecycle = {
  onFileStart?: (fileId: string) => void;
  onFileEnd?: (fileId: string) => void;
};

type PdfMergerFacadeDeps<TDocument> = {
  repository: PdfSessionRepository<TDocument>;
  renderer: PdfRenderAdapter<TDocument>;
  merger: PdfMergeAdapter;
};

export class PdfMergerFacade<TDocument> {
  private readonly colorPalette = new FileColorPalette(FILE_COLORS);

  constructor(private readonly deps: PdfMergerFacadeDeps<TDocument>) {}

  getFiles() {
    return this.deps.repository.getFiles();
  }

  getPages() {
    return this.deps.repository.getPages();
  }

  async addFiles(files: File[], lifecycle?: AddFilesLifecycle): Promise<void> {
    for (const file of files) {
      if (!isPdfFileName(file.name)) continue;

      const fileId = createPdfFileId();
      lifecycle?.onFileStart?.(fileId);

      try {
        const bytes = await file.arrayBuffer();
        const { document, pageCount } = await this.deps.renderer.loadDocument(bytes);
        this.deps.repository.setDocument(fileId, document);

        this.deps.repository.appendFile(
          createPdfFile({
            id: fileId,
            name: file.name,
            bytes,
            pageCount,
            color: this.colorPalette.nextColor(),
          })
        );

        const pages: PdfPage[] = [];
        for (let index = 0; index < pageCount; index++) {
          const thumbnail = await this.deps.renderer.renderPage(
            document,
            index,
            THUMBNAIL_RENDER_WIDTH
          );
          pages.push(
            createPdfPage({
              id: `${fileId}-page-${index}`,
              fileId,
              fileName: file.name,
              pageIndex: index,
              thumbnail,
            })
          );
        }

        this.deps.repository.appendPages(pages);
      } finally {
        lifecycle?.onFileEnd?.(fileId);
      }
    }
  }

  removeFile(fileId: string): void {
    this.deps.repository.removeFile(fileId);
  }

  removePage(pageId: string): void {
    const command = new RemovePageCommand(pageId);
    this.deps.repository.replacePages(command.execute(this.deps.repository.getPages()));
  }

  reorderPages(nextPages: PdfPage[]): void {
    const command = new ReorderPagesCommand(nextPages);
    this.deps.repository.replacePages(command.execute(this.deps.repository.getPages()));
  }

  async renderHighRes(fileId: string, pageIndex: number, width: number): Promise<string> {
    const document = this.deps.repository.getDocument(fileId);
    if (!document) throw new Error("PDF document not loaded");
    return this.deps.renderer.renderPage(document, pageIndex, width);
  }

  async mergePdfs(): Promise<Uint8Array> {
    return this.deps.merger.merge(this.deps.repository.getFiles(), this.deps.repository.getPages());
  }
}
