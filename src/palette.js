import { PALETTE } from './constants.js';

export function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch (max) {
      case r: h = ((g-b)/d + (g<b ? 6 : 0)) / 6; break;
      case g: h = ((b-r)/d + 2) / 6; break;
      case b: h = ((r-g)/d + 4) / 6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const channel = n => {
    const k = (n + h/30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k-3, 9-k, 1), -1))).toString(16).padStart(2,'0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function buildZenShades(baseHex) {
  const [h,s,l] = hexToHsl(baseHex);
  const mode = Math.random() < 0.5 ? 'S' : 'L';
  const baseVal = mode === 'S' ? s : l;
  const fixedVal = mode === 'S' ? l : s;
  const values = Array.from({length:10}, (_,i) => {
    const v = (baseVal + i * 10) % 100;
    return v === 0 ? 100 : v;
  });
  values.sort((a,b) => a - b);
  if (Math.random() < 0.5) values.reverse();
  return values.map(v => mode === 'S' ? hslToHex(h, v, fixedVal) : hslToHex(h, fixedVal, v));
}

export function buildColorPalette(n, label) {
  if (label === 'Hard') return buildHardPalette();
  if (label === 'Gravity') return buildGravityPalette();
  const candidates = shuffle([...PALETTE]);
  const jitterDim = Math.random() < 0.5 ? 'L' : 'S';
  return candidates.slice(0,n).map(hex => {
    const [h,s,l] = hexToHsl(hex);
    const amount = Math.random()*3;
    const sign = Math.random() < 0.5 ? 1 : -1;
    if (jitterDim === 'L') return hslToHex(h, s, Math.min(Math.max(l+sign*amount,0),100));
    return hslToHex(h, Math.min(Math.max(s+sign*amount,0),100), l);
  });
}

export function buildGravityPalette() {
  const baseHex = PALETTE[Math.floor(Math.random()*PALETTE.length)];
  const [h,s,l] = hexToHsl(baseHex);
  const clamp = v => Math.max(10, Math.min(85, v));
  const satFor = lv => Math.min(100, Math.max(0, s + Math.max(0, Math.round((l-lv)/10))*5));
  const lCands = [];
  for (let i=-10; i<=10; i++) { const v=l+i*10; if(v>=10&&v<=85) lCands.push(v); }
  lCands.sort((a,b) => Math.abs(a-l)-Math.abs(b-l));
  const hue1 = lCands.slice(0,7).sort((a,b)=>a-b).map(lv => hslToHex(h, satFor(lv), lv));
  const h2 = (h+120)%360;
  const hue2 = [0,15,30,-15,-30].map(d => { const lv=clamp(l+d); return hslToHex(h2, satFor(lv), lv); });
  const h3 = (h+240)%360;
  const hue3 = [hslToHex(h3, satFor(clamp(l)), clamp(l))];
  return [...hue1, ...hue2, ...hue3];
}

export function buildHardPalette() {
  const baseHex = PALETTE[Math.floor(Math.random()*PALETTE.length)];
  const [h,s,l] = hexToHsl(baseHex);
  const hues = Array.from({length:4}, (_,i) => (h+i*30)%360);
  const lightL = Math.min(l+20, 75);
  const darkL = Math.max(l-20, 25);
  const all = [];
  for (const hue of hues) { all.push(hslToHex(hue, s, lightL)); all.push(hslToHex(hue, s, darkL)); }
  shuffle(all);
  return all;
}

export function shuffle(arr) {
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
