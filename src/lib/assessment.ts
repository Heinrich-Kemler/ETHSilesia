/**
 * Assessment questions. Kept separate from quests.ts so that any changes
 * here don't bloat the quest catalogue.
 */
import type { TranslationKey } from "./i18n";

export type AssessmentQuestion = {
  questionKey: TranslationKey;
  optionKeys: [TranslationKey, TranslationKey, TranslationKey, TranslationKey];
  correctIndex: 0 | 1 | 2 | 3;
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    questionKey: "aQ1",
    optionKeys: ["aQ1a", "aQ1b", "aQ1c", "aQ1d"],
    correctIndex: 1,
  },
  {
    questionKey: "aQ2",
    optionKeys: ["aQ2a", "aQ2b", "aQ2c", "aQ2d"],
    correctIndex: 1,
  },
  {
    questionKey: "aQ3",
    optionKeys: ["aQ3a", "aQ3b", "aQ3c", "aQ3d"],
    correctIndex: 1,
  },
  {
    questionKey: "aQ4",
    optionKeys: ["aQ4a", "aQ4b", "aQ4c", "aQ4d"],
    correctIndex: 1,
  },
  {
    questionKey: "aQ5",
    optionKeys: ["aQ5a", "aQ5b", "aQ5c", "aQ5d"],
    correctIndex: 1,
  },
];

/** Score → level mapping, per spec. */
export function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  return 1;
}

export function scoreToInitialXp(score: number): number {
  return score * 50;
}
