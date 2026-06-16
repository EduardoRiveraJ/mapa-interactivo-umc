// ── DATA AND CONFIGURATION ───────────────────────────────────────────────────
const CATEGORY_LABELS = {
  babor:     'Aula Babor',
  estribor:  'Aula Estribor',
  lab:       'Laboratorio',
  multimedia:'Multimedia',
  servicios: 'Servicios',
  opsu:      'OPSU',
  canchas:   'Área Deportiva',
  admin:     'Administrativo',
  honor:     'Área de Honor',
  banos:     'Servicios Sanitarios',
};

const CATEGORY_COLORS = {
  babor:     'var(--aula-babor-stroke)',
  estribor:  'var(--aula-estribor-stroke)',
  lab:       'var(--lab-stroke)',
  multimedia:'var(--multimedia-stroke)',
  servicios: 'var(--servicios-stroke)',
  opsu:      'var(--opsu-stroke)',
  canchas:   'var(--canchas-stroke)',
  admin:     'var(--admin-stroke)',
  honor:     'var(--honor-stroke)',
  banos:     'var(--banos-stroke)',
};

// ── DOM ELEMENTS ──────────────────────────────────────────────────────────────
const body = document.body;
const svg = document.getElementById('campus');
const mapContainer = document.getElementById('map-container');
const mapSvgWrap = document.getElementById('map-svg-wrap');
const allZones = document.querySelectorAll('.zone');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearFilterBtn = document.getElementById('clear-filter');
const themeToggleBtn = document.getElementById('theme-toggle');

const panel = document.getElementById('info-panel');
const pTitle = document.getElementById('panel-title');
const pBadge = document.getElementById('panel-category-badge');
const pDesc = document.getElementById('panel-desc');

// ── ZOOM AND PAN INTERACTION ─────────────────────────────────────────────────
let scale = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

function updateTransform() {
  // Apply visual transform to the SVG
  svg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

// Drag functionality
mapSvgWrap.addEventListener('mousedown', (e) => {
  // Only pan on left click
  if (e.button !== 0) return;
  isPanning = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
  svg.style.cursor = 'grabbing';
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  panX = e.clientX - startX;
  panY = e.clientY - startY;
  updateTransform();
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    svg.style.cursor = 'grab';
  }
});

mapSvgWrap.addEventListener('mouseleave', () => {
  if (isPanning) {
    isPanning = false;
    svg.style.cursor = 'grab';
  }
});

// Wheel Zoom functionality
mapSvgWrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const oldScale = scale;
  
  if (e.deltaY < 0) {
    // Zoom In
    scale = Math.min(scale * zoomFactor, 6.0);
  } else {
    // Zoom Out
    scale = Math.max(scale / zoomFactor, 0.4);
  }
  
  // Pivot adjustment relative to mouse pointer inside the container
  const rect = mapSvgWrap.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  panX = mouseX - (mouseX - panX) * (scale / oldScale);
  panY = mouseY - (mouseY - panY) * (scale / oldScale);
  
  updateTransform();
}, { passive: false });

// Zoom Control Buttons
document.getElementById('zoom-in').addEventListener('click', () => {
  scale = Math.min(scale * 1.25, 6.0);
  updateTransform();
});

document.getElementById('zoom-out').addEventListener('click', () => {
  scale = Math.max(scale / 1.25, 0.4);
  updateTransform();
});

document.getElementById('zoom-reset').addEventListener('click', () => {
  scale = 1.0;
  panX = 0;
  panY = 0;
  updateTransform();
});

// ── TOUCH PAN & PINCH-TO-ZOOM (MOBILE) ───────────────────────────────────────
let isTouching = false;
let startTouchX = 0;
let startTouchY = 0;
let initialPinchDistance = 0;
let initialScale = 1.0;

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
}

mapSvgWrap.addEventListener('touchstart', (e) => {
  if (document.activeElement === searchInput) {
    searchInput.blur();
  }
  
  if (e.touches.length === 1) {
    isTouching = true;
    startTouchX = e.touches[0].clientX - panX;
    startTouchY = e.touches[0].clientY - panY;
  } else if (e.touches.length === 2) {
    isTouching = false;
    initialPinchDistance = getTouchDistance(e.touches);
    initialScale = scale;
  }
}, { passive: true });

mapSvgWrap.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isTouching) {
    panX = e.touches[0].clientX - startTouchX;
    panY = e.touches[0].clientY - startTouchY;
    updateTransform();
  } else if (e.touches.length === 2 && initialPinchDistance > 0) {
    const currentDistance = getTouchDistance(e.touches);
    const zoomRatio = currentDistance / initialPinchDistance;
    const oldScale = scale;
    
    scale = Math.max(0.4, Math.min(initialScale * zoomRatio, 6.0));
    
    const mid = getTouchMidpoint(e.touches);
    const rect = mapSvgWrap.getBoundingClientRect();
    const mouseX = mid.x - rect.left;
    const mouseY = mid.y - rect.top;
    
    panX = mouseX - (mouseX - panX) * (scale / oldScale);
    panY = mouseY - (mouseY - panY) * (scale / oldScale);
    
    updateTransform();
  }
}, { passive: true });

mapSvgWrap.addEventListener('touchend', (e) => {
  if (e.touches.length === 0) {
    isTouching = false;
    initialPinchDistance = 0;
  } else if (e.touches.length === 1) {
    isTouching = true;
    startTouchX = e.touches[0].clientX - panX;
    startTouchY = e.touches[0].clientY - panY;
  }
}, { passive: true });


// ── DETAILS PANEL ─────────────────────────────────────────────────────────────
function openPanel(name, cat, desc) {
  const catLabel = CATEGORY_LABELS[cat] || cat;
  const catColor = CATEGORY_COLORS[cat] || 'var(--accent)';

  pTitle.textContent = name;
  pBadge.textContent = catLabel;
  pBadge.style.background = catColor;
  pDesc.textContent = desc || `Área de ${catLabel} dentro del campus de la Universidad Marítima del Caribe (UMC).`;

  panel.classList.add('open');
  mapContainer.classList.add('panel-open');
}

function closePanel() {
  panel.classList.remove('open');
  mapContainer.classList.remove('panel-open');
  // Remove active highlighted states
  allZones.forEach(z => z.classList.remove('highlighted'));
}

document.getElementById('panel-close').addEventListener('click', closePanel);

// ── ZONE INTERACTIONS ────────────────────────────────────────────────────────
allZones.forEach(zone => {
  // Show tooltip or info panel on click
  zone.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close keyboard on mobile
    if (document.activeElement === searchInput) {
      searchInput.blur();
    }
    
    const name = zone.dataset.name || 'Zona sin nombre';
    const cat  = zone.dataset.cat  || 'admin';
    const desc = zone.dataset.desc || '';
    
    // Highlight zone
    allZones.forEach(z => z.classList.remove('highlighted'));
    zone.classList.add('highlighted');
    
    openPanel(name, cat, desc);
  });
});

// Click outside map resets focus
mapSvgWrap.addEventListener('click', (e) => {
  // Close keyboard on mobile
  if (document.activeElement === searchInput) {
    searchInput.blur();
  }
  
  if (e.target === mapSvgWrap || e.target.id === 'campus') {
    closePanel();
  }
});


// ── FILTERING SYSTEM ─────────────────────────────────────────────────────────
let activeFilter = null;

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    
    if (activeFilter === cat) {
      clearFilter();
      return;
    }
    
    activeFilter = cat;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Dim other zones
    allZones.forEach(z => {
      z.classList.toggle('dimmed', z.dataset.cat !== cat);
    });
    
    closePanel();
  });
});

clearFilterBtn.addEventListener('click', clearFilter);

function clearFilter() {
  activeFilter = null;
  filterBtns.forEach(b => b.classList.remove('active'));
  allZones.forEach(z => z.classList.remove('dimmed'));
}


// ── LIVE SEARCH ──────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    allZones.forEach(z => z.classList.remove('dimmed', 'highlighted'));
    return;
  }
  
  let firstMatch = null;
  
  allZones.forEach(z => {
    const name = (z.dataset.name || '').toLowerCase();
    const cat = (z.dataset.cat || '').toLowerCase();
    const catLabel = (CATEGORY_LABELS[z.dataset.cat] || '').toLowerCase();
    
    const isMatch = name.includes(query) || cat.includes(query) || catLabel.includes(query);
    z.classList.toggle('dimmed', !isMatch);
    
    if (isMatch && !firstMatch) {
      firstMatch = z;
    }
  });
  
  // Highlight and focus first match
  allZones.forEach(z => z.classList.remove('highlighted'));
  if (firstMatch) {
    firstMatch.classList.add('highlighted');
    const name = firstMatch.dataset.name || 'Zona';
    const cat  = firstMatch.dataset.cat  || 'admin';
    const desc = firstMatch.dataset.desc || '';
    openPanel(name, cat, desc);
    
    // Auto-focus zoom on searched item
    const mapRect = mapSvgWrap.getBoundingClientRect();
    
    // Use SVG getBBox to calculate exact center of any element (rect, polygon, ellipse, group)
    const bbox = firstMatch.getBBox();
    const elX = bbox.x + bbox.width / 2;
    const elY = bbox.y + bbox.height / 2;
    
    // Only zoom in slightly if not already zoomed
    if (scale < 1.5) scale = 1.6;
    
    // Calculate centered coordinates, shifting focus to avoid overlapping panels
    let centerX = mapRect.width / 2;
    let centerY = mapRect.height / 2;
    
    if (window.innerWidth > 991) {
      // Shift focus left to avoid side panel
      centerX = (mapRect.width - 340) / 2;
    } else {
      // Shift focus up to avoid bottom sheet
      centerY = (mapRect.height - 200) / 2;
    }
    
    // Set pan coordinates (scaled and centered)
    panX = centerX - (elX * scale);
    panY = centerY - (elY * scale);
    updateTransform();
  } else {
    closePanel();
  }
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    clearFilter();
    closePanel();
  }
});


// ── DARK MODE TOGGLER ────────────────────────────────────────────────────────
// LocalStorage Backup
const savedTheme = localStorage.getItem('umc-map-theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-theme');
  updateThemeButton(true);
} else {
  updateThemeButton(false);
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = body.classList.toggle('dark-theme');
  localStorage.setItem('umc-map-theme', isDark ? 'dark' : 'light');
  updateThemeButton(isDark);
});

function updateThemeButton(isDark) {
  if (isDark) {
    // Show Sun Icon for light mode
    themeToggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </svg>
    `;
  } else {
    // Show Moon Icon for dark mode
    themeToggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-2.8 2-3.8 5.8-2.2 9 1.6 3.1 5.1 4.7 8.5 3.8.5-.1 1.1.1 1.3.6.2.5 0 1.1-.4 1.4-2 1.5-4.4 2.3-6.4 2.3z"></path>
      </svg>
    `;
  }
}
