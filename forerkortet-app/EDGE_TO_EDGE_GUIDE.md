# Edge-to-Edge Display Guide for Android 15+

This guide explains how to properly handle edge-to-edge display in the app for Android 15+ (SDK 35) compatibility.

## Overview

Starting with Android 15, apps targeting SDK 35 will display edge-to-edge by default. This means:
- Content extends behind the status bar and navigation bar
- Apps must handle insets to ensure content doesn't overlap with system UI
- Proper implementation provides a more immersive user experience

## Implementation

### 1. App Configuration

In `app.json`, edge-to-edge is enabled:
```json
{
  "android": {
    "edgeToEdgeEnabled": true
  }
}
```

### 2. Global Setup

The app is wrapped with `SafeAreaProvider` and the status bar is configured as translucent:
```tsx
<SafeAreaProvider>
  <StatusBar 
    style="auto" 
    translucent={Platform.OS === 'android'}
    backgroundColor="transparent"
  />
</SafeAreaProvider>
```

### 3. Using the Edge-to-Edge Hook

Import and use the custom hook in your screens:
```tsx
import { useEdgeToEdgeInsets } from '../hooks/useEdgeToEdgeInsets';

function MyScreen() {
  const insets = useEdgeToEdgeInsets();
  const styles = createStyles(insets);
  
  return (
    <View style={styles.container}>
      {/* Your content */}
    </View>
  );
}

const createStyles = (insets) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  }
});
```

### 4. Common Patterns

#### Headers
```tsx
header: {
  paddingTop: insets.top + theme.spacing.md,
  paddingHorizontal: theme.spacing.lg,
}
```

#### Footers
```tsx
footer: {
  paddingBottom: insets.bottom + theme.spacing.lg,
  paddingHorizontal: theme.spacing.lg,
}
```

#### Absolute Positioned Elements
```tsx
floatingButton: {
  position: 'absolute',
  bottom: insets.bottom + 20,
  right: insets.right + 20,
}
```

## Best Practices

1. **Always use insets**: Never hardcode padding values for top/bottom areas
2. **Test on multiple devices**: Test with different navigation bar types (gesture, 3-button)
3. **Consider landscape**: Remember to handle left/right insets in landscape mode
4. **Minimum padding**: Use `Math.max()` to ensure minimum padding when insets are 0
5. **ScrollView**: Use `contentInsetAdjustmentBehavior="automatic"` for better iOS compatibility

## Troubleshooting

### Content appears under status bar
- Ensure you're using `insets.top` in your padding/margin
- Check that SafeAreaProvider is at the root of your app

### Navigation gestures conflict
- Add extra padding at the bottom: `paddingBottom: insets.bottom + extraPadding`
- Test with gesture navigation enabled

### Different behavior on older Android versions
- The hook handles platform differences automatically
- Edge-to-edge is only fully active on Android 15+

## Testing

1. Test on Android 15+ devices or emulators
2. Enable/disable gesture navigation
3. Test in both portrait and landscape
4. Verify with different system UI themes (light/dark status bar)