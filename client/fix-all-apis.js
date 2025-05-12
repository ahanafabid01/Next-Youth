const fs = require('fs');
const path = require('path');

// Define all directories to search
const directoriesToSearch = [
  path.join(__dirname, 'src/components/Employer'),
  path.join(__dirname, 'src/components/Admin'),
  path.join(__dirname, 'src/components/Employee'), // Added Employee components too
  path.join(__dirname, 'src/components/Auth')      // Added Auth components for completeness
];

console.log('Starting API URL fixes in all components...');

// Track statistics for reporting
let totalFilesProcessed = 0;
let totalFilesUpdated = 0;
let totalReplacements = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileUpdated = false;
    let replacementsInFile = 0;
    
    // Check for "API_BASE_URL/path" pattern
    const stringLiteralPattern1 = /"API_BASE_URL\/([^"]+)"/g;
    const stringLiteralPattern2 = /'API_BASE_URL\/([^']+)'/g;
    
    // Count matches
    const matches1 = content.match(stringLiteralPattern1) || [];
    const matches2 = content.match(stringLiteralPattern2) || [];
    replacementsInFile = matches1.length + matches2.length;
    
    if (replacementsInFile > 0) {
      console.log(`Fixing ${replacementsInFile} API URLs in: ${path.basename(filePath)}`);
      
      // Replace "API_BASE_URL/path" with `${API_BASE_URL}/path`
      content = content.replace(stringLiteralPattern1, '`${API_BASE_URL}/$1`');
      content = content.replace(stringLiteralPattern2, '`${API_BASE_URL}/$1`');
      
      // Also fix axios.delete("API_BASE_URL/... syntax (different pattern)
      if (content.includes('.delete("API_BASE_URL/') || content.includes(".delete('API_BASE_URL/")) {
        content = content.replace(/\.delete\("API_BASE_URL\/([^"]+)"/g, '.delete(`${API_BASE_URL}/$1`');
        content = content.replace(/\.delete\('API_BASE_URL\/([^']+)'/g, '.delete(`${API_BASE_URL}/$1`');
        replacementsInFile += content.match(/\.delete\(`\${API_BASE_URL}/) ? 1 : 0;
      }
      
      // Check for import statement
      if (!content.includes('import API_BASE_URL') && replacementsInFile > 0) {
        content = `import API_BASE_URL from '../../utils/apiConfig';\n${content}`;
        console.log(`  Added API_BASE_URL import statement`);
        replacementsInFile++;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      fileUpdated = true;
      totalReplacements += replacementsInFile;
    }
    
    totalFilesProcessed++;
    if (fileUpdated) {
      totalFilesUpdated++;
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }
  
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

// Process each directory
directoriesToSearch.forEach(dir => {
  console.log(`Scanning directory: ${path.basename(dir)}`);
  walkDir(dir);
});

// Print summary
console.log('\n===== Summary =====');
console.log(`Total files processed: ${totalFilesProcessed}`);
console.log(`Files updated: ${totalFilesUpdated}`);
console.log(`Total replacements made: ${totalReplacements}`);
console.log('API URL fixes complete!');