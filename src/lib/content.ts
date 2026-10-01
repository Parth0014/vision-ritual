import type { LifeArea } from "../store/types";

export interface LifeAreaMeta {
  id: LifeArea;
  label: string;
  hint: string;
  /** Base color used for tiles, rings and wallpaper. */
  color: string;
  /** Darker end of the tile gradient. */
  colorDeep: string;
}

export const LIFE_AREAS: readonly LifeAreaMeta[] = [
  { id: "career", label: "Career", hint: "internship, first job, promotion", color: "#4f5db5", colorDeep: "#2f3a86" },
  { id: "learning", label: "Learning", hint: "GATE, CAT, exams, skills", color: "#c99b3f", colorDeep: "#8f6a1f" },
  { id: "health", label: "Health", hint: "fitness, sleep, sport", color: "#5f8f6b", colorDeep: "#38603f" },
  { id: "money", label: "Money", hint: "savings, trip fund, budget", color: "#4e9b8f", colorDeep: "#2b655d" },
  { id: "travel", label: "Travel", hint: "places to see, trips", color: "#5b8cc0", colorDeep: "#33587f" },
  { id: "relationships", label: "People", hint: "family, friends, partner", color: "#c06b8b", colorDeep: "#7f3a58" },
];

export const lifeAreaLabel = (area: LifeArea): string =>
  LIFE_AREAS.find((a) => a.id === area)?.label ?? area;

export const lifeAreaMeta = (area: LifeArea): LifeAreaMeta =>
  LIFE_AREAS.find((a) => a.id === area) ?? LIFE_AREAS[0];

/** Student & placement flavoured affirmation suggestions, per life area. */
export const AFFIRMATIONS: Record<LifeArea, string[]> = {
  career: [
    "I walk into every interview prepared and calm.",
    "My work speaks before I do — I keep showing up.",
    "Rejections redirect me; the right role is close.",
  ],
  learning: [
    "Small chapters daily beat last-minute panic.",
    "I study like my admit card depends on it.",
    "Concepts stick because I revise, not just read.",
  ],
  health: [
    "My body carries my ambition — I take care of it.",
    "Strong mornings make strong semesters.",
    "Rest is part of the training plan.",
  ],
  money: [
    "Every rupee saved is a choice for my future.",
    "I spend with a plan, not on impulse.",
    "My emergency fund grows quietly every month.",
  ],
  travel: [
    "The world is wide and I am going to see it.",
    "I plan the trip; the memories plan themselves.",
    "New places, wider mind.",
  ],
  relationships: [
    "I call home before the week gets busy.",
    "Good friends are built in ordinary evenings.",
    "I am present with the people I love.",
  ],
};

/** Placeholder examples shown in the onboarding input. */
export const GOAL_PLACEHOLDERS = [
  "Crack my dream placement",
  "Score 95+ percentile in CAT",
  "Run 10km without stopping",
  "Save ₹50,000 for a Japan trip",
  "Ship my first side project",
];

/** Gentle obstacle prompts shown in the WOOP editor. */
export const OBSTACLE_PROMPTS = [
  "I procrastinate at night",
  "My phone eats my mornings",
  "I skip plans when friends call",
  "I lose steam after week two",
];

const AREA_KEYWORDS: Record<LifeArea, string[]> = {
  career: ["internship", "placement", "job", "interview", "offer", "career", "promotion", "startup", "resume", "swe", "developer", "product"],
  learning: ["gate", "cat", "gre", "gmat", "upsc", "exam", "study", "college", "university", "degree", "course", "learn", "percentile", "admit"],
  health: ["run", "marathon", "gym", "fitness", "weight", "health", "yoga", "sport", "exercise", "diet", "sleep", "walk", "km ", "10k", "half marathon"],
  money: ["save", "saving", "money", "invest", "salary", "lakh", "budget", "debt", "fund", "₹", "rs "],
  travel: ["trip", "travel", "japan", "visit", "vacation", "flight", "backpack", "tour"],
  relationships: ["family", "friend", "partner", "relationship", "marriage", "parents", "people"],
};

/** Guess the life area from free text. Falls back to "career" (the niche default). */
export const suggestLifeArea = (text: string): LifeArea => {
  const lower = ` ${text.toLowerCase()} `;
  let best: LifeArea = "career";
  let bestScore = 0;
  for (const area of LIFE_AREAS) {
    let score = 0;
    for (const kw of AREA_KEYWORDS[area.id]) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = area.id;
    }
  }
  return best;
};
