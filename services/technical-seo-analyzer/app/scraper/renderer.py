"""
Playwright-based HTML renderer for JavaScript-heavy pages.
Optimized for WordPress and modern JS-rendered websites.
Handles lazy loading, AJAX content, and cookie consent popups.
"""

import asyncio
import logging
from typing import Optional
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

logger = logging.getLogger(__name__)

# Browser instance for reuse (singleton pattern)
_browser: Optional[Browser] = None
_playwright = None

# Cookie consent button selectors - comprehensive list
COOKIE_CONSENT_SELECTORS = [
    # Generic accept buttons
    'button[id*="accept" i]',
    'button[id*="consent" i]',
    'button[id*="agree" i]',
    'button[id*="cookie" i]',
    'button[class*="accept" i]',
    'button[class*="consent" i]',
    'button[class*="agree" i]',
    'a[id*="accept" i]',
    'a[class*="accept" i]',
    '[data-testid*="accept" i]',
    '[data-testid*="consent" i]',
    
    # Common cookie plugins
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#CybotCookiebotDialogBodyButtonAccept',
    '.cc-btn.cc-allow',
    '.cc-accept',
    '.cc-dismiss',
    '.cookie-consent-accept',
    '#cookie-consent-accept',
    '.gdpr-accept',
    '#gdpr-accept',
    '.cookie-accept-all',
    '#accept-cookies',
    '.accept-cookies-button',
    '#cookie-accept',
    '.cookie-notice-accept',
    '#cn-accept-cookie',
    '.cli_accept_all_btn',
    '#cli-accept-all-btn',
    
    # ARIA labels
    '[aria-label*="Accept" i]',
    '[aria-label*="Accept all" i]',
    '[aria-label*="Accept cookies" i]',
    '[aria-label*="Agree" i]',
    
    # Text-based selectors (Playwright specific)
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Accept Cookies")',
    'button:has-text("I Accept")',
    'button:has-text("I Agree")',
    'button:has-text("Agree")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("Allow")',
    'button:has-text("Allow All")',
    'button:has-text("Continue")',
    'button:has-text("Close")',
    'a:has-text("Accept")',
    'a:has-text("I Accept")',
    'a:has-text("Agree")',
    
    # Turkish
    'button:has-text("Kabul")',
    'button:has-text("Kabul Et")',
    'button:has-text("Kabul Ediyorum")',
    'button:has-text("Tamam")',
    'button:has-text("Tümünü Kabul Et")',
    'button:has-text("Anladım")',
    
    # German
    'button:has-text("Akzeptieren")',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Zustimmen")',
    
    # French
    'button:has-text("Accepter")',
    'button:has-text("Tout accepter")',
    
    # Spanish
    'button:has-text("Aceptar")',
    'button:has-text("Aceptar todo")',
]

# Desktop user agent
DESKTOP_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36"
)

# Scroll script for lazy loading
SCROLL_SCRIPT = """
async () => {
    // Get page height
    const getScrollHeight = () => Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
    );
    
    // Scroll down gradually to trigger lazy loading
    const scrollStep = window.innerHeight;
    let currentPosition = 0;
    const maxScrolls = 50; // Safety limit
    let scrollCount = 0;
    
    while (currentPosition < getScrollHeight() && scrollCount < maxScrolls) {
        window.scrollTo(0, currentPosition);
        currentPosition += scrollStep;
        scrollCount++;
        await new Promise(r => setTimeout(r, 100));
    }
    
    // Final scroll to absolute bottom
    window.scrollTo(0, getScrollHeight());
    await new Promise(r => setTimeout(r, 300));
    
    // Scroll back to top
    window.scrollTo(0, 0);
    
    return {
        totalHeight: getScrollHeight(),
        scrollCount: scrollCount
    };
}
"""


async def _get_browser() -> Browser:
    """Get or create a browser instance (singleton)."""
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
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        )
        logger.info("Playwright browser started successfully")
    
    return _browser


async def _close_browser():
    """Close the browser instance."""
    global _browser, _playwright
    
    if _browser:
        await _browser.close()
        _browser = None
        logger.info("Browser closed")
    
    if _playwright:
        await _playwright.stop()
        _playwright = None


async def _click_cookie_consent(page: Page) -> bool:
    """
    Try to click cookie consent buttons.
    Returns True if a button was clicked.
    """
    clicked = False
    
    for selector in COOKIE_CONSENT_SELECTORS:
        try:
            element = page.locator(selector).first
            if await element.count() > 0:
                # Check if visible
                is_visible = await element.is_visible()
                if is_visible:
                    await element.click(timeout=2000, force=True)
                    logger.info(f"Clicked cookie consent: {selector}")
                    clicked = True
                    await asyncio.sleep(500 / 1000)  # 500ms wait
                    break
        except Exception:
            continue
    
    return clicked


async def _wait_for_content_ready(page: Page) -> None:
    """Wait for dynamic content to be ready (WordPress/AJAX specific)."""
    try:
        # Wait for common WordPress content containers
        wp_selectors = [
            'article',
            '.entry-content',
            '.post-content',
            '.article-content',
            '.content-area',
            'main',
            '#content',
            '.site-content',
        ]
        
        for selector in wp_selectors:
            try:
                await page.wait_for_selector(selector, timeout=3000)
                logger.debug(f"Found content container: {selector}")
                break
            except:
                continue
                
    except Exception as e:
        logger.debug(f"Content ready check: {e}")


async def get_rendered_html_async(
    url: str,
    timeout_ms: int = 45000,
    scroll_wait_ms: int = 1500,
    final_wait_ms: int = 1000
) -> str:
    """
    Fetch and render a URL using Playwright with full content loading.
    
    Optimized for WordPress and JS-rendered sites:
    1. Navigate with domcontentloaded
    2. Scroll to bottom to trigger lazy loading
    3. Wait for AJAX content
    4. Click cookie consent buttons
    5. Wait for networkidle
    6. Return fully rendered HTML
    
    Args:
        url: The URL to render
        timeout_ms: Total page load timeout
        scroll_wait_ms: Wait time after scrolling (for lazy load)
        final_wait_ms: Final wait before capturing HTML
        
    Returns:
        Fully rendered HTML string
    """
    browser = await _get_browser()
    context: Optional[BrowserContext] = None
    page: Optional[Page] = None
    
    try:
        # Create context with desktop settings
        context = await browser.new_context(
            user_agent=DESKTOP_USER_AGENT,
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            java_script_enabled=True,
            bypass_csp=True,  # Bypass Content Security Policy
        )
        
        page = await context.new_page()
        
        # Set extra headers
        await page.set_extra_http_headers({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
        })
        
        logger.info(f"Rendering URL: {url}")
        
        # Step 1: Navigate with domcontentloaded (faster initial load)
        try:
            response = await page.goto(
                url,
                wait_until='domcontentloaded',
                timeout=timeout_ms
            )
            
            if response and response.status >= 400:
                logger.warning(f"HTTP {response.status} for {url}")
                
        except Exception as e:
            logger.warning(f"Initial navigation issue: {e}")
        
        # Step 2: Wait for WordPress/JS content containers
        await _wait_for_content_ready(page)
        
        # Step 3: Scroll to bottom to trigger lazy loading
        try:
            scroll_result = await page.evaluate(SCROLL_SCRIPT)
            logger.info(f"Scroll complete: height={scroll_result.get('totalHeight', 0)}, scrolls={scroll_result.get('scrollCount', 0)}")
        except Exception as e:
            logger.warning(f"Scroll failed: {e}")
            # Fallback simple scroll
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        
        # Step 4: Wait after scroll for lazy content
        await asyncio.sleep(scroll_wait_ms / 1000)
        
        # Step 5: Click cookie consent buttons
        await _click_cookie_consent(page)
        
        # Step 6: Wait for networkidle (AJAX content)
        try:
            await page.wait_for_load_state('networkidle', timeout=10000)
            logger.info("Network idle reached")
        except Exception as e:
            logger.warning(f"Network idle timeout: {e}")
        
        # Step 7: Final wait for any remaining dynamic content
        await asyncio.sleep(final_wait_ms / 1000)
        
        # Step 8: Check for and handle any remaining modals/overlays
        modal_selectors = [
            '.modal-backdrop',
            '.overlay',
            '[class*="popup"]',
            '[class*="modal"]',
        ]
        for selector in modal_selectors:
            try:
                modal = page.locator(selector)
                if await modal.count() > 0 and await modal.first.is_visible():
                    # Try to close it
                    close_btn = page.locator(f'{selector} button:has-text("Close"), {selector} .close, {selector} [aria-label="Close"]').first
                    if await close_btn.count() > 0:
                        await close_btn.click(timeout=1000)
            except:
                continue
        
        # Step 9: Get the fully rendered HTML
        html_content = await page.content()
        
        content_length = len(html_content)
        logger.info(f"Successfully rendered {url} ({content_length} bytes)")
        
        return html_content
        
    except Exception as e:
        logger.error(f"Render failed for {url}: {str(e)}")
        raise Exception(f"Playwright rendering failed: {str(e)}")
        
    finally:
        if page:
            await page.close()
        if context:
            await context.close()


def get_rendered_html(
    url: str,
    timeout_ms: int = 45000,
    scroll_wait_ms: int = 1500,
    final_wait_ms: int = 1000
) -> str:
    """
    Synchronous wrapper for get_rendered_html_async.
    
    Args:
        url: The URL to render
        timeout_ms: Total page load timeout
        scroll_wait_ms: Wait time after scrolling
        final_wait_ms: Final wait before capturing
        
    Returns:
        Fully rendered HTML string
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    get_rendered_html_async(url, timeout_ms, scroll_wait_ms, final_wait_ms)
                )
                return future.result()
        else:
            return loop.run_until_complete(
                get_rendered_html_async(url, timeout_ms, scroll_wait_ms, final_wait_ms)
            )
    except RuntimeError:
        return asyncio.run(
            get_rendered_html_async(url, timeout_ms, scroll_wait_ms, final_wait_ms)
        )


async def cleanup():
    """Clean up browser resources. Call on application shutdown."""
    await _close_browser()
    logger.info("Playwright resources cleaned up")
