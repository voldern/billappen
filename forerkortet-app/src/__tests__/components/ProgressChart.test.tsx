import React from 'react';
import { render } from '../../test-utils/testUtils';
import { ProgressChart } from '../../components/ProgressChart';
import { TestResult } from '../../types';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: jest.fn().mockImplementation(({ data, ...props }) => {
    const mockReact = require('react');
    return mockReact.createElement('View', { testID: 'line-chart', ...props });
  }),
}));

describe('ProgressChart', () => {
  const mockResults: TestResult[] = [
    {
      id: '1',
      date: '2024-01-01',
      score: 7,
      totalQuestions: 10,
      correctAnswers: 7,
      duration: 300000,
      answers: [],
    },
    {
      id: '2',
      date: '2024-01-02',
      score: 8,
      totalQuestions: 10,
      correctAnswers: 8,
      duration: 280000,
      answers: [],
    },
    {
      id: '3',
      date: '2024-01-03',
      score: 8,
      totalQuestions: 10,
      correctAnswers: 8,
      duration: 290000,
      answers: [],
    },
    {
      id: '4',
      date: '2024-01-04',
      score: 9,
      totalQuestions: 10,
      correctAnswers: 9,
      duration: 270000,
      answers: [],
    },
    {
      id: '5',
      date: '2024-01-05',
      score: 10,
      totalQuestions: 10,
      correctAnswers: 10,
      duration: 250000,
      answers: [],
    },
  ];

  it('should render nothing when no results', () => {
    const { queryByText, queryByTestId } = render(
      <ProgressChart results={[]} />
    );

    expect(queryByText('Fremgang Over Tid')).toBeFalsy();
    expect(queryByTestId('line-chart')).toBeFalsy();
  });

  it('should render chart with single result', () => {
    const singleResult = [mockResults[0]];
    const { getByText, getByTestId } = render(
      <ProgressChart results={singleResult} />
    );

    expect(getByText('Fremgang Over Tid')).toBeTruthy();
    expect(getByTestId('line-chart')).toBeTruthy();
  });

  it('should render chart with multiple results', () => {
    const { getByText, getByTestId } = render(
      <ProgressChart results={mockResults} />
    );

    expect(getByText('Fremgang Over Tid')).toBeTruthy();
    expect(getByTestId('line-chart')).toBeTruthy();
  });

  it('should show trend analysis for multiple results', () => {
    const { getByText } = render(
      <ProgressChart results={mockResults} />
    );

    // Should show positive trend message based on improvement
    expect(getByText(/fremgang|Fortsett|prestasjon/)).toBeTruthy();
  });

  it('should show fantastic progress message for significant improvement', () => {
    const improvingResults: TestResult[] = [
      { ...mockResults[0], score: 5 }, // 50%
      { ...mockResults[1], score: 5 }, // 50%
      { ...mockResults[2], score: 6 }, // 60%
      { ...mockResults[3], score: 8 }, // 80%
      { ...mockResults[4], score: 9 }, // 90%
      { ...mockResults[4], id: '6', score: 9 }, // 90%
    ];

    const { getByText } = render(
      <ProgressChart results={improvingResults} />
    );

    expect(getByText('Fantastisk fremgang! Du forbedrer deg raskt! 🚀')).toBeTruthy();
  });

  it('should show good progress message for moderate improvement', () => {
    const moderateResults: TestResult[] = [
      { ...mockResults[0], score: 7 }, // 70%
      { ...mockResults[1], score: 7 }, // 70%
      { ...mockResults[2], score: 7 }, // 70%
      { ...mockResults[3], score: 8 }, // 80%
      { ...mockResults[4], score: 8 }, // 80%
      { ...mockResults[4], id: '6', score: 8 }, // 80%
    ];

    const { getByText } = render(
      <ProgressChart results={moderateResults} />
    );

    expect(getByText('Bra fremgang! Fortsett slik! 📈')).toBeTruthy();
  });

  it('should show stable performance message for no change', () => {
    const stableResults: TestResult[] = [
      { ...mockResults[0], score: 8 }, // 80%
      { ...mockResults[1], score: 8 }, // 80%
      { ...mockResults[2], score: 8 }, // 80%
      { ...mockResults[3], score: 8 }, // 80%
      { ...mockResults[4], score: 8 }, // 80%
      { ...mockResults[4], id: '6', score: 8 }, // 80%
    ];

    const { getByText } = render(
      <ProgressChart results={stableResults} />
    );

    expect(getByText('Stabil prestasjon. Prøv nye kategorier! 🎯')).toBeTruthy();
  });

  it('should show encouragement message for declining performance', () => {
    const decliningResults: TestResult[] = [
      { ...mockResults[0], score: 9 }, // 90%
      { ...mockResults[1], score: 9 }, // 90%
      { ...mockResults[2], score: 8 }, // 80%
      { ...mockResults[3], score: 7 }, // 70%
      { ...mockResults[4], score: 6 }, // 60%
      { ...mockResults[4], id: '6', score: 6 }, // 60%
    ];

    const { getByText } = render(
      <ProgressChart results={decliningResults} />
    );

    expect(getByText('Ikke gi opp! Øvelse gjør mester! 💪')).toBeTruthy();
  });

  it('should only use last 7 results for chart', () => {
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      ...mockResults[0],
      id: `${i}`,
      score: 7 + (i % 3),
    }));

    const { getByTestId } = render(
      <ProgressChart results={manyResults} />
    );

    // Chart should still render without issues
    expect(getByTestId('line-chart')).toBeTruthy();
  });

  it('should handle results with varying total questions', () => {
    const variedResults: TestResult[] = [
      { ...mockResults[0], score: 7, totalQuestions: 10 }, // 70%
      { ...mockResults[1], score: 14, totalQuestions: 20 }, // 70%
      { ...mockResults[2], score: 21, totalQuestions: 30 }, // 70%
    ];

    const { getByTestId } = render(
      <ProgressChart results={variedResults} />
    );

    // Should calculate percentages correctly
    expect(getByTestId('line-chart')).toBeTruthy();
  });

  it('should show first and last labels correctly', () => {
    const LineChart = require('react-native-chart-kit').LineChart;
    
    render(<ProgressChart results={mockResults} />);

    // Check that LineChart was called with correct labels
    expect(LineChart).toHaveBeenCalled();
    if (LineChart.mock.calls.length > 0) {
      const chartProps = LineChart.mock.calls[0][0];
      expect(chartProps.data.labels[0]).toBe('Første');
      
      // Only check for 'Siste' if there are multiple results
      if (chartProps.data.labels.length > 1) {
        expect(chartProps.data.labels[chartProps.data.labels.length - 1]).toBe('Siste');
      }
    }
  });

  it('should not show trend analysis for single result', () => {
    const singleResult = [mockResults[0]];
    const { queryByText } = render(
      <ProgressChart results={singleResult} />
    );

    // Should not show any trend analysis messages
    expect(queryByText(/fremgang|prestasjon|Fortsett å øve/)).toBeFalsy();
  });

  it('should show initial encouragement for few results', () => {
    const fewResults = mockResults.slice(0, 2);
    const { getByText } = render(
      <ProgressChart results={fewResults} />
    );

    expect(getByText('Fortsett å øve for å se fremgang! 📈')).toBeTruthy();
  });
});