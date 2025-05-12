const fs = require('fs');
const path = require('path');

const directoriesToSearch = [
  path.join(__dirname, 'src/components/Employer')
];

console.log('Starting API URL fixes in employer components...');

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileUpdated = false;
    
    // Check for "API_BASE_URL/path" pattern
    if (content.includes('"API_BASE_URL/') || content.includes("'API_BASE_URL/")) {
      console.log(`Fixing API URLs in: ${path.basename(filePath)}`);
      
      // Replace "API_BASE_URL/path" with `${API_BASE_URL}/path`
      content = content.replace(/"API_BASE_URL\/(.*?)"/g, '`${API_BASE_URL}/$1`');
      content = content.replace(/'API_BASE_URL\/(.*?)'/g, '`${API_BASE_URL}/$1`');
      fileUpdated = true;
    }
    
    if (fileUpdated) {
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
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  });
}

directoriesToSearch.forEach(dir => walkDir(dir));
console.log('API URL fixes complete!');