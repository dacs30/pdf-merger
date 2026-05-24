export type PDFFile = {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  pageCount: number;
  color: string;
};

export type PDFPage = {
  id: string;
  fileId: string;
  fileName: string;
  pageIndex: number;
  thumbnail: string;
};
