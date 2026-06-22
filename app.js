// Mostafa's Morning Packing App Logic

// Checklist items definition
const ALL_ITEMS = [
  { id: 'lights', text: 'Bike lights charged' },
  { id: 'laptop', text: 'Laptop' },
  { id: 'lunchbox', text: 'Lunchbox' },
  { id: 'lunchcup', text: 'Lunchcup' },
  { id: 'street_clothes', text: 'Street clothes' },
  { id: 'bike_shoes', text: 'Bike shoes' },
  { id: 'street_shoes', text: 'Street shoes' }
];

// App State
let state = {
  mode: null,         // 'manual' | 'electric' | 'lime' | 'car'
  checkedItems: [],   // Array of checked item ids
  currentScreen: 'welcome',
  lastActiveDate: null // 'YYYY-MM-DD'
};

// UI Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  packing: document.getElementById('packing-screen'),
  sendoff: document.getElementById('send-off-screen')
};

const modeButtons = document.querySelectorAll('.mode-btn');
const backButton = document.getElementById('back-btn');
const resetButton = document.getElementById('reset-btn');
const checklistContainer = document.getElementById('packing-checklist');
const selectedModeText = document.getElementById('selected-mode-text');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Date Utility to check for daily resets
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initialize Application
function init() {
  loadState();
  checkDailyReset();
  setupEventListeners();
  restoreScreen();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

// Load State from LocalStorage
function loadState() {
  const saved = localStorage.getItem('mostafa_packing_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing localStorage state:', e);
    }
  }
}

// Save State to LocalStorage
function saveState() {
  localStorage.setItem('mostafa_packing_state', JSON.stringify(state));
}

// Reset checklist if a new day has arrived
function checkDailyReset() {
  const today = getTodayString();
  if (state.lastActiveDate !== today) {
    state.checkedItems = [];
    state.mode = null;
    state.currentScreen = 'welcome';
    state.lastActiveDate = today;
    saveState();
  }
}

// Navigate between screens with transitions
function navigateTo(targetScreen, direction = 'forward') {
  const currentEl = screens[state.currentScreen];
  const targetEl = screens[targetScreen];
  
  if (!currentEl || !targetEl) return;
  
  if (direction === 'forward') {
    currentEl.classList.remove('active');
    currentEl.classList.add('exit');
    targetEl.classList.remove('exit');
    targetEl.classList.add('active');
  } else {
    // Going backward
    currentEl.classList.remove('active');
    currentEl.classList.remove('exit');
    targetEl.classList.remove('exit');
    targetEl.classList.add('active');
  }
  
  state.currentScreen = targetScreen;
  saveState();
}

// Restore saved screen state on initial load
function restoreScreen() {
  // Hide all screens
  Object.values(screens).forEach(el => {
    el.classList.remove('active', 'exit');
  });
  
  // Set the current active screen
  const activeEl = screens[state.currentScreen];
  if (activeEl) {
    activeEl.classList.add('active');
  } else {
    screens.welcome.classList.add('active');
    state.currentScreen = 'welcome';
  }
  
  // If we restore onto packing screen, setup and render the list
  if (state.currentScreen === 'packing' && state.mode) {
    setupPackingScreen(state.mode);
  } else if (state.currentScreen === 'sendoff') {
    startConfettiLoop();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Mode selection buttons
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      state.mode = mode;
      saveState();
      
      setupPackingScreen(mode);
      navigateTo('packing', 'forward');
    });
  });
  
  // Back button in checklist
  backButton.addEventListener('click', () => {
    state.checkedItems = [];
    saveState();
    navigateTo('welcome', 'backward');
  });
  
  // Reset button on send-off screen
  resetButton.addEventListener('click', () => {
    state.checkedItems = [];
    state.mode = null;
    saveState();
    
    // Clear checklist rendering
    checklistContainer.innerHTML = '';
    
    navigateTo('welcome', 'backward');
    stopConfettiLoop();
  });
}

// Filter items based on selected transportation mode
function getItemsForMode(mode) {
  return ALL_ITEMS;
}

// Get clean mode title
function getModeTitle(mode) {
  const titles = {
    manual: 'Manual Bike',
    electric: 'Electric Bike',
    lime: 'Lime Bike',
    car: 'Car'
  };
  return titles[mode] || mode;
}

// Setup and render packing screen
function setupPackingScreen(mode) {
  selectedModeText.textContent = getModeTitle(mode);
  renderChecklist(mode);
  updateProgress(mode);
}

// Render the checklist elements
function renderChecklist(mode) {
  const items = getItemsForMode(mode);
  checklistContainer.innerHTML = '';
  
  items.forEach(item => {
    const isChecked = state.checkedItems.includes(item.id);
    
    const li = document.createElement('li');
    li.className = `checklist-item ${isChecked ? 'checked' : ''}`;
    li.dataset.id = item.id;
    
    // Using Flexbox order for visual arrangement: unchecked first (order 0), checked last (order 1)
    li.style.order = isChecked ? '1' : '0';
    
    li.innerHTML = `
      <div class="checkbox-ui">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="item-content">
        <span class="item-text">${item.text}</span>
      </div>
    `;
    
    li.addEventListener('click', () => toggleItem(item.id, li));
    checklistContainer.appendChild(li);
  });
}

// Toggle packing item state
function toggleItem(id, element) {
  const index = state.checkedItems.indexOf(id);
  const isChecked = index > -1;
  
  if (isChecked) {
    state.checkedItems.splice(index, 1);
    element.classList.remove('checked');
    element.style.order = '0';
  } else {
    state.checkedItems.push(id);
    element.classList.add('checked');
    
    // Delay setting visual order slightly to allow checkbox scale animation to be seen
    setTimeout(() => {
      element.style.order = '1';
    }, 250);
  }
  
  saveState();
  updateProgress(state.mode);
  
  // Check if everything is packed
  const items = getItemsForMode(state.mode);
  const allPacked = items.every(item => state.checkedItems.includes(item.id));
  
  if (allPacked) {
    // Wait for the last checked element transition to complete before sliding screen
    setTimeout(() => {
      navigateTo('sendoff', 'forward');
      startConfettiLoop();
      triggerConfettiBursts();
    }, 700);
  }
}

// Update progress bar and percentage numbers
function updateProgress(mode) {
  const items = getItemsForMode(mode);
  const total = items.length;
  const packed = items.filter(item => state.checkedItems.includes(item.id)).length;
  
  const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;
  
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${packed} of ${total} packed`;
  progressPercentage.textContent = `${percentage}%`;
}


// --- CONFETTI SYSTEM (No Libraries) ---

let confettiActive = false;
let particles = [];
const confettiColors = ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7', '#a29bfe', '#fd79a8', '#81ecec'];

function resizeCanvas() {
  const container = document.getElementById('app-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

class ConfettiParticle {
  constructor(x, y, angle, spread) {
    this.x = x;
    this.y = y;
    
    // Convert angle to radians
    const angleRad = angle * (Math.PI / 180);
    const speed = 12 + Math.random() * 10;
    
    // Set velocities based on angle and random spread
    const finalAngle = angleRad + (Math.random() - 0.5) * spread * (Math.PI / 180);
    this.vx = Math.cos(finalAngle) * speed;
    this.vy = Math.sin(finalAngle) * speed; // Negative goes up
    
    this.size = 6 + Math.random() * 6;
    this.width = this.size;
    this.height = this.size * (0.6 + Math.random() * 0.8);
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.opacity = 1.0;
    this.gravity = 0.35;
    this.drag = 0.985;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 8;
  }

  update() {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity; // Gravity pull
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.rotation += this.rotationSpeed;
    
    // Start fading out when falling down
    if (this.vy > 1) {
      this.opacity -= 0.015;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}

// Fire particles from left & right sides
function triggerConfettiBursts() {
  const burstCount = 60;
  
  // Left Side Burst: pointing up-right (-60 degrees to -30 degrees)
  for (let i = 0; i < burstCount; i++) {
    particles.push(new ConfettiParticle(0, canvas.height, -45, 35));
  }
  
  // Right Side Burst: pointing up-left (-150 degrees to -120 degrees)
  for (let i = 0; i < burstCount; i++) {
    particles.push(new ConfettiParticle(canvas.width, canvas.height, -135, 35));
  }
}

function startConfettiLoop() {
  if (confettiActive) return;
  confettiActive = true;
  animateConfetti();
}

function stopConfettiLoop() {
  confettiActive = false;
  particles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animateConfetti() {
  if (!confettiActive) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update & Draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    
    // Remove faded/out of screen particles
    if (p.opacity <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
      particles.splice(i, 1);
    }
  }
  
  // Periodically add minor passive drifts if they completed packing
  if (particles.length < 15 && Math.random() < 0.1) {
    // Occasional bursts to keep it alive for a short time
    if (Math.random() < 0.2) {
      // Small side burst
      const isLeft = Math.random() > 0.5;
      particles.push(new ConfettiParticle(isLeft ? 0 : canvas.width, canvas.height, isLeft ? -45 : -135, 20));
    }
  }

  requestAnimationFrame(animateConfetti);
}

// Run initial configurations
window.addEventListener('DOMContentLoaded', init);

// Register Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
