const yf = require('yahoo-finance2');
console.log('Exports:', Object.keys(yf));
console.log('Default:', yf.default);
try {
    const instance = new yf.YahooFinance();
    console.log('Can instantiate YahooFinance');
} catch (e) {
    console.log('Cannot instantiate YahooFinance', e.message);
}
