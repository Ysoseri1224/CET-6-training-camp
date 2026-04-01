import { create } from 'zustand'

export const useWordTranslationStore = create((set) => ({
  inputZh: '',
  segments: [],
  referenceSentence: '',
  tips: [],
  userAnswers: {},
  evaluation: null,
  showReference: false,
  step: 'input',
  setInputZh: (v) => set({ inputZh: v }),
  setSegments: (v) => set({ segments: v }),
  setReferenceSentence: (v) => set({ referenceSentence: v }),
  setTips: (v) => set({ tips: v }),
  setUserAnswers: (fn) =>
    set((s) => ({ userAnswers: typeof fn === 'function' ? fn(s.userAnswers) : fn })),
  setEvaluation: (v) => set({ evaluation: v }),
  setShowReference: (v) => set({ showReference: v }),
  setStep: (v) => set({ step: v }),
  reset: () =>
    set({ step: 'input', segments: [], userAnswers: {}, evaluation: null, showReference: false, inputZh: '' }),
}))

export const useWritingStudioStore = create((set) => ({
  text: '',
  selectedTopic: '',
  suggestion: '',
  expandResult: '',
  openCategory: null,
  setText: (v) => set((s) => ({ text: typeof v === 'function' ? String(v(s.text) ?? '') : String(v ?? '') })),
  setSelectedTopic: (v) => set({ selectedTopic: v }),
  setSuggestion: (v) => set({ suggestion: v }),
  setExpandResult: (v) => set({ expandResult: v }),
  setOpenCategory: (v) => set({ openCategory: v }),
}))

export const useWordLookupStore = create((set) => ({
  query: '',
  result: null,
  zhData: null,
  error: '',
  setQuery: (v) => set({ query: v }),
  setResult: (v) => set({ result: v }),
  setZhData: (v) => set({ zhData: v }),
  setError: (v) => set({ error: v }),
}))
