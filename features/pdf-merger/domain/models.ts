export type PdfFile = {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  pageCount: number;
  color: string;
};

export type PdfPage = {
  id: string;
  fileId: string;
  fileName: string;
  pageIndex: number;
  thumbnail: string;
};
