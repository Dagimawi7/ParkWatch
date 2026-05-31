import { chromium } from 'playwright';
import { CityEngine, EngineResult, Ticket } from './index';

// creats a boston ticket checking machine which follows the rule of a city engine
export class BostonEngine implements CityEngine {
    cityName = 'Boston'; // set the city name
    

    // give me a plate number and I return ticket results
    async checkTickets(plate: string): Promise<EngineResult> {
        //open chorme but keep it hidden, to see it you have to set headless to false
        const browser = await chromium.launch({ headless: true });
        // open private session in chorme so it doesn't use my cookies and loggs me out of stuff
        const context = await browser.newContext({
            // Pretend to be a normal human browser. so website won't block us
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', // set the user agent
            viewport: { width: 1280, height: 720 } // set the size of the browser window
        });
        // Open a new browser tab
        const page = await context.newPage();

        try { // try to find tickets 
            const targetUrl = 'https://bostonma.rmcpay.com/'; // target url bostons ticket portal
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }); // go to the url
            // array for ticket results
            const tickets: Ticket[] = []; // list of tickets found
            // Close browser to stop it from running in the backgorund
            await browser.close();
            // Return the results
            return {
                success: true,
                tickets
            };
        // catch errors when scraping fails 
        } catch (error: any) { 
            // log the error
            console.error(`[BostonEngine] Failed to scrapte plate ${plate}:`, error);
            let screenshotpath = undefined; // store file path of the screenshot
            try{ // try to take screenshot 
                const timestamp = Date.now (); // get current time 
                screenshotpath = `screenshots/boston_error_${plate}_${timestamp}.png`; // path to store screenshot 
                await page.screenshot({ path: screenshotpath, fullPage: true }); // take the screenshot
            } catch (screenshotError) { // catch errors when taking screenshot 
                console.error(`[BostonEngine] Failed to wirte failure screenshot:`, screenshotError); // log the error 
            }
            await browser.close(); // close the browser 
            // Return the results 
            return {
                success: false, 
                tickets:[], 
                error: error.message || 'unknown scraping error occured',
                screenshotpath
            };

            }
        
            
        }
        
        
    }
