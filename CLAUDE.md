# Claude Instructions for Firefox Language Learning Addon

## Project Overview
We're building a Firefox addon that helps users learn Chinese by replacing words on specific websites with their Chinese translations.

## Code Style Guidelines

### Simplicity First
- **Write code that beginners can understand**
- Use simple, explicit approaches over clever or concise ones
- Choose clarity over brevity in all cases
- Prefer verbose, descriptive variable and function names

### Modern JavaScript Patterns
- Use `const` and `let` instead of `var`
- Use arrow functions for simple functions: `const getName = () => 'John'`
- Use template literals for string interpolation: `` `Hello ${name}` ``
- Use async/await instead of Promise chains when dealing with asynchronous code
- Use destructuring for cleaner variable assignment: `const { title, content } = article`

### Avoid Complex Methods
- **Don't use `.reduce()`** - use `for` loops or `for...of` loops instead
- **Don't use `.map()` with side effects** - use loops for transformations that modify state
- **Don't use complex array methods** like `.flatMap()`, `.some()`, `.every()` unless they make the code significantly clearer
- Use simple `if/else` statements instead of ternary operators for complex conditions

### Examples of Preferred Patterns

#### ❌ Avoid (too complex for beginners)
```javascript
const wordCounts = words.reduce((acc, word) => ({
  ...acc,
  [word]: (acc[word] || 0) + 1
}), {});
```

#### ✅ Prefer (clear and simple)
```javascript
const wordCounts = {};
for (const word of words) {
  if (wordCounts[word]) {
    wordCounts[word] = wordCounts[word] + 1;
  } else {
    wordCounts[word] = 1;
  }
}
```

### Function Guidelines
- Keep functions short and focused on one task
- Use descriptive function names: `replaceSpanishWords()` instead of `replace()`
- Add comments explaining the purpose of each function
- Return early when possible to reduce nesting

### Variable Naming
- Use full words instead of abbreviations: `elementList` instead of `elList`
- Use camelCase consistently
- Boolean variables should start with `is`, `has`, or `should`: `isVisible`, `hasTranslation`

### Error Handling
- Use simple try/catch blocks
- Log errors clearly with descriptive messages
- Provide fallback behavior when operations fail

### No Premature Optimization
- Write the most straightforward solution first
- Don't worry about performance until it becomes a problem
- Favor readable code over micro-optimizations
- Use simple data structures (objects and arrays) over complex ones

### Comments and Documentation
- Add comments explaining **why** something is done, not just what
- Use JSDoc comments for functions that will be reused
- Explain any browser-specific or Firefox addon-specific code

## Firefox Addon Specific Guidelines

### Manifest and Structure
- Keep the manifest.json simple and well-commented
- Organize files in a clear directory structure
- Use descriptive filenames

### Content Scripts
- Keep content scripts lightweight
- Use clear selectors for DOM manipulation
- Handle cases where expected elements don't exist

### Example Code Structure
```javascript
// Good: Clear, simple function with descriptive name
function findTextNodesInElement(element) {
  const textNodes = [];
  
  // Walk through all child nodes
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Recursively search child elements
      const childTextNodes = findTextNodesInElement(node);
      for (const childNode of childTextNodes) {
        textNodes.push(childNode);
      }
    }
  }
  
  return textNodes;
}
```

## When to Break These Rules
These guidelines can be bent when:
- Firefox addon APIs require specific patterns
- A complex method significantly improves readability
- The simple approach would require much more code

## Remember
The goal is to create code that someone new to JavaScript and browser extensions can read, understand, and modify confidently.