import { TestResult } from "../types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: UserStats) => boolean;
  unlocked?: boolean;
  unlockedDate?: string;
  progress?: {
    current: number;
    target: number;
  };
}

export interface UserStats {
  totalTests: number;
  perfectTests: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  streak: number;
}

export const achievements: Achievement[] = [
  {
    id: 'first_test',
    title: 'Første test!',
    description: 'Fullført din første test',
    icon: 'flag',
    color: '#10B981',
    condition: (stats) => stats.totalTests >= 1,
  },
  {
    id: 'perfect_score',
    title: 'Perfekt!',
    description: 'Få 100% på en test',
    icon: 'trophy',
    color: '#F59E0B',
    condition: (stats) => stats.perfectTests >= 1,
  },
  {
    id: 'five_tests',
    title: 'Øvelse gjør mester',
    description: 'Fullført 5 tester',
    icon: 'school',
    color: '#3B82F6',
    condition: (stats) => stats.totalTests >= 5,
  },
  {
    id: 'ten_tests',
    title: 'Dedikert student',
    description: 'Fullført 10 tester',
    icon: 'ribbon',
    color: '#8B5CF6',
    condition: (stats) => stats.totalTests >= 10,
  },
  {
    id: 'high_average',
    title: 'Konsistent høy',
    description: 'Oppretthold 90% gjennomsnitt over 5 tester',
    icon: 'star',
    color: '#EC4899',
    condition: (stats) => stats.totalTests >= 5 && stats.averageScore >= 90,
  },
  {
    id: 'hundred_questions',
    title: 'Kunnskapssøker',
    description: 'Besvart 100 spørsmål',
    icon: 'bulb',
    color: '#06B6D4',
    condition: (stats) => stats.totalQuestions >= 100,
  },
  {
    id: 'three_day_streak',
    title: 'På rad!',
    description: '3 dager med øving på rad',
    icon: 'flame',
    color: '#EF4444',
    condition: (stats) => stats.streak >= 3,
  },
  {
    id: 'week_streak',
    title: 'Ukens helt',
    description: '7 dager med øving på rad',
    icon: 'calendar',
    color: '#14B8A6',
    condition: (stats) => stats.streak >= 7,
  },
];

export const checkAchievements = (stats: UserStats): Achievement[] => {
  return achievements.map(achievement => ({
    ...achievement,
    unlocked: achievement.condition(stats),
  }));
};

export const getNewlyUnlockedAchievements = (
  oldStats: UserStats,
  newStats: UserStats
): Achievement[] => {
  const oldAchievements = checkAchievements(oldStats);
  const newAchievements = checkAchievements(newStats);
  
  return newAchievements.filter((newAch, index) => 
    newAch.unlocked && !oldAchievements[index].unlocked
  );
};

export const getAchievementMessage = (score: number, totalQuestions: number): string => {
  const percentage = (score / totalQuestions) * 100;
  
  if (percentage === 100) {
    return "🏆 Perfekt! Du klarte alle riktig!";
  } else if (percentage >= 90) {
    return "🌟 Fremragende! Nesten perfekt!";
  } else if (percentage >= 80) {
    return "✨ Veldig bra! Du mestrer dette!";
  } else if (percentage >= 70) {
    return "💪 Godt jobbet! Fortsett slik!";
  } else if (percentage >= 60) {
    return "👍 Bra innsats! Rom for forbedring.";
  } else if (percentage >= 50) {
    return "📚 Halvveis der! Øv litt mer.";
  } else {
    return "🎯 Ikke gi opp! Øvelse gjør mester!";
  }
};