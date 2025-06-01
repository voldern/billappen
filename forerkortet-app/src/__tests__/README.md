# Forerkortet App Test Suite

This directory contains the comprehensive test suite for the Forerkortet app. The tests are organized by type and follow best practices for React Native testing.

## Test Structure

```
__tests__/
├── components/          # Component unit tests
├── integration/         # Integration tests for user flows
├── services/           # Service layer tests
├── store/              # Redux store tests
├── utils/              # Utility function tests
└── mocks/              # Shared mocks and test utilities
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test:coverage

# Run specific test file
npm test -- AnimatedCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

## Test Categories

### 1. Component Tests
Tests for React components focusing on:
- Rendering behavior
- User interactions
- Props handling
- Animation behavior

Example components tested:
- `AnimatedCard` - Card animation wrapper
- `GradientButton` - Custom button with gradient
- `AnimatedAnswerOption` - Quiz answer option component

### 2. Service Tests
Tests for service layer including:
- Firebase Authentication service
- Firebase Question service
- Local Question service
- Error handling
- Data transformations

### 3. Store Tests
Redux store tests covering:
- Action creators
- Reducers
- State updates
- Selectors

### 4. Utility Tests
Pure function tests for:
- Score calculations
- Achievement logic
- Question processing
- Formatting utilities

### 5. Integration Tests
End-to-end flow tests:
- Complete quiz flow
- Authentication flow
- User registration
- Password reset

## Writing New Tests

### Component Test Template
```typescript
import React from 'react';
import { render, fireEvent } from '../utils/testUtils';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <MyComponent title="Test" />
    );
    
    expect(getByText('Test')).toBeTruthy();
  });
  
  it('should handle user interaction', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Click me" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Service Test Template
```typescript
import myService from '../../services/myService';

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    // Mock implementation
    
    const result = await myService.getData();
    expect(result).toEqual(mockData);
  });
  
  it('should handle errors', async () => {
    const error = new Error('Network error');
    // Mock error
    
    await expect(myService.getData()).rejects.toThrow('Network error');
  });
});
```

## Mocking Guidelines

### Firebase Mocks
Firebase services are mocked in `mocks/firebase.ts`. Update these mocks when:
- Adding new Firebase functionality
- Changing Firebase method signatures
- Testing error scenarios

### Navigation Mocks
Navigation is mocked globally in `jest.setup.js`. Common navigation methods:
- `navigate`
- `goBack`
- `reset`
- `dispatch`

### Animation Mocks
React Native Reanimated is mocked to prevent test failures. Animations run synchronously in tests.

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Test Names**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
4. **Mock External Dependencies**: Mock Firebase, navigation, and other external services
5. **Test User Behavior**: Focus on testing what users can see and do
6. **Avoid Implementation Details**: Test behavior, not implementation

## Coverage Goals

Aim for:
- 80%+ overall coverage
- 90%+ for utility functions
- 70%+ for components
- 100% for critical business logic

## Debugging Tests

### Common Issues

1. **Async Issues**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(getByText('Loaded')).toBeTruthy();
   });
   ```

2. **Timer Issues**
   ```typescript
   // Use fake timers for animations
   jest.useFakeTimers();
   // ... test code
   jest.runAllTimers();
   jest.useRealTimers();
   ```

3. **Navigation Issues**
   ```typescript
   // Mock navigation properly
   const mockNavigate = jest.fn();
   jest.mock('@react-navigation/native', () => ({
     useNavigation: () => ({ navigate: mockNavigate })
   }));
   ```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hooks (if configured)

## Maintenance

### Weekly Tasks
- Review and update failing tests
- Check coverage reports
- Update mocks for API changes

### Monthly Tasks
- Review test performance
- Refactor repetitive test code
- Update test documentation

## Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Redux](https://redux.js.org/usage/writing-tests)
- [Firebase Mock Examples](https://github.com/firebase/firebase-js-sdk)