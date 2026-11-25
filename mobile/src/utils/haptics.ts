import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_STORAGE_KEY = '@skillhub_haptics_enabled';

// Internal cached state (default enabled)
let isEnabled = true;
let isInitialized = false;

/**
 * Initialize haptic preferences from AsyncStorage.
 */
export async function initHaptics(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(HAPTICS_STORAGE_KEY);
    if (stored !== null) {
      isEnabled = stored === 'true';
    } else {
      isEnabled = true;
    }
    isInitialized = true;
    return isEnabled;
  } catch {
    isEnabled = true;
    isInitialized = true;
    return isEnabled;
  }
}

// Auto-initialize on import
initHaptics();

/**
 * Get current haptic enabled state.
 */
export function getHapticsEnabled(): boolean {
  return isEnabled;
}

/**
 * Set user preference for haptic feedback and persist to AsyncStorage.
 */
export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  isEnabled = enabled;
  try {
    await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Graceful fallback if storage write fails
  }
}

/**
 * Centralized semantic haptic triggers with error suppression and user preference check.
 */
export const triggerHaptic = {
  /**
   * Selection feedback for pickers, date selections, or subtle item cycling.
   */
  selection: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignored for devices without haptics
    }
  },

  /**
   * Light impact for toggle switches, checkboxes, or low-priority interactive controls.
   */
  light: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }
  },

  /**
   * Medium impact for primary action buttons (e.g. Save, Create, Submit).
   */
  medium: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignored
    }
  },

  /**
   * Heavy impact for destructive actions (e.g. Delete confirmations, Logout confirmation).
   */
  heavy: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignored
    }
  },

  /**
   * Notification feedback on successful API operations or uploads.
   */
  success: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored
    }
  },

  /**
   * Notification feedback on API errors, failed validations, or network errors.
   */
  error: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignored
    }
  },

  /**
   * Notification feedback on warnings or alerts.
   */
  warning: async (): Promise<void> => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignored
    }
  },
};
