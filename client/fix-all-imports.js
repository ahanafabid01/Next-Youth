const fs = require('fs');
const path = require('path');

// Define all component directories
const componentDirs = [
  'Auth',
  'Admin',
  'Employee',
  'Employer',
  // Add any other component directories here
];

console.log('Starting to fix all component imports...');

// Process each component directory
componentDirs.forEach(dirName => {
  const dirPath = path.join(__dirname, 'src/components', dirName);
  
  if (fs.existsSync(dirPath)) {
    console.log(`Processing ${dirName} components...`);
    fixFilesInDirectory(dirPath);
  }
});

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
    let changed = false;
    
    // Check if file uses API_BASE_URL without importing it correctly
    if ((content.includes('"API_BASE_URL') || content.includes("'API_BASE_URL")) && 
        !content.includes('import API_BASE_URL')) {
      
      // For files in src/components/X, the path should be ../../utils/apiConfig
      content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
      
      // Replace string literals with the variable
      content = content.replace(/"API_BASE_URL/g, 'API_BASE_URL');
      content = content.replace(/'API_BASE_URL/g, 'API_BASE_URL');
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed imports in: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

console.log('Completed fixing imports in all component directories!');