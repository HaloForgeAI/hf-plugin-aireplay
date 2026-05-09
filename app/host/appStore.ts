import { useMemo } from "react";
import { useHostAppState } from "@haloforge/plugin-sdk";

type AppState = {
  activeModule: string;
  setActiveModule: (module: string) => void;
  pendingMarkdownOpenPath: string | null;
  setPendingMarkdownOpenPath: (path: string | null) => void;
  clearPendingMarkdownOpenPath: () => void;
};

const noop = () => {};

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const hostAppState = useHostAppState();

  const state = useMemo<AppState>(() => ({
    activeModule: hostAppState.activeModule,
    setActiveModule: noop,
    pendingMarkdownOpenPath: null,
    setPendingMarkdownOpenPath: noop,
    clearPendingMarkdownOpenPath: noop,
  }), [hostAppState.activeModule]);

  return selector(state);
}
