"""
Playwright-based HTML renderer for JavaScript-heavy pages.
Handles dynamic content, cookie popups, and JS redirects.
"""

import asyncio
import logging
from typing import Optional
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

logger = logging.getLogger(__name__)

# Browser instance for reuse (singleton pattern)
_browser: Optional[Browser] = None
_playwright = None

# Common cookie consent button selectors
COOKIE_CONSENT_SELECTORS = [
    # Generic patterns
    'button[id*="accept"]',
    'button[id*="consent"]',
    'button[id*="agree"]',
    'button[id*="cookie"]',
    'button[class*="accept"]',
    'button[class*="consent"]',
    'button[class*="agree"]',
    '[data-testid*="accept"]',
    '[data-testid*="consent"]',
    # Common cookie consent plugins
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '.cc-btn.cc-allow',
    '.cookie-consent-accept',
    '#cookie-consent-accept',
    '.gdpr-accept',
    '#gdpr-accept',
    '.cookie-accept-all',
    '#accept-cookies',
    '.accept-cookies-button',
    '[aria-label*="Accept cookies"]',
    '[aria-label*="Accept all"]',
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("I Accept")',
    'button:has-text("Kabul")',  # Turkish
    'button:has-text("Kabul Et")',  # Turkish
    'button:has-text("Tamam")',  # Turkish
    'button:has-text("Tümünü Kabul Et")',  # Turkish
]

# Desktop user agents
DESKTOP_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


async def _get_browser() -> Browser:
    """Get or create a browser instance (singleton)."""
    global _browser, _playwright
    
    if _browser is None or not _browser.is_connected():
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
            ]
        )
        logger.info("Playwright browser instance created")
    
    return _browser


async def _close_browser():
    """Close the browser instance."""
    global _browser, _playwright
    
    if _browser:
        await _browser.close()
        _browser = None
    
    if _playwright:
        await _playwright.stop()
        _playwright = None


async def _handle_cookie_consent(page: Page) -> None:
    """
    Try to click cookie consent buttons automatically.
    Attempts multiple common selectors.
    """
    for selector in COOKIE_CONSENT_SELECTORS:
        try:
            # Check if element exists and is visible
            element = page.locator(selector).first
            if await element.count() > 0:
                is_visible = await element.is_visible()
                if is_visible:
                    await element.click(timeout=2000)
                    logger.info(f"Clicked cookie consent button: {selector}")
                    await asyncio.sleep(0.5)  # Wait for dialog to close
                    return
        except Exception:
            # Silently continue to next selector
            continue


async def _block_resources(route):
    """Block unnecessary resources for faster loading."""
    resource_type = route.request.resource_type
    
    # Block CSS, images, fonts, and media for speed
    if resource_type in ['stylesheet', 'image', 'font', 'media']:
        await route.abort()
    else:
        await route.continue_()


async def get_rendered_html_async(
    url: str,
    wait_for_network: bool = True,
    handle_cookies: bool = True,
    block_resources: bool = True,
    timeout_ms: int = 30000,
    extra_wait_ms: int = 1000
) -> str:
    """
    Fetch and render a URL using Playwright (headless Chromium).
    
    Args:
        url: The URL to render
        wait_for_network: Wait for network to be idle
        handle_cookies: Try to auto-click cookie consent popups
        block_resources: Block CSS/images/fonts for speed
        timeout_ms: Page load timeout in milliseconds
        extra_wait_ms: Additional wait time after load
        
    Returns:
        Fully rendered HTML string
        
    Raises:
        Exception: If rendering fails
    """
    browser = await _get_browser()
    context = None
    page = None
    
    try:
        # Create a new context with desktop settings
        context = await browser.new_context(
            user_agent=DESKTOP_USER_AGENT,
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            java_script_enabled=True,
        )
        
        # Create page
        page = await context.new_page()
        
        # Block resources if enabled
        if block_resources:
            await page.route('**/*', _block_resources)
        
        # Navigate to URL
        logger.info(f"Rendering URL: {url}")
        
        try:
            response = await page.goto(
                url,
                wait_until='networkidle' if wait_for_network else 'domcontentloaded',
                timeout=timeout_ms
            )
            
            if response and response.status >= 400:
                raise Exception(f"HTTP error {response.status}")
                
        except PlaywrightTimeout:
            logger.warning(f"Timeout waiting for network idle, continuing with current state")
        
        # Handle JS redirects - wait a bit and check URL
        await asyncio.sleep(0.5)
        current_url = page.url
        if current_url != url:
            logger.info(f"Detected redirect: {url} -> {current_url}")
        
        # Handle cookie consent popups
        if handle_cookies:
            await _handle_cookie_consent(page)
        
        # Extra wait for any lazy-loaded content
        if extra_wait_ms > 0:
            await asyncio.sleep(extra_wait_ms / 1000)
        
        # Scroll to trigger lazy loading
        await page.evaluate('''
            () => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            }
        ''')
        await asyncio.sleep(0.3)
        
        # Scroll back to top
        await page.evaluate('() => window.scrollTo(0, 0)')
        
        # Get the rendered HTML
        html_content = await page.content()
        
        logger.info(f"Successfully rendered {url} ({len(html_content)} bytes)")
        return html_content
        
    except Exception as e:
        logger.error(f"Failed to render {url}: {str(e)}")
        raise Exception(f"Playwright rendering failed: {str(e)}")
        
    finally:
        # Clean up
        if page:
            await page.close()
        if context:
            await context.close()


def get_rendered_html(
    url: str,
    wait_for_network: bool = True,
    handle_cookies: bool = True,
    block_resources: bool = True,
    timeout_ms: int = 30000,
    extra_wait_ms: int = 1000
) -> str:
    """
    Synchronous wrapper for get_rendered_html_async.
    Creates a new event loop if needed.
    
    Args:
        url: The URL to render
        wait_for_network: Wait for network to be idle
        handle_cookies: Try to auto-click cookie consent popups
        block_resources: Block CSS/images/fonts for speed
        timeout_ms: Page load timeout in milliseconds
        extra_wait_ms: Additional wait time after load
        
    Returns:
        Fully rendered HTML string
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, create a new thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    get_rendered_html_async(
                        url, wait_for_network, handle_cookies, 
                        block_resources, timeout_ms, extra_wait_ms
                    )
                )
                return future.result()
        else:
            return loop.run_until_complete(
                get_rendered_html_async(
                    url, wait_for_network, handle_cookies,
                    block_resources, timeout_ms, extra_wait_ms
                )
            )
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(
            get_rendered_html_async(
                url, wait_for_network, handle_cookies,
                block_resources, timeout_ms, extra_wait_ms
            )
        )


async def cleanup():
    """Clean up browser resources. Call on application shutdown."""
    await _close_browser()
    logger.info("Playwright browser cleaned up")

