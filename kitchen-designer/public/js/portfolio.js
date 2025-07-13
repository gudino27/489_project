
// Configuration
const API_BASE = "https://api.gudinocustom.com";
console.log(`Using API base: ${API_BASE}`);
// State variables
let currentCategory = '';
let currentIndex = 0;
let photos = [];
let allPhotos = [];
let rotationAngle = 0;
// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing portfolio...');
    loadPhotos().then(() => {
        console.log('Photos loaded:', allPhotos);
        // Auto-select first category if photos are available
        if (allPhotos.length > 0) {
            // Get unique categories
            const categories = ['kitchen', 'bathroom', 'livingroom', 'laundryroom', 'bedroom', 'showcase'];
            for (let cat of categories) {
                const catPhotos = allPhotos.filter(p =>
                    (p.category && p.category.toLowerCase() === cat) ||
                    (p.label && p.label.toLowerCase().includes(cat))
                );
                if (catPhotos.length > 0) {
                    console.log(`Auto-selecting category: ${cat}`);
                    selectCategory(cat);
                    break;
                }
            }
        }
    });
    setupCategoryButtons();
    setupModal();
    setupKeyboardNavigation();


// Load photos from API 
async function loadPhotos() {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/api/photos`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        if (response.ok) {
            allPhotos = await response.json();
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        console.log('Loading from localStorage fallback');
        const savedPhotos = localStorage.getItem('cabinetPhotos');
        if (savedPhotos) {
            allPhotos = JSON.parse(savedPhotos);
        } else {
            allPhotos = [];
        }
    }
}

// Get auth token from localStorage or cookies
function getAuthToken() {
    // Try different sources for the token
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') ||
           sessionStorage.getItem('authToken') ||
           getCookie('authToken') ||
           null;
}

// Helper function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Setup category button clicks
function setupCategoryButtons() {
    const buttons = document.querySelectorAll('.category-button');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            const category = this.getAttribute('data-category');
            selectCategory(category);
        });
    });
}

// Select a category and show its photos
function selectCategory(category) {
    // Hide current carousel
    const container = document.getElementById('carousel3dContainer');
    container.classList.remove('active');

    // Wait for fade out before updating
    setTimeout(() => {
        currentCategory = category;
        currentIndex = 0;
        rotationAngle = 0;

        // Update active button
        document.querySelectorAll('.category-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });

        // Filter photos for this category 
        if (allPhotos.length > 0 && !photos) {
            // If this is first load and no photos are in that category, will just show all photos
            photos = allPhotos;
            console.log('No category match found, showing all photos');
        } else {
            photos = allPhotos.filter(photo => {
                // Check all fields for category match
                const photoStr = JSON.stringify(photo).toLowerCase();
                return photoStr.includes(category.toLowerCase());
            });

            // If no matches with strict filter, use looser filter
            if (photos.length === 0) {
                photos = allPhotos.filter(photo => {
                    // Check if photo has a category field
                    if (photo.category && photo.category.toLowerCase() === category.toLowerCase()) {
                        return true;
                    }

                    // Check label field (from spreadsheet)
                    if (photo.label && photo.label.toLowerCase().includes(category.toLowerCase())) {
                        return true;
                    }

                    // Check title
                    if (photo.title && photo.title.toLowerCase().includes(category.toLowerCase())) {
                        return true;
                    }

                    return false;
                });
            }

            // If still no matches, show first 3 photos as fallback
            if (photos.length === 0 && allPhotos.length > 0) {
                photos = allPhotos.slice(0, Math.min(3, allPhotos.length));
            }
        }

        console.log(`Selected category: ${category}`);
        console.log(`Found ${photos.length} photos:`, photos);

        // Show 3D carousel
        show3DCarousel();
    }, 300);
}

// Show the 3D carousel
function show3DCarousel() {
    const container = document.getElementById('carousel3dContainer');
    const carousel = document.getElementById('carousel3d');
    const dotsContainer = document.getElementById('dots3dContainer');

    // Clear existing content
    carousel.innerHTML = '';
    dotsContainer.innerHTML = '';

    // Ensure photos is an array
    if (!Array.isArray(photos)) {
        console.error('Photos is not an array:', photos);
        photos = [];
    }

    if (photos.length === 0) {
    }

    const radius = 350;
    const itemCount = photos.length;
    const angleStep = 360 / itemCount;

    // Create carousel image items
    photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item-3d';

        // Calculate rotation for this image item
        const itemAngle = angleStep * index;
        item.style.transform = `rotateY(${itemAngle}deg) translateZ(${radius}px)`;

        // Get image source
        let imageSrc = photo.thumbnail ||
            photo.url;

        let FullImageSrc = `${API_BASE}${photo.url}`;
        // Create image
        const img = document.createElement('img');
        img.src = `${API_BASE}${imageSrc}`;
        img.alt = photo.title || photo.label || `Image ${index + 1}`;

        // Create caption
        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = photo.title || photo.label || `Cabinet ${index + 1}`;

        item.appendChild(img);
        item.appendChild(caption);

        item.addEventListener('click', () => {
            if (index === currentIndex) {
                openModal(FullImageSrc, caption.textContent);
            } else {
                goToSlide(index);
            }
        });

        carousel.appendChild(item);

        // Create dot
        const dot = document.createElement('span');
        dot.className = 'dot-3d' + (index === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    // Show container
    container.classList.add('active');

    // Initialize
    setTimeout(() => {
        updateCarousel();
    }, 100);
}

// Rotate the 3D carousel
function rotate3DCarousel(direction) {
    if (photos.length === 0) return;

    const angleStep = 360 / photos.length;
    rotationAngle -= direction * angleStep;

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = photos.length - 1;
    if (currentIndex >= photos.length) currentIndex = 0;

    updateCarousel();
}

// Go to specific slide
function goToSlide(index) {
    if (photos.length === 0) return;

    const angleStep = 360 / photos.length;
    const targetAngle = index * angleStep;
    const currentAngle = rotationAngle % 360;

    // Calculate shortest path to target
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    rotationAngle = currentAngle + diff;
    currentIndex = index;

    updateCarousel();
}

// Update carousel rotation
function updateCarousel() {
    const carousel = document.getElementById('carousel3d');
    const items = document.querySelectorAll('.carousel-item-3d');

    if (items.length === 0) return;

    // Rotate the entire carousel
    carousel.style.transform = `rotateY(${-rotationAngle}deg)`;

    // Update dots
    const dots = document.querySelectorAll('.dot-3d');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });

    // Update each item's appearance
    items.forEach((item, index) => {
        const isCurrent = index === currentIndex;

        // Remove all active classes first
        item.classList.remove('active');

        // Add active class to current item
        if (isCurrent) {
            item.classList.add('active');
            item.style.zIndex = '999';
            item.style.opacity = '1';
            item.style.filter = 'brightness(1)';
        } else {
            // Calculate distance from current
            let distance = Math.abs(index - currentIndex);
            if (distance > items.length / 2) {
                distance = items.length - distance;
            }

            // Set properties based on distance
            const zIndex = 100 - (distance * 10);
            const opacity = Math.max(0.5, 1 - (distance * 0.15));
            const brightness = 0.6 + (0.4 * (1 - distance / (items.length / 2)));

            item.style.zIndex = zIndex;
            item.style.opacity = opacity;
            item.style.filter = `brightness(${brightness})`;
        }
    });
}

// Modal functionality
function setupModal() {
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('modalClose');

    modalClose.onclick = () => {
        modal.style.display = 'none';
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function openModal(src, title) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');

    modalImg.src = src;
    modalCaption.textContent = title;
    modal.style.display = 'block';
}

// Keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function (e) {
        if (document.getElementById('carousel3dContainer').classList.contains('active')) {
            if (e.key === 'ArrowLeft') rotate3DCarousel(-1);
            if (e.key === 'ArrowRight') rotate3DCarousel(1);
            if (e.key === 'Escape') {
                document.getElementById('imageModal').style.display = 'none';
            }
        }
    });
}

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        rotate3DCarousel(1); // Swipe left
    }
    if (touchEndX > touchStartX + 50) {
        rotate3DCarousel(-1); // Swipe right
    }
}



// Refresh photos periodically
setInterval(loadPhotos, 30000); // Reload every 30 seconds
// Save test data to localStorage


// Make functions available globally
window.rotate3DCarousel = rotate3DCarousel;
});
