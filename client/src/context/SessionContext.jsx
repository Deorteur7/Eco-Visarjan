import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Remembers the idol details and the user's location for this browser tab only.
const STORAGE_KEY = 'ecovisarjan.session.v1';

const read = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

const write = (value) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage may be unavailable (private mode); the app still works without it
  }
};

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = read();
    return { idol: saved.idol ?? null, location: saved.location ?? null };
  });

  const update = useCallback((patch) => {
    setState((current) => {
      const next = { ...current, ...patch };
      write(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      idol: state.idol,
      location: state.location,
      setIdol: (idol) => update({ idol }),
      setLocation: (location) => update({ location }),
      clearIdol: () => update({ idol: null }),
    }),
    [state, update],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
