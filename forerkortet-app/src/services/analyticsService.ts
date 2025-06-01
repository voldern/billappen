// Platform-agnostic analytics service
// This file serves as the entry point for analytics
// Platform-specific implementations will be loaded based on the platform

import { Platform } from 'react-native';

export interface AnalyticsService {
  logEvent(eventName: string, params?: Record<string, any>): Promise<void>;
  logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void>;
  logLogin(params: { method: string }): Promise<void>;
  logSignUp(params: { method: string }): Promise<void>;
  setUserId(userId: string | null): Promise<void>;
  setUserProperties(properties: Record<string, string | null>): Promise<void>;
  logSelectContent(params: { content_type: string; item_id: string }): Promise<void>;
  logShare(params: { content_type: string; item_id: string; method: string }): Promise<void>;
  logViewItem(params: { value?: number; currency?: string; items?: any[] }): Promise<void>;
  logTutorialBegin(): Promise<void>;
  logTutorialComplete(): Promise<void>;
}

// Dynamic import based on platform
const analyticsService: AnalyticsService = Platform.select({
  web: require('./analyticsService.web').default,
  default: require('./analyticsService.native').default,
});

export default analyticsService;