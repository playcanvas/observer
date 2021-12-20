import fs from 'fs';
// Add 'export as namespace pc' to the end of the file
const path = './dist/observer.d.ts';
let ts = (fs.readFileSync(path, 'utf8')).toString();
ts = ts.replace(/declare/g, 'export');
ts += '\n\nexport as namespace observer;\n';
fs.writeFileSync(path, ts);
