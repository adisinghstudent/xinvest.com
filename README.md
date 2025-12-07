# 🚀 X Invest

> **Transform X (Twitter) profiles into investment portfolios powered by AI**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://xinvest-com.vercel.app)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-blue)](./dist)
[![License](https://img.shields.io/badge/license-GPL--3.0-green)](./LICENSE)

X Invest analyzes any X (Twitter) account using Grok AI to generate personalized stock portfolios based on their tweets, interests, and expertise. Share your investment strategy, discover what others are investing in, and compete on a public leaderboard.

---

## ✨ Features

### 🤖 **AI-Powered Portfolio Generation**
- **Grok AI Analysis**: Analyzes the last 20 tweets from any X account
- **Smart Stock Selection**: Generates 10 personalized stock picks based on user interests
- **Reasoning Transparency**: See exactly why each stock was chosen
- **Custom Weights**: AI assigns portfolio weights based on conviction levels

### 📊 **Real-Time Performance Tracking**
- **Live Price Data**: Real-time stock prices via Yahoo Finance API
- **Historical Charts**: Interactive performance charts showing portfolio growth
- **Multiple Timeframes**: View performance over 24h, 30d, or all-time
- **PnL Tracking**: Automatic profit & loss calculation across all timeframes

### 🏆 **Public Leaderboard**
- **Share Your Vault**: Make your portfolio public with one click
- **Compete Globally**: See how your strategy performs vs. others
- **Performance Rankings**: Sorted by 24h, 30d, and all-time returns
- **Anonymous or Public**: Choose to share with your X handle or stay anonymous

### 🔐 **Vault System**
- **Personal Vaults**: Save and track multiple portfolio strategies
- **Edit Anytime**: Adjust tickers and weights as markets change
- **Privacy First**: Vaults are private by default
- **Share Selectively**: Choose which vaults to make public

### 🌐 **Chrome Extension**
- **Native X.com Integration**: Adds "Invest" tab directly in X's sidebar
- **One-Click Analysis**: Analyze any profile without leaving X
- **Seamless Experience**: Matches X.com's design perfectly
- **Instant Access**: Toggle between timeline and portfolio view

---

## 🎯 How It Works

### 1️⃣ **Analyze Any X Account**

```
Enter @username → Grok analyzes tweets → AI generates portfolio
```

**Example:**
- Input: `@elonmusk`
- Analysis: "Strong interest in technology, AI, sustainable energy, and space exploration"
- Output: Portfolio weighted toward TSLA, NVDA, AI leaders, and aerospace stocks

### 2️⃣ **Review & Customize**

- **See AI Reasoning**: Understand why each stock was selected
- **Edit Tickers**: Add, remove, or change stock symbols
- **Adjust Weights**: Fine-tune portfolio allocation
- **Validate**: Ensure weights total 100%

### 3️⃣ **Save to Vault**

- **Create Vault**: Save your portfolio with one click
- **Track Performance**: Watch real-time price changes
- **View Charts**: Interactive historical performance graphs
- **Monitor PnL**: See gains/losses across multiple timeframes

### 4️⃣ **Share & Compete**

- **Make Public**: Toggle "Share Vault" to join the leaderboard
- **Climb Rankings**: Compete based on portfolio performance
- **Inspire Others**: Let people see your investment strategy
- **Learn Together**: Discover what top performers are investing in

---

## 🖥️ Screenshots

### Home Page - Portfolio Generator
```
┌─────────────────────────────────────────────────┐
│              X Invest                           │
│  Analyze any X account and generate a          │
│  personalized stock portfolio                  │
│                                                 │
│  ┌──────────────────────────────────┐          │
│  │ @  elonmusk              [🔍]    │          │
│  └──────────────────────────────────┘          │
│                                                 │
│  Grok's Analysis:                              │
│  "Strong focus on AI, sustainable energy..."   │
│                                                 │
│  Portfolio Tickers & Weights:                  │
│  ┌──────────────────────────────────┐          │
│  │ TSLA                    15.0%  ✏️│          │
│  │ NVDA                    12.0%  ✏️│          │
│  │ MSFT                    10.0%  ✏️│          │
│  └──────────────────────────────────┘          │
│                                                 │
│  [Open Vault →]                                │
└─────────────────────────────────────────────────┘
```

### Vault View - Performance Dashboard
```
┌─────────────────────────────────────────────────┐
│  @elonmusk's Portfolio                         │
│                                                 │
│  📈 Performance Chart                          │
│  ┌──────────────────────────────────┐          │
│  │     ╱╲                            │          │
│  │    ╱  ╲      ╱╲                  │          │
│  │   ╱    ╲    ╱  ╲                 │          │
│  │  ╱      ╲  ╱    ╲                │          │
│  │ ╱        ╲╱      ╲               │          │
│  └──────────────────────────────────┘          │
│                                                 │
│  💰 PnL:  +12.5% (24h)  +45.2% (30d)          │
│                                                 │
│  📊 Holdings:                                  │
│  TSLA  $245.30  +2.3%                         │
│  NVDA  $495.20  +1.8%                         │
│  MSFT  $378.50  +0.9%                         │
│                                                 │
│  [Share Vault] [Edit Portfolio]               │
└─────────────────────────────────────────────────┘
```

### Public Leaderboard
```
┌─────────────────────────────────────────────────┐
│  🏆 Public Leaderboard                         │
│  Top performing shared vaults                  │
│                                                 │
│  #  User          24h      30d      All Time   │
│  ─────────────────────────────────────────────  │
│  1  @elonmusk    +5.2%   +45.2%   +127.8%     │
│  2  @cathiewood  +4.8%   +38.1%   +98.3%      │
│  3  @chamath     +3.9%   +32.5%   +87.2%      │
│  4  @naval       +3.2%   +28.9%   +76.5%      │
│  5  @balajis     +2.8%   +25.3%   +65.1%      │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive data visualization

### Backend & APIs
- **Grok AI (xAI)** - Tweet analysis and portfolio generation
- **Yahoo Finance API** - Real-time stock data
- **Supabase** - Authentication and database
- **PostgreSQL** - Relational data storage

### Chrome Extension
- **Manifest V3** - Modern extension architecture
- **Content Scripts** - Native X.com integration
- **Phosphor Icons** - Beautiful, consistent iconography
- **TwitterChirp Font** - Matches X.com's design system

---

## 🚀 Getting Started

### Web App

1. **Visit the app:**
   ```
   https://xinvest-com.vercel.app
   ```

2. **Sign in with Google** (optional for viewing, required for saving)

3. **Analyze an account:**
   - Enter any X username (without @)
   - Wait for Grok to analyze
   - Review the generated portfolio

4. **Save to vault:**
   - Click "Open Vault"
   - View real-time performance
   - Share publicly (optional)

### Chrome Extension

1. **Download the extension:**
   ```bash
   git clone https://github.com/yourusername/xinvest.com.git
   cd xinvest.com/dist
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Use on X.com:**
   - Navigate to https://x.com
   - Click the "Invest" tab (under Grok)
   - Analyze profiles without leaving X

---

## 📖 Use Cases

### 🎓 **Learn from Experts**
Discover what industry leaders might invest in based on their interests:
- Tech influencers → AI and semiconductor stocks
- Finance experts → Value and growth picks
- Crypto advocates → Blockchain and fintech companies

### 💡 **Generate Ideas**
Use AI analysis to:
- Find stocks aligned with specific themes
- Discover companies in emerging sectors
- Get diversification suggestions

### 🏆 **Compete & Share**
- Share your best-performing portfolios
- Climb the public leaderboard
- Inspire others with your strategy
- Learn from top performers

### 📊 **Track Performance**
- Monitor multiple portfolio strategies
- Compare different approaches
- See what works over time
- Adjust based on market conditions

---

## 🔒 Privacy & Security

### Data Protection
- **Private by Default**: All vaults are private unless you choose to share
- **Secure Authentication**: Google OAuth via Supabase
- **No Tweet Storage**: We only analyze, never store tweet content
- **Encrypted Connections**: All data transmitted over HTTPS

### What We Store
- ✅ Your portfolio tickers and weights
- ✅ Performance metrics (PnL)
- ✅ Public/private vault settings
- ❌ Your tweets or X account data
- ❌ Personal financial information

### Sharing Controls
- **Full Control**: You decide what to share
- **Anonymous Option**: Share vaults without your X handle
- **Revoke Anytime**: Make public vaults private instantly
- **No Tracking**: We don't track your browsing on X.com

---

## 🎨 Design Philosophy

### Seamless Integration
- **Native Feel**: Matches X.com's design system perfectly
- **TwitterChirp Font**: Uses X's official typography
- **Dark Theme**: Consistent with X's aesthetic
- **Smooth Animations**: Polished, professional experience

### User-First
- **One-Click Actions**: Minimal friction
- **Clear Feedback**: Always know what's happening
- **Error Handling**: Helpful messages, never cryptic errors
- **Responsive Design**: Works on all screen sizes

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Report Bugs
- Open an issue with detailed reproduction steps
- Include screenshots if applicable
- Mention your browser/OS version

### Suggest Features
- Describe the use case
- Explain the expected behavior
- Share mockups if you have them

### Submit PRs
- Fork the repository
- Create a feature branch
- Write clear commit messages
- Add tests if applicable
- Submit a pull request

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Free to use, modify, and distribute
- ✅ Must disclose source code
- ✅ Must use same license for derivatives
- ✅ Commercial use allowed

---

## 🙏 Acknowledgments

### Technologies
- **xAI** for Grok AI API
- **Supabase** for backend infrastructure
- **Vercel** for hosting and deployment
- **Yahoo Finance** for market data

### Inspiration
- The X (Twitter) community
- Open-source finance tools
- AI-powered investment research

---

## 📞 Contact & Support

### Get Help
- **Documentation**: Check the `/dist` folder for extension guides
- **Issues**: Open a GitHub issue
- **Discussions**: Join our community discussions

### Stay Updated
- **Website**: https://xinvest-com.vercel.app
- **GitHub**: Star the repo for updates
- **X (Twitter)**: Follow for announcements

---

## 🗺️ Roadmap

### Coming Soon
- [ ] **More AI Models**: Support for Claude, GPT-4, etc.
- [ ] **Crypto Portfolios**: Analyze for crypto investments
- [ ] **Backtesting**: See how portfolios would have performed historically
- [ ] **Social Features**: Follow other investors, comment on vaults
- [ ] **Mobile App**: Native iOS and Android apps
- [ ] **API Access**: Programmatic portfolio generation

### Future Ideas
- [ ] **Paper Trading**: Simulate trades without real money
- [ ] **Alerts**: Get notified of significant price movements
- [ ] **Portfolio Rebalancing**: AI-suggested adjustments
- [ ] **Multi-Account Analysis**: Combine insights from multiple X accounts
- [ ] **Export Options**: PDF reports, CSV data, etc.

---

## 💎 Why X Invest?

### For Investors
- **Discover New Ideas**: AI finds stocks you might have missed
- **Learn from Others**: See what successful investors focus on
- **Track Performance**: Monitor your strategies over time
- **Stay Informed**: Real-time data keeps you updated

### For Creators
- **Share Your Expertise**: Let followers see your investment thesis
- **Build Credibility**: Prove your strategy with real performance
- **Engage Community**: Discuss picks with your audience
- **Monetize Knowledge**: (Coming soon: Premium insights)

### For Researchers
- **Sentiment Analysis**: See how X discussions correlate with stock picks
- **Trend Discovery**: Identify emerging investment themes
- **Performance Studies**: Analyze what strategies work
- **Data Export**: (Coming soon: API access for research)

---

<div align="center">

**Built with ❤️ for the X community**

[Get Started](https://xinvest-com.vercel.app) • [Install Extension](./dist) • [Report Bug](https://github.com/yourusername/xinvest/issues)

</div>
