import fs from 'fs';
import path from 'path';

const serverPath = './dist/index.js';

if (fs.existsSync(serverPath)) {
  console.log('Fixing ES module compatibility in dist/index.js...');
  
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Replace __dirname with import.meta.dirname for ES modules
  content = content.replace(
    /path3\.join\(__dirname,\s*["']\.\.\/public["']\)/g,
    'path3.resolve(import.meta.dirname, "public")'
  );
  
  // Fix static file serving paths
  content = content.replace(
    /express\.static\(path3\.join\(__dirname,\s*["']\.\.\/public["']\)\)/g,
    'express.static(path3.resolve(import.meta.dirname, "public"))'
  );
  
  // Handle any other __dirname patterns
  content = content.replace(
    /__dirname/g,
    'import.meta.dirname'
  );
  
  // Add ES module compatibility shim at the top if not present
  if (!content.includes('import.meta.dirname')) {
    const shimCode = `// ES Module compatibility shim
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

`;
    content = shimCode + content;
  }
  
  fs.writeFileSync(serverPath, content);
  console.log('Fixed __dirname issues in production build');
} else {
  console.log('Build file not found at ./dist/index.js');
}