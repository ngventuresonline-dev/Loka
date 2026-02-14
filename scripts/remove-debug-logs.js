const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function removeDebugLogs(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeDebugLogs(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove all lines containing [LOKAZEN_DEBUG]
      const lines = content.split('\n');
      const filtered = lines.filter(line => 
        !line.includes('[LOKAZEN_DEBUG]')
      );
      
      const newContent = filtered.join('\n');
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Cleaned: ${filePath}`);
      }
    }
  });
}

console.log('Removing debug logs...');
removeDebugLogs(srcDir);
console.log('Done!');
