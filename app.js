/* Ray Aponte public gallery — no backend required to preview, Supabase required for publishing. */
'use strict';
const config = window.RAY_CONFIG || {};
const configured = Boolean(window.RAY_IS_CONFIGURED);
const db = configured && window.supabase ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY) : null;
const $ = selector => document.querySelector(selector);
const grid = $('#artworkGrid');
const notice = $('#galleryMessage');
const dialog = $('#artworkDialog');
let artworks = [];
let activeCategory = 'all';
let availableOnly = false;

// Images supplied in this conversation; catalog titles are placeholders, NOT the artist's titles.
// These locally bundled photographs are display-only. A real Supabase gallery loads published records instead.
const previewData = [
  ['Study 01', 'surreal', 'A dense composition of intertwined creatures and human-like figures.'],
  ['Study 02', 'surreal', 'A winged, fantastical creature amid overlapping figures and detailed graphite shading.'],
  ['Study 03', 'botanical', 'A skull is surrounded by layered flowers, petals, and fine crosshatched marks.'],
  ['Study 04', 'surreal', 'A surreal grouping of eyes, hands, organic forms, chains, and flowers.'],
  ['Study 05', 'botanical', 'A closely worked field of flowers, leaves, and rhythmic pencil textures.'],
  ['Study 06', 'abstract', 'Expressive painted marks in red, orange, yellow, and black.'],
  ['Study 07', 'abstract', 'A mixed-color painted composition featuring a face, expressive marks, and lettering.'],
  ['Study 08', 'surreal', 'A tight, expressive drawing of multiple distorted faces and skull-like forms.'],
  ['Study 09', 'other', 'A group of fish among curving, ribbon-like underwater forms.'],
  ['Study 10', 'surreal', 'An intricate cluster of eerie faces, eyes, sharp teeth, and curling shapes.']
];
const previews = previewData.map(([title, category, alt], index) => {
  const num = String(index + 1).padStart(2, '0');
  return {
    id:`preview-${num}`, title, category, status:'unknown', medium:'Details to be confirmed',
    year:null, dimensions:'', price:null, isPreview:true, description:'Catalog details have not been confirmed with Ray. This image is included in the design preview to show how the finished gallery will display his work.',
    alt_text:alt, image_path:`assets/artwork/art-${num}.webp`, thumb_path:`assets/artwork/art-${num}-thumb.webp`
  };
});
const categoryLabels = {surreal:'SURREAL / STUDIES',botanical:'BOTANICAL / FORMS',abstract:'ABSTRACT / COLOR',other:'OTHER WORK'};

function money(value) {
  return value === null || value === undefined || value === '' ? 'Price on request'
    : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(value));
}
function statusLabel(piece) {
  if (piece.isPreview) return 'ARCHIVE PREVIEW';
  if (piece.status === 'sold') return 'SOLD';
  if (piece.status === 'not_for_sale') return 'NOT FOR SALE';
  return 'AVAILABLE';
}
function priceLabel(piece) {
  if (piece.isPreview) return 'DETAILS PENDING';
  if (piece.status === 'sold') return 'Sold';
  if (piece.status === 'not_for_sale') return 'Not for sale';
  return money(piece.price);
}
function artworkImageUrl(piece, thumbnail = false) {
  if (!piece.image_path) return null;
  if (piece.isPreview) return thumbnail ? piece.thumb_path : piece.image_path;
  if (!db) return null;
  return db.storage.from('art-images').getPublicUrl(piece.image_path).data.publicUrl;
}
function make(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}
function artworkCard(piece, index) {
  const card = make('article','artwork-card');
  const open = make('button','artwork-open');
  open.type = 'button';
  open.setAttribute('aria-label', `View details for ${piece.title}`);
  const picture = make('span','artwork-image');
  const url = artworkImageUrl(piece, true);
  if (url) {
    const image = document.createElement('img');
    image.src = url;
    image.alt = piece.alt_text || `Artwork titled ${piece.title}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    picture.append(image);
  } else {
    picture.append(make('span','artwork-placeholder','Artwork image pending'));
  }
  picture.append(make('span','artwork-tag',statusLabel(piece)),make('span','artwork-hover-symbol','↗'));
  const detail = make('span','artwork-info');
  const heading = make('span');
  heading.append(make('h3','',piece.title),make('p','',categoryLabels[piece.category] || 'ORIGINAL WORK'));
  detail.append(heading,make('span','artwork-price',priceLabel(piece)));
  open.append(picture,detail);
  open.addEventListener('click', () => openArtwork(piece));
  card.append(open);
  return card;
}
function render() {
  const filtered = artworks.filter(piece =>
    (activeCategory === 'all' || piece.category === activeCategory) &&
    (!availableOnly || piece.status === 'available')
  );
  grid.replaceChildren(...filtered.map(artworkCard));
  $('#artworkCount').textContent = String(artworks.length).padStart(2,'0');
  notice.hidden = filtered.length > 0;
  if (!filtered.length) notice.textContent = artworks.length ? 'No artwork matches this filter.' : 'The collection is being prepared. Check back soon.';
}
function fact(where,label,value) {
  if (value === null || value === undefined || value === '') return;
  const row = make('div');
  row.append(make('span','',label),make('strong','',String(value)));
  where.append(row);
}
function openArtwork(piece) {
  $('#dialogTitle').textContent = piece.title;
  $('#dialogDescription').textContent = piece.description || 'No description has been added for this piece yet.';
  $('#dialogPrice').textContent = priceLabel(piece);
  const facts = $('#dialogFacts');
  facts.replaceChildren();
  fact(facts,'CATEGORY',categoryLabels[piece.category] || 'ORIGINAL WORK');
  fact(facts,'MEDIUM',piece.medium || 'Not specified');
  fact(facts,'DIMENSIONS',piece.dimensions);
  fact(facts,'YEAR',piece.year);
  fact(facts,'STATUS',piece.isPreview ? 'PENDING ARTIST CONFIRMATION' : statusLabel(piece));
  const target = $('#dialogImage');
  target.replaceChildren();
  const source = artworkImageUrl(piece);
  if (source) {
    const image = document.createElement('img'); image.src = source; image.alt = piece.alt_text || piece.title;
    target.append(image);
  } else target.append(make('span','artwork-placeholder','Artwork image pending'));
  const contact = $('#dialogContact');
  if (config.CONTACT_EMAIL && !piece.isPreview && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.CONTACT_EMAIL)) {
    contact.href = `mailto:${config.CONTACT_EMAIL}?subject=${encodeURIComponent(`Artwork inquiry: ${piece.title}`)}`;
    contact.firstChild.textContent = 'INQUIRE ABOUT THIS PIECE ';
  } else {
    contact.href = '#contact';
    contact.firstChild.textContent = 'CONTACT THE ARTIST ';
  }
  dialog.showModal();
}
function initContact() {
  $('#year').textContent = new Date().getFullYear();
  const email = $('#emailLink'); const instagram = $('#instagramLink');
  if (config.CONTACT_EMAIL && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.CONTACT_EMAIL)) {
    email.href = `mailto:${config.CONTACT_EMAIL}`; email.hidden = false;
  }
  if (config.INSTAGRAM_URL && /^https:\/\/(www\.)?instagram\.com\//.test(config.INSTAGRAM_URL)) {
    instagram.href = config.INSTAGRAM_URL; instagram.hidden = false;
  }
  $('#contactPending').hidden = !email.hidden || !instagram.hidden;
}
async function loadArtworks() {
  if (!configured) {
    artworks = previews;
    $('#demoNotice').hidden = false;
    $('#availableControl').hidden = true;
    render();
    return;
  }
  if (!db) {
    notice.hidden = false;
    notice.textContent = 'The gallery connection could not load. Please refresh to try again.';
    return;
  }
  const {data,error} = await db.from('artworks')
    .select('id,title,description,medium,dimensions,year,price,category,status,image_path,alt_text,created_at')
    .eq('is_published',true).order('created_at',{ascending:false});
  if (error) {
    console.error('Gallery loading failed:',error.message);
    notice.hidden = false;
    notice.textContent = 'The gallery could not load right now. Please try again later.';
    return;
  }
  artworks = data || [];
  render();
}
function init() {
  initContact();
  for (const filter of document.querySelectorAll('.filter')) {
    filter.addEventListener('click', () => {
      activeCategory = filter.dataset.category;
      for (const button of document.querySelectorAll('.filter')) {
        const pressed = button === filter;
        button.classList.toggle('active',pressed);
        button.setAttribute('aria-pressed',String(pressed));
      }
      render();
    });
  }
  $('#availableOnly').addEventListener('change',event => {availableOnly = event.target.checked; render();});
  $('#closeDialog').addEventListener('click',()=> dialog.close());
  $('#dialogContact').addEventListener('click',()=> dialog.close());
  dialog.addEventListener('click',event => { if (event.target === dialog) dialog.close(); });
  loadArtworks();
}
init();
