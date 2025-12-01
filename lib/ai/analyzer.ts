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

// Initialize Anthropic client only if API key exists
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in your environment variables.');
  }
  return new Anthropic({ apiKey });
};

interface AIAnalysisResponse {
  content_summary: ContentSummary;
  sentence_analysis: SentenceAnalysis[];
  eeat_scores: EEATScores;
  priority_actions: PriorityAction[];
  statistics: AnalysisStatistics;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAnthropicWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8000,
  retries: number = MAX_RETRIES
): Promise<string> {
  const anthropic = getAnthropicClient();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Anthropic API call attempt ${attempt}/${retries}...`);
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens,
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

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from AI');
      }

      return responseText;
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      // Check if it's a retryable error
      const isRetryable = 
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 502 || // Bad Gateway
        error.status === 503 || // Service unavailable
        error.status === 504 || // Gateway timeout
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('socket hang up') ||
        error.message?.includes('network');

      if (isRetryable && attempt < retries) {
        const delay = RETRY_DELAY_MS * attempt; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else if (!isRetryable) {
        // Don't retry non-retryable errors
        break;
      }
    }
  }

  // If all retries failed, throw a descriptive error
  if (lastError) {
    const errorMessage = lastError.message || 'Unknown error';
    const errorStatus = (lastError as any).status;
    
    // Provide user-friendly error messages
    if (errorMessage.includes('Bad Gateway') || errorStatus === 502) {
      throw new Error('AI service is temporarily unavailable. Please try again in a few moments.');
    }
    if (errorMessage.includes('rate limit') || errorStatus === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (errorMessage.includes('ANTHROPIC_API_KEY') || errorStatus === 401) {
      throw new Error('AI service authentication failed. Please contact support.');
    }
    if (errorStatus === 500 || errorStatus === 503) {
      throw new Error('AI service is experiencing issues. Please try again later.');
    }
    
    throw new Error(`AI analysis failed: ${errorMessage}`);
  }

  throw new Error('AI analysis failed after multiple attempts. Please try again.');
}

function extractAndCleanJson(responseText: string): string {
  // Remove fences if model wrapped output
  let cleaned = responseText.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  
  // If there is leading/excess text, cut to first { ... last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1).trim();
  }

  return cleaned;
}

function repairJson(jsonString: string): string {
  let repaired = jsonString;
  
  // Step 1: Fix control characters
  repaired = repaired.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 2: Fix newlines and tabs inside strings by escaping them properly
  // This is a more sophisticated approach that processes character by character
  let result = '';
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }
    
    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      // Escape problematic characters inside strings
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  repaired = result;
  
  // Step 3: Fix trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Step 4: Fix missing commas between array elements
  // Match closing brace/bracket followed by opening brace/bracket without comma
  repaired = repaired.replace(/}(\s*)(?=")/g, '},$1');
  repaired = repaired.replace(/}(\s*){/g, '},$1{');
  repaired = repaired.replace(/](\s*)\[/g, '],$1[');
  repaired = repaired.replace(/"(\s*)"(?=[a-zA-Z_])/g, '",$1"');
  
  // Step 5: Fix number followed by string without comma
  repaired = repaired.replace(/(\d)(\s*)"(?=[a-zA-Z_])/g, '$1,$2"');
  
  // Step 6: Fix string ending followed by string starting without comma
  repaired = repaired.replace(/"(\s+)"/g, '", "');
  
  // Step 7: Ensure arrays are properly closed - find unclosed arrays
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }
  }
  
  // Step 8: Ensure objects are properly closed
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }
  }
  
  return repaired;
}

function safeJsonParse<T>(jsonString: string): T {
  // First attempt: direct parse
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    console.error('Initial JSON parse failed, attempting repairs...');
    
    // Log error details for debugging
    const posMatch = (firstError as SyntaxError).message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      console.error('Error at position:', pos);
      console.error('Context:', jsonString.substring(Math.max(0, pos - 100), Math.min(jsonString.length, pos + 100)));
    }

    // Second attempt: repair and parse
    try {
      const repaired = repairJson(jsonString);
      return JSON.parse(repaired);
    } catch (secondError) {
      console.error('Standard repair failed, trying aggressive repair...');
      
      // Third attempt: more aggressive repair
      try {
        let aggressive = repairJson(jsonString);
        
        // Remove any text after the last valid closing brace
        const lastBrace = aggressive.lastIndexOf('}');
        if (lastBrace !== -1) {
          aggressive = aggressive.substring(0, lastBrace + 1);
        }
        
        // Try to balance brackets/braces more carefully
        aggressive = balanceJsonStructure(aggressive);
        
        return JSON.parse(aggressive);
      } catch (thirdError) {
        console.error('All JSON repair attempts failed');
        console.error('First 2000 chars:', jsonString.substring(0, 2000));
        console.error('Last 1000 chars:', jsonString.substring(Math.max(0, jsonString.length - 1000)));
        throw new Error(`Invalid response format from AI. Please try again.`);
      }
    }
  }
}

function balanceJsonStructure(json: string): string {
  // Count and balance brackets/braces
  let result = json;
  let stack: string[] = [];
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }
  
  // Close unclosed structures
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') {
      result += '}';
    } else if (open === '[') {
      result += ']';
    }
  }
  
  return result;
}

export async function analyzeContent(content: string, title?: string): Promise<AnalysisResult> {
  // Validate inputs
  if (!content || content.trim().length < 50) {
    throw new Error('Content is too short to analyze. Please provide at least 50 characters.');
  }

  try {
    const systemPrompt = getSystemPrompt();
    
    const userPrompt = `
Analyze the following content. Provide analysis following the JSON structure in your system prompt.

${title ? `Title: ${title}\n\n` : ''}Content:
${content}

CRITICAL INSTRUCTIONS FOR JSON OUTPUT:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Limit sentence_analysis array to maximum 30 sentences (prioritize red and orange)
3. Keep all string values concise (max 200 characters each)
4. Ensure all strings are properly escaped (quotes, newlines, special chars)
5. Do not include any text before { or after }
6. Double-check JSON syntax before responding
`;

    const responseText = await callAnthropicWithRetry(systemPrompt, userPrompt, 8000);
    const cleanedResponse = extractAndCleanJson(responseText);
    const aiResponse: AIAnalysisResponse = safeJsonParse<AIAnalysisResponse>(cleanedResponse);

    // Validate AI response structure
    if (!aiResponse.content_summary || !aiResponse.sentence_analysis || !aiResponse.eeat_scores) {
      throw new Error('AI returned incomplete analysis. Please try again.');
    }

    // Create the full analysis result
    const analysisResult: AnalysisResult = {
      id: generateId(),
      title: title || aiResponse.content_summary.detected_topic,
      content_summary: aiResponse.content_summary,
      sentence_analysis: aiResponse.sentence_analysis,
      eeat_scores: aiResponse.eeat_scores,
      priority_actions: aiResponse.priority_actions || [],
      statistics: aiResponse.statistics || {
        total_sentences: aiResponse.sentence_analysis.length,
        green_count: aiResponse.sentence_analysis.filter(s => s.score === 'green').length,
        orange_count: aiResponse.sentence_analysis.filter(s => s.score === 'orange').length,
        red_count: aiResponse.sentence_analysis.filter(s => s.score === 'red').length,
        green_percentage: 0,
        word_count: content.split(/\s+/).length,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate green percentage if not provided
    if (analysisResult.statistics.green_percentage === 0 && analysisResult.statistics.total_sentences > 0) {
      analysisResult.statistics.green_percentage = Math.round(
        (analysisResult.statistics.green_count / analysisResult.statistics.total_sentences) * 100
      );
    }

    return analysisResult;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Analysis failed. Please try again.');
  }
}

export async function analyzeSentence(
  sentence: string,
  context: { previous?: string; next?: string; topic?: string }
): Promise<SentenceAnalysis> {
  if (!sentence || sentence.trim().length < 5) {
    throw new Error('Sentence is too short to analyze.');
  }

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

    const responseText = await callAnthropicWithRetry(systemPrompt, userPrompt, 2000);
    const cleanedResponse = extractAndCleanJson(responseText);
    const sentenceAnalysis: SentenceAnalysis = safeJsonParse<SentenceAnalysis>(cleanedResponse);
    
    return sentenceAnalysis;
  } catch (error) {
    console.error('Sentence Analysis Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Sentence analysis failed. Please try again.');
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
