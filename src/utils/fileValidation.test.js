import { describe, it, expect } from "vitest";
import { isUploadTooLarge, MAX_UPLOAD_BYTES } from "./fileValidation";

function fakeFile(sizeBytes) {
  return { size: sizeBytes };
}

describe("isUploadTooLarge", () => {
  it("rejects no file as not-too-large (nothing to reject yet)", () => {
    expect(isUploadTooLarge(null)).toBe(false);
    expect(isUploadTooLarge(undefined)).toBe(false);
  });

  it("accepts a file right at the boundary", () => {
    expect(isUploadTooLarge(fakeFile(MAX_UPLOAD_BYTES))).toBe(false);
  });

  it("rejects a file one byte over the boundary", () => {
    expect(isUploadTooLarge(fakeFile(MAX_UPLOAD_BYTES + 1))).toBe(true);
  });

  it("accepts a small file", () => {
    expect(isUploadTooLarge(fakeFile(1024))).toBe(false);
  });

  it("rejects a multi-megabyte file", () => {
    expect(isUploadTooLarge(fakeFile(5 * 1024 * 1024))).toBe(true);
  });
});
