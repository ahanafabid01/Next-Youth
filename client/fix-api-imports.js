const fs = require('fs');
const path = require('path');

// Define directories to search
const directoriesToSearch = [
  path.join(__dirname, 'src/components')
];

console.log('Starting API_BASE_URL string replacement...');

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file uses "API_BASE_URL" as a string but doesn't import it
    if ((content.includes('"API_BASE_URL') || content.includes("'API_BASE_URL")) && 
        !content.includes('import API_BASE_URL')) {
      
      console.log(`Fixing API_BASE_URL in: ${filePath}`);
      
      // Add import statement
      content = `import API_BASE_URL from '../utils/apiConfig';\n${content}`;
      
      // Replace string literals with variable
      content = content.replace(/"API_BASE_URL/g, 'API_BASE_URL');
      content = content.replace(/'API_BASE_URL/g, 'API_BASE_URL');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

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

directoriesToSearch.forEach(dir => walkDir(dir));
console.log('API URL replacements complete!');