document.addEventListener("DOMContentLoaded", function () {

    const contentArea = document.querySelector(".content-area");
    // Filter out any null, undefined, or empty strings from the capturedShots array
    const capturedShots = (JSON.parse(localStorage.getItem('capturedShots')) || []).filter(shot => shot && shot.trim() !== '');
    
    // Retrieve the original photo size selection (e.g., 'Portrait', 'Landscape', 'Square')
    const savedPhotoSize = localStorage.getItem('photoSize') || "Square"; // Default to Square if not set
    
    // Exit if no valid photos remain after filtering
    if (capturedShots.length === 0) return; 

    // Create container for photos (the main strip wrapper)
    const photosContainer = document.createElement('div');
    photosContainer.id = 'photosContainer';
    Object.assign(photosContainer.style, {
        display: 'flex',
        justifyContent: 'center', // Centers the group horizontally
        alignItems: 'center',     // Centers the group vertically
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)', // Centers the container itself within the content area
        gap: '1px', // Space between framed pictures
        flexWrap: 'nowrap'
    });
    contentArea.appendChild(photosContainer);

    // Function to handle image loading and aspect ratio detection
    function loadAndDisplayPhotos() {
        const totalPhotos = capturedShots.length;
        const tempImg = new Image();
        tempImg.src = capturedShots[0]; // Use the first valid image to load dimensions

        tempImg.onload = () => {
            let displayWidth, displayHeight;
            const standardHeight = 100; // Height of the actual *picture* content when displayed in the strip
            const frameMargin = 5; // The size of your "border design" area (adjust as needed)

            if (savedPhotoSize === 'Portrait') {
                displayHeight = standardHeight * (550 / 380); 
                displayWidth = standardHeight;
            } else if (savedPhotoSize === 'Square') {
                displayHeight = standardHeight;
                displayWidth = standardHeight;
            } else { // Landscape
                displayHeight = standardHeight;
                displayWidth = standardHeight * (800 / 550);
            }
            
            displayWidth = Math.round(displayWidth);
            displayHeight = Math.round(displayHeight);

            // Loop through all valid shots and add them to the container
            capturedShots.forEach((shotSrc) => {
                // The wrapper will have the background frame image and padding
                const photoWrapper = document.createElement('div');
                photoWrapper.className = 'photo-frame-wrapper'; // Add class for selection
                Object.assign(photoWrapper.style, {
                    // Total size = picture size + padding (which is the margin/border area)
                    width: `${displayWidth + (frameMargin * 2)}px`,
                    height: `${displayHeight + (frameMargin * 2)}px`,
                    padding: `${frameMargin}px`, // This is the space for the frame design
                    boxSizing: 'border-box', // Ensures width/height includes padding
                    
                    // Use background-image for the frame design (e.g., pictures/frame-Square.png)
                    backgroundImage: `url(pictures/frame-${savedPhotoSize}.png)`,
                    backgroundSize: '100% 100%', // Stretch frame image to fit the wrapper exactly
                    backgroundRepeat: 'no-repeat',
                    
                });

                const userPhoto = document.createElement('img');
                userPhoto.src = shotSrc;
                Object.assign(userPhoto.style, {
                    objectFit: 'cover',
                    width: '100%', // Image fills the padded area
                    height: '100%',
                    display: 'block'
                });

                photoWrapper.appendChild(userPhoto);
                photosContainer.appendChild(photoWrapper);
            });

            // If the original photo was Portrait or Square, we default to a vertical strip layout.
            const stripLayoutDirection = (savedPhotoSize === 'Portrait' || savedPhotoSize === 'Square') ? 'vertical' : 'horizontal';
            applyOrientationLayout(stripLayoutDirection);
        };
    }

    // Function to apply the correct layout direction
    function applyOrientationLayout(stripLayoutDirection) {
        
        if (stripLayoutDirection === "vertical") {
            Object.assign(photosContainer.style, {
                flexDirection: 'column',
            });
            
        } else {
            Object.assign(photosContainer.style, {
                flexDirection: 'row',
            });
        }
    }

    // Helper function to update all frames when a thumbnail is clicked
    function updateAllFrames(frameSrcKey) {
        const frameWrappers = document.querySelectorAll('.photo-frame-wrapper');
        // Check if key is a full filename or just the size name
        const src = frameSrcKey.includes('.') ? `pictures/${frameSrcKey}` : `pictures/frame-${frameSrcKey}.png`;
        
        frameWrappers.forEach(wrapper => {
            wrapper.style.backgroundImage = `url(${src})`;
        });
    }

    // ===================== DROPDOWN ORIENTATION =====================
    const dropdownSelected = document.getElementById("orientationSelect");
    const dropdownMenu = document.getElementById("orientationMenu");
    const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
    const arrow = dropdownSelected.querySelector(".arrow");
    
    // Toggle menu
    dropdownSelected.addEventListener("click", () => {
        const isOpen = dropdownMenu.classList.toggle("open");
        arrow.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    });

    // Select item
    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            const value = item.dataset.value; 
            dropdownSelected.textContent = item.textContent + " "; 
            dropdownMenu.classList.remove("open");
            arrow.style.transform = "rotate(0deg)";
            
            localStorage.setItem("orientation", value); 
            
            applyOrientationLayout(value); 
        });
    });

    // Close menu if click outside
    document.addEventListener("click", (e) => {
        if (!dropdownSelected.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove("open");
            arrow.style.transform = "rotate(0deg)";
        }
    });

    // ===================== FRAME THUMBNAILS =====================
    // This updates every frame individually using the background image technique
    const frameThumbnails = document.querySelectorAll(".frame-thumbnail");
    frameThumbnails.forEach(frame => {
        frame.addEventListener("click", () => {
            const frameSrc = frame.dataset.frame; // e.g. "my-cool-design.png"
            updateAllFrames(frameSrc); // Use the helper function to update all frames
        });
    });
    
    // Start the process: Load photos and set initial layout
    loadAndDisplayPhotos();
});
