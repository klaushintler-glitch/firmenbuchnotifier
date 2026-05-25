import { test, expect } from '@playwright/test';

test.describe('Firmenbuch Notifier - Search and Drawer E2E Tests', () => {
  test('should load the page and allow searching and opening the drawer', async ({ page }) => {
    // 1. Visit the home page
    await page.goto('/');

    // 2. Assert page headers and elements are visible
    await expect(page.locator('.logo-text')).toHaveText('FirmenbuchNotifier');
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();

    // 3. Search for "123456a" (mock FNR for Mayer Bau GmbH)
    await searchInput.fill('123456a');
    
    // Wait for the debounced search results (debounce delay is 450ms)
    await page.waitForTimeout(3000); 

    // 4. Assert results are present in the masonry grid
    const cards = page.locator('.masonry-item');
    const count = await cards.count();
    console.log(`Search result count for "123456a": ${count}`);
    expect(count).toBeGreaterThan(0);

    // 5. Verify the first result card has "Mayer Bau GmbH" in it
    const firstCardName = cards.first().locator('.company-card-name');
    await expect(firstCardName).toContainText('Mayer Bau GmbH');
    const companyNameText = await firstCardName.innerText();

    // 6. Click the first card to open the Document Drawer
    await cards.first().click();

    // 7. Verify Drawer opens and displays the correct company details
    const drawer = page.locator('.doc-drawer');
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('.drawer-company-name')).toHaveText(companyNameText);

    // 8. Verify documents list is loaded (in mock mode it loads 3 documents)
    const docCards = page.locator('.doc-card');
    await expect(docCards.first()).toBeVisible();
    const docCount = await docCards.count();
    console.log(`Document count in drawer for "${companyNameText}": ${docCount}`);
    expect(docCount).toBeGreaterThan(0);

    // 9. Close the drawer
    await page.locator('.drawer-close').click();
    await expect(drawer).not.toHaveClass(/open/);
  });
});
