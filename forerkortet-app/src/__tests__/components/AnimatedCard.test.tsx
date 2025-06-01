import React from 'react';
import { render } from '../../test-utils/testUtils';
import { AnimatedCard } from '../../components/AnimatedCard';
import { Text } from 'react-native';

describe('AnimatedCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <AnimatedCard>
        <Text>Test Content</Text>
      </AnimatedCard>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <AnimatedCard style={customStyle} testID="animated-card">
        <Text testID="content">Test Content</Text>
      </AnimatedCard>
    );

    const container = getByTestId('animated-card');
    expect(container?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle),
      ])
    );
  });

  it('should handle delay prop', () => {
    const { getByText } = render(
      <AnimatedCard delay={1000}>
        <Text>Delayed Content</Text>
      </AnimatedCard>
    );

    expect(getByText('Delayed Content')).toBeTruthy();
    
    // Advance timers to trigger animations
    jest.advanceTimersByTime(1100);
  });

  it('should handle index prop for staggered animations', () => {
    const { getByText } = render(
      <AnimatedCard index={2} delay={100}>
        <Text>Indexed Content</Text>
      </AnimatedCard>
    );

    expect(getByText('Indexed Content')).toBeTruthy();
    
    // The animation should be delayed by delay + index * 50
    jest.advanceTimersByTime(200);
  });

  it('should render multiple cards with different indices', () => {
    const { getByText } = render(
      <>
        <AnimatedCard index={0}>
          <Text>Card 1</Text>
        </AnimatedCard>
        <AnimatedCard index={1}>
          <Text>Card 2</Text>
        </AnimatedCard>
        <AnimatedCard index={2}>
          <Text>Card 3</Text>
        </AnimatedCard>
      </>
    );

    expect(getByText('Card 1')).toBeTruthy();
    expect(getByText('Card 2')).toBeTruthy();
    expect(getByText('Card 3')).toBeTruthy();
  });
});