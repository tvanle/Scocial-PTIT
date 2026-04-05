import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Cross-platform alert that works on iOS, Android, AND Web.
 * On web, falls back to window.confirm / window.alert.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  const displayMessage = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(displayMessage);
    return;
  }

  const hasCancel = buttons.some((b) => b.style === 'cancel');
  const actionButton = buttons.find((b) => b.style !== 'cancel');

  if (hasCancel && actionButton) {
    // Confirmation dialog
    const confirmed = window.confirm(displayMessage);
    if (confirmed) {
      actionButton.onPress?.();
    } else {
      const cancelButton = buttons.find((b) => b.style === 'cancel');
      cancelButton?.onPress?.();
    }
  } else if (buttons.length === 1) {
    // Single button (OK-style)
    window.alert(displayMessage);
    buttons[0].onPress?.();
  } else {
    // Multiple non-cancel buttons — just alert and trigger first
    window.alert(displayMessage);
    buttons[0].onPress?.();
  }
}
