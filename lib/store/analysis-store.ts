import { create } from 'zustand';
import type { AnalysisResult, SentenceAnalysis } from '@/lib/types/analysis';

interface AnalysisStore {
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  selectedSentence: SentenceAnalysis | null;
  
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setSelectedSentence: (sentence: SentenceAnalysis | null) => void;
  
  applySuggestion: (sentencePosition: number) => void;
  rejectSuggestion: (sentencePosition: number) => void;
  
  updateSentence: (position: number, newText: string) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  selectedSentence: null,

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  setSelectedSentence: (sentence) => set({ selectedSentence: sentence }),

  applySuggestion: (sentencePosition) =>
    set((state) => {
      if (!state.currentAnalysis) return state;

      const updatedSentences = state.currentAnalysis.sentence_analysis.map((s) =>
        s.position === sentencePosition
          ? { ...s, original: s.suggestion || s.original, is_accepted: true, score: 'green' as const }
          : s
      );

      // Recalculate statistics
      const greenCount = updatedSentences.filter((s) => s.score === 'green').length;
      const orangeCount = updatedSentences.filter((s) => s.score === 'orange').length;
      const redCount = updatedSentences.filter((s) => s.score === 'red').length;
      const greenPercentage = Math.round((greenCount / updatedSentences.length) * 100);

      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          sentence_analysis: updatedSentences,
          statistics: {
            ...state.currentAnalysis.statistics,
            green_count: greenCount,
            orange_count: orangeCount,
            red_count: redCount,
            green_percentage: greenPercentage,
          },
        },
        selectedSentence: null,
      };
    }),

  rejectSuggestion: (sentencePosition) =>
    set((state) => {
      if (!state.currentAnalysis) return state;

      const updatedSentences = state.currentAnalysis.sentence_analysis.map((s) =>
        s.position === sentencePosition ? { ...s, is_accepted: false } : s
      );

      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          sentence_analysis: updatedSentences,
        },
        selectedSentence: null,
      };
    }),

  updateSentence: (position, newText) =>
    set((state) => {
      if (!state.currentAnalysis) return state;

      const updatedSentences = state.currentAnalysis.sentence_analysis.map((s) =>
        s.position === position ? { ...s, original: newText } : s
      );

      return {
        currentAnalysis: {
          ...state.currentAnalysis,
          sentence_analysis: updatedSentences,
        },
      };
    }),
}));
