import { Question, TestResult } from '../types';

interface QuestionSelectionConfig {
  targetCount: number;
  unseenPercentage: number;
  allQuestions: Question[];
  previousResults: TestResult[];
}

interface CategoryQuestionGroup {
  categoryId: string;
  questions: Question[];
}

/**
 * Smart question selection algorithm that:
 * 1. Prioritizes unseen questions (80% until all seen)
 * 2. Ensures balanced distribution across categories
 * 3. Falls back to random selection when all questions have been seen
 */
export function selectSmartQuestions({
  targetCount,
  unseenPercentage,
  allQuestions,
  previousResults,
}: QuestionSelectionConfig): Question[] {
  // Extract all previously answered question IDs
  const answeredQuestionIds = new Set<string>();
  previousResults.forEach(result => {
    result.answers?.forEach(answer => {
      answeredQuestionIds.add(answer.questionId);
    });
  });

  // Separate questions into seen and unseen
  const unseenQuestions = allQuestions.filter(q => !answeredQuestionIds.has(q.id));
  const seenQuestions = allQuestions.filter(q => answeredQuestionIds.has(q.id));

  // Group questions by category
  const groupByCategory = (questions: Question[]): Map<string, Question[]> => {
    const categoryMap = new Map<string, Question[]>();
    questions.forEach(q => {
      if (!categoryMap.has(q.category)) {
        categoryMap.set(q.category, []);
      }
      categoryMap.get(q.category)!.push(q);
    });
    return categoryMap;
  };

  const unseenByCategory = groupByCategory(unseenQuestions);
  const seenByCategory = groupByCategory(seenQuestions);
  const allCategories = new Set([...unseenByCategory.keys(), ...seenByCategory.keys()]);

  // Calculate how many questions we want from each source
  const targetUnseenCount = Math.min(
    Math.floor(targetCount * unseenPercentage),
    unseenQuestions.length
  );
  const targetSeenCount = targetCount - targetUnseenCount;

  // Select questions with balanced category distribution
  const selectBalancedQuestions = (
    categoryMap: Map<string, Question[]>,
    count: number
  ): Question[] => {
    const selected: Question[] = [];
    const categories = Array.from(categoryMap.keys());
    
    if (categories.length === 0) return [];

    // Calculate questions per category
    const basePerCategory = Math.floor(count / categories.length);
    const remainder = count % categories.length;

    // Shuffle categories for fair distribution of remainder
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);

    shuffledCategories.forEach((category, index) => {
      const categoryQuestions = categoryMap.get(category) || [];
      const questionsToTake = basePerCategory + (index < remainder ? 1 : 0);
      
      // Shuffle and take the required number from this category
      const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, Math.min(questionsToTake, shuffled.length)));
    });

    return selected;
  };

  // Select unseen questions with category balance
  const selectedUnseen = selectBalancedQuestions(unseenByCategory, targetUnseenCount);

  // Select seen questions with category balance
  const selectedSeen = selectBalancedQuestions(seenByCategory, targetSeenCount);

  // Combine and shuffle final selection
  const finalSelection = [...selectedUnseen, ...selectedSeen];
  
  // If we don't have enough questions, fill from all available questions
  if (finalSelection.length < targetCount) {
    const remainingNeeded = targetCount - finalSelection.length;
    const usedIds = new Set(finalSelection.map(q => q.id));
    const remainingQuestions = allQuestions.filter(q => !usedIds.has(q.id));
    const shuffledRemaining = [...remainingQuestions].sort(() => Math.random() - 0.5);
    finalSelection.push(...shuffledRemaining.slice(0, remainingNeeded));
  }

  // Final shuffle to mix seen and unseen questions
  return finalSelection.sort(() => Math.random() - 0.5).slice(0, targetCount);
}

/**
 * Get statistics about question usage
 */
export function getQuestionStatistics(
  allQuestions: Question[],
  previousResults: TestResult[]
): {
  totalQuestions: number;
  seenQuestions: number;
  unseenQuestions: number;
  percentageSeen: number;
  categoryCoverage: Map<string, { seen: number; total: number }>;
} {
  const answeredQuestionIds = new Set<string>();
  previousResults.forEach(result => {
    result.answers?.forEach(answer => {
      answeredQuestionIds.add(answer.questionId);
    });
  });

  const categoryCoverage = new Map<string, { seen: number; total: number }>();
  
  allQuestions.forEach(question => {
    if (!categoryCoverage.has(question.category)) {
      categoryCoverage.set(question.category, { seen: 0, total: 0 });
    }
    const stats = categoryCoverage.get(question.category)!;
    stats.total++;
    if (answeredQuestionIds.has(question.id)) {
      stats.seen++;
    }
  });

  const seenQuestions = allQuestions.filter(q => answeredQuestionIds.has(q.id)).length;

  return {
    totalQuestions: allQuestions.length,
    seenQuestions,
    unseenQuestions: allQuestions.length - seenQuestions,
    percentageSeen: (seenQuestions / allQuestions.length) * 100,
    categoryCoverage,
  };
}