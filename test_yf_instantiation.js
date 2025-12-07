const YahooFinance = require('yahoo-finance2').default;

(async () => {
    try {
        const yf = new YahooFinance();
        const res = await yf.historical('AAPL', { period1: '2023-01-01' });
        console.log('Success:', res.length);
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
