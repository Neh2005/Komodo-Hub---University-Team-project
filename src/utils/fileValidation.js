// Firestore caps a single document at 1 MiB, and base64-encoding a file inflates its
// size by roughly a third — this cap leaves headroom for the document's other fields
// (title, metadata, etc.) so an oversized upload fails fast with a clear message
// instead of silently failing the Firestore write.
export const MAX_UPLOAD_BYTES = 700 * 1024;
export const MAX_UPLOAD_LABEL = "700KB";

export function isUploadTooLarge(file) {
  return !!file && file.size > MAX_UPLOAD_BYTES;
}
