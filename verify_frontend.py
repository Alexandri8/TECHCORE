import asyncio
from playwright.async_api import async_playwright
import subprocess
import time
import os

async def verify_ux():
    # Start the app in background
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_DEBUG'] = 'False'
    os.environ['TESTING'] = 'true'
    process = subprocess.Popen(['flask', 'run', '--port=5002'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Wait for app to start

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(viewport={'width': 375, 'height': 667})
            page = await context.new_page()
            await page.goto('http://127.0.0.1:5002/')

            # Verify Mobile Menu
            mobile_btn = page.locator('.mobile-menu-btn')
            nav_links = page.locator('.nav-links')

            # Initial state
            assert await nav_links.is_hidden()

            # Open menu
            await mobile_btn.click()
            await page.wait_for_timeout(500) # Wait for animation
            assert await nav_links.is_visible()
            assert await page.evaluate("document.body.classList.contains('no-scroll')")

            # Close menu by clicking a link
            await page.locator('.nav-links a').first.click()
            await page.wait_for_timeout(500)
            assert await nav_links.is_hidden()
            assert not await page.evaluate("document.body.classList.contains('no-scroll')")

            print("Frontend UX Verification Passed!")

            await browser.close()
    finally:
        process.terminate()

if __name__ == "__main__":
    asyncio.run(verify_ux())
