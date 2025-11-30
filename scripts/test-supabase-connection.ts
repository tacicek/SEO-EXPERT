/**
 * Test Supabase Connection
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { supabase } from '../lib/db/supabase';
import { analysisService, siteService } from '../lib/db/services';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('sites')
      .select('count');
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return;
    }
    console.log('✅ Connection successful!\n');

    // Test 2: Create a test site
    console.log('Test 2: Creating a test site...');
    const testSite = await siteService.create({
      domain: 'test-example.com',
      name: 'Test Example Site',
    });
    console.log('✅ Site created:', {
      id: testSite.id,
      domain: testSite.domain,
      name: testSite.name,
    });
    console.log('');

    // Test 3: Create a test analysis
    console.log('Test 3: Creating a test analysis...');
    const testAnalysis = await analysisService.create({
      url: 'https://test-example.com/test-article',
      title: 'Test Article',
      siteId: testSite.id,
    });
    console.log('✅ Analysis created:', {
      id: testAnalysis.id,
      url: testAnalysis.url,
      status: testAnalysis.status,
    });
    console.log('');

    // Test 4: Get site statistics
    console.log('Test 4: Getting site statistics...');
    const siteWithStats = await siteService.getWithStats(testSite.id);
    console.log('✅ Site statistics:', {
      domain: siteWithStats.domain,
      total_analyses: siteWithStats.total_analyses,
      avg_score: siteWithStats.avg_score,
    });
    console.log('');

    // Test 5: Get analysis statistics
    console.log('Test 5: Getting analysis statistics...');
    const analysisStats = await analysisService.getStats();
    console.log('✅ Analysis statistics:', analysisStats);
    console.log('');

    // Test 6: Get recent analyses
    console.log('Test 6: Getting recent analyses...');
    const recentAnalyses = await analysisService.getRecent(5);
    console.log('✅ Recent analyses count:', recentAnalyses.length);
    console.log('');

    // Test 7: Get all sites
    console.log('Test 7: Getting all sites...');
    const { data: allSites, count } = await siteService.getAll();
    console.log('✅ Total sites:', count);
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await analysisService.delete(testAnalysis.id);
    await siteService.delete(testSite.id);
    console.log('✅ Cleanup complete!\n');

    console.log('✨ All tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Database connection: ✅');
    console.log('   - Sites table: ✅');
    console.log('   - Analyses table: ✅');
    console.log('   - Views (site_stats): ✅');
    console.log('   - CRUD operations: ✅');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testConnection();
