// A small profanity filter for user-submitted review text. This is a
// display-side safeguard: it masks offensive words wherever a review is shown,
// so it also covers reviews already in the database and ones posted from other
// clients — not just what this browser submits.
//
// It's intentionally a short, conservative blocklist rather than an exhaustive
// or "smart" filter. Aggressive matching creates false positives (the classic
// "Scunthorpe problem", where a clean word contains a blocked substring), which
// is worse for a reviews feed than the occasional word that slips through.

const BLOCKLIST = [
  // Common profanity.
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "piss",
  "cunt",
  "slut",
  "whore",
  "prick",
  "douche",
  // Slurs.
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "spic",
  "chink",
];

// Match a blocked word as a WHOLE word (with an optional common suffix like
// -s/-ed/-ing), case-insensitively. The \b boundaries stop clean words that
// merely contain a blocked run — "class", "assess" — from matching.
const PATTERN = new RegExp(
  `\\b(${BLOCKLIST.join("|")})(s|es|ed|ing|er)?\\b`,
  "gi",
);

// Replace each blocked word with its first letter followed by asterisks
// ("f***"), which reads as censored without printing the word. Returns the
// input unchanged when it's empty/nullish.
export function cleanText(text) {
  if (!text) return text;
  return text.replace(
    PATTERN,
    (match) => match[0] + "*".repeat(Math.max(1, match.length - 1)),
  );
}
