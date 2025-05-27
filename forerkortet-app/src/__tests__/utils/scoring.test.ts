import {
  calculatePercentage,
  getScoreColor,
  isPassed,
  getMotivationalMessage,
  formatDuration,
  calculateAverageTimePerQuestion
} from '../../utils/scoring';

describe('scoring utilities', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(8, 10)).toBe(80);
      expect(calculatePercentage(9, 10)).toBe(90);
      expect(calculatePercentage(10, 10)).toBe(100);
      expect(calculatePercentage(0, 10)).toBe(0);
    });

    it('should handle division by zero', () => {
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('should round percentages', () => {
      expect(calculatePercentage(7, 9)).toBe(78); // 77.78 rounds to 78
    });
  });

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getScoreColor(90)).toBe('#10b981');
      expect(getScoreColor(95)).toBe('#10b981');
      expect(getScoreColor(100)).toBe('#10b981');
    });

    it('should return yellow for medium scores', () => {
      expect(getScoreColor(75)).toBe('#f59e0b');
      expect(getScoreColor(80)).toBe('#f59e0b');
      expect(getScoreColor(89)).toBe('#f59e0b');
    });

    it('should return red for low scores', () => {
      expect(getScoreColor(0)).toBe('#ef4444');
      expect(getScoreColor(50)).toBe('#ef4444');
      expect(getScoreColor(74)).toBe('#ef4444');
    });
  });

  describe('isPassed', () => {
    it('should return true for scores >= 85%', () => {
      expect(isPassed(85)).toBe(true);
      expect(isPassed(90)).toBe(true);
      expect(isPassed(100)).toBe(true);
    });

    it('should return false for scores < 85%', () => {
      expect(isPassed(84)).toBe(false);
      expect(isPassed(50)).toBe(false);
      expect(isPassed(0)).toBe(false);
    });
  });

  describe('getMotivationalMessage', () => {
    it('should return appropriate messages based on score', () => {
      expect(getMotivationalMessage(100)).toBe('Perfekt! Du mestrer stoffet! 🌟');
      expect(getMotivationalMessage(92)).toBe('Utmerket! Du er nesten klar for eksamen! 🎯');
      expect(getMotivationalMessage(87)).toBe('Bra jobbet! Du har god kontroll! 👏');
      expect(getMotivationalMessage(78)).toBe('Godt forsøk! Fortsett å øve! 💪');
      expect(getMotivationalMessage(60)).toBe('På rett vei! Ikke gi opp! 📚');
      expect(getMotivationalMessage(40)).toBe('Rom for forbedring. Øv mer og prøv igjen! 🚀');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(0)).toBe('0 min 0 sek');
      expect(formatDuration(30000)).toBe('0 min 30 sek');
      expect(formatDuration(60000)).toBe('1 min 0 sek');
      expect(formatDuration(90000)).toBe('1 min 30 sek');
      expect(formatDuration(125000)).toBe('2 min 5 sek');
    });
  });

  describe('calculateAverageTimePerQuestion', () => {
    it('should calculate average time correctly', () => {
      expect(calculateAverageTimePerQuestion(60000, 10)).toBe(6); // 6 seconds
      expect(calculateAverageTimePerQuestion(300000, 10)).toBe(30); // 30 seconds
      expect(calculateAverageTimePerQuestion(120000, 5)).toBe(24); // 24 seconds
    });

    it('should handle division by zero', () => {
      expect(calculateAverageTimePerQuestion(60000, 0)).toBe(0);
    });
  });
});