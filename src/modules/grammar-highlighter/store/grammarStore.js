import { create } from 'zustand'

export const useGrammarStore = create((set, get) => ({
  rawText: '',
  setRawText: (text) => set({ rawText: text }),

  analysisResult: [],
  setAnalysisResult: (result) => set({ analysisResult: result }),

  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  visibleRoles: {
    subject: true,
    predicate: true,
    object: true,
    complement: true,
    attributive: true,
    adverbial: true,
    parenthetical: true,
    conjunction: true,
    infinitive: true,
    participial: true,
  },
  toggleRole: (role) =>
    set((s) => ({
      visibleRoles: { ...s.visibleRoles, [role]: !s.visibleRoles[role] },
    })),

  highlightOpacity: 0.28,
  setHighlightOpacity: (v) => set({ highlightOpacity: v }),

  ltErrors: [],
  setLtErrors: (errs) => set({ ltErrors: errs }),

  dsErrors: [],
  setDsErrors: (errs) => set({ dsErrors: errs }),

  dsAnalysis: [],
  setDsAnalysis: (spans) => set({ dsAnalysis: spans }),

  dsTree: null,
  setDsTree: (tree) => set({ dsTree: tree }),

  dsAnalyzing: false,
  setDsAnalyzing: (v) => set({ dsAnalyzing: v }),

  ltApiKey: '',
  setLtApiKey: (k) => set({ ltApiKey: k }),
  dsApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  setDsApiKey: (k) => set({ dsApiKey: k }),

  ltLoading: false,
  setLtLoading: (v) => set({ ltLoading: v }),
  dsLoading: false,
  setDsLoading: (v) => set({ dsLoading: v }),

  preprocessPending: null,
  setPreprocessPending: (v) => set({ preprocessPending: v }),

  tooltip: null,
  setTooltip: (t) => set({ tooltip: t }),

  editorMode: 'editing',
  setEditorMode: (mode) => set({ editorMode: mode }),

  treeViewOpen: false,
  toggleTreeView: () => set((s) => ({ treeViewOpen: !s.treeViewOpen })),

  settingsOpen: false,
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
}))
