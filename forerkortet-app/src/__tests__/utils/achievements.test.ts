import {
  achievements,
  checkAchievements,
  getNewlyUnlockedAchievements,
  getAchievementMessage,
  UserStats,
} from '../../utils/achievements';

describe('achievements utilities', () => {
  describe('checkAchievements', () => {
    it('should mark first test achievement as unlocked', () => {
      const stats: UserStats = {
        totalTests: 1,
        perfectTests: 0,
        totalQuestions: 10,
        correctAnswers: 8,
        averageScore: 80,
        streak: 0,
      };

      const checkedAchievements = checkAchievements(stats);
      const firstTest = checkedAchievements.find((a) => a.id === 'first_test');

      expect(firstTest?.unlocked).toBe(true);
    });

    it('should mark perfect score achievement as unlocked', () => {
      const stats: UserStats = {
        totalTests: 1,
        perfectTests: 1,
        totalQuestions: 10,
        correctAnswers: 10,
        averageScore: 100,
        streak: 0,
      };

      const checkedAchievements = checkAchievements(stats);
      const perfectScore = checkedAchievements.find((a) => a.id === 'perfect_score');

      expect(perfectScore?.unlocked).toBe(true);
    });

    it('should mark multiple achievements as unlocked', () => {
      const stats: UserStats = {
        totalTests: 10,
        perfectTests: 2,
        totalQuestions: 100,
        correctAnswers: 90,
        averageScore: 90,
        streak: 7,
      };

      const checkedAchievements = checkAchievements(stats);
      const unlockedCount = checkedAchievements.filter((a) => a.unlocked).length;

      expect(unlockedCount).toBeGreaterThan(5);
    });

    it('should not unlock high average achievement with less than 5 tests', () => {
      const stats: UserStats = {
        totalTests: 4,
        perfectTests: 0,
        totalQuestions: 40,
        correctAnswers: 38,
        averageScore: 95,
        streak: 0,
      };

      const checkedAchievements = checkAchievements(stats);
      const highAverage = checkedAchievements.find((a) => a.id === 'high_average');

      expect(highAverage?.unlocked).toBe(false);
    });
  });

  describe('getNewlyUnlockedAchievements', () => {
    it('should identify newly unlocked achievements', () => {
      const oldStats: UserStats = {
        totalTests: 4,
        perfectTests: 0,
        totalQuestions: 40,
        correctAnswers: 32,
        averageScore: 80,
        streak: 0,
      };

      const newStats: UserStats = {
        totalTests: 5,
        perfectTests: 0,
        totalQuestions: 50,
        correctAnswers: 42,
        averageScore: 84,
        streak: 0,
      };

      const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats);
      const fiveTests = newlyUnlocked.find((a) => a.id === 'five_tests');

      expect(newlyUnlocked).toHaveLength(1);
      expect(fiveTests).toBeDefined();
    });

    it('should return empty array when no new achievements', () => {
      const stats: UserStats = {
        totalTests: 3,
        perfectTests: 0,
        totalQuestions: 30,
        correctAnswers: 24,
        averageScore: 80,
        streak: 0,
      };

      const newlyUnlocked = getNewlyUnlockedAchievements(stats, stats);

      expect(newlyUnlocked).toHaveLength(0);
    });

    it('should identify multiple newly unlocked achievements', () => {
      const oldStats: UserStats = {
        totalTests: 0,
        perfectTests: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        streak: 0,
      };

      const newStats: UserStats = {
        totalTests: 1,
        perfectTests: 1,
        totalQuestions: 10,
        correctAnswers: 10,
        averageScore: 100,
        streak: 1,
      };

      const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats);

      expect(newlyUnlocked.length).toBeGreaterThanOrEqual(2);
      expect(newlyUnlocked.some((a) => a.id === 'first_test')).toBe(true);
      expect(newlyUnlocked.some((a) => a.id === 'perfect_score')).toBe(true);
    });
  });

  describe('getAchievementMessage', () => {
    it('should return perfect message for 100% score', () => {
      const message = getAchievementMessage(10, 10);
      expect(message).toBe('🏆 Perfekt! Du klarte alle riktig!');
    });

    it('should return appropriate message for 90-99% score', () => {
      const message = getAchievementMessage(9, 10);
      expect(message).toBe('🌟 Fremragende! Nesten perfekt!');
    });

    it('should return appropriate message for 80-89% score', () => {
      const message = getAchievementMessage(8, 10);
      expect(message).toBe('✨ Veldig bra! Du mestrer dette!');
    });

    it('should return appropriate message for 70-79% score', () => {
      const message = getAchievementMessage(7, 10);
      expect(message).toBe('💪 Godt jobbet! Fortsett slik!');
    });

    it('should return appropriate message for 60-69% score', () => {
      const message = getAchievementMessage(6, 10);
      expect(message).toBe('👍 Bra innsats! Rom for forbedring.');
    });

    it('should return appropriate message for 50-59% score', () => {
      const message = getAchievementMessage(5, 10);
      expect(message).toBe('📚 Halvveis der! Øv litt mer.');
    });

    it('should return appropriate message for below 50% score', () => {
      const message = getAchievementMessage(4, 10);
      expect(message).toBe('🎯 Ikke gi opp! Øvelse gjør mester!');
    });

    it('should handle edge cases', () => {
      const message1 = getAchievementMessage(0, 10);
      expect(message1).toBe('🎯 Ikke gi opp! Øvelse gjør mester!');

      const message2 = getAchievementMessage(0, 0);
      expect(message2).toBe('🎯 Ikke gi opp! Øvelse gjør mester!');
    });
  });

  describe('achievement definitions', () => {
    it('should have all required properties', () => {
      achievements.forEach((achievement) => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('title');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('color');
        expect(achievement).toHaveProperty('condition');
        expect(typeof achievement.condition).toBe('function');
      });
    });

    it('should have unique IDs', () => {
      const ids = achievements.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(achievements.length);
    });
  });
});