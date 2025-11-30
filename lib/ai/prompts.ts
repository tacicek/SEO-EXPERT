import fs from 'fs';
import path from 'path';

export const getSystemPrompt = (): string => {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', 'master_system_prompt.md');
    const prompt = fs.readFileSync(promptPath, 'utf-8');
    return prompt;
  } catch (error) {
    console.error('Error reading system prompt:', error);
    throw new Error('Failed to load system prompt');
  }
};
