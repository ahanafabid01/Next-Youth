const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src/components/Admin');

console.log('Fixing Admin components API URL issues...');

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 1: Replace API_BASE_URL string constant definition
    if (content.includes("const API_BASE_URL = 'API_BASE_URL'") || 
        content.includes('const API_BASE_URL = "API_BASE_URL"')) {
      console.log(`Removing API_BASE_URL constant in: ${path.basename(filePath)}`);
      content = content.replace(/const API_BASE_URL = ['"]API_BASE_URL['"];?\n?/g, '');
      modified = true;
    }
    
    // Fix 2: Fix string literals in API calls
    if (content.includes('"API_BASE_URL/') || content.includes("'API_BASE_URL/")) {
      console.log(`Fixing API URLs in: ${path.basename(filePath)}`);
      content = content.replace(/"API_BASE_URL\/([^"]+)"/g, '`${API_BASE_URL}/$1`');
      content = content.replace(/'API_BASE_URL\/([^']+)'/g, '`${API_BASE_URL}/$1`');
      modified = true;
    }
    
    // Fix 3: Add import if missing and we made changes
    if (modified && !content.includes('import API_BASE_URL')) {
      console.log(`Adding API_BASE_URL import in: ${path.basename(filePath)}`);
      content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
    }
    
    // Write changes if any were made
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// Process all files in the Admin directory
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

walkDir(adminDir);
console.log('Admin component fixes complete!');