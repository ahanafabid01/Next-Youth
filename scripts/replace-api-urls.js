const fs = require('fs');
const path = require('path');

// Define directories to search
const directoriesToSearch = [
  path.join(__dirname, '../client/src')
];

// Patterns to search for
const patterns = [
  {
    search: /http:\/\/localhost:4000\/api/g,
    replace: 'API_BASE_URL'
  },
  {
    search: /"http:\/\/localhost:4000"/g,
    replace: 'process.env.REACT_APP_API_URL || "http://localhost:4000"'
  }
];

// Function to process a file
function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanged = false;
    
    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        // If this is the first replacement, add the import statement
        if (!hasChanged && pattern.search === patterns[0].search && !content.includes('import API_BASE_URL')) {
          content = `import API_BASE_URL from '../utils/apiConfig';\n${content}`;
        }
        
        content = content.replace(pattern.search, pattern.replace);
        hasChanged = true;
      }
    });
    
    if (hasChanged) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// Function to walk through directories
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  });
}

// Run the script
console.log('Starting URL replacement...');
directoriesToSearch.forEach(dir => walkDir(dir));
console.log('Finished URL replacement!');