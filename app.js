/* ==========================================================================
   STATE DEFINITION & INITIALIZATION
   ========================================================================== */
const state = {
  currentScreen: 'dashboard', // 'dashboard' | 'wizard'
  currentStep: 1,            // 1 to 4
  networkOnline: true,
  activeCaseId: null,
  offlineQueue: [],
  photos: {
    odo: false,
    car: false,
    title: false,
    check: false
  },
  signatures: {
    agent: false,
    cust: false
  }
};

// Canvas drawing helper instances
let canvasDrawings = {
  agent: { isDrawing: false, lastX: 0, lastY: 0, ctx: null, drawn: false },
  cust: { isDrawing: false, lastX: 0, lastY: 0, ctx: null, drawn: false }
};

/* ==========================================================================
   INITIALIZATION RUN
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);
  setupCanvas('agent');
  setupCanvas('cust');
  setupChat();
  logSystem('System initialized. Encrypted database active (SQLCipher v4.5.1).');
});

/* ==========================================================================
   SYSTEM LOGGING CONSOLE
   ========================================================================== */
function logSystem(message, type = 'normal') {
  const consoleLog = document.getElementById('console-log');
  if (!consoleLog) return;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = document.createElement('div');
  line.className = `log-line ${type === 'warn' ? 'text-warn' : type === 'muted' ? 'text-muted' : ''}`;
  line.textContent = `[${time}] ${message}`;
  
  consoleLog.appendChild(line);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

/* ==========================================================================
   TIME UPDATE
   ========================================================================== */
function updateTime() {
  const timeElements = [document.getElementById('mobile-time')];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  timeElements.forEach(el => {
    if (el) el.textContent = timeStr;
  });
}

/* ==========================================================================
   ROUTING & NAVIGATION
   ========================================================================== */
function openCase(caseId) {
  state.activeCaseId = caseId;
  state.currentScreen = 'wizard';
  state.currentStep = 1;
  
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-wizard').classList.add('active');
  
  // Show back button
  document.getElementById('btn-app-back').style.visibility = 'visible';
  document.getElementById('app-title-text').textContent = `Inspection wizard`;
  
  // Reset wizard progress and inputs
  updateWizardUI();
  logSystem(`Case #${caseId} checkout started by Transfer Agent Kyle Morris.`, 'normal');
}

function goBack() {
  if (state.currentScreen === 'wizard') {
    if (confirm("Are you sure you want to exit the wizard? Unsaved data will be held locally.")) {
      state.currentScreen = 'dashboard';
      document.getElementById('screen-wizard').classList.remove('active');
      document.getElementById('screen-dashboard').classList.add('active');
      
      document.getElementById('btn-app-back').style.visibility = 'hidden';
      document.getElementById('app-title-text').textContent = 'DeMars FieldOps';
      logSystem(`Exited active inspection wizard. Changes preserved in secure buffer.`, 'muted');
    }
  }
}

/* ==========================================================================
   WIZARD STATE CONTROLLER
   ========================================================================== */
function updateWizardUI() {
  // Toggle step visibility
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-content-${i}`);
    if (stepEl) {
      if (i === state.currentStep) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    }
  }

  // Update step indicators
  const dots = document.querySelectorAll('.step-dot');
  const lines = document.querySelectorAll('.step-line');
  
  dots.forEach((dot, index) => {
    const stepNum = index + 1;
    dot.className = 'step-dot';
    if (stepNum === state.currentStep) {
      dot.classList.add('active');
    } else if (stepNum < state.currentStep) {
      dot.classList.add('completed');
    }
  });

  lines.forEach((line, index) => {
    const lineStep = index + 1;
    if (lineStep < state.currentStep) {
      line.classList.add('active');
    } else {
      line.classList.remove('active');
    }
  });

  // Modify Navigation Buttons
  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');
  
  if (state.currentStep === 1) {
    btnPrev.style.visibility = 'hidden';
  } else {
    btnPrev.style.visibility = 'visible';
  }

  if (state.currentStep === 4) {
    btnNext.textContent = 'Submit Buyback';
  } else {
    btnNext.textContent = 'Continue';
  }

  // Update step-specific title text
  const stepTitles = {
    1: 'Step 1: Odometer & VIN Scan',
    2: 'Step 2: Vehicle Condition Audit',
    3: 'Step 3: Verification Documents',
    4: 'Step 4: Secure E-Signature & Handover'
  };
  document.getElementById('wizard-step-title').textContent = stepTitles[state.currentStep];
}

function moveStep(direction) {
  if (direction === 1) {
    // Validate current step fields before going forward
    if (!validateCurrentStep()) return;
    
    if (state.currentStep < 4) {
      state.currentStep++;
      updateWizardUI();
    } else {
      finalizeTransaction();
    }
  } else if (direction === -1) {
    if (state.currentStep > 1) {
      state.currentStep--;
      updateWizardUI();
    }
  }
}

/* ==========================================================================
   VALIDATIONS
   ========================================================================== */
function validateCurrentStep() {
  if (state.currentStep === 1) {
    const vin = document.getElementById('vin-input').value;
    const odometer = document.getElementById('odometer-input').value;
    
    if (!vin || vin.length < 10) {
      alert("Please enter or scan a valid VIN number.");
      return false;
    }
    if (!odometer || odometer <= 0) {
      alert("Please input a valid odometer reading.");
      return false;
    }
    if (!state.photos.odo) {
      alert("Please capture dashboard odometer photograph as proof.");
      return false;
    }
  } else if (state.currentStep === 2) {
    const panels = document.getElementById('check-panels').checked;
    const keys = document.getElementById('check-keys').checked;
    const fuses = document.getElementById('check-fuses').checked;
    
    if (!panels || !keys || !fuses) {
      alert("Please verify all physical vehicle condition audits.");
      return false;
    }
    if (!state.photos.car) {
      alert("Please capture vehicle condition photograph.");
      return false;
    }
  } else if (state.currentStep === 3) {
    if (!state.photos.title) {
      alert("Please scan the signed customer title (front/back).");
      return false;
    }
    if (!state.photos.check) {
      alert("Please capture photographic exchange proof of the check.");
      return false;
    }
  } else if (state.currentStep === 4) {
    if (!canvasDrawings.agent.drawn || !canvasDrawings.cust.drawn) {
      alert("Both signatures (Agent and Customer) are legally required to complete retitling.");
      return false;
    }
    const terms = document.getElementById('terms-consent').checked;
    if (!terms) {
      alert("Please check the terms check-box to acknowledge funds swapping.");
      return false;
    }
  }
  return true;
}

/* ==========================================================================
   SIMULATING HARDWARE OCR & CAMERA CAPTURE
   ========================================================================== */
function simulateVinScan() {
  document.getElementById('vin-input').value = '1FM5K8GC8RGA29402';
  document.getElementById('odometer-input').value = 14350;
  
  logSystem('VIN OCR Scan Successful: 1FM5K8GC8RGA29402 parsed. Match confirmed with manufacturer warranty database.', 'normal');
}

function simulatePhotoCapture(type) {
  const boxId = `${type}-photo-box`;
  const box = document.getElementById(boxId);
  if (!box) return;

  state.photos[type] = true;
  
  // Render clean overlay
  box.innerHTML = `
    <div class="photo-success-overlay">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>Photo Logged</span>
      <span style="font-size: 0.6rem; opacity: 0.85;">GEO-TAG: 32.7767° N, 96.7970° W</span>
    </div>
  `;
  
  logSystem(`GPS-verified photo metadata secured for: ${type.toUpperCase()}. SHA-256 signed.`, 'normal');
}

/* ==========================================================================
   E-SIGNATURE CANVAS CAPTURE LOGIC
   ========================================================================== */
function setupCanvas(type) {
  const canvas = document.getElementById(`${type}-canvas`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  
  canvasDrawings[type].ctx = ctx;

  // Touch & Mouse triggers
  const getCoordinates = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    canvasDrawings[type].isDrawing = true;
    const coords = getCoordinates(e);
    canvasDrawings[type].lastX = coords.x;
    canvasDrawings[type].lastY = coords.y;
  };

  const draw = (e) => {
    if (!canvasDrawings[type].isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvasDrawings[type].ctx;
    
    ctx.beginPath();
    ctx.moveTo(canvasDrawings[type].lastX, canvasDrawings[type].lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    canvasDrawings[type].lastX = coords.x;
    canvasDrawings[type].lastY = coords.y;
    canvasDrawings[type].drawn = true;
  };

  const stopDraw = () => {
    canvasDrawings[type].isDrawing = false;
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDraw);
}

function clearCanvas(type) {
  const canvas = document.getElementById(`${type}-canvas`);
  const ctx = canvasDrawings[type].ctx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvasDrawings[type].drawn = false;
}

/* ==========================================================================
   OFFLINE DISPATCH & NETWORK CONTROL
   ========================================================================== */
function setNetworkStatus(online) {
  state.networkOnline = online;
  
  const onlineBtn = document.getElementById('btn-network-online');
  const offlineBtn = document.getElementById('btn-network-offline');
  const connectionIcon = document.getElementById('network-icon');
  const syncCard = document.getElementById('sync-status-card');
  const syncText = document.getElementById('sync-status-text');

  if (online) {
    onlineBtn.classList.add('active');
    offlineBtn.classList.remove('active');
    connectionIcon.textContent = '⚡';
    connectionIcon.style.color = '#10B981';
    
    syncCard.className = 'status-card active';
    syncText.textContent = 'Sync Synced';
    
    logSystem('Network connectivity restored. Sync manager scanning local SQL queue...', 'normal');
    processOfflineQueue();
  } else {
    onlineBtn.classList.remove('active');
    offlineBtn.classList.add('active');
    connectionIcon.textContent = '❌';
    connectionIcon.style.color = '#EF4444';
    
    syncCard.className = 'status-card warning';
    syncText.textContent = 'Queue (Offline)';
    
    logSystem('Entering Offline field operations environment. Encrypted transactions will cache locally.', 'warn');
  }
}

function processOfflineQueue() {
  if (state.offlineQueue.length === 0) return;
  
  logSystem(`[Sync Manager] Found ${state.offlineQueue.length} unsynced transactions in SQLCipher buffer.`, 'normal');
  
  state.offlineQueue.forEach((task, index) => {
    setTimeout(() => {
      logSystem(`[Sync Engine] Uploading Case #${task.caseId} inspection payload.`, 'normal');
      setTimeout(() => {
        logSystem(`[Sync Completed] Transaction finalized on cloud. Checksum verified: SHA-256 ${task.hash}`, 'normal');
      }, 800);
    }, index * 1500);
  });
  
  state.offlineQueue = [];
}

/* ==========================================================================
   FINALIZE & CRYPTO HASHING
   ========================================================================== */
function finalizeTransaction() {
  // Generate pseudo SHA-256 hash representing audit seal
  const characters = 'abcdef0123456789';
  let mockHash = '';
  for (let i = 0; i < 64; i++) {
    mockHash += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const transactionData = {
    caseId: state.activeCaseId,
    vin: document.getElementById('vin-input').value,
    odometer: document.getElementById('odometer-input').value,
    hash: mockHash,
    gps: '32.7767 N, 96.7970 W',
    timestamp: new Date().toISOString()
  };

  if (state.networkOnline) {
    logSystem(`Signing package Case #${state.activeCaseId}. Computing SHA-256 verification hash...`, 'normal');
    setTimeout(() => {
      logSystem(`Inspection validated & synchronized. Checksum: ${mockHash}`, 'normal');
      alert(`Buyback Completed Successfully!\nAudit Checksum:\n${mockHash.substring(0,32)}...`);
      returnToDashboard();
    }, 1000);
  } else {
    logSystem(`[Offline Storage] Signing transaction locally. Writing metadata to encrypted local storage...`, 'warn');
    state.offlineQueue.push(transactionData);
    setTimeout(() => {
      logSystem(`[Offline Storage] Transaction hashed and queued: ${mockHash.substring(0,16)}...`, 'warn');
      alert(`Buyback completed offline! Form signed and cached locally. Will sync when field connection restored.`);
      returnToDashboard();
    }, 1000);
  }
}

function returnToDashboard() {
  state.currentScreen = 'dashboard';
  document.getElementById('screen-wizard').classList.remove('active');
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('btn-app-back').style.visibility = 'hidden';
  document.getElementById('app-title-text').textContent = 'DeMars FieldOps';
}

/* ==========================================================================
   SECURE CHAT CONTROLLER
   ========================================================================== */
function setupChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const feed = document.getElementById('chat-messages');
  
  if (!form || !input || !feed) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    
    // Add client message
    addChatMessage('You (Transfer Agent)', text, 'outgoing');
    input.value = '';
    
    // Check network connectivity
    if (!state.networkOnline) {
      setTimeout(() => {
        addChatMessage('System Encryption', 'Message transmission failed: Network is offline. Message queued in local buffer.', 'system');
      }, 500);
      return;
    }
    
    // Mock response handler
    logSystem('Routing chat payload through end-to-end TLS bridge.', 'muted');
    setTimeout(() => {
      let replyText = "Understood. Proceed with document exchange.";
      if (text.toLowerCase().includes('title')) {
        replyText = "If the title has a bank lien, verify if they have the official dealer lien release form, or have them sign POA DRX-204.";
      } else if (text.toLowerCase().includes('damage')) {
        replyText = "Take close-up photos of the damage. HQ will review it instantly. Do not write check until we approve.";
      } else if (text.toLowerCase().includes('check')) {
        replyText = "Ensure check number matches the invoice schedule precisely before handing it over.";
      }
      addChatMessage('HQ Dispatch (Sarah)', replyText, 'incoming');
    }, 1200);
  });
}

function addChatMessage(sender, text, type) {
  const feed = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const msgEl = document.createElement('div');
  msgEl.className = `message ${type}`;
  
  if (type === 'incoming') {
    msgEl.innerHTML = `
      <span class="sender">${sender}</span>
      <span class="text">${text}</span>
      <span class="time">${time}</span>
    `;
  } else if (type === 'outgoing') {
    msgEl.innerHTML = `
      <span class="text">${text}</span>
      <span class="time">${time}</span>
    `;
  } else {
    msgEl.innerHTML = `
      <span class="text">${text}</span>
    `;
  }
  
  feed.appendChild(msgEl);
  feed.scrollTop = feed.scrollHeight;
}
