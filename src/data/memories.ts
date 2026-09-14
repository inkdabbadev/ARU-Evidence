/**
 * ══════════════════════════════════════════════════════════════
 *  CASE #2711 — CENTRAL CONTENT FILE  (v2 — "The Missing Pieces")
 * ══════════════════════════════════════════════════════════════
 *  Every personalised word in this project lives here. Edit
 *  freely — nothing outside this file needs to change to reflect
 *  new content. Keep array lengths the same unless a comment
 *  says otherwise.
 * ══════════════════════════════════════════════════════════════
 */

export const NAMES = {
  detective: "Aaru",
  detectiveFull: "Aarushi",
  suspect: "Bhuvi",
};

export const TOTAL_PIECES = 6;

/* ────────────────────────────────────────────────────────────
   OPENING
──────────────────────────────────────────────────────────── */
export const opening = {
  noteLines: ["Aaru, you left something unfinished.", "Again."],
  beginLabel: "obviously I did",
  objectiveIntro:
    "Somewhere between 10739 things, shoots, meetings, house arrest, Rookie, work calls and \u201Cwill tell you later\u201D\u2026",
  objectiveLine: "a few pieces seem to have gone missing.",
  objective: "Find 6 missing pieces.",
  puzzleFlavor: "12/1000 \u2014 relax, she said it takes time.",
};

/* Labels for the 6 pieces, used in progress + final assembly */
export const PIECE_TITLES = [
  "The 10-Mark Question",
  "The Bookstore Incident",
  "The Connections Board",
  "The Little Things",
  "Later",
  "Do Nothing",
];

/* ────────────────────────────────────────────────────────────
   PIECE 1 — THE 10-MARK QUESTION
──────────────────────────────────────────────────────────── */
export const piece1 = {
  question: "How was your trip?",
  marks: "3 marks",
  options: [
    { id: "a", text: "Good only" },
    {
      id: "b",
      text: "Mountains. Monkeys. Snoring roommates. Divorced-people support group. 47 open brain tabs.",
    },
    { id: "c", text: "Detailed report available over coffee." },
    { id: "d", text: "All of the above" },
  ],
  correct: "d",
  stamp: "10/10",
  caption: "Some stories apparently deserve the full answer.",
};

/* ────────────────────────────────────────────────────────────
   PIECE 2 — ROOKIE × SHERLOCK
   Sort each clue onto the correct shelf.
──────────────────────────────────────────────────────────── */
export const piece2 = {
  shelves: [
    { id: "rookie", label: "BHUVI RECOMMENDS", show: "The Rookie" },
    { id: "sherlock", label: "AARU RECOMMENDS", show: "Sherlock" },
  ],
  clues: [
    { id: "c1", text: "Officer Nolan", show: "rookie" },
    { id: "c2", text: "221B Baker Street", show: "sherlock" },
    { id: "c3", text: "LAPD Training Officer", show: "rookie" },
    { id: "c4", text: "The Reichenbach Fall", show: "sherlock" },
  ],
  nolanEggThreshold: 3,
  nolanEgg: "Btw Nolan update\u2026 Armstrong ended up being a snake.",
  unlockLabel: "LIVE UPDATES UNLOCKED",
  chatLines: ["\u201CI need live updates of what you think.\u201D", "\u201CBtw Nolan update\u2026\u201D"],
  caption:
    "Apparently we have always been very good at keeping each other updated about completely unnecessary things.",
};

/* ────────────────────────────────────────────────────────────
   PIECE 3 — THE CONNECTIONS BOARD
──────────────────────────────────────────────────────────── */
export const connectionsGroups = [
  {
    id: "offscreen",
    label: "AARU OFF-SCREEN LIFE",
    color: "#8a6a9e",
    words: ["PUZZLE", "BOOK", "SKETCH", "MUFFY"],
  },
  {
    id: "interrupting",
    label: "THINGS THAT KEEP INTERRUPTING US",
    color: "#a63d33",
    words: ["SHOOT", "MEETING", "CALL", "DEADLINE"],
  },
  {
    id: "waiting",
    label: "RANDOM AARU THINGS",
    color: "#3a5a70",
    words: ["RANDOM UPDATE", "VOICE NOTE", "PHOTO", "HOW WAS YOUR DAY?"],
  },
  {
    id: "brainoff",
    label: "THIS COUNTS AS A PLAN",
    color: "#5f7a52",
    words: ["COFFEE", "EXPLORE CAFÉS", "DO NOTHING", "BOOKSTORE"],
  },
];

export const piece3Caption = {
  title: "Connections found.",
  body: "Conversation completion rate: still questionable. \uD83D\uDE02",
};

/* ────────────────────────────────────────────────────────────
   PIECE 4 — HOUSE ARREST
   A short memory-pattern lock (same mechanic as an escape room
   keypad) themed as unlocking the door.
──────────────────────────────────────────────────────────── */
export const piece4 = {
  doorLabel: "AMMA-APPROVED HOUSE ARREST\u2122",
  items: [
    { id: "meds", emoji: "\uD83D\uDC8A", label: "Meds" },
    { id: "pillow", emoji: "\uD83D\uDECB\uFE0F", label: "Pillow" },
    { id: "book", emoji: "\uD83D\uDCD6", label: "Book" },
    { id: "puzzle", emoji: "\uD83E\uDDE9", label: "Puzzle" },
    { id: "phone", emoji: "\uD83D\uDCF1", label: "Phone" },
    { id: "coffee", emoji: "\u2615", label: "Coffee cup, outside the window" },
  ],
  lockPatternLength: 4,
  unlockedLabel: "DOOR UNLOCKED",
  doctorLine: "Doctor says no. \uD83D\uDE2D",
  earliestActivityLabel: "Earliest permitted activity:",
  earliestActivity: "sit somewhere and talk for an unreasonable amount of time",
  hiddenCallback: "Firm Foundation coffee unlocked.",
  coffeeTooltip: "Detailed report available.",
};

/* ────────────────────────────────────────────────────────────
   PIECE 5 — "LATER"
   Messages pile up automatically, then overflow.
──────────────────────────────────────────────────────────── */
export const piece5 = {
  pileMessages: [
    "Will talk later.",
    "I have follow-up questions, will ask later.",
    "Tell me when free.",
    "Waiting to hear.",
    "I'll show you later.",
    "Can we do later?",
    "Will reply to everything later.",
  ],
  overflowLabel: "LATER OVERLOAD REACHED",
  pendingLabel: "999+ pending",
  options: [
    { id: "whatsapp", label: "WHATSAPP", response: "Still not enough." },
    { id: "work", label: "WORK CALL", response: "Absolutely fucking not." },
    { id: "sitdown", label: "ONE PROPER SIT-DOWN", response: "Recommended.", correct: true },
  ],
};

/* ────────────────────────────────────────────────────────────
   PIECE 6 — DO NOTHING
──────────────────────────────────────────────────────────── */
export const piece6 = {
  quoteMine: "\u201CI wish I was there to just coexist and do nothing.\u201D",
  quoteHer: "\u201CHAHA yess me too, good company does go a long way.\u201D",
  batteryLabel: "17%",
  instruction: "Do nothing for 10 seconds.",
  waitSeconds: 10,
  revealLines: ["Sometimes that was the whole point.", "Good company does go a long way."],
};

/* ────────────────────────────────────────────────────────────
   FINAL PUZZLE — assemble the 6 pieces
──────────────────────────────────────────────────────────── */
export const finalPuzzle = {
  instruction: "Bring the pieces together. There’s a whole picture waiting to be found.",
  revealWord: "TIME",
  captionLines: [
    "Weird.",
    "We talk almost every day.",
    "And somehow this is still the missing piece.",
  ],
};

/* ────────────────────────────────────────────────────────────
   FINAL ROOM — the full emotional message.
   Rendered as progressive reveal, one block at a time.
──────────────────────────────────────────────────────────── */
export const finalMessageBlocks: string[][] = [
  ["Hey Aaru."],
  ["I miss you, man."],
  ["And the stupid part is \u2014 we talk almost every day."],
  ["We check on each other.", "We send random updates.", "We know what's happening."],
  ["I don't feel like you've disappeared."],
  ["I just feel like we have accumulated an absurd number of half-finished conversations."],
  ["\u201CWill tell you later.\u201D", "\u201CWaiting to hear.\u201D", "\u201CWe'll talk when you're free.\u201D", "\u201CNeed to tell you this properly.\u201D"],
  ["And apparently later is full now."],
  ["I miss actually sitting with you."],
  ["Not for work.", "Not between two things.", "Just talking."],
  ["Or honestly, even just coexisting and doing nothing."],
  ["So I'm finally claiming my birthday present."],
];

export const giftReveal = {
  foundLabel: "ALL SIX PIECES ACCOUNTED FOR.",
  openLabel: "OPEN",
  title: "\uD83C\uDF81 ONE PROPER AARU \u00D7 BHUVI DAY",
  requirements: ["No work", "No agenda", "No 20-minute deadline", "Stories mandatory", "Random Aaru updates accepted in person"],
  claimLabel: "fine. claim it.",
  claimedStamp: "10/10",
  claimedLine: "Detailed report to be continued in person.",
};

export const caseClosed = {
  footer: "847 conversations remain pending.",
  heart: "\u2764\uFE0F",
};

/* ────────────────────────────────────────────────────────────
   EASTER EGGS
──────────────────────────────────────────────────────────── */
export const easterEggs = {
  workClickedFirst: "why you always doing 10739 things?",
  workClickedAgain: "This is literally the problem.",
  randomUpdateNotification: "Random Aaru update received +100.",
  friendshipMessage: "You aren't burdening this friendship. Speak your mind.",
  landscapeClick: "Pretty sky. Full calmness with a tint of chaos. Very Aaru coded.",
};

/* ────────────────────────────────────────────────────────────
   GAME STRUCTURE — order of rooms
──────────────────────────────────────────────────────────── */
export const ROOM_ORDER = [
  "intro",
  "piece1",
  "piece2",
  "piece3",
  "piece4",
  "piece5",
  "piece6",
  "final-puzzle",
  "final-room",
  "complete",
] as const;

export type RoomId = (typeof ROOM_ORDER)[number];
