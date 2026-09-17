import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, ClientProfile, CoachProfile, Theme } from '../types';
import { supabase } from '../lib/supabase';

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
  isLoading: true,
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
      return { ...initialState, theme: state.theme, isLoading: false };
    default:
      return state;
  }
}

function authUserToAppUser(session: { user: { id: string; email?: string; created_at: string; user_metadata?: Record<string, string> } }): User {
  const { user } = session;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || '',
    role: (user.user_metadata?.role || 'client') as User['role'],
    avatarUrl: user.user_metadata?.avatar_url,
    createdAt: user.created_at,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Restore session from Supabase on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        dispatch({ type: 'SET_USER', payload: authUserToAppUser(session) });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch({ type: 'SET_USER', payload: authUserToAppUser(session) });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
