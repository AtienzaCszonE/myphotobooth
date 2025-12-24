// === Handle Color Circle Selection ===
const circles = document.querySelectorAll('.color-circle');
let selectedBg = 'pictures/photoboothbg.jpg'; // default background

circles.forEach(circle => {
  circle.addEventListener('click', () => {
    // Remove "selected" class from all circles
    circles.forEach(c => c.classList.remove('selected'));
    // Add "selected" class to clicked circle
    circle.classList.add('selected');

    if (circle.id !== 'uploadCircle') {
      // Use data-bg if available
      selectedBg = circle.dataset.bg || circle.style.backgroundColor;
    }
  });
});

// === Handle Upload Button ===
const uploadBtn = document.getElementById('uploadCircle');
const uploadInput = document.getElementById('uploadInput');

uploadBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      selectedBg = reader.result; // uploaded image
      circles.forEach(c => c.classList.remove('selected'));
      uploadBtn.classList.add('selected');
    };
    reader.readAsDataURL(file);
  }
});

// === Handle Start Button ===
document.getElementById('startSession').addEventListener('click', () => {
  const size = document.getElementById('photoSize').value;
  const quantity = parseInt(document.getElementById('photoCount').value);

  // Save settings
  localStorage.setItem('photoSize', size);
  localStorage.setItem('photoQuantity', quantity);
  localStorage.setItem('photoBackground', selectedBg);

  // Go to photobooth page
  window.location.href = 'photobooth.html';
});
