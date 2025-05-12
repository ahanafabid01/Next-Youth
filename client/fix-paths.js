const fs = require('fs');
const path = require('path');

// Process specific directory immediately
const adminDir = path.join(__dirname, 'src/components/Admin');
console.log('Fixing files in:', adminDir);

function fixFilesInDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixFilesInDirectory(filePath); // Process subdirectories
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fixImportInFile(filePath);
    }
  });
}

function fixImportInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file uses API_BASE_URL without importing it
    if ((content.includes('"API_BASE_URL') || content.includes("'API_BASE_URL")) && 
        !content.includes('import API_BASE_URL')) {
      
      // For src/components/Admin files, the path should be ../../utils/apiConfig
      content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
      
      // Replace string literals with the variable
      content = content.replace(/"API_BASE_URL/g, 'API_BASE_URL');
      content = content.replace(/'API_BASE_URL/g, 'API_BASE_URL');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// Start the fix on Admin directory specifically
fixFilesInDirectory(adminDir);
console.log('Fixed Admin component imports!');