# Snapshot Testing Guide

## Overview

Snapshot tests have been added for complex UI components to catch unintended visual changes. These tests complement our unit and integration tests by ensuring component structure remains consistent.

## Components with Snapshot Tests

### 1. **AnimatedAnswerOption** (`AnimatedAnswerOption.snapshot.test.tsx`)
- Tests all visual states: default, selected, correct, incorrect, disabled
- Tests different answer indices (A, B, C, D)
- Tests long text handling and animations

### 2. **AchievementBadge** (`AchievementBadge.snapshot.test.tsx`)
- Tests locked/unlocked states
- Tests progress indicators
- Tests different achievement types and icons
- Tests edge cases like nearly complete progress

### 3. **PremiumCard** (`PremiumCard.snapshot.test.tsx`)
- Tests all variants: elevated, flat, gradient, blur, neumorphic
- Tests all padding options
- Tests animation states
- Tests complex nested content

### 4. **AnimatedProgress** (`AnimatedProgress.snapshot.test.tsx`)
- Tests various progress percentages
- Tests milestone states (10%, 20%, etc.)
- Tests different step configurations
- Tests with/without percentage display

### 5. **GradientButton** (`GradientButton.snapshot.test.tsx`)
- Tests all variants: primary, secondary, success
- Tests enabled/disabled states
- Tests custom styling
- Tests different button text lengths

### 6. **AnimatedCard** (`AnimatedCard.snapshot.test.tsx`)
- Tests simple and complex content
- Tests delay and index props
- Tests nested cards
- Tests various content types (forms, lists)

## Running Snapshot Tests

```bash
# Run all tests including snapshots
npm test

# Run only snapshot tests
npm test -- snapshot.test

# Update snapshots after intentional changes
npm test -- -u

# Update specific snapshot test
npm test -- AnimatedCard.snapshot.test.tsx -u
```

## When to Update Snapshots

Update snapshots when you've made **intentional** changes to:
- Component structure or layout
- Styling or theming
- Props that affect visual output
- Animation initial states

## Best Practices

### 1. **Review Snapshot Changes Carefully**
```bash
# Always review the diff before updating
npm test -- --no-updateSnapshot
```

### 2. **Keep Snapshots Focused**
- Test one visual state per snapshot
- Use descriptive test names
- Avoid testing implementation details

### 3. **Mock External Dependencies**
All snapshot tests mock:
- `react-native-reanimated` - For consistent animation states
- `expo-haptics` - Prevents runtime errors
- `expo-linear-gradient` - Simplified gradient rendering
- `expo-blur` - Simplified blur rendering

### 4. **Test Important Visual States**
Focus on states that affect user experience:
- Loading/empty states
- Error states
- Different data scenarios
- Interactive states (selected, disabled)

## Common Issues and Solutions

### Issue: Snapshot Mismatch Due to Random Data
**Solution**: Use fixed test data instead of random values

### Issue: Platform-Specific Differences
**Solution**: Mock platform-specific components or use platform checks

### Issue: Large Snapshot Files
**Solution**: Break down complex components into smaller snapshot tests

### Issue: Flaky Animation States
**Solution**: Ensure animations are properly mocked and use `animated={false}` in tests

## Adding New Snapshot Tests

1. Create a new file: `ComponentName.snapshot.test.tsx`
2. Import necessary mocks
3. Test all visual variants
4. Run tests and review initial snapshots
5. Commit both test and snapshot files

Example template:
```typescript
import React from 'react';
import renderer from 'react-test-renderer';
import { MyComponent } from '../../components/MyComponent';

// Mock dependencies
jest.mock('expo-haptics');

describe('MyComponent Snapshots', () => {
  it('should match snapshot for default state', () => {
    const tree = renderer
      .create(<MyComponent />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  
  // Add more visual state tests...
});
```

## Maintenance

- Review snapshots during code reviews
- Update snapshots as part of the PR when making visual changes
- Document why snapshots were updated in commit messages
- Periodically audit snapshots for relevance

## CI/CD Integration

Snapshot tests run automatically in CI. Failed snapshots will:
1. Block the PR merge
2. Show a diff of what changed
3. Require manual review and update

To update snapshots in CI:
1. Run tests locally with `-u` flag
2. Review and commit updated snapshots
3. Push changes to trigger new CI run