# Test Utilities

This directory contains shared test utilities and mocks for the test suite.

## Files

- `testUtils.tsx` - Test rendering utilities and mock implementations
- `firebase-mocks.js` - Firebase service mocks

## Current Test Status

As of the latest run:
- **Total Test Suites**: 24 (14 passing, 10 failing)
- **Total Tests**: 254 (205 passing, 49 failing)
- **Snapshots**: 135 (all passing)

## Known Issues and Fixes

### 1. Mock Implementation Limitations
The current mock implementations in `testUtils.tsx` are simplified and may not cover all use cases. For more complex tests, you may need to:
- Use actual testing libraries like `@testing-library/react-native`
- Implement more sophisticated mocks
- Use integration testing tools

### 2. Navigation Mocks
Navigation is mocked globally in `jest.setup.js`. If tests need specific navigation behavior, update the mock in the test file:

```javascript
require('@react-navigation/native').useNavigation = jest.fn(() => ({
  navigate: mockNavigate,
  goBack: mockGoBack,
  // ... other methods
}));
```

### 3. Firebase Mocks
Firebase services are mocked in `firebase-mocks.js`. Update these mocks when:
- Adding new Firebase functionality
- Testing specific error scenarios
- Needing more complex mock behavior

## Common Test Patterns

### Testing Components
```typescript
import { render, fireEvent } from '../../test-utils/testUtils';

const { getByText } = render(<MyComponent />);
fireEvent.press(getByText('Button'));
```

### Testing with Redux
```typescript
import { renderWithProviders } from '../../test-utils/testUtils';

const { store, getByText } = renderWithProviders(<MyComponent />, {
  preloadedState: { /* ... */ }
});
```

### Mocking Services
```typescript
jest.mock('../../services/myService', () => ({
  default: {
    myMethod: jest.fn(),
  }
}));
```

## Recommendations

1. **Gradually migrate to real testing libraries**: The current mock implementation is basic. Consider installing `@testing-library/react-native` for more robust testing.

2. **Fix failing tests incrementally**: Focus on fixing one test suite at a time, starting with the most critical functionality.

3. **Update mocks as needed**: The simplified mocks may need enhancement for specific test cases.

4. **Consider E2E testing**: For complex user flows, consider adding E2E tests with Detox or similar tools.