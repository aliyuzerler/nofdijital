# Risk Kaydı — NOF DİJİTAL Port

| # | Risk | Etki | Olasılık | Önlem | Durum |
|---|---|---|---|---|---|
| R1 | Galeri kompozisyon algoritmasının (placeScene + AABB) birebir port edilememesi → görsel farklılık | Yüksek | Orta | Algoritma satır satır TS'ye taşınır; seed sabit (101+si*37, mobil +900) deterministik test | Açık |
| R2 | Canvas arka plan motoru farklılıkları (kamera, paralaks, DPR) | Orta | Orta | JS referansı birebir port; RM'de statik kare; tab visibility'de duraklatma eklenir | Açık |
| R3 | Google Fonts bağımlılığı (FOUT/ağ) | Orta | Düşük | `next/font` self-host; fallback metrikleri tokenlarda korunur | Açık |
| R4 | Hash routing → gerçek slug URL geçişi (Back/Forward, scroll davranışı) | Orta | Orta | Next.js App Router real routes `/blog`, `/blog/[slug]`; anchor'lar `/#hizmetler` | Açık |
| R5 | Base64 görsellerin bundle'a tekrar gömülmesi | Orta | Düşük | Varlıklar `public/assets/` + DB medya kayıtları; `next/image` ile servis | Çözüldü |
| R6 | Örnek blog gövdelerinin gerçek içerik sanılması | Orta | Düşük | Seed'de `draft` durumu; `.nt` notu korunur; yayın onayı adminde | Açık |
| R7 | Yarı saydam bölüm zeminlerinin canvas ile katman uyumu (tema sistemiyle bozulma) | Yüksek | Orta | DEV-001: tema değişkenleri bölüm zeminlerini tek çatıda yönetir; her iki temada screenshot testi | Açık |
| R8 | Sticky galeri yüksekliği hesabı (`sec.height = H + range + H*.5`) mobil Safari `svh` sapması | Orta | Orta | Referans formülü korunur; 390/360 viewport testleri zorunlu | Açık |
| R9 | PGlite (sandbox) ile Neon postgres.js arasındaki davranış farkı | Orta | Düşük | Drizzle + standart SQL; sürücü adapter'da; migration dosyaları her ikisinde de çalışır | Açık |
| R10 | Admin editör (Tiptap) bundle boyutu public route'a sızması | Orta | Düşük | Editor yalnız `/admin/blog/[id]` client chunk'ında; public sayfa statik/ISR | Açık |
| R11 | Fotoğraf caption/alt metin eksikliği (a11y) | Düşük | Düşük | `CAP` listesi alt metin kaynağı; medya tablosunda `alt_text` zorunlu alan | Açık |
| R12 | Placeholder iletişim verilerinin uydurulması | Yüksek | Düşük | Kaynakta "eklenecek" placeholder'ları aynen korunur; admin Settings'te boş | Açık |
