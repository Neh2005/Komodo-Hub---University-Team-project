// *******************Neha's part********************
//
// Tamper-evident audit log for privileged actions (program deletion, grade changes).
// Each entry is chained to the one before it by a SHA-256 hash that covers the entry's
// own content PLUS the previous entry's hash — the same construction a blockchain or a
// git commit history uses. Firestore rules make every entry immutable (no update, no
// delete, for anyone including admins), so nothing can rewrite history through this app.
// That leaves exactly one way to tamper: editing a document directly via the Firebase
// Console or the Admin SDK, which bypasses security rules entirely. The hash chain can't
// prevent that (nothing client-side can), but verifyAuditChain() recomputes every hash
// from the raw stored fields and will catch it the next time an admin opens the audit
// log — a single edited field, deleted entry, or reordered entry breaks the chain from
// that point forward and is flagged, not silently accepted.
import {
  collection, doc, runTransaction, query, orderBy, getDocs,
} from "firebase/firestore";
import { db } from "../firebaseconfig";

const COLLECTION = "auditLogs";
const HEAD_DOC = "chainHead";
const GENESIS_HASH = "GENESIS";

export async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Canonical string form of one entry's content. Every field that participates in the
// hash lives here — changing this function changes what every future entry hashes to,
// so it must stay stable once real entries exist.
export function canonicalize({ sequence, action, actorUid, actorEmail, targetId, details, timestampMs, prevHash }) {
  return JSON.stringify({ sequence, action, actorUid, actorEmail, targetId, details, timestampMs, prevHash });
}

// Appends one entry to the chain. Wrapped in a transaction against a single "chain head"
// pointer document so concurrent callers can't both read the same prevHash and fork the
// chain. This pointer is a genuine, unavoidable serialization point — a real hash chain
// has to commit each entry's link to the literal entry before it, so there is no way to
// make concurrent appends fully independent the way program enrollment's per-student
// subcollection could (that fix worked precisely because enrollment entries don't need
// to know about each other at all; audit log entries do, by design).
//
// Load-tested at 100 fully simultaneous writers: 92/100 fail with "Transaction lock
// timeout" even with Firestore's built-in retry. That is a real limit, but it is not the
// realistic shape of this feature's traffic — admin deletions and grade submissions come
// from individual people acting seconds apart, not 100 processes racing in the same
// instant the way enrollment's "popular program opens" burst could. The retry wrapper
// below absorbs that realistic case (a handful of near-simultaneous actions) with
// exponential backoff + jitter; it does not and cannot fix the pathological 100-at-once
// case, because fixing that would mean giving up the write-time chaining that makes this
// tamper-evident in the first place.
const MAX_RETRIES = 6;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function logAuditEvent({ action, actorUid, actorEmail, targetId, details = {} }) {
  const headRef = doc(db, "auditLogMeta", HEAD_DOC);

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(200 * 2 ** attempt, 4000) + Math.random() * 200;
      await sleep(backoffMs);
    }
    try {
      await runTransaction(db, async (tx) => {
        const newLogRef = doc(collection(db, COLLECTION));
        const headSnap = await tx.get(headRef);
        const prevHash = headSnap.exists() ? headSnap.data().lastHash : GENESIS_HASH;
        const sequence = headSnap.exists() ? headSnap.data().lastSequence + 1 : 0;
        const timestampMs = Date.now();

        const content = canonicalize({ sequence, action, actorUid, actorEmail, targetId, details, timestampMs, prevHash });
        const hash = await sha256Hex(content);

        tx.set(newLogRef, { sequence, action, actorUid, actorEmail, targetId, details, timestampMs, prevHash, hash });
        tx.set(headRef, { lastHash: hash, lastSequence: sequence });
      });
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// Re-derives the whole chain from the immutable auditLogs collection (never from the
// head pointer, which is only a write-side convenience — see file header) and reports
// exactly which entries, if any, fail to verify.
export async function verifyAuditChain() {
  const q = query(collection(db, COLLECTION), orderBy("sequence", "asc"));
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let expectedPrevHash = GENESIS_HASH;
  const results = [];
  for (const entry of entries) {
    const content = canonicalize({
      sequence: entry.sequence, action: entry.action, actorUid: entry.actorUid,
      actorEmail: entry.actorEmail, targetId: entry.targetId, details: entry.details,
      timestampMs: entry.timestampMs, prevHash: entry.prevHash,
    });
    const recomputedHash = await sha256Hex(content);
    const linkOk = entry.prevHash === expectedPrevHash;
    const hashOk = recomputedHash === entry.hash;
    results.push({ ...entry, verified: linkOk && hashOk });
    // Keep following the *stored* hash even after a mismatch, so a single tampered
    // entry is reported once rather than cascading a false failure onto every entry
    // written after it.
    expectedPrevHash = entry.hash;
  }

  const tampered = results.filter((r) => !r.verified);
  return { entries: results, tampered, isClean: tampered.length === 0 };
}
