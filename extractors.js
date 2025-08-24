// Site-specific text extractors for word swapping
// Only extracts the specific content we want to translate on each site

class SiteExtractors {
  static getExtractorForSite(hostname) {
    if (hostname.includes('news.ycombinator.com')) {
      return this.hackerNewsExtractor;
    }
    
    // Add more extractors as needed
    return null;
  }

  // Hacker News - extract only story titles
  static hackerNewsExtractor() {
    return {
      name: 'hackernews-titles',
      selectors: [
        '.titleline a' // Story title links
      ],
      extractText: (element) => {
        // Only extract direct text content, skip nested elements
        return SiteExtractors.getDirectTextContent(element);
      }
    };
  }

  // Helper to get only direct text content, ignoring nested elements
  static getDirectTextContent(element) {
    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    return text.trim();
  }
}

// Export for use in content script
window.SiteExtractors = SiteExtractors;