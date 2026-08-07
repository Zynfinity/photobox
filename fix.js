import fs from 'fs';
import path from 'path';

const domain = 'https://photobox.fajarjaya.site';
const targetDir = './src';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.svelte') || file.endsWith('.ts') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(targetDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/'\/api\//g, `'${domain}/api/`);
    content = content.replace(/`\/api\//g, `\`${domain}/api/`);
    content = content.replace(/"\/api\//g, `"${domain}/api/`);

    content = content.replace(/'\/uploads\//g, `'${domain}/uploads/`);
    content = content.replace(/`\/uploads\//g, `\`${domain}/uploads/`);
    content = content.replace(/"\/uploads\//g, `"${domain}/uploads/`);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
});
