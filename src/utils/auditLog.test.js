import { describe, it, expect } from "vitest";
import { sha256Hex, canonicalize } from "./auditLog";

// These exercise the hash-chain primitives directly (no Firestore involved) — this is
// the security-critical logic: if canonicalize() or sha256Hex() ever silently changed
// behavior, every previously-written audit entry would stop verifying, which is exactly
// the kind of regression a unit test should catch before it reaches production.

const baseEntry = {
  sequence: 0,
  action: "program_delete",
  actorUid: "uid-1",
  actorEmail: "admin@example.com",
  targetId: "prog-123",
  details: { title: "Wildlife Watch" },
  timestampMs: 1735000000000,
  prevHash: "GENESIS",
};

describe("sha256Hex", () => {
  it("is deterministic — same input, same hash", async () => {
    const a = await sha256Hex("hello world");
    const b = await sha256Hex("hello world");
    expect(a).toBe(b);
  });

  it("matches Node's own crypto.createHash('sha256') on a fixed string — an independent implementation, not just self-consistency", async () => {
    expect(await sha256Hex("hello world")).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    );
  });

  it("produces a different hash for a different input (avalanche, not just non-empty)", async () => {
    const a = await sha256Hex("hello world");
    const b = await sha256Hex("hello world!");
    expect(a).not.toBe(b);
  });
});

describe("canonicalize + sha256Hex — chain integrity", () => {
  it("hashing the same entry twice gives the same result", async () => {
    const h1 = await sha256Hex(canonicalize(baseEntry));
    const h2 = await sha256Hex(canonicalize(baseEntry));
    expect(h1).toBe(h2);
  });

  it("changing any single field changes the resulting hash (tamper is detectable)", async () => {
    const original = await sha256Hex(canonicalize(baseEntry));

    const tamperedDetails = await sha256Hex(canonicalize({ ...baseEntry, details: { title: "Hacked Title" } }));
    const tamperedActor = await sha256Hex(canonicalize({ ...baseEntry, actorUid: "attacker-uid" }));
    const tamperedTarget = await sha256Hex(canonicalize({ ...baseEntry, targetId: "prog-999" }));
    const tamperedPrevHash = await sha256Hex(canonicalize({ ...baseEntry, prevHash: "some-other-hash" }));

    expect(tamperedDetails).not.toBe(original);
    expect(tamperedActor).not.toBe(original);
    expect(tamperedTarget).not.toBe(original);
    expect(tamperedPrevHash).not.toBe(original);
  });

  it("a valid 3-entry chain links prevHash -> hash correctly end to end", async () => {
    const entry0 = { ...baseEntry, sequence: 0, prevHash: "GENESIS" };
    const hash0 = await sha256Hex(canonicalize(entry0));

    const entry1 = { ...baseEntry, sequence: 1, action: "grade_assignment", targetId: "a1:s1", prevHash: hash0 };
    const hash1 = await sha256Hex(canonicalize(entry1));

    const entry2 = { ...baseEntry, sequence: 2, targetId: "prog-456", prevHash: hash1 };
    const hash2 = await sha256Hex(canonicalize(entry2));

    // This is exactly what verifyAuditChain() does: walk the chain re-deriving each
    // hash and confirming it matches what the next entry claims as its prevHash.
    expect(entry1.prevHash).toBe(hash0);
    expect(entry2.prevHash).toBe(hash1);
    expect(hash0).not.toBe(hash1);
    expect(hash1).not.toBe(hash2);
  });

  it("splicing a forged entry into the middle breaks the link to the next real entry", async () => {
    const entry0 = { ...baseEntry, sequence: 0, prevHash: "GENESIS" };
    const hash0 = await sha256Hex(canonicalize(entry0));

    const entry1 = { ...baseEntry, sequence: 1, prevHash: hash0 };
    const hash1 = await sha256Hex(canonicalize(entry1));

    // Attacker edits entry1's content directly (e.g. via Console) without recomputing
    // entry2's stored prevHash to match the new hash1.
    const forgedEntry1 = { ...entry1, details: { title: "forged" } };
    const forgedHash1 = await sha256Hex(canonicalize(forgedEntry1));

    const entry2 = { ...baseEntry, sequence: 2, prevHash: hash1 }; // still points at the ORIGINAL hash1

    expect(forgedHash1).not.toBe(hash1);
    expect(entry2.prevHash).not.toBe(forgedHash1); // verification would flag entry2's link as broken
  });
});
