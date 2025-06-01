// Web implementation using Firebase JS SDK
import { analytics } from '../lib/firebase.web';
import { logEvent } from 'firebase/analytics';
import { AnalyticsService } from './analyticsService';

class WebAnalyticsService implements AnalyticsService {
  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, eventName, params);
      }
    } catch (error) {
      console.warn('Analytics logEvent failed:', error);
    }
  }

  async logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'screen_view', params);
      }
    } catch (error) {
      console.warn('Analytics logScreenView failed:', error);
    }
  }

  async logLogin(params: { method: string }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'login', params);
      }
    } catch (error) {
      console.warn('Analytics logLogin failed:', error);
    }
  }

  async logSignUp(params: { method: string }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'sign_up', params);
      }
    } catch (error) {
      console.warn('Analytics logSignUp failed:', error);
    }
  }

  async setUserId(userId: string | null): Promise<void> {
    try {
      // Note: setUserId is not directly available in Firebase JS SDK v9+
      // You might need to use setUserProperties or custom implementation
      if (analytics && userId) {
        this.setUserProperties({ user_id: userId });
      }
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  async setUserProperties(properties: Record<string, string | null>): Promise<void> {
    try {
      // Note: setUserProperties is not directly available in Firebase JS SDK v9+
      // You would typically send these as event parameters
      if (analytics) {
        logEvent(analytics, 'user_properties_set', properties);
      }
    } catch (error) {
      console.warn('Analytics setUserProperties failed:', error);
    }
  }

  async logSelectContent(params: { content_type: string; item_id: string }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'select_content', params);
      }
    } catch (error) {
      console.warn('Analytics logSelectContent failed:', error);
    }
  }

  async logShare(params: { content_type: string; item_id: string; method: string }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'share', params);
      }
    } catch (error) {
      console.warn('Analytics logShare failed:', error);
    }
  }

  async logViewItem(params: { value?: number; currency?: string; items?: any[] }): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'view_item', params);
      }
    } catch (error) {
      console.warn('Analytics logViewItem failed:', error);
    }
  }

  async logTutorialBegin(): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'tutorial_begin');
      }
    } catch (error) {
      console.warn('Analytics logTutorialBegin failed:', error);
    }
  }

  async logTutorialComplete(): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'tutorial_complete');
      }
    } catch (error) {
      console.warn('Analytics logTutorialComplete failed:', error);
    }
  }
}

export default new WebAnalyticsService();