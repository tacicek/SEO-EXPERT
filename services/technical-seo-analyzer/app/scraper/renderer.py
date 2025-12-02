"""
Playwright-based HTML renderer optimized for WordPress/Gutenberg/Elementor.
Handles lazy loading, AJAX content, React hydration, and dynamic page builders.

Key features:
- Progressive scroll with height stability detection
- Wait for actual content (not just containers)
- Multiple content detection strategies
- Extended timeouts for AJAX/React
"""

import asyncio
import logging
from typing import Optional, Tuple
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

logger = logging.getLogger(__name__)

# Browser singleton
_browser: Optional[Browser] = None
_playwright = None

# User agent
DESKTOP_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36"
)

# Cookie consent selectors
COOKIE_CONSENT_SELECTORS = [
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '.cc-btn.cc-allow',
    'button[id*="accept" i]',
    'button[class*="accept" i]',
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("I Agree")',
    'button:has-text("OK")',
    'button:has-text("Kabul")',
    'button:has-text("Tamam")',
    '[aria-label*="Accept" i]',
]

# Content selectors to wait for
CONTENT_SELECTORS = [
    'article',
    '.entry-content',
    '.post-content',
    '.article-content',
    '[role="main"]',
    'main',
    '.elementor-widget-container',
    '.wp-block-post-content',
    '.et_pb_post_content',
    '#content',
    '.content',
]


async def _get_browser() -> Browser:
    """Get or create browser instance."""
    global _browser, _playwright
    
    if _browser is None or not _browser.is_connected():
        logger.info("Starting Playwright browser...")
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080',
            ]
        )
    return _browser


async def _close_browser():
    """Close browser instance."""
    global _browser, _playwright
    if _browser:
        await _browser.close()
        _browser = None
    if _playwright:
        await _playwright.stop()
        _playwright = None


async def _get_page_word_count(page: Page) -> int:
    """Get approximate word count from visible text in page."""
    try:
        word_count = await page.evaluate('''
            () => {
                // Get all text from body, excluding script/style
                const body = document.body;
                if (!body) return 0;
                
                // Clone body and remove unwanted elements
                const clone = body.cloneNode(true);
                const remove = clone.querySelectorAll('script, style, noscript, nav, header, footer, aside');
                remove.forEach(el => el.remove());
                
                // Get text content
                const text = clone.innerText || clone.textContent || '';
                
                // Count words
                const words = text.trim().split(/\\s+/).filter(w => w.length > 0);
                return words.length;
            }
        ''')
        return word_count or 0
    except Exception as e:
        logger.warning(f"Word count check failed: {e}")
        return 0


async def _get_page_height(page: Page) -> int:
    """Get current page height."""
    try:
        height = await page.evaluate('() => document.body.scrollHeight')
        return height or 0
    except:
        return 0


async def _progressive_scroll(page: Page, max_scrolls: int = 20, stability_checks: int = 3) -> None:
    """
    Scroll progressively until page height stabilizes.
    This triggers lazy-loaded content and infinite scroll.
    """
    logger.info("Starting progressive scroll...")
    
    last_height = await _get_page_height(page)
    stable_count = 0
    scroll_count = 0
    
    while scroll_count < max_scrolls and stable_count < stability_checks:
        # Scroll down by viewport height
        await page.evaluate('window.scrollBy(0, window.innerHeight)')
        await asyncio.sleep(0.3)
        
        # Check height
        new_height = await _get_page_height(page)
        
        if new_height == last_height:
            stable_count += 1
        else:
            stable_count = 0
            last_height = new_height
        
        scroll_count += 1
    
    # Scroll to absolute bottom
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    await asyncio.sleep(0.5)
    
    # Scroll back to top
    await page.evaluate('window.scrollTo(0, 0)')
    
    logger.info(f"Scroll complete: {scroll_count} scrolls, final height: {last_height}")


async def _wait_for_content(page: Page, min_words: int = 200, timeout_ms: int = 15000) -> bool:
    """
    Wait until page has minimum word count.
    This ensures React/Gutenberg hydration and AJAX content is loaded.
    """
    logger.info(f"Waiting for content (min {min_words} words)...")
    
    start_time = asyncio.get_event_loop().time()
    timeout_sec = timeout_ms / 1000
    
    while (asyncio.get_event_loop().time() - start_time) < timeout_sec:
        word_count = await _get_page_word_count(page)
        
        if word_count >= min_words:
            logger.info(f"Content ready: {word_count} words")
            return True
        
        logger.debug(f"Current word count: {word_count}, waiting...")
        await asyncio.sleep(0.5)
    
    # Final check
    final_count = await _get_page_word_count(page)
    logger.warning(f"Content wait timeout. Final word count: {final_count}")
    return final_count >= min_words


async def _wait_for_hydration(page: Page, timeout_ms: int = 10000) -> None:
    """
    Wait for React/Gutenberg hydration to complete.
    Checks for common hydration indicators.
    """
    try:
        # Wait for React hydration markers
        await page.wait_for_function('''
            () => {
                // Check if React has hydrated
                const reactRoot = document.querySelector('[data-reactroot]') || 
                                  document.querySelector('#__next') ||
                                  document.querySelector('#root');
                
                // Check if Gutenberg blocks are rendered
                const gutenbergBlocks = document.querySelectorAll('[class*="wp-block-"]');
                
                // Check if Elementor widgets are rendered
                const elementorWidgets = document.querySelectorAll('.elementor-widget-container');
                
                // If any framework elements exist, check they have content
                if (reactRoot || gutenbergBlocks.length > 0 || elementorWidgets.length > 0) {
                    const bodyText = document.body.innerText || '';
                    return bodyText.length > 500;
                }
                
                // No framework detected, just check for content
                return document.body.innerText.length > 200;
            }
        ''', timeout=timeout_ms)
        logger.info("Hydration complete")
    except Exception as e:
        logger.warning(f"Hydration wait timeout: {e}")


async def _click_cookie_buttons(page: Page) -> None:
    """Click cookie consent buttons."""
    for selector in COOKIE_CONSENT_SELECTORS:
        try:
            btn = page.locator(selector).first
            if await btn.count() > 0 and await btn.is_visible():
                await btn.click(timeout=2000, force=True)
                logger.info(f"Clicked cookie button: {selector}")
                await asyncio.sleep(0.3)
                return
        except:
            continue


async def _wait_for_selectors(page: Page, timeout_ms: int = 10000) -> Optional[str]:
    """Wait for any content selector to appear with content."""
    for selector in CONTENT_SELECTORS:
        try:
            element = page.locator(selector).first
            await element.wait_for(state='attached', timeout=timeout_ms // len(CONTENT_SELECTORS))
            
            # Check if it has content
            text_length = await element.evaluate('el => (el.innerText || "").length')
            if text_length > 100:
                logger.info(f"Found content in: {selector} ({text_length} chars)")
                return selector
        except:
            continue
    
    return None


async def get_rendered_html_async(
    url: str,
    timeout_ms: int = 60000,
    min_words: int = 150,
    scroll_wait_ms: int = 2000,
    content_wait_ms: int = 15000
) -> str:
    """
    Fetch and render URL with full content extraction.
    
    This function:
    1. Navigates and waits for initial DOM
    2. Waits for content selectors to appear
    3. Waits for React/Gutenberg hydration
    4. Performs progressive scroll for lazy content
    5. Waits for minimum word count
    6. Validates content before returning
    
    Args:
        url: URL to render
        timeout_ms: Total page timeout
        min_words: Minimum words to wait for
        scroll_wait_ms: Wait time after scrolling
        content_wait_ms: Max wait for content to appear
        
    Returns:
        Fully rendered HTML
    """
    browser = await _get_browser()
    context: Optional[BrowserContext] = None
    page: Optional[Page] = None
    
    try:
        # Create context
        context = await browser.new_context(
            user_agent=DESKTOP_USER_AGENT,
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True,
            bypass_csp=True,
        )
        
        page = await context.new_page()
        
        logger.info(f"Rendering: {url}")
        
        # Step 1: Navigate
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=timeout_ms)
        except Exception as e:
            logger.warning(f"Navigation warning: {e}")
        
        # Step 2: Wait for initial network activity to settle
        try:
            await page.wait_for_load_state('networkidle', timeout=15000)
        except:
            pass
        
        # Step 3: Wait for content selectors
        await _wait_for_selectors(page, timeout_ms=10000)
        
        # Step 4: Wait for React/Gutenberg hydration
        await _wait_for_hydration(page, timeout_ms=10000)
        
        # Step 5: Click cookie banners
        await _click_cookie_buttons(page)
        
        # Step 6: Progressive scroll for lazy content
        await _progressive_scroll(page, max_scrolls=15, stability_checks=3)
        
        # Step 7: Wait after scroll
        await asyncio.sleep(scroll_wait_ms / 1000)
        
        # Step 8: Wait for minimum content
        content_ready = await _wait_for_content(page, min_words=min_words, timeout_ms=content_wait_ms)
        
        # Step 9: Final network idle
        try:
            await page.wait_for_load_state('networkidle', timeout=5000)
        except:
            pass
        
        # Step 10: Get HTML
        html = await page.content()
        
        # Validate
        final_word_count = await _get_page_word_count(page)
        html_length = len(html)
        
        logger.info(f"Rendered {url}: {html_length} bytes, ~{final_word_count} words")
        
        if final_word_count < 50:
            logger.warning(f"Low word count ({final_word_count}). Content may be incomplete.")
        
        return html
        
    except Exception as e:
        logger.error(f"Render failed: {e}")
        raise
        
    finally:
        if page:
            await page.close()
        if context:
            await context.close()


def get_rendered_html(
    url: str,
    timeout_ms: int = 60000,
    min_words: int = 150,
    scroll_wait_ms: int = 2000,
    content_wait_ms: int = 15000
) -> str:
    """Synchronous wrapper for get_rendered_html_async."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    get_rendered_html_async(url, timeout_ms, min_words, scroll_wait_ms, content_wait_ms)
                )
                return future.result()
        else:
            return loop.run_until_complete(
                get_rendered_html_async(url, timeout_ms, min_words, scroll_wait_ms, content_wait_ms)
            )
    except RuntimeError:
        return asyncio.run(
            get_rendered_html_async(url, timeout_ms, min_words, scroll_wait_ms, content_wait_ms)
        )


async def cleanup():
    """Cleanup browser resources."""
    await _close_browser()
