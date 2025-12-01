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

function extractAndCleanJson(responseText: string): string {
  // Remove fences if model wrapped output
  let cleaned = responseText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  
  // If there is leading/excess text, cut to first { ... last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1).trim();
  }

  // Fix common JSON issues from AI responses
  // 1. Remove control characters that break JSON
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });

  // 2. Fix unescaped quotes inside string values (common AI mistake)
  // This regex looks for quotes inside strings that aren't escaped
  cleaned = cleaned.replace(/"([^"]*?)(?<!\\)"([^"]*?)"/g, (match, p1, p2) => {
    // If p2 contains typical JSON structure characters, it's likely a real quote boundary
    if (p2.match(/^[\s]*[:,\[\]{}]/)) {
      return match;
    }
    // Otherwise, escape the middle quote
    return `"${p1}\\"${p2}"`;
  });

  return cleaned;
}

function safeJsonParse<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    console.error('Initial JSON parse failed, attempting repairs...');
    console.error('Error position:', (firstError as SyntaxError).message);
    
    // Log a portion around the error position for debugging
    const posMatch = (firstError as SyntaxError).message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      console.error('Context around error:', jsonString.substring(Math.max(0, pos - 50), pos + 50));
    }

    // Attempt to fix common issues
    let repaired = jsonString;
    
    // Fix trailing commas before } or ]
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between array elements or object properties
    repaired = repaired.replace(/}(\s*){/g, '},$1{');
    repaired = repaired.replace(/](\s*)\[/g, '],$1[');
    repaired = repaired.replace(/"(\s*)"/g, '",$1"');
    
    // Try parsing again
    try {
      return JSON.parse(repaired);
    } catch (secondError) {
      console.error('JSON repair failed:', secondError);
      console.error('Raw response (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('Raw response (last 500 chars):', jsonString.substring(jsonString.length - 500));
      throw new Error(`JSON parse error: ${(firstError as Error).message}. AI response may be malformed.`);
    }
  }
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
      model: 'claude-sonnet-4-5-20250929',
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

    const responseText = message.content
      .map(part => (part.type === 'text' ? part.text : ''))
      .join('\n');

    const cleanedResponse = extractAndCleanJson(responseText);
    const aiResponse: AIAnalysisResponse = safeJsonParse<AIAnalysisResponse>(cleanedResponse);

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
      model: 'claude-sonnet-4-5-20250929',
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

    const responseText = message.content
      .map(part => (part.type === 'text' ? part.text : ''))
      .join('\n');
    const cleanedResponse = extractAndCleanJson(responseText);
    const sentenceAnalysis: SentenceAnalysis = safeJsonParse<SentenceAnalysis>(cleanedResponse);
    
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
