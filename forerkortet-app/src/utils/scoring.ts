export const calculatePercentage = (score: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
};

export const getScoreColor = (percentage: number): string => {
  if (percentage >= 90) return '#10b981';
  if (percentage >= 75) return '#f59e0b';
  return '#ef4444';
};

export const isPassed = (percentage: number): boolean => {
  return percentage >= 85;
};

export const getMotivationalMessage = (percentage: number): string => {
  if (percentage === 100) return 'Perfekt! Du mestrer stoffet! 🌟';
  if (percentage >= 90) return 'Utmerket! Du er nesten klar for eksamen! 🎯';
  if (percentage >= 85) return 'Bra jobbet! Du har god kontroll! 👏';
  if (percentage >= 75) return 'Godt forsøk! Fortsett å øve! 💪';
  if (percentage >= 50) return 'På rett vei! Ikke gi opp! 📚';
  return 'Rom for forbedring. Øv mer og prøv igjen! 🚀';
};

export const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes} min ${seconds} sek`;
};

export const calculateAverageTimePerQuestion = (duration: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return Math.round(duration / totalQuestions / 1000);
};