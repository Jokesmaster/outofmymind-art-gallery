/* Admin permissions are enforced in the database, not just in this UI. */
'use strict';
const config = window.RAY_CONFIG || {};
const configured = Boolean(window.RAY_IS_CONFIGURED);
const db = configured && window.supabase ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY) : null;
const $ = selector => document.querySelector(selector);
let pieces = [];
let authorizedUser = null;
let pending = false;
const form = $('#artworkForm');
const get = name => $(`#artwork${name}`);
const allowedTypes = ['image/jpeg','image/png','image/webp'];
const maximumBytes = 8 * 1024 * 1024;

function message(text, isError = false) {
  const status = $('#adminStatus');
  status.textContent = text;
  status.classList.toggle('error', isError);
  status.hidden = false;
}
function setView(name) {
  for (const view of ['setupView','loginView','dashboardView']) $(`#${view}`).hidden = name !== view;
  $('#logoutBtn').hidden = name !== 'dashboardView';
}
function priceString(value) {
  return value === null || value === '' ? 'Price on request' :
    new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(Number(value));
}
function thumbURL(piece) {
  return piece.image_path ? db.storage.from('art-images').getPublicUrl(piece.image_path).data.publicUrl : null;
}
async function checkAdmin(user) {
  if (!user) return false;
  const {data, error} = await db.from('artist_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
async function refreshSession() {
  const {data, error} = await db.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') console.warn(error.message);
  if (!data?.user) { setView('loginView'); return; }
  try {
    if (!(await checkAdmin(data.user))) {
      await db.auth.signOut();
      setView('loginView');
      message('This account does not have permission to edit the gallery.', true);
      return;
    }
    authorizedUser = data.user;
    setView('dashboardView');
    await loadInventory();
  } catch (err) {
    setView('loginView');
    message(`Could not verify studio access: ${err.message}`, true);
  }
}
function fieldValue(name) { return get(name).value.trim(); }
function validateFile(file) {
  if (!file) return;
  if (!allowedTypes.includes(file.type)) throw new Error('Please upload a JPG, PNG, or WebP image.');
  if (file.size > maximumBytes) throw new Error('That image is over 8 MB. Please choose a smaller file.');
}
function clearForm() {
  form.reset();
  get('Id').value = '';
  $('#formHeading').textContent = 'Add artwork';
  $('#saveArtworkBtn').textContent = 'SAVE ARTWORK ↗';
}
function editPiece(piece) {
  clearForm();
  get('Id').value = piece.id;
  get('Title').value = piece.title || '';
  get('Description').value = piece.description || '';
  get('Category').value = piece.category || 'other';
  get('Medium').value = piece.medium || '';
  get('Dimensions').value = piece.dimensions || '';
  get('Year').value = piece.year || '';
  get('Price').value = piece.price === null ? '' : piece.price;
  get('Status').value = piece.status || 'available';
  get('Alt').value = piece.alt_text || '';
  get('Published').checked = Boolean(piece.is_published);
  $('#formHeading').textContent = `Edit: ${piece.title}`;
  $('#saveArtworkBtn').textContent = 'UPDATE ARTWORK ↗';
  $('#formPanel').scrollIntoView({behavior:'smooth',block:'start'});
  get('Title').focus({preventScroll:true});
}
function renderInventory() {
  const list = $('#inventoryList');
  list.replaceChildren();
  $('#inventoryCount').textContent = `${pieces.length} ${pieces.length === 1 ? 'PIECE' : 'PIECES'}`;
  if (!pieces.length) { const p = document.createElement('p'); p.className='field-helper'; p.textContent='No artwork yet. Use the form to upload the first piece.'; list.append(p); return; }
  for (const piece of pieces) {
    const row = document.createElement('article'); row.className='inventory-item';
    const url = thumbURL(piece);
    const thumb = url ? document.createElement('img') : document.createElement('div');
    thumb.className = url ? 'inventory-thumb' : 'inventory-thumb inventory-placeholder';
    if (url) { thumb.src=url; thumb.alt=''; } else { thumb.textContent='RA'; }
    const details = document.createElement('div'); details.className='inventory-details';
    const chip = document.createElement('span'); chip.className=`status-chip ${piece.is_published ? 'published' : ''}`;
    chip.textContent = piece.is_published ? 'LIVE ON GALLERY' : 'PRIVATE DRAFT';
    const title = document.createElement('h4'); title.textContent=piece.title;
    const subtitle = document.createElement('p'); subtitle.textContent=`${piece.status.replaceAll('_',' ')} · ${priceString(piece.price)}`;
    const actions = document.createElement('div'); actions.className='inventory-actions';
    const edit = document.createElement('button'); edit.type='button'; edit.textContent='EDIT';
    edit.addEventListener('click', () => editPiece(piece));
    const remove = document.createElement('button'); remove.type='button'; remove.textContent='DELETE'; remove.className='delete-action';
    remove.addEventListener('click', () => deletePiece(piece));
    actions.append(edit,remove);
    details.append(chip,title,subtitle,actions); row.append(thumb,details); list.append(row);
  }
}
async function loadInventory() {
  const {data,error} = await db.from('artworks').select('*').order('created_at',{ascending:false});
  if (error) { message(`Could not load inventory: ${error.message}`,true); return; }
  pieces=data || [];
  renderInventory();
}
async function removeUploadedImage(path) {
  if (!path) return;
  const {error} = await db.storage.from('art-images').remove([path]);
  if (error) console.warn('Image cleanup failed:',error.message);
}
async function deletePiece(piece) {
  if (pending || !window.confirm(`Permanently delete "${piece.title}" from the collection?`)) return;
  pending = true;
  try {
    const {error} = await db.from('artworks').delete().eq('id',piece.id);
    if (error) throw error;
    if (piece.image_path) await removeUploadedImage(piece.image_path);
    if (get('Id').value === piece.id) clearForm();
    message(`Deleted "${piece.title}".`);
    await loadInventory();
  } catch(err) { message(`Delete failed: ${err.message}`,true); }
  finally { pending=false; }
}
async function savePiece(event) {
  event.preventDefault();
  if (pending || !authorizedUser) return;
  pending=true;
  const save = $('#saveArtworkBtn'); save.disabled=true; save.textContent='SAVING…';
  let uploadedPath = null;
  try {
    const id = fieldValue('Id');
    const existing = pieces.find(piece => piece.id === id);
    const file = get('Image').files[0];
    validateFile(file);
    const priceRaw = fieldValue('Price');
    const price = priceRaw === '' ? null : Number(priceRaw);
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Price must be a positive amount or left blank.');
    const yearRaw = fieldValue('Year');
    const year = yearRaw === '' ? null : Number(yearRaw);
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) throw new Error('Please enter a valid year.');
    const publishing = get('Published').checked;
    if (publishing && !file && !existing?.image_path) throw new Error('Add an artwork photo before publishing this piece.');
    if (file && !fieldValue('Alt')) throw new Error('Add a short image description to make this artwork accessible.');
    if (file) {
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      uploadedPath = `${authorizedUser.id}/${crypto.randomUUID()}.${extension}`;
      const {error} = await db.storage.from('art-images').upload(uploadedPath,file,{contentType:file.type,upsert:false});
      if (error) throw error;
    }
    const payload = {
      title:fieldValue('Title'), description:fieldValue('Description'),
      category:get('Category').value, medium:fieldValue('Medium'),
      dimensions:fieldValue('Dimensions'), year, price,
      status:get('Status').value, alt_text:fieldValue('Alt'),
      is_published:publishing, image_path:uploadedPath || existing?.image_path || null
    };
    if (!payload.title) throw new Error('Please give this artwork a title.');
    let error;
    if (existing) ({error} = await db.from('artworks').update(payload).eq('id',existing.id));
    else ({error} = await db.from('artworks').insert(payload));
    if (error) throw error;
    if (uploadedPath && existing?.image_path) await removeUploadedImage(existing.image_path);
    uploadedPath=null;
    clearForm();
    message(`"${payload.title}" saved successfully${publishing ? ' and published' : ' as a private draft'}.`);
    await loadInventory();
  } catch(err) {
    if (uploadedPath) await removeUploadedImage(uploadedPath);
    message(`Could not save artwork: ${err.message}`,true);
  } finally { pending=false; save.disabled=false; save.textContent = get('Id').value ? 'UPDATE ARTWORK ↗' : 'SAVE ARTWORK ↗'; }
}
async function init() {
  if (!configured) { setView('setupView'); return; }
  if (!db) { setView('setupView'); message('Supabase could not load. Check your internet connection.',true); return; }
  $('#loginForm').addEventListener('submit',async event => {
    event.preventDefault();
    const submit=$('#loginForm button[type=submit]'); submit.disabled=true;
    try {
      const {error} = await db.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});
      if (error) throw error;
      $('#adminStatus').hidden=true;
      $('#loginPassword').value='';
      await refreshSession();
    } catch(err) { message(`Sign-in failed: ${err.message}`,true); }
    finally { submit.disabled=false; }
  });
  $('#logoutBtn').addEventListener('click',async () => {
    await db.auth.signOut(); authorizedUser=null; setView('loginView'); clearForm(); message('You have signed out.');
  });
  $('#newArtworkBtn').addEventListener('click', () => {clearForm();$('#formPanel').scrollIntoView({behavior:'smooth'});get('Title').focus({preventScroll:true});});
  $('#cancelEditBtn').addEventListener('click',clearForm);
  form.addEventListener('submit',savePiece);
  await refreshSession();
}
init();
