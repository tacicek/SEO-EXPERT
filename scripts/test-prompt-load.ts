import { getSystemPrompt } from '../lib/ai/prompts';

try {
    console.log('Loading system prompt...');
    const prompt = getSystemPrompt();

    if (prompt && prompt.length > 0) {
        console.log('✅ System prompt loaded successfully!');
        console.log('Prompt length:', prompt.length);
        console.log('First 100 characters:', prompt.substring(0, 100));
    } else {
        console.error('❌ System prompt is empty!');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to load system prompt:', error);
    process.exit(1);
}
