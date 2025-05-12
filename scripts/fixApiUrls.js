const fs = require('fs');
const path = require('path');

const directoriesToSearch = [path.join(__dirname, '../client/src')];
let replacementCount = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  // Check for the literal string 'API_BASE_URL'
  if (content.includes('API_BASE_URL') && !content.includes('import API_BASE_URL')) {
    console.log(`Found API_BASE_URL in: ${filePath}`);
    
    // Prepare updated content with import
    const updatedContent = `import API_BASE_URL from '../utils/apiConfig';\n${content.replace(/['"]API_BASE_URL['"]/g, 'API_BASE_URL')}`;
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    replacementCount++;
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

console.log('Starting API_BASE_URL replacement...');
directoriesToSearch.forEach(dir => walkDir(dir));
console.log(`Completed! Fixed ${replacementCount} files.`);