import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Minimal client-side router (no external dependency, no SSR/RSC surface).
// The admin panel is a small flat set of top-level sections, so a full
// routing library isn't needed — this keeps the dependency footprint at
// just `firebase`.

const RouterContext = createContext(null);

function currentPath() {
  return window.location.pathname.replace(/^\/admin\/?/, '') || '';
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to) => {
    const full = '/admin/' + to.replace(/^\/+/, '');
    window.history.pushState(null, '', full);
    setPath(to.replace(/^\/+/, ''));
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
