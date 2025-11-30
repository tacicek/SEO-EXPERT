import { useMutation } from '@tanstack/react-query';
import type { AnalysisRequest, AnalysisResponse } from '@/lib/types/analysis';

export function useAnalyzeContent() {
  return useMutation({
    mutationFn: async (request: AnalysisRequest) => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: AnalysisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data;
    },
  });
}
