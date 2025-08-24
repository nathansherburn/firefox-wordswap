// Settings page functionality for WordSwap extension

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const testButton = document.getElementById('testButton');
  const status = document.getElementById('status');

  // Load saved settings
  loadSettings();

  // Save settings on form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettings();
  });

  // Test API connection
  testButton.addEventListener('click', function() {
    testApiConnection();
  });

  async function loadSettings() {
    try {
      const result = await browser.storage.local.get(['openaiApiKey']);
      if (result.openaiApiKey) {
        apiKeyInput.value = result.openaiApiKey;
      }
    } catch (error) {
      console.error('WordSwap: Error loading settings:', error);
    }
  }

  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus('API key should start with "sk-"', 'error');
      return;
    }

    try {
      await browser.storage.local.set({
        openaiApiKey: apiKey
      });
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('WordSwap: Error saving settings:', error);
      showStatus('Error saving settings: ' + error.message, 'error');
    }
  }

  async function testApiConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key first', 'error');
      return;
    }

    showStatus('Testing connection...', 'success');
    testButton.disabled = true;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        showStatus('✓ API key is valid and working!', 'success');
      } else {
        const errorData = await response.json();
        showStatus(`API test failed: ${errorData.error?.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('WordSwap: Error testing API:', error);
      showStatus('Connection test failed: ' + error.message, 'error');
    } finally {
      testButton.disabled = false;
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  }
});