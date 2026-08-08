const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');
const oldUrl = 'https://photobox.fajarjaya.site';
const newUrl = 'https://panel.tail11f9ba.ts.net';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.svelte') || fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(oldUrl)) {
        content = content.split(oldUrl).join(newUrl);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

walk(dir);
