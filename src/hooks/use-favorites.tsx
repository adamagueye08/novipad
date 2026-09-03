import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "jokkotech_favorites";

type FavoritesContextValue = {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  function toggle(productId: string) {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }

  function has(productId: string) {
    return ids.includes(productId);
  }

  return (
    <FavoritesContext.Provider value={{ ids, has, toggle, count: ids.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites doit être utilisé sous FavoritesProvider");
  return ctx;
}
