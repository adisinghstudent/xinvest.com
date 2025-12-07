const yf = require('yahoo-finance2').default;
console.log('Type of yf:', typeof yf);
console.log('Is historical a function?', typeof yf.historical);

(async () => {
    try {
        const res = await yf.historical('AAPL', { period1: '2023-01-01' });
        console.log('Success:', res.length);
    } catch (e) {
        console.log('Error:', e.message);
    }
})();
