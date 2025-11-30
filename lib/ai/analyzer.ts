import Anthropic from '@anthropic-ai/sdk';
import type { 
  AnalysisResult, 
  SentenceAnalysis, 
  ContentSummary,
  EEATScores,
  PriorityAction,
  AnalysisStatistics 
} from '@/lib/types/analysis';
import { getSystemPrompt } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface AIAnalysisResponse {
  content_summary: ContentSummary;
  sentence_analysis: SentenceAnalysis[];
  eeat_scores: EEATScores;
  priority_actions: PriorityAction[];
  statistics: AnalysisStatistics;
}

export async function analyzeContent(content: string, title?: string): Promise<AnalysisResult> {
  try {
    const systemPrompt = getSystemPrompt();
    
    const userPrompt = `
Analyze the following content comprehensively. Provide a detailed analysis following the exact JSON structure specified in your system prompt.

${title ? `Title: ${title}\n\n` : ''}Content:
${content}

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. The response must be pure JSON that can be parsed directly.
`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Clean response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    const aiResponse: AIAnalysisResponse = JSON.parse(cleanedResponse);

    // Create the full analysis result
    const analysisResult: AnalysisResult = {
      id: generateId(),
      title: title || aiResponse.content_summary.detected_topic,
      content_summary: aiResponse.content_summary,
      sentence_analysis: aiResponse.sentence_analysis,
      eeat_scores: aiResponse.eeat_scores,
      priority_actions: aiResponse.priority_actions,
      statistics: aiResponse.statistics,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return analysisResult;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeSentence(
  sentence: string,
  context: { previous?: string; next?: string; topic?: string }
): Promise<SentenceAnalysis> {
  try {
    const systemPrompt = getSystemPrompt();
    
    const userPrompt = `
Analyze this single sentence in context:

Topic: ${context.topic || 'General'}
Previous sentence: ${context.previous || 'N/A'}
Current sentence: ${sentence}
Next sentence: ${context.next || 'N/A'}

Provide a detailed sentence-level analysis in JSON format matching the sentence_analysis schema from your system prompt. Return ONLY the JSON object for this single sentence, without array brackets.
`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    let cleanedResponse = responseText.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    const sentenceAnalysis: SentenceAnalysis = JSON.parse(cleanedResponse);
    
    return sentenceAnalysis;
  } catch (error) {
    console.error('Sentence Analysis Error:', error);
    throw new Error(`Sentence analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function splitIntoSentences(text: string): string[] {
  // Basic sentence splitting - can be enhanced with NLP library
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

export function calculateOverallScore(statistics: AnalysisStatistics): number {
  const { green_count, orange_count, red_count, total_sentences } = statistics;
  
  if (total_sentences === 0) return 0;
  
  // Weighted scoring: Green=10, Orange=5, Red=0
  const score = ((green_count * 10) + (orange_count * 5)) / total_sentences;
  
  return Math.round(score * 10); // Convert to 0-100 scale
}

function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
