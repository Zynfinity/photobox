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

      // Reverse replace: `${import.meta.env.VITE_API_URL}` -> `https://panel.tail11f9ba.ts.net`
      content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\}/g, 'https://panel.tail11f9ba.ts.net');
      // Reverse replace in Svelte HTML attributes: {import.meta.env.VITE_API_URL} -> https://panel.tail11f9ba.ts.net
      content = content.replace(/\{import\.meta\.env\.VITE_API_URL\}/g, 'https://panel.tail11f9ba.ts.net');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Reverted', fullPath);
      }
    }
  }
}

walk(dir);
