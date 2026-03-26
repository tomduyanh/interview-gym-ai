declare module "pdf-parse/lib/pdf-parse.js" {
  type PDFParseResult = {
    text: string;
  };

  type PDFParseFn = (
    dataBuffer: Buffer | Uint8Array,
    options?: unknown
  ) => Promise<PDFParseResult>;

  const pdfParse: PDFParseFn;
  export default pdfParse;
}
