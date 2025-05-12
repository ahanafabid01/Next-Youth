const fs = require('fs');
const path = require('path');

const employeeDir = path.join(__dirname, 'src/components/Employee');

console.log('Starting API_BASE_URL constant fixes in Employee components...');

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileUpdated = false;
    
    // Check if file defines API_BASE_URL as a string literal
    if (content.includes("const API_BASE_URL = 'API_BASE_URL'") || 
        content.includes('const API_BASE_URL = "API_BASE_URL"')) {
      
      console.log(`Fixing API_BASE_URL in: ${path.basename(filePath)}`);
      
      // Check if there's already an import for API_BASE_URL
      const hasImport = content.includes("import API_BASE_URL from");
      
      // Remove the incorrect constant definition
      content = content.replace(/const API_BASE_URL = ['"]API_BASE_URL['"];?\n?/g, '');
      
      // Add import if it doesn't exist
      if (!hasImport) {
        content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
      }
      
      fileUpdated = true;
    }
    
    if (fileUpdated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.basename(filePath)}`);
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

walkDir(employeeDir);
console.log('API_BASE_URL fixes complete!');