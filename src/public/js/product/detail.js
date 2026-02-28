/**
 * Product Detail Page - UI & Gallery Logic
 */

let currentImageIndex = 0;
let galleryImages = [];

/**
 * Initialize Gallery and UI
 * @param {Object} config - { galleryImages: [] }
 */
function initProductUI(config) {
    galleryImages = config.galleryImages || [];

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', function (event) {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'flex') {
            if (event.key === 'ArrowLeft') prevImage();
            if (event.key === 'ArrowRight') nextImage();
            if (event.key === 'Escape') closeLightbox();
        }
    });

    // Click on main image to open lightbox
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.addEventListener('click', function () {
            openLightbox(currentImageIndex);
        });
    }
}

function galleryNext() {
    const thumbnails = document.querySelectorAll('.gallery-thumb');
    if (thumbnails.length > 0) {
        const nextIndex = (currentImageIndex + 1) % thumbnails.length;
        thumbnails[nextIndex].click();
    }
}

function galleryPrev() {
    const thumbnails = document.querySelectorAll('.gallery-thumb');
    if (thumbnails.length > 0) {
        const prevIndex = (currentImageIndex - 1 + thumbnails.length) % thumbnails.length;
        thumbnails[prevIndex].click();
    }
}

function changeMainImage(element, index) {
    const imgSrc = element.querySelector('img').src;
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imgSrc;
    }
    currentImageIndex = index;

    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    element.classList.add('active');
}

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const currentImageNum = document.getElementById('currentImageNum');

    if (lightbox && lightboxImage && galleryImages[index]) {
        lightboxImage.src = galleryImages[index];
        if (currentImageNum) {
            currentImageNum.textContent = index + 1;
        }
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function nextImage() {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateLightboxImage();
}

function prevImage() {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightboxImage');
    const currentImageNum = document.getElementById('currentImageNum');
    if (lightboxImage && galleryImages[currentImageIndex]) {
        lightboxImage.src = galleryImages[currentImageIndex];
        if (currentImageNum) {
            currentImageNum.textContent = currentImageIndex + 1;
        }
    }
}

// Section Toggles
function toggleDescription() {
    const descContent = document.getElementById('descriptionContent');
    const descToggle = document.getElementById('descriptionToggle');
    if (!descContent || !descToggle) return;

    const isHidden = descContent.style.display === 'none';
    descContent.style.display = isHidden ? 'block' : 'none';
    descToggle.innerHTML = isHidden
        ? '<i class="bi bi-chevron-up"></i>'
        : '<i class="bi bi-chevron-down"></i>';
}

function toggleDetails() {
    const detailsContent = document.getElementById('detailsContent');
    const detailsToggle = document.getElementById('detailsToggle');
    if (!detailsContent || !detailsToggle) return;

    const isHidden = detailsContent.style.display === 'none';
    detailsContent.style.display = isHidden ? 'block' : 'none';
    detailsToggle.innerHTML = isHidden
        ? '<i class="bi bi-chevron-up"></i>'
        : '<i class="bi bi-chevron-down"></i>';
}

// Export to window
window.initProductUI = initProductUI;
window.galleryNext = galleryNext;
window.galleryPrev = galleryPrev;
window.changeMainImage = changeMainImage;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.toggleDescription = toggleDescription;
window.toggleDetails = toggleDetails;
