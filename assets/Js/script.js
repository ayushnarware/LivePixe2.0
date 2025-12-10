/**
 * PixelPro Ultimate - script.js
 * Updated with Smart Proxy Failover Logic
 */

// --- CONFIGURATION ---
const API_KEY = 'FdexWHTC26hHcrlvTj2gKYzQ5Lx3wr230lyFIJXaOfT7BqvZhtGhRNOl';

// Ye function decide karta hai ki kaunsa URL use karna hai
function getUrlsToTry(endpoint, queryString) {
    const targetUrl = `https://api.pexels.com${endpoint}${queryString}`;

    // 1. Agar Localhost hai toh Direct URL bhejo (Browser Extension ON rakhna zaroori hai)
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        return [targetUrl];
    }

    // 2. Agar Live Server (GitHub Pages) hai toh 3 Backup Proxies try karo
    return [
        // Priority 1: Corsfix (Best for APIs)
        `https://proxy.corsfix.com/?${targetUrl}`,
        
        // Priority 2: CorsProxy.io (Backup)
        `https://corsproxy.io/?url=${targetUrl}`,
        
        // Priority 3: ThingProxy (Last Resort)
        `https://thingproxy.freeboard.io/fetch/${targetUrl}`
    ];
}

const state = {
    page: 1,
    query: 'India',
    type: 'photos',
    loading: false,
    hasMore: true,
    orientation: '',
    color: '',
    savedItems: JSON.parse(localStorage.getItem('pixelpro_saved')) || []
};

// --- DOM ELEMENTS ---
const getLoader = () => document.getElementById('loader');
const getGrid = () => document.getElementById('gallery-grid');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadRandomHero();
    fetchContent(true);
    updateSavedBadge();
    setupEventListeners();
});

function setupEventListeners() {
    // Infinite Scroll
    const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting && state.hasMore && !state.loading) {
            fetchContent();
        }
    }, { rootMargin: '300px' });
    const loader = getLoader();
    if(loader) observer.observe(loader);

    // Search
    const navInput = document.getElementById('nav-search-input');
    if(navInput) navInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch(e.target.value));
    
    // Back to Top
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('back-top');
        if(window.scrollY > 300) btn.classList.add('visible');
        else btn.classList.remove('visible');
    });
    document.getElementById('back-top')?.addEventListener('click', () => window.scrollTo(0,0));

    // Mobile Menu Toggles
    document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobileMenu);
    document.querySelector('.close-menu')?.addEventListener('click', closeMobileMenu);
    
    // Mobile Search Toggle
    document.getElementById('mobile-search-toggle')?.addEventListener('click', () => {
        document.getElementById('hero-search-input').focus();
        window.scrollTo(0,0);
    });
}

// --- THEME ---
function initTheme() {
    const savedTheme = localStorage.getItem('pixelpro_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

document.getElementById('theme-toggle').onclick = () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('pixelpro_theme', next);
};

// --- API LOGIC (UPDATED WITH BACKUP PROXIES) ---
async function fetchContent(reset = false) {
    if (state.loading) return;
    state.loading = true;
    const loader = getLoader();
    if(loader) loader.classList.add('active');

    if (reset) {
        state.page = 1;
        const grid = getGrid();
        if(grid) grid.innerHTML = '';
        state.hasMore = true;
    }

    // URL Construction
    const params = `?query=${state.query}&page=${state.page}&per_page=15` +
                   `${state.orientation ? '&orientation='+state.orientation : ''}` +
                   `${state.color ? '&color='+state.color : ''}`;
    
    const endpoint = state.type === 'photos' ? '/v1/search' : '/videos/search';
    
    // Smart Logic: Get list of URLs to try
    const urls = getUrlsToTry(endpoint, params);
    
    let success = false;

    // Loop through proxies until one works
    for (const url of urls) {
        try {
            console.log(`Trying Fetch: ${url}`); 
            
            const res = await fetch(url, { 
                headers: { Authorization: API_KEY } 
            });

            if (!res.ok) throw new Error(`Status: ${res.status}`);

            const data = await res.json();
            const items = data.photos || data.videos || [];
            
            if (items.length === 0) {
                state.hasMore = false;
            } else {
                renderItems(items);
                state.page++;
            }
            
            success = true; 
            break; // Data mil gaya, loop roko!

        } catch (err) {
            console.warn(`Failed URL: ${url}`, err);
        }
    }

    if (!success) {
        console.error("All proxies failed.");
        showToast("Error loading content. Please refresh.");
    }

    state.loading = false;
    if(loader) loader.classList.remove('active');
}

// --- RENDER ITEMS ---
function renderItems(items) {
    const fragment = document.createDocumentFragment();
    const grid = getGrid();
    if(!grid) return;

    items.forEach(item => {
        const isVideo = state.type === 'videos';
        const card = document.createElement('div');
        card.className = 'media-card';
        
        const imgUrl = isVideo ? item.image : item.src.large;
        const dlLink = isVideo ? item.video_files[0].link : item.src.original;
        const creatorName = (item.user && item.user.name) || item.photographer;

        card.innerHTML = `
            <div style="background-color:${item.avg_color || '#333'}; height:100%;">
                <img src="${imgUrl}" loading="lazy" alt="${item.alt || 'Stock Media'}">
                ${isVideo ? '<div style="position:absolute; top:10px; left:10px; background:white; padding:5px; border-radius:50%; width:30px; height:30px; display:grid; place-items:center;"><i class="ph-fill ph-video-camera"></i></div>' : ''}
            </div>
            <div class="card-overlay">
                <div class="card-header">
                     <button class="icon-action save-btn">
                        <i class="${isSaved(item.id) ? 'ph-fill ph-bookmark-simple' : 'ph-bold ph-bookmark-simple'}"></i>
                     </button>
                     <button class="icon-action download-btn"><i class="ph-bold ph-download-simple"></i></button>
                </div>
                <div class="card-footer">
                    <span>${creatorName}</span>
                </div>
            </div>
        `;

        card.querySelector('.card-overlay').addEventListener('click', (e) => {
            if(!e.target.closest('button')) {
                openModal(item);
            }
        });

        card.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            forceDownload(dlLink, `livepixe-${item.id}.${isVideo ? 'mp4' : 'jpeg'}`);
        });

        card.querySelector('.save-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSave(item.id, imgUrl, state.type, creatorName);
            const iconClass = isSaved(item.id) ? 'ph-fill ph-bookmark-simple' : 'ph-bold ph-bookmark-simple';
            e.currentTarget.innerHTML = `<i class="${iconClass}"></i>`;
        });

        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

// --- FORCE DOWNLOAD ---
async function forceDownload(url, filename) {
    showToast('Downloading...');
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        showToast('Download Complete!');
    } catch (e) {
        window.open(url, '_blank');
        showToast('Opened in New Tab');
    }
}

// --- MODAL LOGIC ---
function openModal(item) {
    const modal = document.getElementById('modal');
    const isVideo = state.type === 'videos';
    const img = document.getElementById('modal-img');
    const vid = document.getElementById('modal-video');
    
    img.hidden = false; vid.hidden = true; vid.pause();

    const dlLink = isVideo ? item.video_files[0].link : item.src.original;
    const creatorName = (item.user && item.user.name) || item.photographer; 

    if(isVideo) {
        img.hidden = true; vid.hidden = false;
        if(item.video_files?.length > 0) { vid.src = dlLink; vid.play(); }
    } else {
        img.src = item.src.large2x;
    }

    document.getElementById('m-user').innerText = creatorName;
    document.getElementById('m-author-label').innerText = isVideo ? 'Video Creator' : 'Photographer';
    document.getElementById('m-title').innerText = item.alt || "Untitled Artwork";
    document.getElementById('m-desc').innerText = item.alt ? `A stunning high-quality shot of ${item.alt}.` : "No specific description provided.";
    
    const dlBtn = document.getElementById('dl-btn');
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => forceDownload(dlLink, `livepixe-${item.id}`));

    const tagsDiv = document.getElementById('m-tags');
    tagsDiv.innerHTML = '';
    const tagText = item.alt || "Stock, Creative, Design";
    const tagsArray = tagText.split(/[\s,]+/).filter(t => t.length > 3).slice(0, 5);
    
    tagsArray.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.innerText = t;
        span.onclick = () => { closeModal(); performSearch(t); };
        tagsDiv.appendChild(span);
    });

    const searchTag = tagsArray[0] || state.query;
    fetchSimilar(searchTag);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('modal-video').pause();
}

async function fetchSimilar(query) {
    const grid = document.getElementById('similar-grid');
    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Finding related matches...</p>';
    
    try {
        const url = `${BASE_URL}/v1/search?query=${query}&per_page=6`;
        // Handle local vs proxy for similar images too
        const finalUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
            ? url 
            : `https://proxy.corsfix.com/?${url}`;

        const res = await fetch(finalUrl, { headers: {Authorization: API_KEY} });
        const data = await res.json();
        grid.innerHTML = '';
        
        if(!data.photos || data.photos.length === 0) {
             grid.innerHTML = '<p>No similar images found.</p>';
             return;
        }

        data.photos.forEach(p => {
            const img = document.createElement('img');
            img.className = 'sim-img';
            img.src = p.src.medium;
            img.onclick = () => openModal(p);
            grid.appendChild(img);
        });
    } catch(e) {
        grid.innerHTML = '<p>Could not load similar images.</p>';
    }
}

// --- SEARCH & UTILS ---
function performSearch(query) {
    if (!query) return;
    state.query = query;
    document.getElementById('gallery-title').innerText = `Results for "${query}"`;
    fetchContent(true);
}

function handleSearch(term) {
    document.getElementById('nav-search-input').value = term;
    performSearch(term);
}

function triggerHeroSearch() {
    performSearch(document.getElementById('hero-search-input').value);
}

function switchTab(type) {
    state.type = type;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    const tabs = Array.from(document.querySelectorAll('.filter-tab'));
    tabs.filter(t => t.innerText.toLowerCase().includes(type)).forEach(t => t.classList.add('active'));
    
    document.getElementById('gallery-title').innerText = type === 'photos' ? 'Explore Photos' : 'Explore Videos';
    fetchContent(true);
}

function applyFilters() {
    state.orientation = document.getElementById('orientation-filter').value;
    fetchContent(true);
}

function filterColor(color) {
    state.color = color;
    fetchContent(true);
}

// --- DRAWER & MENUS ---
function openMobileMenu() {
    document.getElementById('mobile-menu').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}
function closeMobileMenu() {
    document.getElementById('mobile-menu').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// Saved Items Drawer
document.getElementById('saved-toggle').onclick = () => {
    renderSavedDrawer();
    document.getElementById('drawer').classList.add('open');
    document.getElementById('overlay').classList.add('active');
};

document.getElementById('overlay').onclick = () => {
    document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open'));
    document.getElementById('overlay').classList.remove('active');
};
document.querySelectorAll('.close-drawer, .close-menu').forEach(b => {
    b.onclick = document.getElementById('overlay').onclick;
});

// --- SAVED ITEMS LOGIC ---
function toggleSave(id, img, type, creator) {
    const idx = state.savedItems.findIndex(b => b.id === id);
    if (idx > -1) {
        state.savedItems.splice(idx, 1);
        showToast('Removed from Saved');
    } else {
        state.savedItems.push({ id, img, type, creator });
        showToast('Item Saved!');
    }
    
    localStorage.setItem('pixelpro_saved', JSON.stringify(state.savedItems));
    updateSavedBadge();
    if(document.getElementById('drawer').classList.contains('open')) {
        renderSavedDrawer();
    }
}

function isSaved(id) { return state.savedItems.some(b => b.id === id); }
function updateSavedBadge() { document.getElementById('saved-badge').innerText = state.savedItems.length; }

function renderSavedDrawer() {
    const list = document.getElementById('drawer-list');
    list.innerHTML = '';
    
    if(state.savedItems.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:gray; margin-top:20px;">No saved items yet.</p>';
        return;
    }

    state.savedItems.forEach(b => {
        const div = document.createElement('div');
        div.className = 'saved-item';
        div.innerHTML = `
            <img src="${b.img}" class="saved-thumb"> 
            <div class="saved-info">
                <strong>${b.creator}</strong><br>
                <small>${b.type}</small>
            </div>
            <button class="btn-remove" onclick="removeFromSaved(${b.id})">
                <i class="ph-bold ph-trash"></i>
            </button>
        `;
        list.appendChild(div);
    });
}

function removeFromSaved(id) {
    const idx = state.savedItems.findIndex(b => b.id === id);
    if(idx > -1) {
        state.savedItems.splice(idx, 1);
        localStorage.setItem('pixelpro_saved', JSON.stringify(state.savedItems));
        updateSavedBadge();
        renderSavedDrawer();
        showToast('Removed');
    }
}

function clearSaved() {
    state.savedItems = [];
    localStorage.setItem('pixelpro_saved', JSON.stringify([]));
    updateSavedBadge();
    renderSavedDrawer();
}

// Misc
function loadRandomHero() {
    const images = ['https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1600'];
    const bg = document.getElementById('hero-bg');
    if(bg) bg.style.backgroundImage = `url(${images[0]})`;
}

function showToast(msg) { 
    const toast = document.getElementById('toast');
    toast.innerText = msg; toast.classList.add('active'); 
    setTimeout(() => toast.classList.remove('active'), 3000); 
}

window.onclick = (e) => { 
    if(e.target === document.getElementById('modal')) closeModal(); 
};