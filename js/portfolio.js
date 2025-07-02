
// Configuration
const API_BASE = 'http://localhost:3001'; // Update this to match the photo server

// State variables
let currentCategory = '';
let currentSlideIndex = 0;
let photos = [];
let allPhotos = [];

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadPhotos();
    setupCategoryButtons();
});

// Load photos from API or localStorage
async function loadPhotos() {
    try {
        // Try to load from API first
        const response = await fetch(`${API_BASE}/api/photos`);
        if (response.ok) {
            allPhotos = await response.json();
            console.log('Loaded photos from API:', allPhotos);
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        console.log('Loading from localStorage fallback');
        // Fallback to localStorage for demo
        const savedPhotos = localStorage.getItem('cabinetPhotos');
        if (savedPhotos) {
            allPhotos = JSON.parse(savedPhotos);
        } else {
            // Demo photos if nothing is saved
            allPhotos = [             
            ];
        }
    }
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
    currentCategory = category;
    currentSlideIndex = 0;

    // Update active button
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });

    // Filter photos for this category
    photos = allPhotos.filter(photo => {
        // Handle both specific categories and general matching
        if (photo.category === category) return true;

        // Map livingroom -> showcase, bedroom -> showcase, etc.
        const categoryMappings = {
            'livingroom': ['showcase', 'living'],
            'laundryroom': ['showcase', 'laundry'],
            'bedroom': ['showcase', 'bedroom']
        };

        if (categoryMappings[category]) {
            return categoryMappings[category].some(mapping =>
                photo.category.includes(mapping) || photo.title.toLowerCase().includes(category)
            );
        }

        return false;
    });

    // Show slideshow
    showSlideshow();
}
// Modal logic
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalCaption = document.getElementById("modalCaption");
const modalClose = document.getElementById("modalClose");

modalClose.onclick = () => {
  modal.style.display = "none";
};
// Show the slideshow with current category photos
function showSlideshow() {
    const container = document.getElementById('slideshowContainer');
    const wrapper = document.getElementById('slidesWrapper');
    const dotsContainer = document.getElementById('dotsContainer');

    // Clear existing content
    wrapper.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (photos.length === 0) {
        wrapper.innerHTML = '<div class="no-photos">No photos available for this category</div>';
        container.classList.add('active', 'fade-in');
        return;
    }

    // Create slides
    photos.forEach((photo, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (index === 0 ? ' active' : '');

    const thumbSrc = `${API_BASE}${photo.thumbnail || photo.full || photo.url}`;
    const fullSrc = `${API_BASE}/photos${photo.full || photo.url}`;

    slide.innerHTML = `
      <img src="${fullSrc}" 
           alt="${photo.title}"
           class="slideshow-image"
           style="cursor: zoom-in;"
           data-full="${fullSrc}"
           data-title="${photo.title}"
           onerror="this.onerror=null; this.src='placeholder.jpg';">
      <div class="caption">${photo.title}</div>
    `;

    // After slide added, attach click handler to image
    setTimeout(() => {
      const img = slide.querySelector('img');
      img.addEventListener('click', () => {
        modalImg.src = img.getAttribute('data-full');
        modalCaption.textContent = img.getAttribute('data-title');
        modal.style.display = 'block';
      });
    }, 0);

    wrapper.appendChild(slide);

        // Create dot
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    // Show container with animation
    container.classList.add('active', 'fade-in');

    // Hide arrows if only one photo
    if (photos.length <= 1) {
        document.querySelector('.prev').style.display = 'none';
        document.querySelector('.next').style.display = 'none';
    } else {
        document.querySelector('.prev').style.display = 'block';
        document.querySelector('.next').style.display = 'block';
    }
}

// Change slide by offset (-1 or 1)
function changeSlide(offset) {
    if (photos.length === 0) return;

    currentSlideIndex += offset;
    if (currentSlideIndex >= photos.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = photos.length - 1;

    updateSlideDisplay();
}

// Go to specific slide
function goToSlide(index) {
    currentSlideIndex = index;
    updateSlideDisplay();
}

// Update slide display
function updateSlideDisplay() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlideIndex);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex);
    });
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (document.getElementById('slideshowContainer').classList.contains('active')) {
        if (e.key === 'ArrowLeft') changeSlide(-1);
        if (e.key === 'ArrowRight') changeSlide(1);
    }
});

// Refresh photos periodically (useful if admin is updating)
setInterval(loadPhotos, 30000); // Reload every 30 seconds
