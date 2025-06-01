import { Alert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function that works on both native and web
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: any
) => {
  if (Platform.OS === 'web') {
    // For web, we'll use window.confirm for simple yes/no dialogs
    // or window.alert for simple messages
    
    if (!buttons || buttons.length === 0) {
      // Simple alert with OK button
      window.alert(message ? `${title}\n\n${message}` : title);
      return;
    }
    
    if (buttons.length === 1) {
      // Single button alert
      window.alert(message ? `${title}\n\n${message}` : title);
      const button = buttons[0];
      if (button.onPress) {
        button.onPress();
      }
      return;
    }
    
    // For multiple buttons, use confirm dialog
    const confirmButton = buttons.find(b => b.style !== 'cancel');
    const cancelButton = buttons.find(b => b.style === 'cancel');
    
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    
    if (confirmed && confirmButton?.onPress) {
      confirmButton.onPress();
    } else if (!confirmed && cancelButton?.onPress) {
      cancelButton.onPress();
    }
  } else {
    // Use native Alert on mobile
    Alert.alert(title, message, buttons, options);
  }
};