// Native implementation using @react-native-firebase/analytics
import analytics from '@react-native-firebase/analytics';
import { AnalyticsService } from './analyticsService';

class NativeAnalyticsService implements AnalyticsService {
  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.warn('Analytics logEvent failed:', error);
    }
  }

  async logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void> {
    try {
      await analytics().logScreenView(params);
    } catch (error) {
      console.warn('Analytics logScreenView failed:', error);
    }
  }

  async logLogin(params: { method: string }): Promise<void> {
    try {
      await analytics().logLogin(params);
    } catch (error) {
      console.warn('Analytics logLogin failed:', error);
    }
  }

  async logSignUp(params: { method: string }): Promise<void> {
    try {
      await analytics().logSignUp(params);
    } catch (error) {
      console.warn('Analytics logSignUp failed:', error);
    }
  }

  async setUserId(userId: string | null): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  async setUserProperties(properties: Record<string, string | null>): Promise<void> {
    try {
      await analytics().setUserProperties(properties);
    } catch (error) {
      console.warn('Analytics setUserProperties failed:', error);
    }
  }

  async logSelectContent(params: { content_type: string; item_id: string }): Promise<void> {
    try {
      await analytics().logSelectContent(params);
    } catch (error) {
      console.warn('Analytics logSelectContent failed:', error);
    }
  }

  async logShare(params: { content_type: string; item_id: string; method: string }): Promise<void> {
    try {
      await analytics().logShare(params);
    } catch (error) {
      console.warn('Analytics logShare failed:', error);
    }
  }

  async logViewItem(params: { value?: number; currency?: string; items?: any[] }): Promise<void> {
    try {
      await analytics().logViewItem(params);
    } catch (error) {
      console.warn('Analytics logViewItem failed:', error);
    }
  }

  async logTutorialBegin(): Promise<void> {
    try {
      await analytics().logTutorialBegin();
    } catch (error) {
      console.warn('Analytics logTutorialBegin failed:', error);
    }
  }

  async logTutorialComplete(): Promise<void> {
    try {
      await analytics().logTutorialComplete();
    } catch (error) {
      console.warn('Analytics logTutorialComplete failed:', error);
    }
  }
}

export default new NativeAnalyticsService();