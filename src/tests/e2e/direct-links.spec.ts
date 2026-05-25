import { test, expect } from '@playwright/test';

test.describe('Firmenbuch Notifier - Direct Document Links E2E Tests', () => {
  test('should parse FNR and doc parameters, auto-open drawer, and highlight document', async ({ page }) => {
    const testFnr = '123456a';
    const testDocKey = '123456a_doc_3_gesellschaftsvertrag';
    const testUrl = `/?fnr=${testFnr}&doc=${testDocKey}`;

    // 1. Visit the direct link
    await page.goto(testUrl);

    // 2. Verify that the search input got populated with the FNR
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toHaveValue(testFnr);

    // 3. Verify that the Drawer automatically slides open
    const drawer = page.locator('.doc-drawer');
    await expect(drawer).toHaveClass(/open/);

    // 4. Verify the drawer title shows the mock company "Mayer Bau GmbH"
    await expect(page.locator('.drawer-company-name')).toHaveText('Mayer Bau GmbH');

    // 5. Verify the target document is highlighted in the list
    const highlightedCard = page.locator('.doc-card.highlighted');
    await expect(highlightedCard).toBeVisible();
    await expect(highlightedCard.locator('.doc-card-title')).toHaveText('Gesellschaftsvertrag');

    // 6. Close the drawer
    await page.locator('.drawer-close').click();
    await expect(drawer).not.toHaveClass(/open/);
    
    // 7. Verify the highlighted state was reset on close
    await expect(highlightedCard).not.toBeVisible();
  });
});
