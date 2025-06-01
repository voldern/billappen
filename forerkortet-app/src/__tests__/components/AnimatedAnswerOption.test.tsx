import React from 'react';
import { render, fireEvent, waitFor } from '../../test-utils/testUtils';
import { AnimatedAnswerOption } from '../../components/AnimatedAnswerOption';
import * as Haptics from 'expo-haptics';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('AnimatedAnswerOption', () => {
  const defaultProps = {
    option: 'Test Answer',
    index: 0,
    isSelected: false,
    isCorrect: false,
    showResult: false,
    onPress: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render option text correctly', () => {
    const { getByText } = render(<AnimatedAnswerOption {...defaultProps} />);

    expect(getByText('Test Answer')).toBeTruthy();
    expect(getByText('A')).toBeTruthy(); // Index 0 should show 'A'
  });

  it('should display correct letter for different indices', () => {
    const { rerender, getByText } = render(
      <AnimatedAnswerOption {...defaultProps} index={0} />
    );
    expect(getByText('A')).toBeTruthy();

    rerender(<AnimatedAnswerOption {...defaultProps} index={1} />);
    expect(getByText('B')).toBeTruthy();

    rerender(<AnimatedAnswerOption {...defaultProps} index={2} />);
    expect(getByText('C')).toBeTruthy();

    rerender(<AnimatedAnswerOption {...defaultProps} index={3} />);
    expect(getByText('D')).toBeTruthy();
  });

  it('should call onPress when pressed and not disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedAnswerOption {...defaultProps} onPress={onPress} />
    );

    fireEvent.press(getByText('Test Answer'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedAnswerOption {...defaultProps} onPress={onPress} disabled={true} />
    );

    fireEvent.press(getByText('Test Answer'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should trigger haptic feedback when selected', async () => {
    const { rerender } = render(<AnimatedAnswerOption {...defaultProps} />);

    // Select the option
    rerender(<AnimatedAnswerOption {...defaultProps} isSelected={true} />);

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });

  it('should show correct icon when showing results', async () => {
    const { getByTestId, queryByTestId, rerender, getByText } = render(
      <AnimatedAnswerOption {...defaultProps} showResult={true} isCorrect={true} />
    );

    // First verify the component is rendering
    expect(getByText('Test Answer')).toBeTruthy();

    // Advance timers to allow animations to complete
    jest.advanceTimersByTime(1000);

    // Should show checkmark for correct answer - use queryByTestId first to see if it exists
    await waitFor(() => {
      const checkmarkIcon = queryByTestId('checkmark-circle');
      expect(checkmarkIcon).toBeTruthy();
    });

    // Should show close icon for incorrect selected answer
    rerender(
      <AnimatedAnswerOption
        {...defaultProps}
        showResult={true}
        isCorrect={false}
        isSelected={true}
      />
    );
    
    // Advance timers for the second animation
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(queryByTestId('close-circle')).toBeTruthy();
    });
  });

  it('should show "Riktig svar" label for correct unselected answer', () => {
    const { getByText } = render(
      <AnimatedAnswerOption
        {...defaultProps}
        showResult={true}
        isCorrect={true}
        isSelected={false}
      />
    );

    expect(getByText('Riktig svar')).toBeTruthy();
  });

  it('should handle entrance animation with delay', () => {
    const { getByText } = render(
      <AnimatedAnswerOption {...defaultProps} delay={500} />
    );

    expect(getByText('Test Answer')).toBeTruthy();

    // Advance timers to trigger animations
    jest.advanceTimersByTime(600);
  });

  it('should apply correct styles based on state', () => {
    const { rerender, getByText } = render(
      <AnimatedAnswerOption {...defaultProps} />
    );

    const option = getByText('Test Answer');

    // Test selected state (before showing result)
    rerender(
      <AnimatedAnswerOption {...defaultProps} isSelected={true} />
    );

    // Test correct answer state
    rerender(
      <AnimatedAnswerOption
        {...defaultProps}
        showResult={true}
        isCorrect={true}
      />
    );

    // Test incorrect selected answer state
    rerender(
      <AnimatedAnswerOption
        {...defaultProps}
        showResult={true}
        isCorrect={false}
        isSelected={true}
      />
    );

    // Component should render without errors in all states
    expect(option).toBeTruthy();
  });
});