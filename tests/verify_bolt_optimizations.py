import asyncio
from playwright.async_api import async_playwright
import subprocess
import time
import os

async def verify_optimizations():
    # Start the Flask app
    proc = subprocess.Popen(['python3', 'app.py'], env={**os.environ, 'FLASK_DEBUG': 'False'})
    time.sleep(2)  # Give the server time to start

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()

            # 1. Desktop Viewport
            page = await browser.new_page()
            await page.goto('http://127.0.0.1:5000')

            print("Verifying Desktop Page Load...")
            await page.wait_for_selector('.navbar')

            # Verify animations triggered by IntersectionObserver
            print("Verifying reveal animations...")
            hero_content = page.locator('.hero-content')
            await page.wait_for_selector('.hero-content.visible')

            # 2. Mobile Viewport
            print("Verifying Mobile Menu...")
            mobile_page = await browser.new_page(viewport={'width': 375, 'height': 667})
            await mobile_page.goto('http://127.0.0.1:5000')

            menu_btn = mobile_page.locator('.mobile-menu-btn')
            nav_links = mobile_page.locator('.nav-links')

            # Initial state
            assert await nav_links.is_hidden() or await nav_links.evaluate("el => getComputedStyle(el).display === 'none'")

            # Toggle Open
            print("Toggling Mobile Menu Open...")
            await menu_btn.click()
            await mobile_page.wait_for_selector('.nav-links.active')
            assert await mobile_page.evaluate("document.body.classList.contains('no-scroll')")

            # Toggle Close via link
            print("Toggling Mobile Menu Close via link...")
            await mobile_page.click('.nav-links a[href="#about"]')
            await asyncio.sleep(0.5)
            # Depending on CSS, it might be display:none or off-screen
            is_active = await mobile_page.evaluate("document.querySelector('.nav-links').classList.contains('active')")
            assert not is_active
            assert not await mobile_page.evaluate("document.body.classList.contains('no-scroll')")

            # 3. Form Interaction
            print("Verifying Contact Form...")
            await page.fill('#name', 'Bolt Test')
            await page.fill('#email', 'bolt@test.com')
            await page.fill('#message', 'Speed is a feature.')

            # Check character counter
            char_counter = await page.inner_text('#charCounter')
            assert "19 / 1000" in char_counter

            print("Frontend verification successful!")
            await browser.close()

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(verify_optimizations())
