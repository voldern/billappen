import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import testReducer from '../store/testSlice';
import resultsReducer from '../store/resultsSlice';
import { RootState } from '../store';

// Import the actual testing library functions - avoiding global hooks
import { 
  render as rtlRender, 
  fireEvent as rtlFireEvent,
  waitFor as rtlWaitFor,
  screen as rtlScreen,
  act as rtlAct
} from '@testing-library/react-native';

interface ExtendedRenderOptions {
  preloadedState?: Partial<RootState>;
  store?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        test: testReducer,
        results: resultsReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <NavigationContainer>{children}</NavigationContainer>
      </Provider>
    );
  }

  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Custom renderHook implementation to avoid global hook conflicts
export function renderHook<T>(hook: () => T, options: { wrapper?: React.ComponentType<any> } = {}) {
  let result: { current: T } = { current: undefined as any };
  
  function TestComponent() {
    result.current = hook();
    return null;
  }

  const Wrapper = options.wrapper || React.Fragment;
  
  const utils = rtlRender(
    <Wrapper>
      <TestComponent />
    </Wrapper>
  );

  return {
    result,
    rerender: (newHook?: () => T) => {
      // If new hook provided, update the test component
      if (newHook) {
        function NewTestComponent() {
          result.current = newHook();
          return null;
        }
        utils.rerender(
          <Wrapper>
            <NewTestComponent />
          </Wrapper>
        );
      } else {
        utils.rerender(
          <Wrapper>
            <TestComponent />
          </Wrapper>
        );
      }
    },
    unmount: utils.unmount,
  };
}

// Export specific functions to avoid global hook conflicts
export const render = rtlRender;
export const fireEvent = rtlFireEvent;
export const waitFor = rtlWaitFor;
export const screen = rtlScreen;
export const act = rtlAct;