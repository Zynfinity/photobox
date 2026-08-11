const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.svelte') || fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // 1. Replace single quotes
      content = content.replace(/'https:\/\/panel\.tail11f9ba\.ts\.net([^']*)'/g, '`${import.meta.env.VITE_API_URL}$1`');
      
      // 2. Replace backticks
      content = content.replace(/`https:\/\/panel\.tail11f9ba\.ts\.net([^`]*)`/g, '`${import.meta.env.VITE_API_URL}$1`');
      
      // 3. Replace double quotes (mostly HTML attributes in Svelte)
      content = content.replace(/"https:\/\/panel\.tail11f9ba\.ts\.net([^"]*)"/g, '"{import.meta.env.VITE_API_URL}$1"');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

walk(dir);
