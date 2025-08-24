class AIWordSwapper {
  constructor() {
    this.processedNodes = new WeakSet();
    this.apiCache = new Map();
    this.init();
  }

  init() {
    this.addEventListeners();
    this.processPage();
    this.observeChanges();
  }

  addEventListeners() {
    // Event listeners are now added directly to each span in parseMarkedText
  }

  showWordDetails(chinese, pinyin, english, element) {
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.wordswap-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'wordswap-tooltip';
    tooltip.innerHTML = `
      <div><strong>${chinese}</strong></div>
      <div><em>${pinyin}</em></div>
      <div>${english}</div>
    `;
    
    // Style the tooltip
    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-family: sans-serif;
      line-height: 1.4;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 200px;
      pointer-events: none;
    `;

    document.body.appendChild(tooltip);
    
    // Position tooltip near the clicked element (accounting for scroll)
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';

    // Remove tooltip after 3 seconds or on next click
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 3000);

    // Remove on click elsewhere
    const removeTooltip = () => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
      document.removeEventListener('click', removeTooltip);
    };
    setTimeout(() => document.addEventListener('click', removeTooltip), 100);
  }

  async processPage() {
    
    // Use site-specific extractor
    const hostname = window.location.hostname;
    const extractor = window.SiteExtractors ? window.SiteExtractors.getExtractorForSite(hostname) : null;
    
    if (!extractor) {
      return;
    }

    const extractorConfig = extractor();
    
    // Collect all titles for API processing
    const titles = [];
    const titleElements = [];
    
    extractorConfig.selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const titleText = extractorConfig.extractText ? extractorConfig.extractText(element) : element.textContent.trim();
        if (titleText && !this.processedNodes.has(element)) {
          titles.push(titleText);
          titleElements.push(element);
        }
      });
    });
    
    if (titles.length > 0) {
      try {
        const processedTitles = await this.processTitlesWithChatGPT(titles);
        this.applyProcessedTitles(titleElements, processedTitles);
      } catch (error) {
        console.error('WordSwap: Failed to process titles with ChatGPT:', error);
      }
    }
  }

  async processTitlesWithChatGPT(titles) {
    const cacheKey = JSON.stringify(titles);
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey);
    }

    const requestBody = {
      model: "gpt-4.1-2025-04-14",
      messages: [
        {
          role: "system", 
          content: "You will receive a JSON array of English sentences. Replace a phrase in each sentence with a Chinese phrase but only if the phrase can written in extremely elementary Chinese characters (like 你, 我, 好, 的, 是, etc.). For each Chinese replacement, wrap it in markers like this: <PHRASE>chinese|pinyin|english</PHRASE>. Return ONLY a JSON array with the same number of sentences. Example: 'I am good' becomes '<PHRASE>我很好|wǒ hěn hǎo|I am good</PHRASE>'."
        },
        {
          role: "user",
          content: JSON.stringify(titles)
        }
      ],
      max_tokens: 1000
    };

    try {
      const apiKey = await this.getApiKey();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WordSwap: API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('WordSwap: Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }
      
      const content = data.choices[0].message.content;
      
      try {
        const processedTitles = JSON.parse(content);
        this.apiCache.set(cacheKey, processedTitles);
        return processedTitles;
      } catch (parseError) {
        console.error('WordSwap: Failed to parse API response as JSON:', content);
        throw parseError;
      }
    } catch (error) {
      console.error('WordSwap: API request error:', error);
      throw error;
    }
  }

  async getApiKey() {
    try {
      const result = await browser.storage.local.get(['openaiApiKey']);
      if (result.openaiApiKey) {
        return result.openaiApiKey;
      } else {
        throw new Error('No API key found. Please configure your OpenAI API key in the extension settings.');
      }
    } catch (error) {
      console.error('WordSwap: Error getting API key:', error);
      throw error;
    }
  }

  applyProcessedTitles(elements, processedTitles) {
    elements.forEach((element, index) => {
      if (index < processedTitles.length && !this.processedNodes.has(element)) {
        const originalText = element.textContent.trim();
        const processedText = processedTitles[index];
        
        if (processedText !== originalText) {
          
          // Parse and replace marked text with clickable spans
          const parsedContent = this.parseMarkedText(processedText);
          element.innerHTML = parsedContent;
          
          element.classList.add('wordswap-ai-replacement');
        }
        
        this.processedNodes.add(element);
      }
    });
  }

  parseMarkedText(text) {
    // Replace <PHRASE>chinese|pinyin|english</PHRASE> with clickable spans
    return text.replace(/<PHRASE>([^|]+)\|([^|]+)\|([^<]+)<\/PHRASE>/g, (_, chinese, pinyin, english) => {
      const spanId = 'wordswap-' + Math.random().toString(36).slice(2, 9);
      // Schedule event listener attachment after DOM update
      setTimeout(() => {
        const span = document.getElementById(spanId);
        if (span) {
          span.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.showWordDetails(chinese, pinyin, english, span);
          });
        }
      }, 0);
      
      return `<span id="${spanId}" class="wordswap-clickable" data-chinese="${chinese}" data-pinyin="${pinyin}" data-english="${english}" style="color: #0066cc; cursor: pointer; font-weight: bold;">${chinese}</span>`;
    });
  }

  observeChanges() {
    let timeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        let hasNewContent = false;
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hasNewContent = true;
            }
          });
        });
        
        if (hasNewContent) {
          this.processPage();
        }
      }, 500); // Longer delay for API calls
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Wait for extractors to be available
function initializeWhenReady() {
  
  if (window.SiteExtractors) {
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new AIWordSwapper();
      });
    } else {
      new AIWordSwapper();
    }
  } else {
    setTimeout(initializeWhenReady, 100);
  }
}

initializeWhenReady();