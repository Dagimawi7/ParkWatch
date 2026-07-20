import { chromium } from 'playwright';
import { CityEngine, EngineResult, Ticket } from './index';

// Creating Boston ticket checking engine 
export class BostonEngine implements CityEngine {
    cityName = 'Boston';

    // Takes a license plate number and checks for active tickets on the Boston RMCPay portal
    async checkTickets(plate: string): Promise<EngineResult> {
        // Launch a headless Chromium browser instance
        const browser = await chromium.launch({ headless: true });
        
        // Opens an isolated browser context with a modern user-agent to bypass basic bot-detection
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();

        try {
            const targetUrl = 'https://bostonma.rmcpay.com/';
            // Goes to the target site and waits until the DOM is loaded
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

            // Step A: Waits for the inputs to be visible on the page
            await page.waitForSelector('input#licensePlateInput', { state: 'visible', timeout: 15000 });

            // Step B: Fills the license plate input
            await page.fill('input#licensePlateInput', plate);

            // Step C: Selects the state dropdown (defaulting to Massachusetts 'MA')
            const stateSelect = page.locator('select#licensePlateStateSelect');
            if (await stateSelect.isVisible()) {
                await stateSelect.selectOption('MA');
            }

            // Step D: Submits the search
            const searchButton = page.locator('button[aria-label="Search by License Plate"]');
            await searchButton.click();

            // Step E: Sets up locator paths for the two expected outcomes:
            // 1. "No tickets found" alert text
            // 2. Active tickets listing row/container
            const noTicketsAlert = page.getByText(/No citations found for this license plate/i);
            
            // Typical classes for citation lists/items in RMC systems: .citation-card, .citation-item, etc.
            const citationItems = page.locator('.citation-card, .citation-item, .ticket-row, tr.ticket-row');

            // Wait for either outcome to load (up to 15 seconds)
            await Promise.race([
                noTicketsAlert.waitFor({ state: 'visible', timeout: 15000 }),
                citationItems.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
            ]);

            const tickets: Ticket[] = [];

            // Step F: Parse active tickets if any are present
            if (await citationItems.first().isVisible()) {
                const rows = await citationItems.all();
                for (const row of rows) {
                    // Extract data defensively
                    const ticketNumber = await row.locator('.citation-number, .ticket-id, [class*="number"]').first().innerText().catch(() => 'UNKNOWN');
                    const description = await row.locator('.violation, .description, [class*="description"]').first().innerText().catch(() => 'Parking Violation');
                    const amountDueText = await row.locator('.amount, .due, [class*="amount"]').first().innerText().catch(() => '$0.00');
                    const amountDue = parseFloat(amountDueText.replace(/[^0-9.]/g, '')) || 0;
                    const issueDate = await row.locator('.date, [class*="date"]').first().innerText().catch(() => new Date().toISOString());

                    tickets.push({
                        ticketNumber: ticketNumber.trim(),
                        issueDate: issueDate.trim(),
                        amountDue,
                        description: description.trim(),
                        rawPayload: { htmlRowText: await row.innerText() }
                    });
                }
            }

            // Always close browser before returning!
            await browser.close();

            return {
                success: true,
                tickets
            };

        } catch (error: any) {
            console.error(`[BostonEngine] Failed to scrape plate ${plate}:`, error);

            let screenshotpath = undefined;
            try {
                // If anything fails, capture a screenshot for debugging before cleaning up
                const timestamp = Date.now();
                screenshotpath = `screenshots/boston_error_${plate}_${timestamp}.png`;
                // Create directory if it doesn't exist (Playwright creates it automatically when screenshotting)
                await page.screenshot({ path: screenshotpath, fullPage: true });
            } catch (screenshotError) {
                console.error('[BostonEngine] Failed to write failure screenshot:', screenshotError);
            }

            await browser.close();

            return {
                success: false,
                tickets: [],
                error: error.message || 'unknown scraping error occurred',
                screenshotpath
            };
        }
    }
}
