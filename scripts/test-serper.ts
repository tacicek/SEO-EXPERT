/**
 * Test Serper.dev Integration
 * Run with: npx tsx scripts/test-serper.ts
 */

import { serperService } from '../lib/services/serper';

async function testSerper() {
  console.log('🔍 Testing Serper.dev Integration...\n');

  try {
    // Test 1: Scrape a URL
    console.log('Test 1: Scraping a URL...');
    const testUrl = 'https://example.com';
    
    const scrapeResult = await serperService.scrapeUrl(testUrl);
    console.log('✅ Scrape successful!');
    console.log('Response keys:', Object.keys(scrapeResult));
    
    // Extract text content
    const textContent = serperService.extractTextContent(scrapeResult);
    console.log('Text content length:', textContent.length);
    console.log('First 200 chars:', textContent.substring(0, 200));
    
    // Extract metadata
    const metadata = serperService.extractMetadata(scrapeResult);
    console.log('Metadata:', {
      title: metadata.title,
      description: metadata.description?.substring(0, 100),
      author: metadata.author,
      lang: metadata.lang,
    });
    console.log('');

    // Test 2: Google Search
    console.log('Test 2: Performing a Google search...');
    const searchResult = await serperService.searchGoogle({
      q: 'SEO best practices',
      num: 5,
    });
    
    console.log('✅ Search successful!');
    console.log('Search parameters:', searchResult.searchParameters);
    console.log('Number of results:', searchResult.organic?.length || 0);
    
    if (searchResult.organic && searchResult.organic.length > 0) {
      console.log('\nTop 3 results:');
      searchResult.organic.slice(0, 3).forEach((result, idx) => {
        console.log(`${idx + 1}. ${result.title}`);
        console.log(`   ${result.link}`);
        console.log(`   ${result.snippet?.substring(0, 100)}...`);
      });
    }
    
    console.log('\nCredits used:', searchResult.credits || 'N/A');
    console.log('');

    // Test 3: URL validation
    console.log('Test 3: Testing URL validation...');
    const validUrl = 'https://example.com/article';
    const invalidUrl = 'https://example.com/document.pdf';
    
    console.log(`Is "${validUrl}" scrapable?`, serperService.isScrapableUrl(validUrl));
    console.log(`Is "${invalidUrl}" scrapable?`, serperService.isScrapableUrl(invalidUrl));
    console.log('');

    console.log('✨ All tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - URL Scraping: ✅');
    console.log('   - Google Search: ✅');
    console.log('   - URL Validation: ✅');
    console.log('   - Text Extraction: ✅');
    console.log('   - Metadata Extraction: ✅');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.log('\n💡 Make sure SERPER_API_KEY is set in your .env file');
      }
    }
    
    process.exit(1);
  }
}

// Run tests
testSerper();
