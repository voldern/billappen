/**
 * Feature flags for controlling app functionality
 * Set these to true/false to enable/disable features
 */

export const FEATURE_FLAGS = {
  // Enable category selection when starting a new test
  // Currently disabled due to insufficient questions per category
  ENABLE_CATEGORY_SELECTION: false,
} as const;

// Type for feature flag keys
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}