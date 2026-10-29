// Oyunun güncel HTML dosyasını uygulamaya hazırlar ve www/ klasörüne yazar.
//  - Google Fonts yazı tiplerini indirip pakete koyar (uygulama internetsiz çalışır, Google'a istek gitmez)
//  - Capacitor köprüsünü ve uygulama içi düzeltmeleri ekler
// Kullanım: npm run hazirla [-- oyun.html yolu]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] || path.resolve(root, '../artikel-balikcisi.html');
const www = path.join(root, 'www');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

let html = fs.readFileSync(src, 'utf8');
fs.rmSync(www, {recursive: true, force: true});
fs.mkdirSync(path.join(www, 'fonts'), {recursive: true});

// 1) Yazı tipleri: her Google Fonts bağlantısını yerel bir CSS dosyasına çevir.
const fontUrls = [...new Set(html.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g) || [])];
let n = 0;
const saved = new Map();
for (const url of fontUrls) {
  let css = await (await fetch(url.replace(/&amp;/g, '&'), {headers: {'User-Agent': UA}})).text();
  for (const f of [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])]) {
    let name = saved.get(f);
    if (!name) {
      name = 'f' + (n++) + path.extname(new URL(f).pathname);
      fs.writeFileSync(path.join(www, 'fonts', name), Buffer.from(await (await fetch(f)).arrayBuffer()));
      saved.set(f, name);
    }
    css = css.split(f).join(name);
  }
  const cssName = 'fonts' + fontUrls.indexOf(url) + '.css';
  fs.writeFileSync(path.join(www, 'fonts', cssName), css);
  // yazdırılabilir sayfa ayrı dosya olarak paylaşıldığında yerel yolu bulamaz; orada sistem yazı tipine düşer
  html = html.split(url).join('fonts/' + cssName);
}
html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '');

// 2) Capacitor çekirdeği + köprü + stil, oyun kodundan önce yüklensin.
fs.copyFileSync(path.join(root, 'node_modules/@capacitor/core/dist/capacitor.js'), path.join(www, 'capacitor.js'));
fs.copyFileSync(path.join(root, 'scripts/app-shim.js'), path.join(www, 'app-shim.js'));
fs.copyFileSync(path.join(root, 'scripts/app-style.css'), path.join(www, 'app-style.css'));
// (sayfada </head> etiketi yok; ekleri viewport satırının hemen ardına koyuyoruz)
const vp = '<meta name="viewport" content="width=device-width,initial-scale=1">';
if (!html.includes(vp)) throw new Error('viewport satırı bulunamadı, hazirla.mjs güncellenmeli');
html = html.replace(vp, '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
  '<link rel="stylesheet" href="app-style.css">\n<script src="capacitor.js"></script>\n<script src="app-shim.js"></script>');

// 3) Uygulamada geçmeyen tarayıcı ifadeleri
html = html.split('İlerlemen sadece bu tarayıcıda saklanır').join('İlerlemen sadece bu cihazda saklanır');

// 4) Ayrı kelime dosyası kullanan sürümler için
if (html.includes('src="kelimeler.js"')) fs.copyFileSync(path.resolve(path.dirname(src), 'kelimeler.js'), path.join(www, 'kelimeler.js'));

fs.writeFileSync(path.join(www, 'index.html'), html);
const left = html.match(/https?:\/\/[^"'\s)]+/g) || [];
console.log(`www/ hazır: ${path.relative(root, src)} → index.html, ${n} yazı tipi dosyası.`);
if (left.length) console.log('Dikkat, sayfada hâlâ dış bağlantı var:', [...new Set(left)]);
