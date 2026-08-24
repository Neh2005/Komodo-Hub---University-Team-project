
// *******************Neha's part********************
//
// Rebuilt on react-chatbotify's actual v2 API. The previous version passed
// `assistant` / `config` / `messages` props, none of which exist on this
// library's <ChatBot> component (it only accepts id/flow/settings/styles/
// themes/plugins) — so none of that configuration ever did anything, and the
// "hi/hello/help" patterns never matched real user input. This version uses
// a real conversation `flow` with keyword-based routing, so typing a
// question (or tapping a topic button) actually answers it.

import ChatBot from "react-chatbotify";
import { askKomodoAssistant } from "../utils/gemini";
import "./Chatbot.css"; // Custom styling

const TOPICS = [
  { path: "getting_started", label: "Getting started", keywords: ["sign up", "signup", "register", "get started", "new account", "create account", "join komodo"] },
  { path: "classes", label: "Classes & class codes", keywords: ["class id", "classid", "class code", "join a class", "join my class", "which class"] },
  { path: "messaging", label: "Messaging", keywords: ["message", "messaging", "chat", "dm", "talk to", "classmate", "text my teacher"] },
  { path: "assignments", label: "Assignments", keywords: ["assignment", "homework", "submit", "upload", "due date", "deadline"] },
  { path: "grading", label: "Grades & feedback", keywords: ["grade", "grading", "marks", "mark", "feedback", "score"] },
  { path: "quizzes", label: "Quizzes", keywords: ["quiz", "quizzes", "trivia"] },
  { path: "forum", label: "Posts & discussion forum", keywords: ["forum", "discussion", "post", "anonymous", "library"] },
  { path: "wildlife", label: "Wildlife Encyclopedia", keywords: ["wildlife", "encyclopedia", "species", "animal", "endangered"] },
  { path: "subscriptions", label: "School subscriptions", keywords: ["subscription", "subscribe", "school code", "plan", "pricing", "payment", "billing"] },
  { path: "account", label: "Login & account help", keywords: ["password", "forgot password", "login", "log in", "verify", "verification", "profile", "email not verified"] },
  { path: "support", label: "Contact support", keywords: ["support", "human", "report a problem", "admin", "contact", "bug"] },
];

const GREETINGS = ["hi", "hello", "hey", "menu", "start", "help"];

// Shared router used by every block's `path` — so whether someone clicks a topic
// button or just types a question from anywhere in the flow, it lands on the
// right answer instead of dead-ending.
const routeByKeyword = (params) => {
  const input = (params.userInput || "").toLowerCase().trim();
  if (!input || GREETINGS.some((g) => input === g)) return "start";

  const backKeywords = ["back", "menu", "another question", "something else"];
  if (backKeywords.some((k) => input.includes(k))) return "start";

  const matched = TOPICS.find((t) => t.keywords.some((k) => input.includes(k)));
  return matched ? matched.path : "fallback";
};

const topicOptions = () => TOPICS.map((t) => t.label);

// Resolve a clicked option label back to its topic path (options send their label
// text as userInput, same as free-typed text, so this reuses the same lookup).
const pathFromLabel = (params) => {
  const input = params.userInput;
  const byLabel = TOPICS.find((t) => t.label === input);
  return byLabel ? byLabel.path : routeByKeyword(params);
};

const backOptions = { items: ["⬅ Back to menu"], sendOutput: false };

const flow = {
  start: {
    message: "👋 Hi! I'm the Komodo Hub Helper. Ask me a question, or pick a topic below:",
    options: topicOptions(),
    path: pathFromLabel,
  },

  getting_started: {
    message:
      "To join Komodo Hub, go to Sign Up and pick a category — Student, Teacher, School, Community, Community Member, or General Enthusiast. " +
      "Students and Teachers also need their school's code, provided by the school. After signing up you'll get a verification email — you must verify your address before you can log in.",
    options: backOptions,
    path: pathFromLabel,
  },

  classes: {
    message:
      "Classes are connected through a class ID. Your teacher creates the class and shares its class ID with you. " +
      "You enter it on your profile to join that class — it's what links you to your classmates, your assigned teacher, your assignments, and your timetable, so only enter a code your own teacher gave you.",
    options: backOptions,
    path: pathFromLabel,
  },

  messaging: {
    message:
      "Once you've joined a class, open Messages to chat with your classmates and your assigned teacher in real time. " +
      "Admins are also reachable from Messages if you need platform support.",
    options: backOptions,
    path: pathFromLabel,
  },

  assignments: {
    message:
      "Teachers post assignments for their own class under Assignments. Students upload their work (PDF/DOCX) before the due date. " +
      "Your teacher can then download your submission, leave written feedback, and enter your marks — you'll see both once they've graded it.",
    options: backOptions,
    path: pathFromLabel,
  },

  grading: {
    message:
      "Marks and feedback show up on the assignment once your teacher has graded your submission. " +
      "Teachers: open Grade Assignments from your dashboard to download a student's file, write feedback, and record marks — including a mark of 0 if that's genuinely the score.",
    options: backOptions,
    path: pathFromLabel,
  },

  quizzes: {
    message:
      "Head to Quiz from your dashboard to try timed quizzes on endangered and endemic species — answer before the timer runs out to see your score at the end.",
    options: backOptions,
    path: pathFromLabel,
  },

  forum: {
    message:
      "Posts and the Discussion Forum (under Library) are where you can share articles, start discussions, and reply to others. " +
      "Students post anonymously by design — your name is never shown on your posts.",
    options: backOptions,
    path: pathFromLabel,
  },

  wildlife: {
    message:
      "The Wildlife Encyclopedia lets you search for information on different species — a good way to learn more before tackling a quiz or writing a discussion post.",
    options: backOptions,
    path: pathFromLabel,
  },

  subscriptions: {
    message:
      "Komodo Hub is built for subscribed schools — a school signs up with its own school code, and that subscription is what gives its teachers and students full access to the platform. " +
      "Check your Profile page for your school's current subscription status.",
    options: backOptions,
    path: pathFromLabel,
  },

  account: {
    message:
      "Forgot your password? Use \"Forgot Password?\" on the Login page to get a reset link. " +
      "Seeing \"email not verified\"? Use \"Resend Verification Email\" on the Login page, then check your inbox. " +
      "You can update your profile details any time from the Profile page.",
    options: backOptions,
    path: pathFromLabel,
  },

  support: {
    message:
      "For anything I can't answer, message an admin directly from the Messages page — they're listed alongside your classmates and teacher.",
    options: backOptions,
    path: pathFromLabel,
  },

  // Anything that doesn't match a known topic keyword falls through here and is
  // answered by a real LLM call (Gemini, grounded on how Komodo Hub works — see
  // src/utils/gemini.js) instead of a dead-end message. Known topics still resolve
  // instantly via routeByKeyword above, so the LLM only spends free-tier quota on
  // genuinely novel questions.
  fallback: {
    message: async (params) => askKomodoAssistant(params.userInput),
    options: backOptions,
    path: pathFromLabel,
  },
};

const settings = {
  general: {
    primaryColor: "#6a1b9a",
    secondaryColor: "#42b0c5",
    showFooter: false,
  },
  header: {
    title: "Komodo Hub Helper",
    showAvatar: true,
  },
  tooltip: {
    mode: "start",
    text: "👋 Need help? Ask me anything about Komodo Hub!",
  },
  chatWindow: {
    defaultOpen: false,
    showScrollbar: true,
  },
  chatInput: {
    enabledPlaceholderText: "Ask a question, e.g. \"how do assignments work?\"",
  },
};

const Helperbot = () => {
  return (
    <div className="helper-chatbot-container">
      <ChatBot settings={settings} flow={flow} />
    </div>
  );
};

export default Helperbot;
