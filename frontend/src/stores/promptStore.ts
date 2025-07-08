import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PromptData,
  CategorySelection,
  DetailSelection,
  ColorSelection,
  StyleSelection,
  MoodSelection,
  LightingSelection,
} from '@visual-prompt-builder/shared';

interface PromptStore {
  // 現在の選択状態
  currentPrompt: Partial<PromptData>;

  // 履歴
  history: PromptData[];

  // アクション
  setCategory: (category: CategorySelection) => void;
  addDetail: (detail: DetailSelection) => void;
  removeDetail: (detailId: string) => void;
  reorderDetails: (details: DetailSelection[]) => void;
  setColors: (colors: ColorSelection[]) => void;
  setStyle: (style: StyleSelection | undefined) => void;
  setMood: (mood: MoodSelection | undefined) => void;
  setLighting: (lighting: LightingSelection | undefined) => void;
  setGeneratedPrompt: (prompt: string, promptJa: string) => void;

  saveToHistory: () => void;
  reset: () => void;
  clearSelectionsFromDetails: () => void;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      currentPrompt: {},
      history: [],

      setCategory: (category) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, category },
        })),

      addDetail: (detail) =>
        set((state) => {
          const details = state.currentPrompt.details || [];
          const order = details.length;
          return {
            currentPrompt: {
              ...state.currentPrompt,
              details: [...details, { ...detail, order }],
            },
          };
        }),

      removeDetail: (detailId) =>
        set((state) => ({
          currentPrompt: {
            ...state.currentPrompt,
            details: state.currentPrompt.details?.filter((d) => d.predefinedId !== detailId),
          },
        })),

      reorderDetails: (details) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, details },
        })),

      setColors: (colors) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, colors },
        })),

      setStyle: (style) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, style },
        })),

      setMood: (mood) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, mood },
        })),

      setLighting: (lighting) =>
        set((state) => ({
          currentPrompt: { ...state.currentPrompt, lighting },
        })),

      setGeneratedPrompt: (prompt, promptJa) =>
        set((state) => ({
          currentPrompt: {
            ...state.currentPrompt,
            generatedPrompt: prompt,
            generatedPromptJa: promptJa,
          },
        })),

      saveToHistory: () => {
        const { currentPrompt, history } = get();
        if (!currentPrompt.category) return;

        const newPrompt: PromptData = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: currentPrompt.category,
          details: currentPrompt.details || [],
          colors: currentPrompt.colors || [],
          style: currentPrompt.style,
          mood: currentPrompt.mood,
          lighting: currentPrompt.lighting,
          generatedPrompt: currentPrompt.generatedPrompt,
          generatedPromptJa: currentPrompt.generatedPromptJa,
        };

        set({
          history: [newPrompt, ...history].slice(0, 100), // 最大100件
        });
      },

      reset: () => set({ currentPrompt: {} }),

      clearSelectionsFromDetails: () =>
        set((state) => ({
          currentPrompt: {
            ...state.currentPrompt,
            details: [],
            colors: [],
            style: undefined,
            mood: undefined,
            lighting: undefined,
            generatedPrompt: undefined,
            generatedPromptJa: undefined,
          },
        })),
    }),
    {
      name: 'prompt-store',
    }
  )
);
