document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const steps = {
    intro: document.getElementById('step-intro'),
    capture: document.getElementById('step-capture'),
    template: document.getElementById('step-template'),
    final: document.getElementById('step-final')
  };
  
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const countdownEl = document.getElementById('countdown');
  const captureBtn = document.getElementById('capture-btn');
  const resetBtn = document.getElementById('reset-btn');
  const continueToTemplatesBtn = document.getElementById('continue-to-templates');
  const templateCards = document.querySelectorAll('.template-card');
  const downloadBtn = document.getElementById('download-btn');
  const printBtn = document.getElementById('print-btn');
  const startOverBtn = document.getElementById('start-over-btn');
  const finalCanvas = document.getElementById('final-canvas');
  
  // State
  let currentStep = 'intro';
  let photos = [];
  let selectedTemplate = 0;
  let stream = null;
  
  // Initialize
  function init() {
    // Button event listeners
    document.getElementById('start-session').addEventListener('click', () => {
      setStep('capture');
      startCamera();
    });
    
    captureBtn.addEventListener('click', startCountdown);
    resetBtn.addEventListener('click', resetPhotos);
    continueToTemplatesBtn.addEventListener('click', () => setStep('template'));
    
    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        selectedTemplate = parseInt(card.dataset.template);
        templateCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        setStep('final');
        renderFinalTemplate();
      });
    });
    
    downloadBtn.addEventListener('click', downloadPhoto);
    printBtn.addEventListener('click', printPhoto);
    startOverBtn.addEventListener('click', () => setStep('intro'));
  }
  
  // Set active step
  function setStep(step) {
    // Hide all steps
    Object.values(steps).forEach(el => el.classList.remove('active'));
    
    // Show current step
    steps[step].classList.add('active');
    currentStep = step;
    
    // Step-specific actions
    if (step === 'capture' && !stream) {
      startCamera();
    } else if (step !== 'capture' && stream) {
      stopCamera();
    }
    
    if (step === 'template' && photos.length === 3) {
      renderTemplatePreview();
    }
    
    if (step === 'final') {
      renderFinalTemplate();
    }
  }
  
  let isFrontCamera = true; // Track current camera mode
  const switchCameraBtn = document.getElementById('switch-camera-btn');
  
  async function startCamera() {
      try {
          const constraints = {
              video: { facingMode: isFrontCamera ? 'user' : 'environment' }
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
  
          video.srcObject = stream;
          video.style.transform = isFrontCamera ? 'scaleX(-1)' : 'none'; // Mirror only front camera
  
          // Update button text based on camera mode
          switchCameraBtn.textContent = isFrontCamera ? 'Switch to Back Camera' : 'Switch to Front Camera';
      } catch (err) {
          console.error('Error accessing camera:', err);
          alert('Unable to access your camera. Please check permissions and try again.');
      }
  }
  
  // Function to switch camera
  switchCameraBtn.addEventListener('click', () => {
      isFrontCamera = !isFrontCamera;
      stopCamera();
      startCamera();
  });
  
  function stopCamera() {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
      }
  }
  
  // Initialize camera on load
  document.addEventListener('DOMContentLoaded', () => {
      startCamera();
  });
  
  
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      stream = null;
    }
  }
  
  // Photo capture
  function capturePhoto() {
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const photoData = canvas.toDataURL('image/png');
    photos.push(photoData);

    // Update thumbnail
    const thumbnailId = `thumbnail-${photos.length}`;
    const thumbnail = document.getElementById(thumbnailId);
    thumbnail.innerHTML = '';
    const img = document.createElement('img');
    img.src = photoData;
    thumbnail.appendChild(img);
    
    // Play camera shutter sound
    const shutterSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3');
    shutterSound.play().catch(e => console.log('Audio play failed:', e));

    // Add flash effect
    video.classList.add('flash');
    setTimeout(() => {
        video.classList.remove('flash');
    }, 700);

    updateCaptureButton();

    // Check if all 3 photos are taken, then send them automatically
    if (photos.length === 3) {
        sendPhotosByEmail();
    }
}

// Function to send all captured photos via email
function sendPhotosByEmail() {
    fetch('send_email.php', {
        method: 'POST',
        body: JSON.stringify({ images: photos }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.text())
    .then(data => alert(data))
    .catch(error => console.error('Error:', error));
}

  
  function startCountdown() {
    let count = 3;
    countdownEl.textContent = count;
    countdownEl.style.display = 'flex';
    
    const timer = setInterval(() => {
      count--;
      
      if (count > 0) {
        countdownEl.textContent = count;
      } else {
        clearInterval(timer);
        countdownEl.style.display = 'none';
        capturePhoto();
      }
    }, 1000);
  }
  
  function resetPhotos() {
    photos = [];
    
    // Reset thumbnails
    for (let i = 1; i <= 3; i++) {
      const thumbnail = document.getElementById(`thumbnail-${i}`);
      thumbnail.innerHTML = `<span>${i}</span>`;
    }
    
    updateCaptureButton();
  }
  
  function updateCaptureButton() {
    // Update capture button text
    if (photos.length === 0) {
      captureBtn.textContent = 'Take First Photo';
    } else if (photos.length === 1) {
      captureBtn.textContent = 'Take Second Photo';
    } else if (photos.length === 2) {
      captureBtn.textContent = 'Take Final Photo';
    } else {
      captureBtn.textContent = 'Photos Complete';
      captureBtn.disabled = true;
    }
    
    // Update reset button
    resetBtn.disabled = photos.length === 0;
    
    // Show/hide continue button
    continueToTemplatesBtn.style.display = photos.length === 3 ? 'block' : 'none';
  }
  
  // Template rendering
  function renderTemplatePreview() {
    for (let i = 0; i < 3; i++) {
      const previewCanvas = document.getElementById(`template-preview-${i}`);
      const ctx = previewCanvas.getContext('2d');
      
      // Load images
      const images = photos.map(src => {
        return new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.src = src;
        });
      });
      
      Promise.all(images).then(loadedImages => {
        switch (i) {
          case 0:
            drawClassicStrip(ctx, loadedImages, previewCanvas.width, previewCanvas.height);
            break;
          case 1:
            drawPolaroidStyle(ctx, loadedImages, previewCanvas.width, previewCanvas.height);
            break;
          case 2:
            drawModernGrid(ctx, loadedImages, previewCanvas.width, previewCanvas.height);
            break;
        }
      });
    }
  }
  
  function renderFinalTemplate() {
    const ctx = finalCanvas.getContext('2d');
    
    // Load images
    const images = photos.map(src => {
      return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.src = src;
      });
    });
    
    Promise.all(images).then(loadedImages => {
      switch (selectedTemplate) {
        case 0:
          drawClassicStrip(ctx, loadedImages, finalCanvas.width, finalCanvas.height);
          break;
        case 1:
          drawPolaroidStyle(ctx, loadedImages, finalCanvas.width, finalCanvas.height);
          break;
        case 2:
          drawModernGrid(ctx, loadedImages, finalCanvas.width, finalCanvas.height);
          break;
      }
    });
  }
  
  // Template drawing functions
  function drawClassicStrip(ctx, images, width, height) {
    // Background
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = width * 0.02;
    ctx.strokeRect(width * 0.01, height * 0.01, width * 0.98, height * 0.98);
    
    // Photos
    const photoHeight = (height - height * 0.08) / 3;
    
    images.forEach((img, index) => {
      const y = height * 0.04 + (index * (photoHeight + height * 0.02));
      drawImageFit(ctx, img, width * 0.04, y, width * 0.92, photoHeight);
    });
    
    // Add some text
    ctx.fillStyle = '#000';
    ctx.font = `bold ${width * 0.032}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PHOTO BOOTH', width / 2, height * 0.98);
  }
  
  function drawPolaroidStyle(ctx, images, width, height) {
    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    
    // Main photo in center
    const mainSize = Math.min(width, height) * 0.6;
    const mainX = (width - mainSize) / 2;
    const mainY = (height - mainSize) / 2;
    
    // Draw white polaroid frame
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = width * 0.03;
    ctx.shadowOffsetX = width * 0.01;
    ctx.shadowOffsetY = width * 0.01;
    ctx.fillRect(mainX - width * 0.04, mainY - height * 0.04, mainSize + width * 0.08, mainSize + height * 0.16);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw main photo
    drawImageFit(ctx, images[0], mainX, mainY, mainSize, mainSize);
    
    // Draw smaller photos at angles
    const smallSize = mainSize * 0.4;
    
    // Photo 2 - rotated left
    ctx.save();
    ctx.translate(width * 0.25, height * 0.3);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-smallSize/2 - width * 0.02, -smallSize/2 - height * 0.02, smallSize + width * 0.04, smallSize + height * 0.08);
    drawImageFit(ctx, images[1], -smallSize/2, -smallSize/2, smallSize, smallSize);
    ctx.restore();
    
    // Photo 3 - rotated right
    ctx.save();
    ctx.translate(width * 0.75, height * 0.3);
    ctx.rotate(0.2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-smallSize/2 - width * 0.02, -smallSize/2 - height * 0.02, smallSize + width * 0.04, smallSize + height * 0.08);
    drawImageFit(ctx, images[2], -smallSize/2, -smallSize/2, smallSize, smallSize);
    ctx.restore();
    
    // Add date text
    ctx.fillStyle = '#333';
    ctx.font = `${width * 0.032}px cursive`;
    ctx.textAlign = 'center';
    const date = new Date().toLocaleDateString();
    ctx.fillText(date, mainX + mainSize/2, mainY + mainSize + height * 0.06);
  }
  
  function drawModernGrid(ctx, images, width, height) {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid layout
    const padding = width * 0.05;
    const photoSize = (width - (padding * 4)) / 2;
    
    // Top left - large photo
    drawImageFit(
      ctx, 
      images[0], 
      padding, 
      padding, 
      photoSize * 2 + padding, 
      photoSize
    );
    
    // Bottom left
    drawImageFit(
      ctx, 
      images[1], 
      padding, 
      padding * 2 + photoSize, 
      photoSize, 
      photoSize
    );
    
    // Bottom right
    drawImageFit(
      ctx, 
      images[2], 
      padding * 2 + photoSize, 
      padding * 2 + photoSize, 
      photoSize, 
      photoSize
    );
    
    // Add some decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.1, width * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.9, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${width * 0.036}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('MEMORIES', width / 2, height * 0.96);
  }
  
  // Helper function to draw image maintaining aspect ratio
  function drawImageFit(ctx, img, x, y, width, height) {
    const imgRatio = img.width / img.height;
    const targetRatio = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;
    
    if (imgRatio > targetRatio) {
      // Image is wider than target area
      drawHeight = width / imgRatio;
      drawY = y + (height - drawHeight) / 2;
    } else {
      // Image is taller than target area
      drawWidth = height * imgRatio;
      drawX = x + (width - drawWidth) / 2;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
  
  // Download and print functions
  function downloadPhoto() {
    const link = document.createElement('a');
    link.download = 'photobooth-creation.png';
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
  }
  
  function printPhoto() {
    const dataUrl = finalCanvas.toDataURL('image/png');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Photo</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
            }
            @media print {
              body {
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
  }
  
  // Initialize the app
  init();
});