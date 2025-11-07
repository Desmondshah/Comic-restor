/**
 * Comic Restoration Pipeline - Web UI JavaScript
 */

// State
let uploadedFilename = null;
let uploadedMaskFilename = null;
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Mask Editor State
let maskEditorActive = false;
let maskCanvas = null;
let maskCtx = null;
let maskLayer = null; // Separate layer for the mask
let maskLayerCtx = null;
let baseImage = null;
let isDrawing = false;
let currentTool = 'brush'; // 'brush' or 'eraser'
let brushSize = 20;
let maskOpacity = 0.5;

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const maskZone = document.getElementById('maskZone');
const maskInput = document.getElementById('maskInput');
const uploadText = document.getElementById('uploadText');
const maskText = document.getElementById('maskText');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const restoreBtn = document.getElementById('restoreBtn');
const jobsList = document.getElementById('jobsList');
const apiWarning = document.getElementById('apiWarning');

// Mask Editor Elements
const createMaskBtn = document.getElementById('createMaskBtn');
const maskEditorContainer = document.getElementById('maskEditorContainer');
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const brushSizeInput = document.getElementById('brushSize');
const maskOpacitySlider = document.getElementById('maskOpacity');
const opacityValue = document.getElementById('opacityValue');
const clearMaskBtn = document.getElementById('clearMaskBtn');
const saveMaskBtn = document.getElementById('saveMaskBtn');
const cancelMaskBtn = document.getElementById('cancelMaskBtn');

// Settings
const scale = document.getElementById('scale');
const dpi = document.getElementById('dpi');
const matteComp = document.getElementById('matteComp');
const bleed = document.getElementById('bleed');
const faceRestore = document.getElementById('faceRestore');
const extractOCR = document.getElementById('extractOCR');

// ============ INITIALIZATION ============

async function init() {
  await checkHealth();
  await loadJobs();
  connectWebSocket();
  setupEventListeners();
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (!data.hasApiToken) {
      apiWarning.innerHTML = `
        <div class="alert alert-warning">
          <span>⚠️</span>
          <div>
            <strong>API Token Not Configured</strong><br>
            Add REPLICATE_API_TOKEN to .env file to enable restoration.
            <a href="https://replicate.com/account/api-tokens" target="_blank" style="color: var(--warning); text-decoration: underline;">Get token</a>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

// ============ WEBSOCKET ============

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0;
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 3000 * reconnectAttempts);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function handleWebSocketMessage(data) {
  if (data.type === 'job-update') {
    updateJobCard(data.jobId, data.job);
  } else if (data.type === 'jobs-list') {
    renderJobs(data.jobs);
  }
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  // Image upload - click
  uploadZone.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
  
  // Image upload - drag & drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imageInput.files = files;
      handleImageUpload();
    }
  });
  
  // Mask upload
  maskZone.addEventListener('click', (e) => {
    // Don't trigger file input if clicking the "draw damage areas" link
    if (e.target.id !== 'createMaskBtn') {
      maskInput.click();
    }
  });
  maskInput.addEventListener('change', handleMaskUpload);
  
  // Create mask button
  if (createMaskBtn) {
    createMaskBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openMaskEditor();
    });
  }
  
  // Mask editor tools
  brushBtn.addEventListener('click', () => setTool('brush'));
  eraserBtn.addEventListener('click', () => setTool('eraser'));
  brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
  });
  maskOpacitySlider.addEventListener('input', (e) => {
    maskOpacity = parseInt(e.target.value) / 100;
    opacityValue.textContent = e.target.value + '%';
    redrawMaskCanvas();
  });
  clearMaskBtn.addEventListener('click', clearMask);
  saveMaskBtn.addEventListener('click', saveMask);
  cancelMaskBtn.addEventListener('click', closeMaskEditor);
  
  // Restore button
  restoreBtn.addEventListener('click', startRestoration);

  console.log('Event listeners initialized');
}

// ============ FILE UPLOAD ============

async function handleImageUpload() {
  const file = imageInput.files[0];
  if (!file) return;
  
  console.log('Uploading file:', file.name, file.size, 'bytes');
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    uploadText.innerHTML = '<div class="spinner"></div> Uploading...';
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Upload response:', data);
    
    if (data.success) {
      uploadedFilename = data.filename;
      uploadZone.classList.add('has-file');
      uploadText.innerHTML = `
        <strong>✓ ${data.originalName}</strong><br>
        <span style="color: var(--text-muted);">${formatFileSize(data.size)}</span>
      `;
      
      console.log('uploadedFilename set to:', uploadedFilename);
      
      // Show preview
      previewImage.src = `/api/preview/${data.filename}`;
      previewContainer.style.display = 'block';
      
      // Enable restore button
      restoreBtn.disabled = false;
      console.log('Restore button enabled');
    } else {
      console.error('Upload failed:', data);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    uploadText.innerHTML = `
      <strong style="color: var(--danger);">✗ Upload failed</strong><br>
      <span style="color: var(--text-muted);">Click to try again</span>
    `;
  }
}

async function handleMaskUpload() {
  const file = maskInput.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('mask', file);
  
  try {
    maskText.innerHTML = '<div class="spinner"></div> Uploading...';
    
    const response = await fetch('/api/upload-mask', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      uploadedMaskFilename = data.filename;
      maskZone.classList.add('has-file');
      maskText.innerHTML = `
        <strong>✓ ${data.originalName}</strong>
      `;
    }
  } catch (error) {
    console.error('Mask upload failed:', error);
    maskText.innerHTML = `
      <strong style="color: var(--danger);">✗ Upload failed</strong><br>
      <span style="color: var(--text-muted); font-size: 0.85rem;">Click to try again</span>
    `;
  }
}

// ============ MASK EDITOR ============

function openMaskEditor() {
  if (!uploadedFilename) {
    alert('Please upload an image first before creating a damage mask.');
    return;
  }
  
  maskEditorActive = true;
  maskEditorContainer.classList.add('active');
  previewContainer.style.display = 'none';
  
  // Initialize canvas
  maskCanvas = document.getElementById('maskCanvas');
  maskCtx = maskCanvas.getContext('2d');
  
  // Create mask layer
  maskLayer = document.createElement('canvas');
  maskLayerCtx = maskLayer.getContext('2d');
  
  // Load the uploaded image
  baseImage = new Image();
  baseImage.crossOrigin = 'anonymous';
  baseImage.onload = () => {
    // Set canvas sizes to match image
    maskCanvas.width = baseImage.width;
    maskCanvas.height = baseImage.height;
    maskLayer.width = baseImage.width;
    maskLayer.height = baseImage.height;
    
    // Initialize mask layer as transparent
    maskLayerCtx.clearRect(0, 0, maskLayer.width, maskLayer.height);
    
    // Draw initial view
    redrawMaskCanvas();
    
    // Setup canvas event listeners
    setupCanvasListeners();
  };
  baseImage.src = `/api/preview/${uploadedFilename}`;
}

function closeMaskEditor() {
  maskEditorActive = false;
  maskEditorContainer.classList.remove('active');
  previewContainer.style.display = 'block';
  
  // Remove canvas listeners
  if (maskCanvas) {
    const newCanvas = maskCanvas.cloneNode(true);
    maskCanvas.parentNode.replaceChild(newCanvas, maskCanvas);
  }
}

function setTool(tool) {
  currentTool = tool;
  
  if (tool === 'brush') {
    brushBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  } else {
    brushBtn.classList.remove('active');
    eraserBtn.classList.add('active');
  }
}

function setupCanvasListeners() {
  maskCanvas.addEventListener('mousedown', startDrawing);
  maskCanvas.addEventListener('mousemove', draw);
  maskCanvas.addEventListener('mouseup', stopDrawing);
  maskCanvas.addEventListener('mouseout', stopDrawing);
  
  // Touch support for tablets
  maskCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    maskCanvas.dispatchEvent(mouseEvent);
  });
  
  maskCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    maskCanvas.dispatchEvent(mouseEvent);
  });
  
  maskCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    maskCanvas.dispatchEvent(mouseEvent);
  });
}

function startDrawing(e) {
  isDrawing = true;
  
  // Start a new path at the click location
  const rect = maskCanvas.getBoundingClientRect();
  const scaleX = maskCanvas.width / rect.width;
  const scaleY = maskCanvas.height / rect.height;
  
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  maskLayerCtx.beginPath();
  maskLayerCtx.moveTo(x, y);
}

function stopDrawing() {
  isDrawing = false;
  maskLayerCtx.beginPath(); // Reset path when stopping
}

function draw(e) {
  if (!isDrawing) return;
  
  const rect = maskCanvas.getBoundingClientRect();
  const scaleX = maskCanvas.width / rect.width;
  const scaleY = maskCanvas.height / rect.height;
  
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  // Set drawing properties
  maskLayerCtx.lineWidth = brushSize;
  maskLayerCtx.lineCap = 'round';
  maskLayerCtx.lineJoin = 'round';
  
  if (currentTool === 'brush') {
    maskLayerCtx.globalCompositeOperation = 'source-over';
    maskLayerCtx.strokeStyle = 'white';
  } else {
    maskLayerCtx.globalCompositeOperation = 'destination-out';
  }
  
  // Draw line to current position
  maskLayerCtx.lineTo(x, y);
  maskLayerCtx.stroke();
  
  // Move to current position for next segment
  maskLayerCtx.beginPath();
  maskLayerCtx.moveTo(x, y);
  
  // Redraw display canvas
  redrawMaskCanvas();
}

function redrawMaskCanvas() {
  if (!baseImage || !maskCanvas || !maskLayer) return;
  
  // Clear display canvas
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  
  // Draw base image
  maskCtx.drawImage(baseImage, 0, 0);
  
  // Create colored overlay from mask layer
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = maskCanvas.width;
  overlayCanvas.height = maskCanvas.height;
  const overlayCtx = overlayCanvas.getContext('2d');
  
  // Draw mask
  overlayCtx.drawImage(maskLayer, 0, 0);
  
  // Color it red
  overlayCtx.globalCompositeOperation = 'source-in';
  overlayCtx.fillStyle = 'rgba(255, 0, 0, 1)';
  overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  // Draw colored overlay with opacity
  maskCtx.globalAlpha = maskOpacity;
  maskCtx.drawImage(overlayCanvas, 0, 0);
  maskCtx.globalAlpha = 1.0;
}

function clearMask() {
  if (!confirm('Clear all damage marks?')) return;
  
  maskLayerCtx.clearRect(0, 0, maskLayer.width, maskLayer.height);
  redrawMaskCanvas();
}

async function saveMask() {
  if (!maskLayer) return;
  
  try {
    saveMaskBtn.disabled = true;
    saveMaskBtn.innerHTML = '<div class="spinner"></div> Saving...';
    
    // Create export canvas with white mask on black background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = maskLayer.width;
    exportCanvas.height = maskLayer.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Fill with black background
    exportCtx.fillStyle = 'black';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw white mask areas
    exportCtx.drawImage(maskLayer, 0, 0);
    
    // Convert to blob and upload
    exportCanvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('mask', blob, 'damage-mask.png');
      
      const response = await fetch('/api/upload-mask', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        uploadedMaskFilename = data.filename;
        maskZone.classList.add('has-file');
        maskText.innerHTML = `
          <strong>✓ Damage mask created</strong><br>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Mask will be used for inpainting</span>
        `;
        
        closeMaskEditor();
      }
    }, 'image/png');
    
  } catch (error) {
    console.error('Failed to save mask:', error);
    alert('Failed to save damage mask. Please try again.');
  } finally {
    saveMaskBtn.disabled = false;
    saveMaskBtn.innerHTML = '💾 Save Damage Mask';
  }
}

// ============ RESTORATION ============

async function startRestoration() {
  console.log('Start restoration clicked. uploadedFilename:', uploadedFilename);
  
  if (!uploadedFilename) {
    apiWarning.innerHTML = `
      <div class="alert alert-warning">
        <span>⚠️</span>
        <div>
          <strong>No Image Uploaded</strong><br>
          Please upload a comic scan first before starting restoration.
        </div>
      </div>
    `;
    
    setTimeout(() => {
      apiWarning.innerHTML = '';
    }, 3000);
    
    return;
  }
  
  const options = {
    scale: parseInt(scale.value),
    dpi: parseInt(dpi.value),
    matteCompensation: parseInt(matteComp.value),
    bleedIn: parseFloat(bleed.value),
    useFaceRestore: faceRestore.checked,
    extractOCR: extractOCR.checked,
    // Lighting options
    lightingPreset: document.getElementById('lightingPreset').value
  };
  
  const payload = {
    filename: uploadedFilename,
    maskFilename: uploadedMaskFilename,
    options
  };
  
  try {
    restoreBtn.disabled = true;
    restoreBtn.innerHTML = '<div class="spinner"></div> Starting...';
    
    const response = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reset form
      uploadedFilename = null;
      uploadedMaskFilename = null;
      uploadZone.classList.remove('has-file');
      maskZone.classList.remove('has-file');
      uploadText.innerHTML = `
        <strong>Drag & drop comic scan here</strong><br>
        <span style="color: var(--text-muted);">or click to browse (JPG, PNG, TIFF)</span>
      `;
      maskText.innerHTML = `
        <strong>Optional: Damage mask</strong><br>
        <span style="color: var(--text-muted); font-size: 0.85rem;">White = areas to inpaint</span>
      `;
      previewContainer.style.display = 'none';
      imageInput.value = '';
      maskInput.value = '';
      
      // Show success
      apiWarning.innerHTML = `
        <div class="alert alert-success">
          <span>✓</span>
          <div>
            <strong>Restoration Started!</strong><br>
            Job #${data.jobId} is now processing. This may take 2-5 minutes.
          </div>
        </div>
      `;
      
      setTimeout(() => {
        apiWarning.innerHTML = '';
      }, 5000);
      
      // Reload jobs
      await loadJobs();
    }
  } catch (error) {
    console.error('Restoration failed:', error);
    
    apiWarning.innerHTML = `
      <div class="alert alert-error">
        <span>✗</span>
        <div>
          <strong>Restoration Failed</strong><br>
          ${error.message || 'Unknown error occurred. Check console for details.'}
        </div>
      </div>
    `;
    
    setTimeout(() => {
      apiWarning.innerHTML = '';
    }, 5000);
  } finally {
    restoreBtn.innerHTML = '<span>🚀 Start Restoration</span>';
    restoreBtn.disabled = false;
  }
}

// ============ JOBS ============

async function loadJobs() {
  try {
    const response = await fetch('/api/jobs');
    const jobs = await response.json();
    renderJobs(jobs);
  } catch (error) {
    console.error('Failed to load jobs:', error);
  }
}

function renderJobs(jobs) {
  if (jobs.length === 0) {
    jobsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>No jobs yet. Upload a comic scan to get started!</p>
      </div>
    `;
    return;
  }
  
  jobsList.innerHTML = jobs.map(job => createJobCard(job)).join('');
}

function createJobCard(job) {
  const statusClass = `status-${job.status}`;
  const statusIcon = {
    queued: '⏳',
    processing: '⚙️',
    completed: '✅',
    failed: '❌'
  }[job.status] || '❓';
  
  const progressWidth = job.progress || 0;
  
  return `
    <div class="job-card" id="job-${job.id}">
      <div class="job-header">
        <div class="job-title">
          Job #${job.id}: ${job.filename}
        </div>
        <div class="job-status ${statusClass}">
          <span>${statusIcon}</span>
          <span>${job.status.toUpperCase()}</span>
        </div>
      </div>
      
      ${job.status === 'processing' ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressWidth}%"></div>
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">
          ${job.stage || 'Processing'}... ${progressWidth}%
        </div>
      ` : ''}
      
      ${job.status === 'failed' ? `
        <div style="color: var(--danger); margin-top: 10px; font-size: 0.9rem;">
          <strong>Error: ${job.error}</strong>
          ${job.errorDetail ? `<br><span style="color: var(--warning); font-size: 0.85rem;">${job.errorDetail}</span>` : ''}
        </div>
      ` : ''}
      
      <div class="job-details">
        <div>
          ${job.options ? `
            <span class="badge">${job.options.scale}x upscale</span>
            <span class="badge">${job.options.dpi} DPI</span>
          ` : ''}
        </div>
        <div class="job-actions">
          ${job.status === 'completed' ? `
            <button class="btn btn-small btn-success" onclick="downloadJob(${job.id}, '${job.outputFilename}')">
              📥 Download Image
            </button>
          ` : ''}
          <button class="btn btn-small btn-danger" onclick="deleteJob(${job.id})">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

function updateJobCard(jobId, job) {
  const card = document.getElementById(`job-${jobId}`);
  if (!card) {
    // Job card doesn't exist yet, reload all jobs
    loadJobs();
    return;
  }
  
  // Replace card content
  const newCard = createJobCard(job);
  card.outerHTML = newCard;
}

async function deleteJob(jobId) {
  if (!confirm('Delete this job?')) return;
  
  try {
    await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    await loadJobs();
  } catch (error) {
    console.error('Failed to delete job:', error);
  }
}

function downloadJob(jobId, filename) {
  window.location.href = `/api/download/${filename}`;
}

// ============ UTILITIES ============

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============ START ============

init();
