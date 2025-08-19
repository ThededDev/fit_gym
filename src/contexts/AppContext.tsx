import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, ClientProfile, CoachProfile, Theme } from '../types';

interface AppState {
  user: User | null;
  clientProfile: ClientProfile | null;
  coachProfile: CoachProfile | null;
  theme: Theme;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'SET_COACH_PROFILE'; payload: CoachProfile }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  clientProfile: null,
  coachProfile: null,
  theme: 'light',
  isLoading: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_CLIENT_PROFILE':
      return { ...state, clientProfile: action.payload };
    case 'SET_COACH_PROFILE':
      return { ...state, coachProfile: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGOUT':
      return { ...initialState, theme: state.theme };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className={state.theme}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}