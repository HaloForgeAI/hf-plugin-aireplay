import { useMemo } from "react";
import { useHostAI } from "@haloforge/plugin-sdk";

type AIChatState = Record<string, unknown>;

export function useAIChatStore<T>(selector: (state: AIChatState) => T): T {
  const hostAI = useHostAI<unknown, unknown>();
  const state = useMemo<AIChatState>(() => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    modelConfigs: hostAI.models,
    selectedModelId: hostAI.selectedModelId,
    isStreaming: false,
    streamingContent: "",
    streamingReasoning: "",
    fetchSessions: async () => {},
    fetchModelConfigs: hostAI.refresh,
    createSession: hostAI.createSession,
    setActiveSession: async () => {},
    sendMessage: hostAI.sendMessage,
    stopGeneration: hostAI.stopGeneration,
  }), [
    hostAI.createSession,
    hostAI.models,
    hostAI.refresh,
    hostAI.selectedModelId,
    hostAI.sendMessage,
    hostAI.stopGeneration,
  ]);

  return selector(state);
}
