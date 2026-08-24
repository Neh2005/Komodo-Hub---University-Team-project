import md5 from "md5";

// Public-API-based default avatar (Gravatar) — given an email, returns a real image
// instead of a generic placeholder icon. Gravatar's own `d=identicon` falls back to a
// deterministic geometric pattern for any email that doesn't have a Gravatar photo set,
// so this always returns something real rather than ever needing a second fallback.
export const getGravatarUrl = (email, size = 200) => {
  if (!email) return null;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};
