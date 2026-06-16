---
name: pglistrik-web-management
description: Manage PG Listrik web catalog — add/edit products, upload photos, sync products.csv, deploy to Vercel. Static site at pglistrik.web.id.
triggers:
  - pg listrik
  - pglistrik
  - tambah produk listrik
  - katalog lampu
  - foto produk pglistrik
  - pglistrik.web.id
  - produk listrik
  - web listrik
---

# PG Listrik Web Management

## Overview
Static site (HTML/CSS/JS) deployed on Vercel at `https://pglistrik.web.id`.
Source: `~/pglistrik-web/`
GitHub: `Pujagaul6/pglistrik-web`
Vercel project: `pglistrik-web` under `neela-s-projects`
WhatsApp store: `+628980356662`

## File Structure
```
~/pglistrik-web/
├── public/
│   ├── index.html        # Main page
│   ├── app.js            # Product loader + filters
│   ├── style.css         # Styles
│   ├── products.csv      # Product catalog (THE data source)
│   └── assets/           # Product photos (.webp)
│       ├── ambyar-series.webp
│       ├── obaja-value-series.webp
│       └── ...
├── package.json
├── vercel.json
└── README.md
```

## Product Data: products.csv

### CSV Columns
```
nama,kategori,harga,deskripsi,tag,icon,foto,aktif
```

- **nama**: Product name (e.g., "Ambyar 5W", "Obaja 12W")
- **kategori**: Category — lampu, instalasi, aksesoris, elektronik, gas
- **harga**: Price with "Rp" prefix and dots (e.g., "Rp9.000", "Rp15.000")
- **deskripsi**: Description text (can contain commas, wrap in quotes)
- **tag**: Stock status — "Ready", "Stok terbatas", "Stok habis", "Promo"
- **icon**: Emoji icon — 💡 (lampu), 🔌 (instalasi), 🔧 (aksesoris), etc.
- **foto**: Path to image — `/assets/nama-file.webp` (empty if no photo)
- **aktif**: "ya" to show, "tidak" to hide

### Example Row
```
Ambyar 12W,lampu,Rp15.000,"Lampu LED untuk kebutuhan rumah. Stok kasir: 87 pcs.",Ready,💡,/assets/ambyar-series.webp,ya
```

## Operations

### Add New Product
1. Add row to `~/pglistrik-web/public/products.csv`
2. If has photo, save .webp to `~/pglistrik-web/public/assets/`
3. Reference photo in CSV `foto` column: `/assets/nama-file.webp`
4. Deploy to Vercel

```bash
# Add product via script
cd ~/pglistrik-web
echo 'Nama Baru,lampu,Rp25.000,"Deskripsi produk baru.",Ready,💡,/assets/nama-baru.webp,ya' >> public/products.csv
```

### Edit Existing Product
Edit `~/pglistrik-web/public/products.csv` directly. Find row by `nama`, update fields.

```bash
# Example: update price
cd ~/pglistrik-web
# Use sed or manual edit on products.csv
sed -i 's/Ambyar 12W,lampu,Rp15.000/Ambyar 12W,lampu,Rp17.000/' public/products.csv
```

### Upload Product Photo
1. User sends image via Telegram (or provides URL/file)
2. Convert to .webp format (for performance):
   ```bash
   # If cwebp available
   cwebp -q 80 input.jpg -o ~/pglistrik-web/public/assets/nama-produk.webp
   
   # If only PIL available (no GPU)
   python3 -c "
   from PIL import Image
   img = Image.open('input.jpg')
   img.save('/home/ubuntu/pglistrik-web/public/assets/nama-produk.webp', 'WEBP', quality=80)
   print('OK')
   "
   ```
3. Update CSV `foto` column to `/assets/nama-produk.webp`

### Remove Product
Set `aktif` column to `tidak` in CSV (soft delete), or delete the row.

### Add New Category
1. Add product with new `kategori` value in CSV
2. Add emoji `icon` for the category
3. The app.js auto-detects categories from CSV data

### Deploy to Vercel
```bash
cd ~/pglistrik-web

# If Vercel CLI installed and authenticated
vercel --prod

# If not authenticated, need token
# User needs to provide Vercel token or login
```

### Push to GitHub
```bash
cd ~/pglistrik-web
git add -A
git commit -m "update: description of changes"
git push origin master
```

### Sync Products from Kasir App
The CSV can be synced from Kasir App's product database:
```bash
cd ~/kasir-app && python3 -c "
import sqlite3, csv
conn = sqlite3.connect('kasir.db')
products = conn.execute('SELECT name, price, stock FROM products ORDER BY name').fetchall()
conn.close()

# Read existing CSV to preserve foto mapping
existing = {}
try:
    with open('/home/ubuntu/pglistrik-web/public/products.csv') as f:
        for row in csv.DictReader(f):
            existing[row['nama']] = row
except: pass

with open('/home/ubuntu/pglistrik-web/public/products.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['nama','kategori','harga','deskripsi','tag','icon','foto','aktif'])
    for name, price, stock in products:
        old = existing.get(name, {})
        tag = 'Ready' if stock > 5 else ('Stok terbatas' if stock > 0 else 'Stok habis')
        foto = old.get('foto', '')
        icon = old.get('icon', '💡')
        kat = old.get('kategori', 'lampu')
        desc = old.get('deskripsi', f'Stok kasir: {stock} pcs. Harga bisa berubah, chat dulu untuk konfirmasi.')
        w.writerow([name, kat, f'Rp{price:,}', desc, tag, icon, foto, 'ya'])
print('Synced')
"
```

## Pitfalls
- **CSV uses Indonesian number format**: `Rp9.000` (dots, not commas)
- **Photo paths must start with `/assets/`** — relative to public/
- **Wrap descriptions in quotes** if they contain commas
- **Cache-busting**: app.js appends `?v={timestamp}` to CSV fetch — Vercel CDN may cache old version
- **Vercel auto-deploys on git push** if connected to GitHub repo
- **No backend** — all data is in CSV, no database
- **User updates photos by sending images via Telegram** — then map to CSV row
- **WhatsApp link format**: `https://wa.me/628980356662?text=...` in app.js
- **Google Review link**: `https://g.page/r/CbXY2y2lfWXuEBI/review`
