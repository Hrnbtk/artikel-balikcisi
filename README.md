# Artikel Balıkçısı · mobil uygulama paketi

Oyunun tek HTML dosyasını iOS ve Android uygulamasına çeviren Capacitor projesi.

## Klasörler
- `scripts/hazirla.mjs` — `../artikel-balikcisi.html` dosyasını alır, yazı tiplerini pakete gömer, uygulama köprüsünü ekler, `www/` klasörüne yazar.
- `scripts/app-shim.js` — uygulama içi köprü: paylaş menüsüyle dosya kaydetme, kayıt yedeği, durum çubuğu.
- `android/`, `ios/` — yerel projeler (Android Studio ve Xcode ile açılır).
- `resources/` — ikon ve açılış ekranı kaynakları (`icon.svg` düzenlenebilir).
- `magaza-metinleri/` — gizlilik politikası ve ekran görüntüleri.
- `.github/workflows/android.yml` — Android Studio kurmadan GitHub'da Google Play paketi (.aab) üretir.

## Oyun güncellenince
```
npm install          # ilk seferde
npm run sync         # hazirla + cap sync
npm run ikonlar      # yalnızca ikon değiştiyse
```
Sonra `npx cap open android` veya `npx cap open ios`.

Her yeni mağaza sürümünde sürüm numarasını artır:
- Android: `android/app/build.gradle` içinde `versionCode` (1, 2, 3…) ve `versionName`
- iOS: Xcode > App target > General > Version / Build

## Uygulama görünümünü tarayıcıda denemek
`npm run hazirla` sonrası `www/index.html?app` adresini telefon boyutunda aç: oyun tam ekran, kaydırmasız açılır.
Telefonlarda uygulama dikey (portre) kilitli; iPad her yönde döner.
