"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { centersApi, centerKeys } from "@/features/centers/api";
import type { Center } from "@/features/centers/types";
import { setActiveCenterScope } from "@/lib/api-client";

/**
 * The SUPERADMIN's "acting center". When a superadmin enters a center, this
 * scope is set and every API request is scoped to that center via `?centerId=`.
 * Leaving the value null puts the app in global "admin mode".
 */

const STORAGE_KEY = "classflow.center";
const listeners = new Set<() => void>();

let currentCenterId: number | null = null;
if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    const parsed = Number(stored);
    if (Number.isInteger(parsed) && parsed > 0) {
      currentCenterId = parsed;
    }
  }
}
setActiveCenterScope(currentCenterId);

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): number | null {
  return currentCenterId;
}

function getServerSnapshot(): number | null {
  return null;
}

export function setCenterId(id: number | null): void {
  currentCenterId = id;
  setActiveCenterScope(id);
  if (id !== null && id > 0) {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  for (const listener of listeners) listener();
}

export function resetCenterScope(): void {
  setCenterId(null);
}

interface CenterScopeValue {
  centerId: number | null;
  setCenterId: (id: number | null) => void;
}

const CenterScopeContext = createContext<CenterScopeValue | null>(null);

export function CenterScopeProvider({ children }: { children: ReactNode }) {
  const centerId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setCenter = useCallback((id: number | null) => setCenterId(id), []);

  const value = useMemo<CenterScopeValue>(
    () => ({ centerId, setCenterId: setCenter }),
    [centerId, setCenter],
  );

  // When the SUPERADMIN enters/exits a center, drop cached data from the
  // previous scope so no stale center A results surface in center B.
  const queryClient = useQueryClient();
  const previousCenterId = useRef(centerId);
  useEffect(() => {
    if (previousCenterId.current !== centerId) {
      previousCenterId.current = centerId;
      void queryClient.invalidateQueries();
    }
  }, [centerId, queryClient]);

  return (
    <CenterScopeContext.Provider value={value}>
      {children}
    </CenterScopeContext.Provider>
  );
}

export function useCenterScope(): CenterScopeValue {
  const context = useContext(CenterScopeContext);
  if (!context) {
    throw new Error("useCenterScope must be used within a CenterScopeProvider");
  }
  return context;
}

/** Whether the current session is scoped to a single center (SUPERADMIN acting mode). */
export function useIsScopedToCenter(): { scoped: boolean; centerId: number | null } {
  const { centerId } = useCenterScope();
  return { scoped: centerId !== null, centerId };
}

/** Fetch the active center entity (name/address/phone) for display in the shell. */
export function useActingCenter(): Center | undefined {
  const { centerId } = useCenterScope();
  const query = useQuery({
    queryKey: centerKeys.detail(centerId),
    queryFn: () => centersApi.get(centerId as number),
    enabled: centerId !== null,
  });
  return query.data;
}