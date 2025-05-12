const fs = require('fs');
const path = require('path');

// Process Employee directory
const employeeDir = path.join(__dirname, 'src/components/Employee');
console.log('Fixing files in:', employeeDir);

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
    
    // Check if file uses API_BASE_URL without importing it correctly
    if ((content.includes('"API_BASE_URL') || content.includes("'API_BASE_URL")) && 
        !content.includes('import API_BASE_URL')) {
      
      // For src/components/Employee files, the path should be ../../utils/apiConfig
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

// Start the fix on Employee directory specifically
fixFilesInDirectory(employeeDir);
console.log('Fixed Employee component imports!');