const STORE = {
  name: 'Puja Gayatri Listrik',
  whatsapp: '628980356662',
};

const DATA_SOURCE = {
  googleSheetCsvUrl: '',
  localCsvUrl: '/products.csv',
};

const categories = [
  { id: 'all', label: 'Semua', icon: '\u26A1' },
  { id: 'lampu', label: 'Lampu', icon: '\uD83D\uDCA1' },
  { id: 'instalasi', label: 'Instalasi', icon: '\uD83D\uDD0C' },
  { id: 'aksesoris', label: 'Aksesoris', icon: '\uD83D\uDD27' },
  { id: 'elektronik', label: 'Elektronik', icon: '\uD83D\uDCFA' },
  { id: 'gas', label: 'Gas', icon: '\uD83D\uDD25' },
];

const fallbackProducts = [
  { name: 'Lampu LED Bulb 9W / 12W', category: 'lampu', icon: '\uD83D\uDCA1', desc: 'Lampu hemat listrik untuk kamar, ruang tamu, toko, dan teras.', price: 'Mulai Rp15 ribuan', tag: 'Ready', active: 'ya' },
  { name: 'Lampu LED Emergency', category: 'lampu', icon: '\uD83D\uDD26', desc: 'Tetap nyala saat listrik padam. Cocok untuk rumah dan warung.', price: 'Tanya stok', tag: 'Ready', active: 'ya' },
  { name: 'Lampu Downlight / Plafon', category: 'lampu', icon: '\u2B55', desc: 'Pilihan warm white / cool white untuk plafon rumah dan toko.', price: 'Tanya ukuran', tag: 'Ready', active: 'ya' },
  { name: 'Kabel NYA / NYM', category: 'instalasi', icon: '\uD83E\uDDF5', desc: 'Kabel instalasi rumah. Tersedia beberapa ukuran sesuai kebutuhan.', price: 'Per meter / roll', tag: 'Ready', active: 'ya' },
  { name: 'Stop Kontak Dinding', category: 'instalasi', icon: '\uD83D\uDD0C', desc: 'Stop kontak tanam/tempel untuk rumah, kos, kantor, dan toko.', price: 'Mulai Rp10 ribuan', tag: 'Ready', active: 'ya' },
  { name: 'Saklar Tunggal / Ganda', category: 'instalasi', icon: '\uD83D\uDD18', desc: 'Saklar lampu berbagai model. Bisa tanya cocoknya yang mana.', price: 'Tanya stok', tag: 'Ready', active: 'ya' },
  { name: 'MCB Listrik', category: 'instalasi', icon: '\uD83D\uDEE1\uFE0F', desc: 'Untuk pengaman instalasi listrik. Pilih ampere sesuai beban.', price: 'Tanya ampere', tag: 'Ready', active: 'ya' },
  { name: 'Fitting Lampu', category: 'aksesoris', icon: '\uD83D\uDD27', desc: 'Fitting gantung, tempel, dan plafon untuk berbagai kebutuhan.', price: 'Mulai Rp5 ribuan', tag: 'Ready', active: 'ya' },
  { name: 'Terminal Colokan', category: 'aksesoris', icon: '\uD83D\uDD0B', desc: 'Terminal 3\u20136 lubang untuk elektronik rumah dan toko.', price: 'Tanya panjang kabel', tag: 'Ready', active: 'ya' },
];

let products = fallbackProducts;
let visibleProducts = fallbackProducts;
let activeCategory = 'all';
let searchTerm = '';

const waLink = (message) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

function initWhatsAppLinks() {
  document.querySelectorAll('[data-wa]').forEach((el) => {
    el.href = waLink(el.dataset.wa);
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; }
    else if (char === '"') { quoted = !quoted; }
    else if (char === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else { value += char; }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(h) { return h.toLowerCase().trim().replace(/\s+/g, '_'); }

function productsFromCsv(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some(Boolean));
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((h, i) => { item[h] = row[i] || ''; });
    return {
      name: item.nama || item.name || '',
      category: (item.kategori || item.category || 'aksesoris').toLowerCase(),
      icon: item.icon || '\u26A1',
      img: item.foto || item.image || item.gambar || '',
      desc: item.deskripsi || item.desc || '',
      price: item.harga || item.price || 'Tanya harga',
      tag: item.tag || item.label || 'Ready',
      active: String(item.aktif || item.active || 'ya').toLowerCase(),
    };
  }).filter((p) => p.name && !['tidak', 'no', 'false', '0'].includes(p.active));
}

async function loadProducts() {
  const sourceUrl = DATA_SOURCE.googleSheetCsvUrl || DATA_SOURCE.localCsvUrl;
  try {
    const response = await fetch(`${sourceUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`CSV HTTP ${response.status}`);
    const csvText = await response.text();
    const csvProducts = productsFromCsv(csvText);
    if (csvProducts.length) products = csvProducts;
  } catch (error) {
    console.warn('Produk CSV gagal dimuat, pakai data fallback:', error);
  }
  updateStats();
  updateHeroProduct();
  renderProducts();
}

function updateStats() {
  const el = document.getElementById('statCount');
  if (el) el.textContent = products.length + '+';
}

function updateHeroProduct() {
  // Pick the first product with stock tag "Ready" that has a photo
  const featured = products.find((p) => p.tag === 'Ready' && p.img) || products[0];
  if (!featured) return;
  const nameEl = document.getElementById('heroProductName');
  const descEl = document.getElementById('heroProductDesc');
  const priceEl = document.getElementById('heroProductPrice');
  if (nameEl) nameEl.textContent = featured.name;
  if (descEl) descEl.textContent = featured.desc;
  if (priceEl) priceEl.textContent = featured.price;
}

function renderFilters() {
  const filters = document.getElementById('filters');
  filters.innerHTML = categories.map((cat) =>
    `<button class="chip${cat.id === activeCategory ? ' active' : ''}" data-category="${cat.id}">${cat.icon ? '<span>' + cat.icon + '</span> ' : ''}${cat.label}</button>`
  ).join('');
  filters.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderFilters();
      renderProducts();
    });
  });
}

function productMatches(product) {
  const byCategory = activeCategory === 'all' || product.category === activeCategory;
  const haystack = `${product.name} ${product.desc} ${product.tag}`.toLowerCase();
  const bySearch = haystack.includes(searchTerm.toLowerCase());
  return byCategory && bySearch;
}

function escapeHtml(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function photoHtml(product) {
  if (product.img) {
    return `<img src="${escapeHtml(product.img)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.remove(); this.parentElement.innerHTML='${escapeHtml(product.icon || '\u26A1')}';" />`;
  }
  return `<span style="font-size:48px;opacity:0.3">${escapeHtml(product.icon || '\u26A1')}</span>`;
}

function tagClass(tag) {
  if (!tag) return '';
  const t = tag.toLowerCase();
  if (t.includes('habis')) return 'out';
  if (t.includes('terbatas')) return 'low';
  return '';
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  visibleProducts = products.filter(productMatches);

  grid.innerHTML = visibleProducts.map((product, index) => {
    const message = `Halo Puja Gayatri Listrik, saya mau tanya ${product.name}. Stok dan harganya berapa?`;
    return `
      <article class="product-card" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(product.name)}" data-product-index="${index}">
        <div class="product-photo" aria-hidden="true">
          <span class="tag ${tagClass(product.tag)}">${escapeHtml(product.tag)}</span>
          ${photoHtml(product)}
        </div>
        <div class="product-body">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.desc)}</p>
          <div class="price">${escapeHtml(product.price)}</div>
          <a class="btn" href="${waLink(message)}" target="_blank" rel="noopener">Tanya via WhatsApp</a>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      openProductModal(Number(card.dataset.productIndex));
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProductModal(Number(card.dataset.productIndex));
      }
    });
  });

  empty.hidden = visibleProducts.length !== 0;
}

function openProductModal(index) {
  const product = visibleProducts[index];
  if (!product) return;
  const modal = document.getElementById('productModal');
  const message = `Halo Puja Gayatri Listrik, saya mau tanya ${product.name}. Stok dan harganya berapa?`;
  document.getElementById('modalPhoto').innerHTML = photoHtml(product);
  document.getElementById('modalTag').textContent = product.tag;
  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalPrice').textContent = product.price;
  document.getElementById('modalDesc').textContent = product.desc;
  document.getElementById('modalWa').href = waLink(message);
  document.getElementById('modalWa').textContent = `Tanya ${product.name} via WA`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function bindProductModal() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeProductModal);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProductModal();
  });
}

function bindSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', (event) => {
    searchTerm = event.target.value.trim();
    renderProducts();
  });
}

function bindMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Init
document.getElementById('year').textContent = new Date().getFullYear();
initWhatsAppLinks();
renderFilters();
renderProducts();
bindSearch();
bindMenu();
bindProductModal();
loadProducts();

// ─── DARK MODE ───────────────────────────────────
function toggleTheme() {
  const body = document.body;
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
}
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.body.setAttribute('data-theme', 'dark');
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
})();
