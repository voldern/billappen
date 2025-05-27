export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  unlocked?: boolean;
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
    icon: '🎯',
    condition: (stats) => stats.totalTests >= 1,
  },
  {
    id: 'perfect_score',
    title: 'Perfekt!',
    description: 'Få 100% på en test',
    icon: '⭐',
    condition: (stats) => stats.perfectTests >= 1,
  },
  {
    id: 'five_tests',
    title: 'Øvelse gjør mester',
    description: 'Fullført 5 tester',
    icon: '📚',
    condition: (stats) => stats.totalTests >= 5,
  },
  {
    id: 'ten_tests',
    title: 'Dedikert student',
    description: 'Fullført 10 tester',
    icon: '🏆',
    condition: (stats) => stats.totalTests >= 10,
  },
  {
    id: 'high_average',
    title: 'Konsistent høy',
    description: 'Oppretthold 90% gjennomsnitt over 5 tester',
    icon: '💎',
    condition: (stats) => stats.totalTests >= 5 && stats.averageScore >= 90,
  },
  {
    id: 'hundred_questions',
    title: 'Kunnskapssøker',
    description: 'Besvart 100 spørsmål',
    icon: '🧠',
    condition: (stats) => stats.totalQuestions >= 100,
  },
  {
    id: 'three_day_streak',
    title: 'På rad!',
    description: '3 dager med øving på rad',
    icon: '🔥',
    condition: (stats) => stats.streak >= 3,
  },
  {
    id: 'week_streak',
    title: 'Ukens helt',
    description: '7 dager med øving på rad',
    icon: '🌟',
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