const fs = require('fs');
const PNG = require('pngjs').PNG;
const svg = fs.readFileSync('../logo.svg', 'utf8');
const base64 = svg.match(/base64,([^"]+)/)[1];
const buffer = Buffer.from(base64, 'base64');
new PNG().parse(buffer, function(error, data) {
  if(error) { console.error(error); return; }
  const colors = {};
  for (let y = 0; y < data.height; y+=10) {
    for (let x = 0; x < data.width; x+=10) {
      let idx = (data.width * y + x) << 2;
      let r = data.data[idx];
      let g = data.data[idx+1];
      let b = data.data[idx+2];
      let hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      if (hex !== 'ffffff' && hex !== '000000') {
         colors[hex] = (colors[hex] || 0) + 1;
      }
    }
  }
  const sorted = Object.entries(colors).sort((a,b) => b[1] - a[1]).slice(0, 10);
  console.log('Dominant colors:', sorted);
});
