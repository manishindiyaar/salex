/**
 * useHaptics Hook
 * 
 * Provides haptic feedback functions for the High-Strength UI.
 * Uses expo-haptics for cross-platform haptic feedback.
 * 
 * Intensity levels:
 * - light: Button taps, preset selections
 * - medium: Toggle switches, confirmations
 * - heavy: Swipe actions, checkout completion, milestones
 */

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface UseHapticsReturn {
  /** Light haptic - for button taps and preset selections */
  light: () => Promise<void>;
  /** Medium haptic - for toggle switches and confirmations */
  medium: () => Promise<void>;
  /** Heavy haptic - for swipe actions, checkout, and milestones */
  heavy: () => Promise<void>;
  /** Generic haptic with specified intensity */
  trigger: (intensity: HapticIntensity) => Promise<void>;
  /** Selection feedback - for picker/selection changes */
  selection: () => Promise<void>;
  /** Success notification - for successful actions */
  success: () => Promise<void>;
  /** Warning notification - for warnings */
  warning: () => Promise<void>;
  /** Error notification - for errors */
  error: () => Promise<void>;
}

export function useHaptics(): UseHapticsReturn {
  const light = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available on this device, fail silently
      console.debug('Haptics not available:', error);
    }
  }, []);

  const medium = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  const heavy = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  const trigger = useCallback(async (intensity: HapticIntensity) => {
    switch (intensity) {
      case 'light':
        return light();
      case 'medium':
        return medium();
      case 'heavy':
        return heavy();
    }
  }, [light, medium, heavy]);

  const selection = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  const success = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  const warning = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  const error = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }, []);

  return {
    light,
    medium,
    heavy,
    trigger,
    selection,
    success,
    warning,
    error,
  };
}

export default useHaptics;
