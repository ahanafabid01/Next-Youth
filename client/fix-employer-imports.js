const fs = require('fs');
const path = require('path');

// Directory containing the Employer components
const employerDir = path.join(__dirname, 'src/components/Employer');
console.log('Fixing imports in:', employerDir);

// Get list of all files in the Employer directory
const files = fs.readdirSync(employerDir).filter(file => 
  file.endsWith('.js') || file.endsWith('.jsx')
);

let fixedCount = 0;

// Process each file
files.forEach(file => {
  const filePath = path.join(employerDir, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check for incorrect import path
    if (content.includes("import API_BASE_URL from '../utils/apiConfig'")) {
      console.log(`Fixing import in ${file}...`);
      
      // Replace incorrect path with correct path
      content = content.replace(
        "import API_BASE_URL from '../utils/apiConfig'", 
        "import API_BASE_URL from '../../utils/apiConfig'"
      );
      
      // Also fix any 'API_BASE_URL' string literals
      content = content.replace(/"API_BASE_URL\//g, '`${API_BASE_URL}/');
      content = content.replace(/"\)$/g, '`)}');
      content = content.replace(/'API_BASE_URL\//g, '`${API_BASE_URL}/');
      content = content.replace(/'\)$/g, '`)}');
      
      // Write the corrected content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});

console.log(`Fixed import paths in ${fixedCount} files.`);