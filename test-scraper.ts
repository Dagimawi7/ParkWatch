import { BostonEngine } from './engines/boston';

async function runTest() {
    const engine = new BostonEngine();
    console.log('🚀 Starting Boston Ticket Scraper Test...');
    
    // Using the dummy plate 123XYZ to see if the "no citations" flow runs successfully.
    const plateToTest = '123XYZ'; 
    
    const result = await engine.checkTickets(plateToTest);
    
    console.log('\n📊 SCRAPER RESULTS:');
    console.log(JSON.stringify(result, null, 2));
}

runTest();
