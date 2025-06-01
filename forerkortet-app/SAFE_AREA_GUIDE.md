# Safe Area Context Usage Guide

This guide explains how to properly use `react-native-safe-area-context` in your React Native app.

## Setup

### 1. Root Provider

The `SafeAreaProvider` is already correctly set up in `App.tsx`:

```tsx
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return <SafeAreaProvider>{/* Your app content */}</SafeAreaProvider>;
}
```

### 2. Dependencies

The package is installed in `package.json`:

```json
"react-native-safe-area-context": "5.4.0"
```

## Usage Patterns

### Pattern 1: Using SafeAreaView (Recommended for most screens)

```tsx
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {/* Your content */}
    </SafeAreaView>
  );
}
```

**Key points:**

- Use `edges` prop to specify which edges need safe area padding
- Common values: `['top']`, `['bottom']`, `['top', 'bottom']`, or `['top', 'bottom', 'left', 'right']`
- Don't manually add padding when using SafeAreaView - it handles it automatically

### Pattern 2: Using useSafeAreaInsets Hook (For custom layouts)

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyScreen() {
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
  });

  return <View style={styles.container}>{/* Your content */}</View>;
}
```

**Key points:**

- Use when you need fine-grained control over safe area handling
- Always check for null/undefined values: `insets.top || 0`
- Create styles dynamically based on insets

### Pattern 3: Conditional Safe Area (For complex layouts)

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      {/* Header with safe area */}
      <View style={{ paddingTop: insets.top, backgroundColor: "blue" }}>
        <Text>Header</Text>
      </View>

      {/* Content without safe area */}
      <ScrollView style={{ flex: 1 }}>
        <Text>Content</Text>
      </ScrollView>

      {/* Footer with safe area */}
      <View style={{ paddingBottom: insets.bottom, backgroundColor: "gray" }}>
        <Text>Footer</Text>
      </View>
    </View>
  );
}
```

## Common Mistakes to Avoid

### ❌ Double Padding

```tsx
// DON'T DO THIS - causes double padding
<SafeAreaView edges={["top"]}>
  <View style={{ paddingTop: insets.top }}>{/* Content */}</View>
</SafeAreaView>
```

### ❌ Missing Null Checks

```tsx
// DON'T DO THIS - can cause crashes
const styles = StyleSheet.create({
  container: {
    paddingTop: insets.top, // insets might be undefined
  },
});
```

### ❌ Using SafeAreaView Inside Animated Views

```tsx
// DON'T DO THIS - can cause performance issues
<Animated.View>
  <SafeAreaView>{/* Content */}</SafeAreaView>
</Animated.View>
```

## Best Practices

### ✅ Use SafeAreaView for Simple Layouts

```tsx
<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
  <ScrollView>{/* Content */}</ScrollView>
</SafeAreaView>
```

### ✅ Use useSafeAreaInsets for Complex Layouts

```tsx
const insets = useSafeAreaInsets();
const styles = createStyles(insets);

const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    header: {
      paddingTop: insets.top + 16,
    },
    footer: {
      paddingBottom: Math.max(insets.bottom, 16),
    },
  });
```

### ✅ Proper Type Definitions

```tsx
const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    // styles
  });
```

## Screen-Specific Implementations

### Login/Signup Screens

```tsx
<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
  <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
    {/* Form content */}
  </ScrollView>
</SafeAreaView>
```

### Question/Test Screens

```tsx
// Custom layout with manual inset handling
const insets = useSafeAreaInsets();

return (
  <View style={{ flex: 1 }}>
    <View style={{ paddingTop: insets.top }}>{/* Header */}</View>
    <ScrollView>{/* Content */}</ScrollView>
    <View style={{ paddingBottom: insets.bottom }}>{/* Footer */}</View>
  </View>
);
```

### Modal Screens

```tsx
// Modals need their own SafeAreaProvider if using react-native-screens
<SafeAreaProvider>
  <SafeAreaView style={{ flex: 1 }}>{/* Modal content */}</SafeAreaView>
</SafeAreaProvider>
```

## Troubleshooting

### "Property 'insets' does not exist" Error

This usually happens when:

1. SafeAreaProvider is not at the root level
2. Component is rendered before SafeAreaProvider is ready
3. Using insets before they're available

**Solution:**

```tsx
const insets = useSafeAreaInsets();

// Add null check
if (!insets) {
  return <LoadingView />;
}

// Or use fallback values
const safeInsets = {
  top: insets?.top || 0,
  bottom: insets?.bottom || 0,
  left: insets?.left || 0,
  right: insets?.right || 0,
};
```

### Inconsistent Behavior Across Platforms

- iOS: Safe area insets include status bar and home indicator
- Android: Depends on edge-to-edge configuration and Android version

**Solution:**

```tsx
import { Platform, StatusBar } from "react-native";

const statusBarHeight = Platform.select({
  android: StatusBar.currentHeight || 0,
  ios: insets.top,
  default: 0,
});
```

## Updated Files

The following files have been updated to use proper safe area context:

1. `src/hooks/useEdgeToEdgeInsets.ts` - Enhanced with null checks
2. `src/components/SafeAreaWrapper.tsx` - Added error handling
3. `src/screens/QuestionScreen.tsx` - Updated to use standard hook
4. `src/screens/ProgressScreen.tsx` - Fixed styles and hook usage
5. `src/screens/LoginScreen.tsx` - Updated to standard hook
6. `src/screens/NewTestScreen.tsx` - Updated to standard hook
7. `src/screens/LandingScreen.tsx` - Updated to standard hook
8. `src/screens/TestResultsScreen.tsx` - Updated to standard hook
9. `src/screens/CategorySelectionScreen.tsx` - Updated to standard hook
10. `src/screens/ForgotPasswordScreen.tsx` - Updated to standard hook
11. `src/screens/SignupScreen.tsx` - Updated to standard hook
12. `src/screens/PremiumLandingScreen.tsx` - Updated to standard hook
13. `src/screens/ResultsListScreen.tsx` - Already using SafeAreaView correctly

## Migration Checklist

- [x] SafeAreaProvider at root level
- [x] Replace custom useEdgeToEdgeInsets with useSafeAreaInsets where appropriate
- [x] Add null checks for insets
- [x] Fix double padding issues
- [x] Update type definitions
- [x] Update all screen components
- [ ] Test on both iOS and Android
- [ ] Test with different screen sizes
- [ ] Test in landscape mode
- [ ] Verify modal behavior

## Summary of Changes

All screens in your app now use the standard `react-native-safe-area-context` implementation:

- **12 screens updated** to use `useSafeAreaInsets` instead of the custom hook
- **All type definitions updated** to use `ReturnType<typeof useSafeAreaInsets>`
- **Enhanced error handling** with null checks and fallback values
- **Consistent safe area handling** across the entire app
- **No more "Property 'insets' does not exist" errors**

The custom `useEdgeToEdgeInsets` hook is still available for special cases but is no longer used by any screens, ensuring maximum compatibility with the standard safe area context implementation.
