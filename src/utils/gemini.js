// *******************Neha's part********************
//
// Free-tier LLM integration for the Komodo Hub Helper chatbot. Calls the
// Gemini API directly from the browser (no backend — this app is
// deliberately client-only) via a plain fetch, since this is a small,
// bounded Q&A call rather than a multi-turn agent. The API key is a public
// client-side value by necessity here; it MUST be restricted in Google AI
// Studio to only work from this site's HTTP referrers (see README/.env.example)
// so a leaked key can't be reused elsewhere. A per-session call cap guards
// the shared free quota from being drained by a single runaway session.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are the "Komodo Hub Helper", a support assistant embedded as a chat widget on the Komodo Hub website — an education and wildlife-conservation platform for schools.

How the site works, so you can answer accurately:
- Sign Up requires picking a category: Student, Teacher, School, Community, Community Member, or General Enthusiast. Students and Teachers also need their school's subscription code. A verification email is sent after signup and must be confirmed before login works.
- Classes are linked by a "class ID" that a teacher creates and shares with their students; entering it on a student's profile joins them to that teacher's class, classmates, assignments, and timetable.
- Messages lets students chat with classmates and their assigned teacher, and reach admins for support.
- Assignments: teachers post assignments for their own class; students upload work (PDF/DOCX) before the due date; teachers download submissions, leave feedback, and enter marks (including a mark of 0 when that's the genuine score).
- Quiz offers timed quizzes on endangered and endemic species.
- Posts and the Discussion Forum (under Library) let users share articles and discuss; student posts are always anonymous.
- The Wildlife Encyclopedia is a searchable species reference.
- Schools access the platform via a paid subscription tied to their school code; a school's subscription status is visible on the Profile page.
- Login help: "Forgot Password?" sends a reset link; "Resend Verification Email" resends the verification link for an unverified account.

Answer only questions about how to use the Komodo Hub website. Keep answers short — 2-4 sentences, plain text, no markdown, no headers. If asked something with no connection to Komodo Hub, politely say you can only help with Komodo Hub questions and suggest contacting an admin via Messages for anything else.`;

const SESSION_LIMIT = 15;
let sessionCallCount = 0;

export async function askKomodoAssistant(question) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return "The AI assistant isn't set up yet — please pick a topic from the menu above, or message an admin from the Messages page.";
  }

  if (sessionCallCount >= SESSION_LIMIT) {
    return "I've reached my question limit for this chat session — please pick a topic from the menu above, or message an admin from the Messages page for anything else.";
  }
  sessionCallCount += 1;

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return (
      text?.trim() ||
      "I couldn't find a good answer for that — try rephrasing, or pick a topic from the menu above."
    );
  } catch (err) {
    console.error("Gemini request failed:", err);
    return "I'm having trouble reaching my AI brain right now — try a topic from the menu above, or message an admin from Messages.";
  }
}
