const fs = require('fs');
const path = require('path');

// Get all component directories
const componentsDir = path.join(__dirname, 'src/components');
const componentDirs = fs.readdirSync(componentsDir).filter(item => {
  const itemPath = path.join(componentsDir, item);
  return fs.statSync(itemPath).isDirectory();
});

console.log('Found component directories:', componentDirs);

// Process each component directory
let totalFixed = 0;

componentDirs.forEach(dirName => {
  const dirPath = path.join(componentsDir, dirName);
  console.log(`\nProcessing ${dirName} components...`);
  
  try {
    // Get all JS/JSX files in this directory
    const files = fs.readdirSync(dirPath).filter(file => 
      file.endsWith('.js') || file.endsWith('.jsx')
    );
    
    // Process each file
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Check for API_BASE_URL usage without proper import
      if ((content.includes('"API_BASE_URL') || content.includes("'API_BASE_URL")) && 
          !content.includes('import API_BASE_URL')) {
        
        // Add correct import at the beginning
        content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
        
        // Replace string literals with variable
        content = content.replace(/"API_BASE_URL/g, 'API_BASE_URL');
        content = content.replace(/'API_BASE_URL/g, 'API_BASE_URL');
        
        modified = true;
      }
      
      // Also check for incorrect import path
      if (content.includes("import API_BASE_URL from '../utils/apiConfig'")) {
        // Replace incorrect path with correct path
        content = content.replace(
          "import API_BASE_URL from '../utils/apiConfig'", 
          "import API_BASE_URL from '../../utils/apiConfig'"
        );
        
        modified = true;
      }
      
      // Write the corrected content back to the file if changes were made
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalFixed++;
        console.log(`✓ Fixed ${file}`);
      }
    });
  } catch (err) {
    console.error(`Error processing directory ${dirName}:`, err);
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);