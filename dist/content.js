// X Invest Extension - Content Script
// Injects the Invest tab and UI into X.com

(function () {
  'use strict';

  // Wait for the page to be fully loaded
  function waitForElement(selector, callback, maxAttempts = 50) {
    let attempts = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        callback(element);
      } else if (++attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('X Invest: Could not find element:', selector);
      }
    }, 200);
  }

  // Create the Invest tab
  function createInvestTab() {
    // Find the navigation bar (where Grok tab is)
    const navSelector = 'nav[aria-label="Primary"] a[href="/i/grok"]';

    waitForElement(navSelector, (grokTab) => {
      // Check if Invest tab already exists
      if (document.querySelector('[data-xinvest-tab]')) {
        return;
      }

      // Clone the Grok tab structure
      const investTab = grokTab.cloneNode(true);
      investTab.setAttribute('data-xinvest-tab', 'true');
      investTab.href = '#';

      // Update the tab content
      const tabContent = investTab.querySelector('div[dir="ltr"]');
      if (tabContent) {
        // Find and update the icon
        const iconContainer = tabContent.querySelector('svg').parentElement;
        iconContainer.innerHTML = `
          <svg viewBox="0 0 256 256" width="26.25" height="26.25" fill="currentColor">
            <path d="M240,56v64a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,212.69,64H168a8,8,0,0,1,0-16h64A8,8,0,0,1,240,56Z"></path>
          </svg>
        `;

        // Update the text
        const textSpan = tabContent.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Invest';
        }
      }

      // Insert after Grok tab
      grokTab.parentElement.insertBefore(investTab, grokTab.nextSibling);

      // Add click handler
      investTab.addEventListener('click', (e) => {
        e.preventDefault();
        toggleInvestPanel();
      });

      console.log('X Invest: Tab created successfully');
    });
  }

  // Create the Invest panel
  function createInvestPanel() {
    if (document.getElementById('xinvest-panel')) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'xinvest-panel';
    panel.className = 'xinvest-panel';
    panel.style.display = 'none';

    panel.innerHTML = `
      <div class="xinvest-container">
        <div class="xinvest-header">
          <h1 class="xinvest-title">X Invest</h1>
          <button class="xinvest-close" id="xinvest-close">×</button>
        </div>
        
        <div class="xinvest-content">
          <p class="xinvest-subtitle">Analyze any X account and generate a personalized stock portfolio</p>
          
          <form class="xinvest-form" id="xinvest-form">
            <div class="xinvest-input-wrapper">
              <span class="xinvest-at">@</span>
              <input 
                type="text" 
                id="xinvest-handle" 
                placeholder="elonmusk" 
                class="xinvest-input"
              />
              <button type="submit" class="xinvest-submit" id="xinvest-submit">
                <svg class="xinvest-search-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"/>
                </svg>
              </button>
            </div>
            <div class="xinvest-error" id="xinvest-error"></div>
          </form>
          
          <div class="xinvest-loading" id="xinvest-loading" style="display: none;">
            <p>Grok is analyzing tweets...</p>
            <div class="xinvest-progress-bar">
              <div class="xinvest-progress-fill"></div>
            </div>
          </div>
          
          <div class="xinvest-results" id="xinvest-results" style="display: none;">
            <div class="xinvest-reasoning-section">
              <div class="xinvest-section-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
                </svg>
                <span>Grok's Analysis</span>
              </div>
              <div class="xinvest-reasoning" id="xinvest-reasoning"></div>
            </div>
            
            <div class="xinvest-tickers-section">
              <div class="xinvest-section-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span>Portfolio Tickers & Weights</span>
              </div>
              <div id="xinvest-tickers-list"></div>
              <button class="xinvest-add-ticker" id="xinvest-add-ticker">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Ticker
              </button>
            </div>
            
            <button class="xinvest-vault-btn" id="xinvest-vault-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              Open Vault
            </button>
          </div>
        </div>
      </div>
    `;

    // Find the main timeline container
    waitForElement('main[role="main"]', (mainElement) => {
      const timelineContainer = mainElement.querySelector('div[data-testid="primaryColumn"]');
      if (timelineContainer) {
        timelineContainer.appendChild(panel);
        setupEventListeners();
      }
    });
  }

  // Toggle panel visibility
  function toggleInvestPanel() {
    const panel = document.getElementById('xinvest-panel');
    if (!panel) {
      createInvestPanel();
      setTimeout(() => toggleInvestPanel(), 100);
      return;
    }

    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      // Hide the main timeline
      const timeline = document.querySelector('div[data-testid="primaryColumn"] > div > div:not(#xinvest-panel)');
      if (timeline) {
        timeline.style.display = 'none';
      }
    } else {
      panel.style.display = 'none';
      // Show the main timeline
      const timeline = document.querySelector('div[data-testid="primaryColumn"] > div > div:not(#xinvest-panel)');
      if (timeline) {
        timeline.style.display = 'block';
      }
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    const closeBtn = document.getElementById('xinvest-close');
    const form = document.getElementById('xinvest-form');
    const addTickerBtn = document.getElementById('xinvest-add-ticker');
    const vaultBtn = document.getElementById('xinvest-vault-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', toggleInvestPanel);
    }

    if (form) {
      form.addEventListener('submit', handleAnalyze);
    }

    if (addTickerBtn) {
      addTickerBtn.addEventListener('click', addTicker);
    }

    if (vaultBtn) {
      vaultBtn.addEventListener('click', openVault);
    }
  }

  // State management
  let currentTickers = [];
  let currentWeights = {};
  let currentReasoning = '';
  let currentHandle = '';

  // Handle analyze form submission
  async function handleAnalyze(e) {
    e.preventDefault();

    const handleInput = document.getElementById('xinvest-handle');
    const handle = handleInput.value.trim();

    if (!handle) return;

    currentHandle = handle;

    const loadingDiv = document.getElementById('xinvest-loading');
    const resultsDiv = document.getElementById('xinvest-results');
    const errorDiv = document.getElementById('xinvest-error');

    loadingDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    errorDiv.textContent = '';

    try {
      // Mock data for demonstration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulated response
      currentTickers = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'COIN'];
      currentWeights = {
        'AAPL': 10,
        'TSLA': 15,
        'NVDA': 12,
        'MSFT': 10,
        'GOOGL': 10,
        'AMZN': 10,
        'META': 8,
        'NFLX': 8,
        'AMD': 9,
        'COIN': 8
      };
      currentReasoning = `Based on @${handle}'s tweets, they show strong interest in technology innovation, AI, and sustainable energy. This portfolio reflects a tech-forward investment strategy with emphasis on AI leaders and growth stocks.`;

      displayResults();

    } catch (error) {
      errorDiv.textContent = error.message || 'Something went wrong';
    } finally {
      loadingDiv.style.display = 'none';
    }
  }

  // Display analysis results
  function displayResults() {
    const resultsDiv = document.getElementById('xinvest-results');
    const reasoningDiv = document.getElementById('xinvest-reasoning');
    const tickersListDiv = document.getElementById('xinvest-tickers-list');

    reasoningDiv.textContent = currentReasoning;

    tickersListDiv.innerHTML = currentTickers.map((ticker, index) => `
      <div class="xinvest-ticker-item">
        <input 
          type="text" 
          value="${ticker}" 
          class="xinvest-ticker-input"
          data-index="${index}"
          placeholder="Enter ticker"
        />
        <div class="xinvest-weight-group">
          <input 
            type="number" 
            value="${currentWeights[ticker] || 0}" 
            class="xinvest-weight-input"
            data-ticker="${ticker}"
            min="0"
            max="100"
            step="0.1"
          />
          <span class="xinvest-percent">%</span>
        </div>
        <button class="xinvest-delete-ticker" data-index="${index}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Add total weight indicator
    const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + w, 0);
    const isValid = Math.abs(totalWeight - 100) < 1;
    const weightClass = isValid ? 'valid' : 'invalid';

    tickersListDiv.innerHTML += `
      <div class="xinvest-total-weight">
        <span>Total Portfolio Weight:</span>
        <span class="xinvest-weight-value ${weightClass}">${totalWeight.toFixed(1)}%</span>
      </div>
    `;

    resultsDiv.style.display = 'block';

    // Add event listeners for ticker inputs
    document.querySelectorAll('.xinvest-ticker-input').forEach(input => {
      input.addEventListener('change', updateTicker);
    });

    document.querySelectorAll('.xinvest-weight-input').forEach(input => {
      input.addEventListener('change', updateWeight);
    });

    document.querySelectorAll('.xinvest-delete-ticker').forEach(btn => {
      btn.addEventListener('click', deleteTicker);
    });
  }

  // Update ticker
  function updateTicker(e) {
    const index = parseInt(e.target.dataset.index);
    const oldTicker = currentTickers[index];
    const newTicker = e.target.value.toUpperCase();

    currentTickers[index] = newTicker;

    if (oldTicker && oldTicker !== newTicker && currentWeights[oldTicker]) {
      currentWeights[newTicker] = currentWeights[oldTicker];
      delete currentWeights[oldTicker];
    }

    displayResults();
  }

  // Update weight
  function updateWeight(e) {
    const ticker = e.target.dataset.ticker;
    const weight = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    currentWeights[ticker] = weight;
    displayResults();
  }

  // Delete ticker
  function deleteTicker(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const ticker = currentTickers[index];

    currentTickers.splice(index, 1);
    delete currentWeights[ticker];

    displayResults();
  }

  // Add ticker
  function addTicker() {
    currentTickers.push('');
    displayResults();
  }

  // Open vault (redirect to your web app)
  function openVault() {
    // Save to localStorage
    localStorage.setItem('vaultTickers', JSON.stringify(currentTickers));
    localStorage.setItem('vaultWeights', JSON.stringify(currentWeights));
    localStorage.setItem('vaultHandle', currentHandle);
    localStorage.setItem('vaultReasoning', currentReasoning);

    // Open your web app in a new tab
    window.open('http://localhost:3000/vault', '_blank');
  }

  // Initialize
  function init() {
    console.log('X Invest: Initializing...');
    createInvestTab();
    createInvestPanel();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run when navigating (X is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();
