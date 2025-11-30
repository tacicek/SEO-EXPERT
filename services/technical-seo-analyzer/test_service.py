#!/usr/bin/env python3
"""
Quick test script for Technical SEO Analyzer service
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Health check passed: {data['status']}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_analyze(url="https://example.com"):
    """Test full analysis endpoint"""
    print(f"\n🔍 Analyzing {url}...")
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json={"url": url},
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Analysis complete!")
        print(f"   Overall Score: {data['score']['overall']}/100")
        print(f"   Meta Score: {data['score']['meta']}/100")
        print(f"   Headings Score: {data['score']['headings']}/100")
        print(f"   Images Score: {data['score']['images']}/100")
        print(f"   URL Score: {data['score']['url']}/100")
        print(f"   Schema Score: {data['score']['schema']}/100")
        print(f"   Content Score: {data['score']['content']}/100")
        
        print(f"\n📋 Issues found: {len(data['issues'])}")
        for issue in data['issues'][:3]:
            print(f"   • [{issue['impact'].upper()}] {issue['message']}")
        
        if len(data['issues']) > 3:
            print(f"   ... and {len(data['issues']) - 3} more")
        
        return True
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return False

def test_quick_analyze(url="https://example.com"):
    """Test quick analysis endpoint"""
    print(f"\n🔍 Quick analyzing {url}...")
    try:
        response = requests.post(
            f"{BASE_URL}/analyze/quick",
            json={"url": url},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Quick analysis complete!")
        print(f"   Meta Score: {data['meta_score']}/100")
        print(f"   Critical Issues: {data['critical_issues_count']}")
        
        return True
    except Exception as e:
        print(f"❌ Quick analysis failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Technical SEO Analyzer - Service Test\n")
    print("=" * 50)
    
    # Check if service is running
    if not test_health():
        print("\n❌ Service is not running!")
        print("Start it with: python -m uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Run tests
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    
    success = True
    success = test_analyze(test_url) and success
    success = test_quick_analyze(test_url) and success
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
