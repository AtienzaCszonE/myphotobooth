const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const captureBtn = document.getElementById('captureBtn');
const flash = document.getElementById('flash');
const shotsContainer = document.getElementById('shots');
const finishBtn = document.getElementById('finishBtn');
let stream = null;
let retakeIndex = null;

// Ensure the canvas element used for processing is hidden from view
canvas.style.display = 'none';

// Load session settings
const maxPhotos = parseInt(localStorage.getItem('photoQuantity')) || 4;
const photoSize = localStorage.getItem('photoSize') || 'Landscape';

// Initialize empty shots
const totalSlots = 4;
const shots = Array(totalSlots).fill(null);

// Camera frame sizing
const cameraFrame = document.querySelector('.camera-frame');
// Reintroducing the aspect ratio control for the container dimensions
if (photoSize === 'Portrait') {
  cameraFrame.style.width = '380px';
  cameraFrame.style.height = '550px';
} else if (photoSize === 'Square') {
  cameraFrame.style.width = '550px';
  cameraFrame.style.height = '550px';
} else {
  cameraFrame.style.width = '800px';
  cameraFrame.style.height = '550px';
}


// Load selected background
let selectedBg = localStorage.getItem('photoBackground') || 'pictures/photoboothbg.jpg';

// Apply background to camera frame
// Apply background to camera frame (default camera view only)
function applyCameraBackground() {
  // remove any style or design in camera background
  cameraFrame.style.backgroundImage = 'none';
  cameraFrame.style.backgroundColor = 'transparent';
  cameraFrame.style.backgroundSize = '';
  cameraFrame.style.backgroundPosition = '';
}

// Only apply clean camera view (no bg design)
applyCameraBackground();

applyCameraBackground(selectedBg);

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    // This ensures the video fills its parent container while maintaining aspect ratio,
    // solving the 'Hindi normal tignan' (doesn't look normal/stretched) issue.
    video.style.objectFit = 'cover';
    video.style.width = '100%';
    video.style.height = '100%';
    video.play();
  } catch (err) {
    alert('Cannot access camera. Please allow camera permissions.');
    console.error(err);
  }
}
startCamera();

// Load BodyPix model
let net = null;
async function loadBodyPix() {
  net = await bodyPix.load();
}
loadBodyPix();

// Generate placeholder for preview (color or image)
function getPreviewSrc(shot) {
  if (shot) return shot;
  if (selectedBg.endsWith('.jpg') || selectedBg.endsWith('.png') || selectedBg.startsWith('data:image')) {
    return selectedBg;
  } else {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 150;
    colorCanvas.height = 100;
    const ctx = colorCanvas.getContext('2d');
    ctx.fillStyle = selectedBg;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
    return colorCanvas.toDataURL('image/png');
  }
}

// Capture photo
captureBtn.addEventListener('click', async () => {
  if (!net) return alert('Background model not ready.');
  if (!stream) return alert('Camera not ready.');

  const slot = retakeIndex !== null ? retakeIndex : shots.findIndex((s, i) => i < maxPhotos && s === null);
  if (slot === -1) {
    alert(`Maximum of ${maxPhotos} photos reached.`);
    return;
  }

  // Use the actual dimensions of the video stream for the canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  // Flash (visual effect for the user)
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 400);

  // Segment person
  const segmentation = await net.segmentPerson(video);

  // Draw background
  if (selectedBg.endsWith('.jpg') || selectedBg.endsWith('.png') || selectedBg.startsWith('data:image')) {
    const bgImg = new Image();
    bgImg.src = selectedBg;
    await new Promise(res => {
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        res();
      };
    });
  } else {
    ctx.fillStyle = selectedBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw person
  const videoCanvas = document.createElement('canvas');
  videoCanvas.width = video.videoWidth;
  videoCanvas.height = video.videoHeight;
  const vCtx = videoCanvas.getContext('2d');
  vCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const videoData = vCtx.getImageData(0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] === 1) {
      imageData.data[i*4 + 0] = videoData.data[i*4 + 0];
      imageData.data[i*4 + 1] = videoData.data[i*4 + 1];
      imageData.data[i*4 + 2] = videoData.data[i*4 + 2];
      imageData.data[i*4 + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Save slot
  shots[slot] = canvas.toDataURL('image/png');
  retakeIndex = null;
  renderShots();
});

// Finish
finishBtn.addEventListener('click', () => {
  ; 
});

// Render shots preview
function renderShots() {
  shotsContainer.innerHTML = '';
  shots.forEach((shot, idx) => {
    const img = document.createElement('img');
    img.src = getPreviewSrc(shot);
    img.alt = `Photo slot ${idx+1}`;

    // Size
    if (photoSize === 'Portrait') {
      img.style.width = '90px'; img.style.height = '120px';
    } else if (photoSize === 'Square') {
      img.style.width = '100px'; img.style.height = '100px';
    } else {
      img.style.width = '130px'; img.style.height = '90px';
    }

    img.style.objectFit = 'cover';
    img.style.margin = '5px';
    img.style.borderRadius = '8px';
    img.style.border = '2px solid white';
    img.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

    if (idx >= maxPhotos) {
      img.style.filter = 'grayscale(100%) opacity(0.4)';
      img.style.cursor = 'not-allowed';
    } else {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        retakeIndex = idx;
        highlightSelectedSlot(idx);
      });
    }

    shotsContainer.appendChild(img);
  });
  highlightSelectedSlot(retakeIndex);
}

// Highlight retake slot
function highlightSelectedSlot(index) {
  const allImgs = shotsContainer.querySelectorAll('img');
  allImgs.forEach((img, i) => {
    img.style.outline = i === index ? '4px solid #00ccff' : 'none';
  });
}

// Initial render
renderShots();

// Finish button - redirect to result.html
finishBtn.addEventListener('click', () => {
    // Save captured shots for the result page
    localStorage.setItem('capturedShots', JSON.stringify(shots));

    // Redirect to result page
    window.location.href = 'result.html';
});
