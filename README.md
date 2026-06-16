# Puja Gayatri Listrik

Website katalog static untuk jualan lampu dan alat listrik.

## Edit nomor WhatsApp

Buka `public/app.js`, ganti:

```js
whatsapp: '6281234567890'
```

pakai nomor toko format 62, tanpa nol depan.

## Cara nambah produk manual via file CSV

Edit file:

```txt
public/products.csv
```

Kolom:

```txt
nama,kategori,harga,deskripsi,tag,icon,foto,aktif
```

Contoh baris:

```csv
Lampu LED Obaja 12W,lampu,Rp15.000,"Lampu LED hemat listrik fitting E27 cahaya putih",Ready,💡,https://contoh.com/foto.jpg,ya
```

Kategori yang dipakai filter:

```txt
lampu
kabel
instalasi
proteksi
aksesoris
```

Kalau produk mau disembunyikan, isi `aktif` jadi `tidak`.

## Cara pakai Google Sheet sebagai database

1. Buat Google Sheet baru.
2. Baris pertama isi header persis:

```txt
nama | kategori | harga | deskripsi | tag | icon | foto | aktif
```

3. Isi produk di baris berikutnya.
4. Untuk foto, isi URL gambar publik. Bisa dari Drive kalau link gambarnya bisa dibuka publik, atau kirim fotonya ke Kimber biar diupload ke asset web.
5. Google Sheet → `File` → `Share` → `Publish to web`.
6. Pilih sheet produk → format `Comma-separated values (.csv)` → Publish.
7. Copy URL CSV.
8. Buka `public/app.js`, isi:

```js
googleSheetCsvUrl: 'URL_CSV_DARI_GOOGLE_SHEET',
```

9. Deploy ulang:

```bash
vercel --prod --yes
```

## Jalankan lokal

```bash
python3 -m http.server 4173 --directory public
```

Buka `http://localhost:4173`.

## Deploy Vercel

```bash
vercel --prod --yes
```

Domain sudah diarahkan ke Vercel:

```txt
pglistrik.web.id
www.pglistrik.web.id
```
