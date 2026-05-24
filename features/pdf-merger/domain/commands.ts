import type { PdfPage } from "./models";

export interface PageCommand {
  execute(currentPages: PdfPage[]): PdfPage[];
}

export class RemovePageCommand implements PageCommand {
  constructor(private readonly pageId: string) {}

  execute(currentPages: PdfPage[]): PdfPage[] {
    return currentPages.filter((page) => page.id !== this.pageId);
  }
}

export class ReorderPagesCommand implements PageCommand {
  constructor(private readonly nextPages: PdfPage[]) {}

  execute(currentPages: PdfPage[]): PdfPage[] {
    const existingIds = new Set(currentPages.map((page) => page.id));
    return this.nextPages.filter((page) => existingIds.has(page.id));
  }
}
