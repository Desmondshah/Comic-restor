/**
 * Comic Restoration Pipeline - Web UI JavaScript
 */

// ============ UTILITY FUNCTIONS ============

// Debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/touch events
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Detect iOS device
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detect if device has limited resources
function isLowEndDevice() {
  return navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
}

// State
let uploadedFiles = []; // Array to store multiple files with their metadata
let uploadedFilenames = []; // Array of filenames uploaded to server
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

// Preset State
let customPresets = {};
let currentPresetId = null;

// Comparison View State
let comparisonMode = 'split'; // 'split' or 'side-by-side'
let zoomLevel = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

// Real-time Preview State
let previewDebounceTimer = null;
let isPreviewEnabled = false;
let originalImageData = null;
let restoredImageData = null;

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const maskZone = document.getElementById('maskZone');
const maskInput = document.getElementById('maskInput');
const uploadText = document.getElementById('uploadText');
const maskText = document.getElementById('maskText');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const batchPreviewContainer = document.getElementById('batchPreviewContainer');
const batchPreviewGrid = document.getElementById('batchPreviewGrid');
const imageCount = document.getElementById('imageCount');
const addMoreBtn = document.getElementById('addMoreBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const restoreBtn = document.getElementById('restoreBtn');
const jobsList = document.getElementById('jobsList');
const apiWarning = document.getElementById('apiWarning');
const exportPDF = document.getElementById('exportPDF');

// Track whether next file selection should append or replace existing uploads
let nextUploadMode = 'replace';
let lastButtonClick = 0; // Timestamp of last button click

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
  loadCustomPresets();
  initializeDefaultPresets();
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
  const openFilePicker = (mode = 'replace') => {
    nextUploadMode = mode;
    imageInput.click();
  };

  // Image upload - click on main upload zone (replace mode)
  uploadZone.addEventListener('click', (event) => {
    // Ignore clicks within 500ms of button clicks
    const timeSinceButtonClick = Date.now() - lastButtonClick;
    if (timeSinceButtonClick < 500) {
      return;
    }
    
    // Don't trigger if clicking on buttons or interactive elements
    if (event.target.closest('button') || event.target.closest('.batch-preview-container')) {
      return;
    }
    openFilePicker('replace');
  });

  imageInput.addEventListener('change', () => {
    const appendMode = nextUploadMode === 'append';
    handleImageUpload(appendMode);
    nextUploadMode = 'replace';
  });

  // Add more button - sets append mode for next selection
  if (addMoreBtn) {
    addMoreBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      lastButtonClick = Date.now();
      openFilePicker('append');
    });
  }

  // Clear all button - clears batch and resets mode
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      lastButtonClick = Date.now();
      nextUploadMode = 'replace';
      clearAllBatchItems();
    });
  }
  
  // Image upload - drag & drop (optimized for mobile)
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  }, { passive: false });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  }, { passive: true });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imageInput.files = files;
      handleImageUpload(false);
    }
  }, { passive: false });

  
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

  // AI Restoration controls
  const enableAIRestore = document.getElementById('enableAIRestore');
  const aiRestoreOptions = document.getElementById('aiRestoreOptions');
  const aiStrength = document.getElementById('aiStrength');
  const aiStrengthValue = document.getElementById('aiStrengthValue');
  
  if (enableAIRestore) {
    enableAIRestore.addEventListener('change', (e) => {
      if (aiRestoreOptions) {
        aiRestoreOptions.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }
  
  if (aiStrength && aiStrengthValue) {
    aiStrength.addEventListener('input', (e) => {
      const value = (parseInt(e.target.value) / 100).toFixed(2);
      aiStrengthValue.textContent = value;
    });
  }

  // Preset controls
  const presetSelector = document.getElementById('presetSelector');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const deletePresetBtn = document.getElementById('deletePresetBtn');
  
  if (presetSelector) presetSelector.addEventListener('change', onPresetChange);
  if (savePresetBtn) savePresetBtn.addEventListener('click', openSavePresetModal);
  if (deletePresetBtn) deletePresetBtn.addEventListener('click', deletePreset);
  
  // Settings change listeners for real-time preview
  const settingsInputs = [
    'scale', 'dpi', 'lightingPreset', 'matteComp', 'bleed', 'faceRestore', 'extractOCR'
  ];
  
  settingsInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        // Mark as custom settings when changed
        if (currentPresetId) {
          document.getElementById('presetSelector').value = '';
          currentPresetId = null;
        }
        
        // Schedule preview update
        if (isPreviewEnabled && uploadedFilename) {
          schedulePreviewUpdate();
        }
      });
    }
  });
  
  // Comparison view controls
  const closeComparisonBtn = document.getElementById('closeComparisonBtn');
  if (closeComparisonBtn) closeComparisonBtn.addEventListener('click', closeComparison);
  
  // Comparison slider
  const comparisonSlider = document.getElementById('comparisonSlider');
  if (comparisonSlider) {
    comparisonSlider.addEventListener('input', updateSplitView);
  }
  
  // Add direct drag to entire comparison container for easier interaction
  const comparisonImages = document.querySelector('.comparison-images');
  const sliderHandle = document.getElementById('sliderButton');
  
  if (comparisonImages && sliderHandle) {
    let isDragging = false;
    let dragOffset = 0;
    let animationFrameId = null;
    
    const updatePosition = (e, useOffset = false) => {
      const container = document.querySelector('.comparison-images');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      let x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      
      // Apply offset if dragging from handle
      if (useOffset) {
        x -= dragOffset;
      }
      
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Use requestAnimationFrame for smooth 60fps updates
      animationFrameId = requestAnimationFrame(() => {
        const slider = document.getElementById('comparisonSlider');
        if (slider) {
          slider.value = percentage;
          updateSplitView();
        }
      });
    };
    
    const startDragHandle = (e) => {
      isDragging = true;
      
      // Calculate offset from center of handle
      const handleRect = sliderHandle.getBoundingClientRect();
      const handleCenterX = handleRect.left + handleRect.width / 2;
      const mouseX = e.clientX || e.touches?.[0]?.clientX;
      dragOffset = mouseX - handleCenterX;
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    const startDragImage = (e) => {
      isDragging = true;
      dragOffset = 0;
      updatePosition(e, false); // Immediately snap to click position
      e.preventDefault();
    };
    
    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updatePosition(e, true); // Use offset during drag
    };
    
    const stopDrag = () => {
      isDragging = false;
      dragOffset = 0;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    
    // Handle-specific events (dragging from handle keeps offset)
    sliderHandle.addEventListener('mousedown', startDragHandle);
    sliderHandle.addEventListener('touchstart', startDragHandle);
    
    // Image click events (clicking image snaps to position)
    comparisonImages.addEventListener('mousedown', startDragImage);
    comparisonImages.addEventListener('touchstart', startDragImage);
    
    // Global drag and stop events
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }
  
  console.log('Event listeners initialized');
}

// ============ FILE UPLOAD ============

// Compress image for mobile devices to improve performance
async function compressImageForMobile(file) {
  // Only compress on iOS or low-end devices
  if (!isIOS() && !isLowEndDevice()) {
    return file;
  }

  // Skip if file is already small (< 5MB)
  if (file.size < 5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 2048px on longest side for mobile)
        const maxDimension = 2048;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use better quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality 0.9
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(compressedFile);
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(appendMode = false) {
  const files = Array.from(imageInput.files);
  if (!files.length) return;
  
  console.log(`Uploading ${files.length} file(s), append mode: ${appendMode}`);
  console.log(`Current batch: ${uploadedFiles.length} files`);
  
  // If not in append mode, clear existing files
  if (!appendMode) {
    uploadedFiles = [];
    uploadedFilenames = [];
    batchPreviewGrid.innerHTML = '';
  }
  
  try {
    uploadText.innerHTML = '<div class="spinner"></div> Uploading...';
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      
      // Update progress
      uploadText.innerHTML = `<div class="spinner"></div> Uploading ${i + 1}/${files.length}: ${file.name}`;
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tiff|tif)$/i)) {
        console.warn(`Skipping invalid file type: ${file.name} (${file.type})`);
        continue;
      }
      
      // Compress image on mobile devices
      file = await compressImageForMobile(file);
      
      // Use FormData for faster upload (no base64 conversion)
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData // Don't set Content-Type header - browser will set it with boundary
      });
      
      const data = await response.json();
      console.log(`Upload response for ${file.name}:`, data);
      
      if (data.success) {
        // Store file info
        uploadedFiles.push({
          file: file,
          filename: data.filename,
          storageId: data.storageId,
          originalName: data.originalName || file.name,
          size: file.size
        });
        uploadedFilenames.push(data.filename);
        
        // Add to preview grid
        addBatchPreviewItem(data.filename, data.originalName || file.name, uploadedFiles.length);
      }
    }
    
    // Update UI
    if (uploadedFiles.length > 0) {
      uploadZone.classList.add('has-file');
      uploadText.innerHTML = `
        <strong>✓ ${uploadedFiles.length} file(s) uploaded</strong><br>
        <span style="color: var(--text-muted);">Click to add more files</span>
      `;
      
      // Show batch preview container
      batchPreviewContainer.style.display = 'block';
      imageCount.textContent = uploadedFiles.length;
      
      // Hide single preview
      previewContainer.style.display = 'none';
      
      // Enable restore button
      restoreBtn.disabled = false;
      restoreBtn.innerHTML = uploadedFiles.length > 1 
        ? `<span>🚀 Restore ${uploadedFiles.length} Images</span>`
        : `<span>🚀 Start Restoration</span>`;
      
      console.log(`✓ Upload complete! Total files: ${uploadedFiles.length}`);
    }
    
    // Reset input to allow re-selecting the same files
    imageInput.value = '';
  } catch (error) {
    console.error('Upload failed:', error);
    uploadText.innerHTML = `
      <strong style="color: var(--danger);">✗ Upload failed</strong><br>
      <span style="color: var(--text-muted);">Click to try again</span>
    `;
    // Reset input on error too
    imageInput.value = '';
  }
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function addBatchPreviewItem(filename, originalName, pageNumber) {
  const item = document.createElement('div');
  item.className = 'batch-preview-item';
  item.dataset.filename = filename;
  
  const img = document.createElement('img');
  img.src = `/api/preview/${filename}`;
  img.alt = originalName;
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '×';
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    removeBatchItem(filename);
  };
  
  const pageNum = document.createElement('div');
  pageNum.className = 'page-number';
  pageNum.textContent = `#${pageNumber}`;
  
  item.appendChild(img);
  item.appendChild(removeBtn);
  item.appendChild(pageNum);
  
  batchPreviewGrid.appendChild(item);
}

function removeBatchItem(filename) {
  // Remove from arrays
  const index = uploadedFilenames.indexOf(filename);
  if (index > -1) {
    uploadedFilenames.splice(index, 1);
    uploadedFiles.splice(index, 1);
  }
  
  // Remove from DOM
  const item = batchPreviewGrid.querySelector(`[data-filename="${filename}"]`);
  if (item) {
    item.remove();
  }
  
  // Update UI
  imageCount.textContent = uploadedFiles.length;
  
  if (uploadedFiles.length === 0) {
    batchPreviewContainer.style.display = 'none';
    uploadZone.classList.remove('has-file');
    uploadText.innerHTML = `
      <strong>Drag & drop comic scans here</strong><br>
      <span style="color: var(--text-muted);">or click to browse • Multiple files supported (JPG, PNG, TIFF)</span>
    `;
    restoreBtn.disabled = true;
    restoreBtn.innerHTML = '<span>🚀 Start Restoration</span>';
  } else {
    // Renumber remaining items
    const items = batchPreviewGrid.querySelectorAll('.batch-preview-item');
    items.forEach((item, index) => {
      const pageNum = item.querySelector('.page-number');
      if (pageNum) {
        pageNum.textContent = `#${index + 1}`;
      }
    });
    
    restoreBtn.innerHTML = uploadedFiles.length > 1 
      ? `<span>🚀 Restore ${uploadedFiles.length} Images</span>`
      : `<span>🚀 Start Restoration</span>`;
  }
}

function clearAllBatchItems() {
  uploadedFiles = [];
  uploadedFilenames = [];
  batchPreviewGrid.innerHTML = '';
  batchPreviewContainer.style.display = 'none';
  uploadZone.classList.remove('has-file');
  uploadText.innerHTML = `
    <strong>Drag & drop comic scans here</strong><br>
    <span style="color: var(--text-muted);">or click to browse • Multiple files supported (JPG, PNG, TIFF)</span>
  `;
  restoreBtn.disabled = true;
  restoreBtn.innerHTML = '<span>🚀 Start Restoration</span>';
  imageInput.value = '';
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
  if (!uploadedFilenames.length) {
    alert('Please upload an image first before creating a damage mask.');
    return;
  }
  
  maskEditorActive = true;
  maskEditorContainer.classList.add('active');
  previewContainer.style.display = 'none';
  batchPreviewContainer.style.display = 'none';
  
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
  // Use first uploaded file for mask editor
  baseImage.src = `/api/preview/${uploadedFilenames[0]}`;
}

function closeMaskEditor() {
  maskEditorActive = false;
  maskEditorContainer.classList.remove('active');
  
  // Show appropriate preview
  if (uploadedFilenames.length > 1) {
    batchPreviewContainer.style.display = 'block';
  } else {
    previewContainer.style.display = 'block';
  }
  
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
  
  // Optimized touch support for iOS and tablets
  maskCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    maskCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });
  
  // Throttle touch move for better performance on mobile
  const throttledTouchMove = throttle((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    maskCanvas.dispatchEvent(mouseEvent);
  }, 16); // ~60fps
  
  maskCanvas.addEventListener('touchmove', throttledTouchMove, { passive: false });
  
  maskCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    maskCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });
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

// ============ PRESET MANAGEMENT ============

function loadCustomPresets() {
  try {
    const saved = localStorage.getItem('comicRestorationPresets');
    if (saved) {
      customPresets = JSON.parse(saved);
      updatePresetSelector();
    }
  } catch (error) {
    console.error('Failed to load presets:', error);
  }
}

function saveCustomPresets() {
  try {
    localStorage.setItem('comicRestorationPresets', JSON.stringify(customPresets));
  } catch (error) {
    console.error('Failed to save presets:', error);
  }
}

function initializeDefaultPresets() {
  const defaultPresets = {
    'golden-age': {
      name: '📚 Golden Age (1938-1956)',
      description: 'Optimized for older comics with yellowed paper and faded colors',
      era: 'golden-age',
      settings: {
        scale: 4,
        dpi: 600,
        lightingPreset: 'vintage-enhanced',
        matteComp: 10,
        bleed: 0.125,
        faceRestore: false,
        extractOCR: false
      },
      isDefault: true
    },
    'silver-age': {
      name: '✨ Silver Age (1956-1970)',
      description: 'Balanced restoration for classic comics',
      era: 'silver-age',
      settings: {
        scale: 2,
        dpi: 300,
        lightingPreset: 'modern-reprint',
        matteComp: 7,
        bleed: 0.125,
        faceRestore: false,
        extractOCR: false
      },
      isDefault: true
    },
    'bronze-age': {
      name: '🥉 Bronze Age (1970-1985)',
      description: 'Modern look with subtle enhancements',
      era: 'bronze-age',
      settings: {
        scale: 2,
        dpi: 300,
        lightingPreset: 'subtle',
        matteComp: 5,
        bleed: 0.125,
        faceRestore: true,
        extractOCR: false
      },
      isDefault: true
    },
    'modern-age': {
      name: '🆕 Modern Age (1985+)',
      description: 'High quality scan with minimal processing',
      era: 'modern-age',
      settings: {
        scale: 2,
        dpi: 300,
        lightingPreset: 'dramatic',
        matteComp: 3,
        bleed: 0.125,
        faceRestore: true,
        extractOCR: true
      },
      isDefault: true
    }
  };

  // Merge with custom presets (don't overwrite custom ones)
  Object.keys(defaultPresets).forEach(key => {
    if (!customPresets[key] || customPresets[key].isDefault) {
      customPresets[key] = defaultPresets[key];
    }
  });

  updatePresetSelector();
}

function updatePresetSelector() {
  const selector = document.getElementById('presetSelector');
  if (!selector) return;

  const currentValue = selector.value;
  
  // Clear existing options except "Custom Settings"
  selector.innerHTML = '<option value="">Custom Settings</option>';
  
  // Add presets
  Object.entries(customPresets).forEach(([id, preset]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = preset.name;
    selector.appendChild(option);
  });
  
  // Restore selection
  selector.value = currentValue;
}

function getCurrentSettings() {
  return {
    scale: parseInt(document.getElementById('scale').value),
    dpi: parseInt(document.getElementById('dpi').value),
    lightingPreset: document.getElementById('lightingPreset').value,
    matteComp: parseInt(document.getElementById('matteComp').value),
    bleed: parseFloat(document.getElementById('bleed').value),
    faceRestore: document.getElementById('faceRestore').checked,
    extractOCR: document.getElementById('extractOCR').checked
  };
}

function applySettings(settings) {
  document.getElementById('scale').value = settings.scale || 2;
  document.getElementById('dpi').value = settings.dpi || 300;
  document.getElementById('lightingPreset').value = settings.lightingPreset || 'modern-reprint';
  document.getElementById('matteComp').value = settings.matteComp || 5;
  document.getElementById('bleed').value = settings.bleed || 0.125;
  document.getElementById('faceRestore').checked = settings.faceRestore || false;
  document.getElementById('extractOCR').checked = settings.extractOCR || false;
  
  // Trigger preview update if enabled
  if (isPreviewEnabled && uploadedFilename) {
    schedulePreviewUpdate();
  }
}

function openSavePresetModal() {
  const modal = document.getElementById('savePresetModal');
  modal.classList.add('active');
  
  // Clear inputs
  document.getElementById('presetName').value = '';
  document.getElementById('presetDescription').value = '';
  document.getElementById('presetEra').value = '';
}

function closeSavePresetModal() {
  const modal = document.getElementById('savePresetModal');
  modal.classList.remove('active');
}

function confirmSavePreset() {
  const name = document.getElementById('presetName').value.trim();
  const description = document.getElementById('presetDescription').value.trim();
  const era = document.getElementById('presetEra').value;
  
  if (!name) {
    alert('Please enter a preset name.');
    return;
  }
  
  // Generate ID from name
  const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Check if preset already exists
  if (customPresets[id] && customPresets[id].isDefault) {
    alert('Cannot overwrite default preset. Please choose a different name.');
    return;
  }
  
  // Save preset
  customPresets[id] = {
    name: name,
    description: description,
    era: era,
    settings: getCurrentSettings(),
    isDefault: false
  };
  
  saveCustomPresets();
  updatePresetSelector();
  
  // Select the new preset
  document.getElementById('presetSelector').value = id;
  currentPresetId = id;
  
  closeSavePresetModal();
  
  // Show success message
  showNotification('✅ Preset saved successfully!', 'success');
}

function deletePreset() {
  const selector = document.getElementById('presetSelector');
  const selectedId = selector.value;
  
  if (!selectedId) {
    alert('Please select a preset to delete.');
    return;
  }
  
  const preset = customPresets[selectedId];
  
  if (preset.isDefault) {
    alert('Cannot delete default presets.');
    return;
  }
  
  if (!confirm(`Delete preset "${preset.name}"?`)) {
    return;
  }
  
  delete customPresets[selectedId];
  saveCustomPresets();
  updatePresetSelector();
  
  // Reset to custom settings
  selector.value = '';
  currentPresetId = null;
  
  showNotification('🗑️ Preset deleted', 'success');
}

function onPresetChange() {
  const selector = document.getElementById('presetSelector');
  const selectedId = selector.value;
  
  if (!selectedId) {
    currentPresetId = null;
    return;
  }
  
  const preset = customPresets[selectedId];
  if (preset) {
    currentPresetId = selectedId;
    applySettings(preset.settings);
    
    // Show notification
    const desc = preset.description ? `\n${preset.description}` : '';
    showNotification(`📋 Applied: ${preset.name}${desc}`, 'success');
  }
}

function showNotification(message, type = 'success') {
  const alertClass = type === 'success' ? 'alert-success' : 'alert-warning';
  apiWarning.innerHTML = `
    <div class="alert ${alertClass}">
      <div>${message}</div>
    </div>
  `;
  
  setTimeout(() => {
    apiWarning.innerHTML = '';
  }, 3000);
}

// ============ RESTORATION ============

async function startRestoration() {
  console.log('Start restoration clicked. Files:', uploadedFilenames.length);
  
  if (!uploadedFilenames.length) {
    apiWarning.innerHTML = `
      <div class="alert alert-warning">
        <span>⚠️</span>
        <div>
          <strong>No Images Uploaded</strong><br>
          Please upload comic scan(s) first before starting restoration.
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
    exportPDF: exportPDF.checked,
    // Lighting options
    lightingPreset: document.getElementById('lightingPreset').value,
    // AI Damage Restoration options
    enableAIRestore: document.getElementById('enableAIRestore')?.checked || false,
    aiPreserveLogo: document.getElementById('aiPreserveLogo')?.checked || true,
    aiPreserveSignature: document.getElementById('aiPreserveSignature')?.checked || true,
    aiModernStyle: document.getElementById('aiModernStyle')?.checked || true,
    aiStrength: parseInt(document.getElementById('aiStrength')?.value || 80) / 100
  };
  
  // Determine if batch or single restoration
  const isBatch = uploadedFilenames.length > 1;
  
  const payload = {
    filenames: uploadedFilenames, // Send array of filenames
    maskFilename: uploadedMaskFilename,
    options
  };
  
  try {
    restoreBtn.disabled = true;
    restoreBtn.innerHTML = '<div class="spinner"></div> Starting...';
    
    // Use batch endpoint if multiple files
    const endpoint = isBatch ? '/api/restore-batch' : '/api/restore';
    const requestPayload = isBatch ? payload : {
      filename: uploadedFilenames[0],
      maskFilename: uploadedMaskFilename,
      options
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reset form
      clearAllBatchItems();
      uploadedMaskFilename = null;
      maskZone.classList.remove('has-file');
      maskText.innerHTML = `
        <strong>Damage Mask</strong> <span style="color: var(--danger); font-weight: normal;">(Currently Unavailable)</span><br>
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          Inpainting models on Replicate are currently unavailable. Use external tools (Photoshop, GIMP) for damage removal.
        </span>
      `;
      maskInput.value = '';
      
      // Show success
      const jobMessage = isBatch 
        ? `Batch job #${data.jobId} is processing ${uploadedFilenames.length} images.${options.exportPDF ? ' PDF will be generated.' : ''}`
        : `Job #${data.jobId} is now processing.`;
      
      apiWarning.innerHTML = `
        <div class="alert alert-success">
          <span>✓</span>
          <div>
            <strong>Restoration Started!</strong><br>
            ${jobMessage} This may take ${isBatch ? '5-15' : '2-5'} minutes.
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
  const isBatch = job.isBatch || false;
  const jobTitle = isBatch 
    ? `Batch Job #${job.id}: ${job.fileCount} images`
    : `Job #${job.id}: ${job.filename}`;
  
  return `
    <div class="job-card" id="job-${job.id}">
      <div class="job-header">
        <div class="job-title">
          ${isBatch ? '📚 ' : ''}${jobTitle}
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
          ${isBatch && job.processedCount !== undefined ? ` (${job.processedCount}/${job.fileCount} completed)` : ''}
        </div>
      ` : ''}
      
      ${job.status === 'completed' && isBatch ? `
        <div style="color: var(--success); margin-top: 10px; font-size: 0.9rem;">
          <strong>✓ ${job.successCount || job.fileCount} images restored successfully</strong>
          ${job.failedCount > 0 ? `<br><span style="color: var(--warning);">${job.failedCount} failed</span>` : ''}
          ${job.failedFiles && job.failedFiles.length > 0 ? `
            <details style="margin-top: 8px;">
              <summary style="cursor: pointer; color: var(--warning);">Show failed files</summary>
              <ul style="margin: 5px 0 0 20px; font-size: 0.85rem;">
                ${job.failedFiles.map(f => `<li>${f.filename}: ${f.error}</li>`).join('')}
              </ul>
            </details>
          ` : ''}
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
            ${isBatch && job.options.exportPDF ? '<span class="badge">📄 PDF</span>' : ''}
          ` : ''}
        </div>
        <div class="job-actions">
          ${job.status === 'completed' && !isBatch ? `
            <button class="btn btn-small" onclick="viewComparison('${job.filename}', '${job.outputFilename}')" title="Compare before/after">
              🔄 Compare
            </button>
            <button class="btn btn-small btn-success" onclick="downloadJob(${job.id}, '${job.outputFilename}')">
              📥 Download
            </button>
          ` : ''}
          ${job.status === 'completed' && isBatch && job.outputFilename ? `
            <button class="btn btn-small btn-success" onclick="downloadJob(${job.id}, '${job.outputFilename}')">
              📥 Download PDF
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

function viewComparison(originalFilename, restoredFilename) {
  const originalUrl = `/api/preview/${originalFilename}`;
  const restoredUrl = `/api/download/${restoredFilename}`;
  
  showComparison(originalUrl, restoredUrl);
  
  // Scroll to comparison
  document.getElementById('comparisonContainer').scrollIntoView({ behavior: 'smooth' });
}

// ============ UTILITIES ============

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============ COMPARISON VIEW ============

function showComparison(originalUrl, restoredUrl) {
  const comparisonContainer = document.getElementById('comparisonContainer');
  
  // Store image data
  originalImageData = originalUrl;
  restoredImageData = restoredUrl;
  
  // Load before image first to get dimensions
  const beforeImgSplit = document.getElementById('beforeImageSplit');
  const afterImgSplit = document.getElementById('afterImageSplit');
  
  afterImgSplit.onload = () => {
    const slider = document.getElementById('comparisonSlider');
    if (slider) {
      slider.value = 50;
    }
    updateSplitView();
  };
  
  // Load images for split view
  beforeImgSplit.src = originalUrl;
  afterImgSplit.src = restoredUrl;
  
  // Reset slider position immediately for instant feedback
  const slider = document.getElementById('comparisonSlider');
  if (slider) {
    slider.value = 50;
  }
  updateSplitView();
  
  // Show container
  comparisonContainer.style.display = 'block';
}

function closeComparison() {
  const comparisonContainer = document.getElementById('comparisonContainer');
  comparisonContainer.style.display = 'none';
  
  // Reset state
  originalImageData = null;
  restoredImageData = null;
}

function updateSplitView() {
  const slider = document.getElementById('comparisonSlider');
  const afterWrapper = document.querySelector('.after-image-wrapper');
  const sliderButton = document.getElementById('sliderButton');

  if (!slider || !afterWrapper || !sliderButton) {
    return;
  }

  const value = parseFloat(slider.value);
  if (Number.isNaN(value)) {
    return;
  }

  const clamped = Math.max(0, Math.min(100, value));
  afterWrapper.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
  sliderButton.style.left = clamped + '%';
  sliderButton.style.top = '0';
}

// ============ REAL-TIME PREVIEW ============

function schedulePreviewUpdate() {
  // Clear existing timer
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer);
  }
  
  // Schedule new preview update
  previewDebounceTimer = setTimeout(() => {
    updatePreview();
  }, 1000); // 1 second debounce
}

async function updatePreview() {
  if (!uploadedFilename) return;
  
  try {
    // Show loading indicator
    const previewImg = document.getElementById('previewImage');
    previewImg.style.opacity = '0.5';
    
    // Get current settings
    const settings = getCurrentSettings();
    
    // Request preview from server
    const response = await fetch('/api/preview-with-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: uploadedFilename,
        settings: settings
      })
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);
      
      // Update preview image
      previewImg.src = previewUrl;
      previewImg.style.opacity = '1';
      
      // Update comparison if active
      if (originalImageData && restoredImageData) {
        showComparison(originalImageData, previewUrl);
      }
    }
  } catch (error) {
    console.error('Preview update failed:', error);
    // Silently fail - don't interrupt user workflow
  }
}

function enableRealTimePreview() {
  isPreviewEnabled = true;
  if (uploadedFilename) {
    schedulePreviewUpdate();
  }
}

function disableRealTimePreview() {
  isPreviewEnabled = false;
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer);
  }
}

// ============ START ============

init();

// ============ TESLA-INSPIRED UI ENHANCEMENTS ============

// Smooth scroll reveal animations
function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.card, .job-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(el);
  });
}

// Enhanced button feedback
function enhanceButtons() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', function(e) {
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.6)';
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.pointerEvents = 'none';
      
      const rect = this.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left - 10) + 'px';
      ripple.style.top = (e.clientY - rect.top - 10) + 'px';
      
      ripple.style.animation = 'ripple 0.6s ease-out';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Particle effect for background
function createParticles() {
  const particleCount = 30;
  const container = document.body;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = Math.random() * 3 + 1 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = 'rgba(234, 179, 8, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '0';
    particle.style.filter = 'blur(1px)';
    particle.style.animation = `float ${10 + Math.random() * 20}s ease-in-out infinite`;
    particle.style.animationDelay = Math.random() * 5 + 's';
    
    container.appendChild(particle);
  }
}

// Smooth mouse tracking for interactive elements
function addMouseTracking() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
}

// Enhanced upload zone feedback
function enhanceUploadZones() {
  [uploadZone, maskZone].forEach(zone => {
    if (!zone) return;
    
    zone.addEventListener('dragenter', function(e) {
      this.style.transform = 'scale(1.02)';
    });
    
    zone.addEventListener('dragleave', function(e) {
      if (e.target === this) {
        this.style.transform = '';
      }
    });
    
    zone.addEventListener('drop', function(e) {
      this.style.transform = '';
      // Add success animation
      this.style.animation = 'none';
      setTimeout(() => {
        this.style.animation = 'successPulse 0.6s ease-out';
      }, 10);
    });
  });
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes successPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-20px) translateX(10px);
    }
    50% {
      transform: translateY(-10px) translateX(-10px);
    }
    75% {
      transform: translateY(-30px) translateX(5px);
    }
  }
`;
document.head.appendChild(style);

// Initialize enhancements
setTimeout(() => {
  observeElements();
  enhanceButtons();
  createParticles();
  addMouseTracking();
  enhanceUploadZones();
}, 100);

// Add loading progress indicator
function showLoadingProgress(message = 'Processing...') {
  const existing = document.getElementById('loadingOverlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  `;
  
  overlay.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="width: 60px; height: 60px; margin: 0 auto 20px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #eab308; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div style="font-size: 1.2rem; font-weight: 600; letter-spacing: 0.02em;">${message}</div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  return overlay;
}

function hideLoadingProgress() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  }
}

// Add fade animations to style
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(fadeStyle);
