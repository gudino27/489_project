import React, { useEffect, useState, useCallback, useMemo } from "react";
import "../css/portfolio.css";
import Navigation from "../ui/Navigation";
import SEO from "../ui/SEO";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import BeforeAfterSlider from "../ui/BeforeAfterSlider";
import BeforeAfterCarousel from "../ui/BeforeAfterCarousel";
const API_BASE =process.env.REACT_APP_API_URL ||"https://api.gudinocustom.com";
const Portfolio = () => {
  // Analytics tracking
  useAnalytics("/portfolio");

  // Language context
  const { t } = useLanguage();

  const [allPhotos, setAllPhotos] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [modalCaption, setModalCaption] = useState("");
  const [modalIsVideo, setModalIsVideo] = useState(false);
  const [categoryVideos, setCategoryVideos] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allCategoryPhotos, setAllCategoryPhotos] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [savedPositions, setSavedPositions] = useState({});
  const [videoInView, setVideoInView] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'beforeAfter', 'grid'
  const [beforeAfterPairs, setBeforeAfterPairs] = useState([]);
  const categories = useMemo(
    () => [
      "kitchen",
      "bathroom",
      "livingroom",
      "laundryroom",
      "bedroom",
      "showcase",
    ],
    []
  );

  // Function to get translated category name
  const getCategoryName = useCallback(
    (category) => {
      const key = `portfolio.${
        category === "livingroom"
          ? "livingRoom"
          : category === "laundryroom"
          ? "laundryRoom"
          : category
      }`;
      return t(key);
    },
    [t]
  );

  const radius = 350;
  const PHOTOS_PER_PAGE = 6;
  const TRANSITION_DURATION = 300; // in milliseconds
  const getAuthToken = () =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1] ||
    null;

  const loadPhotos = useCallback(async () => {
    try {
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/photos`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAllPhotos(data);
        // Save to localStorage for offline access
        localStorage.setItem("cabinetPhotos", JSON.stringify(data));
      } else {
        throw new Error("API not available");
      }
    } catch (error) {
      const saved = localStorage.getItem("cabinetPhotos");
      if (saved) {
        const data = JSON.parse(saved);
        setAllPhotos(data);
      }
    }
  }, []);

  const selectCategory = useCallback(
    (category, resetPosition = false) => {
      setCurrentCategory(category);
      setCurrentIndex(0);
      setRotationAngle(0);

      let filtered = allPhotos.filter((photo) => {
        const str = JSON.stringify(photo).toLowerCase();
        return str.includes(category.toLowerCase());
      });

      if (filtered.length === 0) {
        filtered = allPhotos.filter(
          (photo) =>
            (photo.category &&
              photo.category.toLowerCase() === category.toLowerCase()) ||
            (photo.label &&
              photo.label.toLowerCase().includes(category.toLowerCase())) ||
            (photo.title &&
              photo.title.toLowerCase().includes(category.toLowerCase()))
        );
      }

      if (filtered.length === 0) {
        filtered = allPhotos.slice(0, Math.min(3, allPhotos.length));
      }

      // Separate videos from photos
      const videos = filtered.filter(item => item.mime_type && item.mime_type.startsWith('video/'));
      const photosOnly = filtered.filter(item => !item.mime_type || !item.mime_type.startsWith('video/'));

      // Group before/after photos by comparison_pair_id
      const pairs = [];
      const pairedIds = new Set();
      const regularPhotos = [];

      photosOnly.forEach(photo => {
        if (photo.comparison_pair_id && !pairedIds.has(photo.comparison_pair_id)) {
          // Find the matching pair
          const beforePhoto = photosOnly.find(p =>
            p.comparison_pair_id === photo.comparison_pair_id && p.photo_type === 'before'
          );
          const afterPhoto = photosOnly.find(p =>
            p.comparison_pair_id === photo.comparison_pair_id && p.photo_type === 'after'
          );

          if (beforePhoto && afterPhoto) {
            pairs.push({ before: beforePhoto, after: afterPhoto });
            pairedIds.add(photo.comparison_pair_id);
          }
        } else if (!photo.comparison_pair_id || photo.photo_type === 'regular') {
          if (!pairedIds.has(photo.id)) {
            regularPhotos.push(photo);
          }
        }
      });

      setBeforeAfterPairs(pairs);

      // Store all photos for this category (photos only, videos shown separately)
      setAllCategoryPhotos(photosOnly);
      // Calculate total pages (photos only)
      const pages = Math.ceil(photosOnly.length / PHOTOS_PER_PAGE);
      setTotalPages(pages);
      // Determine which page to show
      let targetPage = 0;
      if (
        !resetPosition &&
        savedPositions[category] !== undefined &&
        savedPositions[category] >= 0
      ) {
        targetPage = Math.min(savedPositions[category], pages - 1);
      }
      setCurrentPage(targetPage);
      // Get photos for the target page
      const startIndex = targetPage * PHOTOS_PER_PAGE;
      const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photosOnly.length);
      const pagePhotos = photosOnly.slice(startIndex, endIndex);

      setPhotos(pagePhotos);

      // Store videos separately for hero section
      setCategoryVideos(videos);
      setCurrentVideoIndex(0); // Reset to first video when category changes
    },
    [allPhotos, savedPositions]
  );
  const changePage = useCallback(
    (newPage) => {
      if (newPage < 0 || newPage >= totalPages || isTransitioning) return;
      setIsTransitioning(true);
      // Start transition animation
      const carousel = document.getElementById("carousel3d");
      if (carousel) {
        carousel.style.transform = `rotateY(${-rotationAngle}deg) scale(0.9)`;
      }
      setTimeout(() => {
        setCurrentPage(newPage);
        setCurrentIndex(0);
        setRotationAngle(0);
        // Get photos for the new page
        const startIndex = newPage * PHOTOS_PER_PAGE;
        const endIndex = Math.min(
          startIndex + PHOTOS_PER_PAGE,
          allCategoryPhotos.length
        );
        const pagePhotos = allCategoryPhotos.slice(startIndex, endIndex);
        setPhotos(pagePhotos);
        // Scale in animation
        setTimeout(() => {
          if (carousel) {
            carousel.style.transform = `rotateY(0deg) scale(1)`;
          }
          setIsTransitioning(false);
        }, 50);
      }, TRANSITION_DURATION);
    },
    [totalPages, allCategoryPhotos, rotationAngle, isTransitioning]
  );
  const resetToBeginning = useCallback(() => {
    if (currentCategory) {
      // Animate the reset
      setIsTransitioning(true);
      const carousel = document.getElementById("carousel3d");
      if (carousel) {
        carousel.style.transform = `rotateY(${-rotationAngle}deg) translateY(-20px)`;
      }
      setTimeout(() => {
        // Clear saved position for current category
        const newPositions = { ...savedPositions };
        delete newPositions[currentCategory];
        setSavedPositions(newPositions);
        localStorage.setItem(
          "portfolioPositions",
          JSON.stringify(newPositions)
        );
        // Reset to first page
        selectCategory(currentCategory, true);
        setTimeout(() => {
          if (carousel) {
            carousel.style.transform = "rotateY(0deg) translateY(0)";
          }
          setIsTransitioning(false);
        }, 50);
      }, TRANSITION_DURATION);
    }
  }, [currentCategory, savedPositions, selectCategory, rotationAngle]);
  const rotateCarousel = useCallback(
    (direction) => {
      if (photos.length === 0) return;
      const angleStep = 360 / photos.length;
      setRotationAngle((prev) => prev - direction * angleStep);
      setCurrentIndex((prev) => {
        let newIndex = prev + direction;
        if (newIndex < 0) return photos.length - 1;
        if (newIndex >= photos.length) return 0;
        return newIndex;
      });
    },
    [photos.length]
  );
  const goToSlide = useCallback(
    (index) => {
      if (photos.length === 0) return;
      const angleStep = 360 / photos.length;
      const targetAngle = index * angleStep;
      setRotationAngle((prev) => {
        let currentAngle = prev % 360;
        let diff = targetAngle - currentAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return currentAngle + diff;
      });

      setCurrentIndex(index);
    },
    [photos.length]
  );
  const openModal = (src, caption, isVideo = false, videoQualities = null) => {
    setModalSrc(src);
    setModalCaption(caption);
    setModalIsVideo(isVideo);
    setModalOpen(true);

    // Store video qualities for quality selector
    if (videoQualities) {
      window.currentVideoQualities = videoQualities;
    }
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalSrc("");
    setModalIsVideo(false);
  };
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isTransitioning) {
        if (e.key === "ArrowLeft") rotateCarousel(-1);
        if (e.key === "ArrowRight") rotateCarousel(1);
        if (e.key === "ArrowUp") changePage(currentPage - 1);
        if (e.key === "ArrowDown") changePage(currentPage + 1);
        if (e.key === "Home" && e.ctrlKey) resetToBeginning();
        if (e.key === "Escape") closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    rotateCarousel,
    changePage,
    currentPage,
    resetToBeginning,
    isTransitioning,
  ]);
useEffect(() => {
  const carouselContainer = document.querySelector('.carousel-3d-container');
  const activeItem = document.querySelector('.carousel-item-3d.active');
  
  if (carouselContainer && activeItem) {
    const orientation = activeItem.getAttribute('data-orientation') || 'landscape';
    carouselContainer.setAttribute('data-active-orientation', orientation);
  }
}, [currentIndex]);
  // Touch/swipe support - optimized for all mobile devices (iOS and Android)
  useEffect(() => {
    const carouselContainer = document.getElementById("carousel3dContainer");

    if (!carouselContainer) return;

    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    const EDGE_THRESHOLD = 50; // Pixels from screen edge to ignore swipes
    // Dynamic swipe threshold based on screen size (better for different device sizes)
    const MIN_SWIPE_DISTANCE = Math.max(
      50,
      Math.min(100, window.innerWidth * 0.15)
    );
    const MAX_VERTICAL_DISTANCE = 100; // Max vertical movement for horizontal swipe

    const handleTouchStart = (e) => {
      // Block swipes during transition to prevent lag
      if (isTransitioning) return;

      const touch = e.changedTouches[0];
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;

      // Don't capture swipes that start near the screen edges (iPhone/Android navigation)
      if (
        touchStartX < EDGE_THRESHOLD ||
        touchStartX > window.innerWidth - EDGE_THRESHOLD
      ) {
        return;
      }
    };

    const handleTouchMove = (e) => {
      // Block movement during transition
      if (isTransitioning) return;

      const touch = e.changedTouches[0];
      const currentX = touch.screenX;
      const currentY = touch.screenY;

      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);

      // If horizontal swipe detected, prevent default scroll to stop page shift
      if (deltaX > deltaY && deltaX > 30) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      // Block swipes during transition
      if (isTransitioning) return;

      const touch = e.changedTouches[0];
      touchEndX = touch.screenX;
      touchEndY = touch.screenY;

      // Don't process swipes that start or end near edges
      if (
        touchStartX < EDGE_THRESHOLD ||
        touchStartX > window.innerWidth - EDGE_THRESHOLD ||
        touchEndX < EDGE_THRESHOLD ||
        touchEndX > window.innerWidth - EDGE_THRESHOLD
      ) {
        return;
      }

      const horizontalDistance = Math.abs(touchEndX - touchStartX);
      const verticalDistance = Math.abs(touchEndY - touchStartY);

      // Only process horizontal swipes (not vertical scrolling)
      if (
        horizontalDistance > MIN_SWIPE_DISTANCE &&
        verticalDistance < MAX_VERTICAL_DISTANCE
      ) {
        if (touchEndX < touchStartX - MIN_SWIPE_DISTANCE) {
          rotateCarousel(1); // Swipe left
        } else if (touchEndX > touchStartX + MIN_SWIPE_DISTANCE) {
          rotateCarousel(-1); // Swipe right
        }
      }
    };

    // Use passive: false to allow preventDefault() in touchmove
    carouselContainer.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    carouselContainer.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    carouselContainer.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      carouselContainer.removeEventListener("touchstart", handleTouchStart);
      carouselContainer.removeEventListener("touchmove", handleTouchMove);
      carouselContainer.removeEventListener("touchend", handleTouchEnd);
    };
  }, [rotateCarousel, isTransitioning]);
  // Load photos on mount
  useEffect(() => {
    loadPhotos();
    const interval = setInterval(loadPhotos, 30000);
    return () => clearInterval(interval);
  }, [loadPhotos]);
  // Auto-select first available category when photos load
  useEffect(() => {
    if (allPhotos.length > 0 && !currentCategory) {
      for (let cat of categories) {
        const match = allPhotos.find(
          (p) =>
            (p.category && p.category.toLowerCase() === cat) ||
            (p.label && p.label.toLowerCase().includes(cat))
        );
        if (match) {
          selectCategory(cat);
          break;
        }
      }
    }
  }, [allPhotos, currentCategory, selectCategory, categories]);
  useEffect(() => {
    const saved = localStorage.getItem("portfolioPositions");
    if (saved) {
      try {
        setSavedPositions(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved positions:", e);
      }
    }
  }, []);
  useEffect(() => {
    if (currentCategory) {
      const newPositions = {
        ...savedPositions,
        [currentCategory]: currentPage,
      };
      setSavedPositions(newPositions);
      localStorage.setItem("portfolioPositions", JSON.stringify(newPositions));
    }
  }, [currentPage, currentCategory]);
  const angleStep = photos.length > 0 ? 360 / photos.length : 0;

 const handleImageLoad = useCallback((e, i) => {
  const img = e.target;
  const photo = photos[i];
  
  if (!photo) return;
  
  const container = img.closest('.carousel-item-3d');
  if (!container) return;
  
  // Get the carousel container to set active orientation
  const carouselContainer = document.querySelector('.carousel-3d-container');
  
  const originalImgSrc = `${API_BASE}${photo.url}`;
  
  const originalImg = new Image();
  
  originalImg.onload = () => {
    const width = originalImg.naturalWidth;
    const height = originalImg.naturalHeight;
    const aspectRatio = width / height;
    
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let boxWidth, boxHeight, orientation;
    
    if (aspectRatio < 0.8) {
      orientation = "portrait";
      if (isSmallMobile) {
        boxWidth = 100;  
        boxHeight = 180; 
      } else if (isMobile) {
        boxWidth = 120;  
        boxHeight = 200; 
      } else {
        boxWidth = 150;  
        boxHeight = 250; 
      }
    } else if (aspectRatio < 1.2) {
      orientation = "square";
      if (isSmallMobile) {
        boxWidth = 160;
        boxHeight = 160;
      } else if (isMobile) {
        boxWidth = 200;
        boxHeight = 200;
      } else {
        boxWidth = 300;
        boxHeight = 300;
      }
    } else if (aspectRatio < 1.8) {
      orientation = "landscape";
      if (isSmallMobile) {
        boxWidth = 240;
        boxHeight = 120;
      } else if (isMobile) {
        boxWidth = 280;
        boxHeight = 140;
      } else {
        boxWidth = 400;
        boxHeight = 200;
      }
    } else {
      orientation = "panoramic";
      if (isSmallMobile) {
        boxWidth = 260;
        boxHeight = 100;
      } else if (isMobile) {
        boxWidth = 320;
        boxHeight = 120;
      } else {
        boxWidth = 500;
        boxHeight = 180;
      }
    }
    
    const marginLeft = -(boxWidth / 2);
    const marginTop = -(boxHeight / 2);
    const itemAngle = angleStep * i;

    container.style.width = `${boxWidth}px`;
    container.style.height = `${boxHeight}px`;
    container.style.marginLeft = `${marginLeft}px`;
    container.style.marginTop = `${marginTop}px`;
    container.setAttribute("data-orientation", orientation);

    // Update carousel container with active image orientation if this is the active image
    if (i === currentIndex && carouselContainer) {
      carouselContainer.setAttribute("data-active-orientation", orientation);
    }

    // Reapply the transform to ensure it's centered correctly with new dimensions
    container.style.transform = `rotateY(${itemAngle}deg) translateZ(${radius}px)`;
    
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";
  };
  
  originalImg.onerror = () => {
    console.error(`❌ Failed to load original image for sizing: ${originalImgSrc}`);
    container.setAttribute("data-orientation", "landscape");
    if (i === currentIndex && carouselContainer) {
      carouselContainer.setAttribute("data-active-orientation", "landscape");
    }
  };
  
  originalImg.src = originalImgSrc;
  
}, [photos, currentIndex]);
  return (
    <>
      <SEO
        title="Portfolio - Kitchen & Bathroom Remodeling Projects"
        description="Browse our extensive portfolio of custom kitchen cabinets, bathroom vanities, and woodworking projects in Washington. Quality craftsmanship showcased."
        keywords="kitchen portfolio, bathroom remodeling gallery, custom cabinet photos, woodworking projects, before and after, Washington remodeling"
        canonical="https://gudinocustom.com/portfolio"
      />
      <Navigation />

      <div className="category-container">
        <h2 className="text-white mb-4">{t("portfolio.selectCategory")}</h2>
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-button ${
                cat === currentCategory ? "active" : ""
              }`}
              onClick={() => selectCategory(cat)}
            >
              {getCategoryName(cat)}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        {currentCategory && (
          <div className="view-mode-toggle" style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <button
              className={`category-button ${viewMode === '3d' ? 'active' : ''}`}
              onClick={() => setViewMode('3d')}
              style={{ minWidth: '120px' }}
            >
              Carousel
            </button>
            {beforeAfterPairs.length > 0 && (
              <button
                className={`category-button ${viewMode === 'beforeAfter' ? 'active' : ''}`}
                onClick={() => setViewMode('beforeAfter')}
                style={{ minWidth: '120px' }}
              >
                Before/After
              </button>
            )}
            <button
              className={`category-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ minWidth: '120px' }}
            >
              Grid View
            </button>
          </div>
        )}
      </div>



      {totalPages > 1 && currentCategory && viewMode === '3d' && (
        <div className="page-navigation enhanced">
          <div className="page-header">
            <div className="page-info">
              <span className="current-range">
                Photos {currentPage * PHOTOS_PER_PAGE + 1}-
                {Math.min(
                  (currentPage + 1) * PHOTOS_PER_PAGE,
                  allCategoryPhotos.length
                )}{" "}
                of {allCategoryPhotos.length}
              </span>
              {savedPositions[currentCategory] > 0 && (
                <span className="saved-indicator" title="Position saved">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
              )}
            </div>
            {currentPage > 0 && (
              <button
                onClick={resetToBeginning}
                className="reset-button"
                title="Start from beginning (Ctrl+Home)"
                disabled={isTransitioning}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Start Over
              </button>
            )}
          </div>
          <div className="page-controls">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 0 || isTransitioning}
              className="page-nav-button"
              title="Previous set (arrow up)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="page-dots">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => changePage(index)}
                  className={`page-dot ${
                    index === currentPage ? "active" : ""
                  }`}
                  title={`Page ${index + 1}${
                    savedPositions[currentCategory] === index
                      ? " (saved position)"
                      : ""
                  }`}
                  disabled={isTransitioning}
                >
                  <span className="page-number">{index + 1}</span>
                  {savedPositions[currentCategory] === index &&
                    index !== currentPage && (
                      <span className="saved-dot"></span>
                    )}
                </button>
              ))}
            </div>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || isTransitioning}
              className="page-nav-button"
              title="Next set (PageDown)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <div className="keyboard-hint">
            arrow up / arrow down to switch pages,
            <span className="keyboard-shortcut">Ctrl + Home</span> to reset to
            beginning
          </div>
        </div>
      )}
      {viewMode === '3d' && (
        <div
          className={`carousel-3d-container ${
            photos.length > 0 ? "active" : ""
          } ${isTransitioning ? "loading" : ""}`}
          id="carousel3dContainer"
        >
        <div
          className="carousel-3d"
          id="carousel3d"
          style={{
            transform: `rotateY(${-rotationAngle}deg)`,
            transformStyle: "preserve-3d",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {photos.map((photo, i) => {
  const itemAngle = angleStep * i;
  const zIndex =
    i === currentIndex ? 999 : 100 - Math.abs(i - currentIndex) * 10;
  const isVideo = photo.mime_type && photo.mime_type.startsWith('video/');
  const imgSrc = `${API_BASE}${photo.thumbnail || photo.url}`; // Thumbnail for display
  const fullSrc = `${API_BASE}${photo.url}`; // Full image/video for modal
  const caption = "";

  return (
    <div
      key={`${photo.id || i}-${currentCategory}`}
      className={`carousel-item-3d ${i === currentIndex ? "active" : ""} ${isVideo ? "video-item" : ""}`}
      style={{
        transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
        zIndex,
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "400px",      // Default landscape width
        height: "200px",     // Default landscape height
        marginLeft: "-200px", // Default centering
        marginTop: "-100px",  // Default centering
        backgroundColor: "transparent",
      }}
      data-orientation="landscape"
      onClick={() => openModal(fullSrc, caption, isVideo)}
    >
      {isVideo ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src={imgSrc}
            alt={caption}
            loading="lazy"
            width="400"
            height="300"
            onLoad={(e) => handleImageLoad(e, i)}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
          {/* Video play icon overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={caption}
          loading={i === 0 ? "eager" : "lazy"}
          width="400"
          height="300"
          onLoad={(e) => handleImageLoad(e, i)}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      )}
      <div className="caption">{caption}</div>
    </div>
  );
})}
        </div>

        <div className="dots-3d-container" id="dots3dContainer">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`dot-3d ${i === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(i)}
            ></span>
          ))}
        </div>
        {photos.length > 0 && (
          <div className="carousel-hint">
            <span className="desktop-hint">← → arrow keys or swipe to navigate photos</span>
            <span className="mobile-hint">← Swipe to browse →</span>
          </div>
        )}
      </div>
      )}

      {/* Before/After Carousel View */}
      {viewMode === 'beforeAfter' && beforeAfterPairs.length > 0 && (
        <div className="before-after-section" style={{
          maxWidth: '1200px',
          margin: '3rem auto',
          padding: '0 1rem'
        }}>
          <BeforeAfterCarousel photoPairs={beforeAfterPairs} autoPlayInterval={5000} />
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="portfolio-grid" style={{
          maxWidth: '1200px',
          margin: '3rem auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {allCategoryPhotos.map((photo, index) => {
              const imgSrc = `${API_BASE}${photo.thumbnail || photo.url}`;
              const fullSrc = `${API_BASE}${photo.url}`;
              const isVideo = photo.mime_type && photo.mime_type.startsWith('video/');

              return (
                <div
                  key={photo.id || index}
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onClick={() => openModal(fullSrc, photo.title || '', isVideo)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img
                    src={imgSrc}
                    style={{
                      width: '100%',
                      height: '250px',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />
                  
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Video Section - Full Screen with Navigation */}
      {categoryVideos.length > 0 && currentCategory && (
        <div className="video-hero-fullscreen">
          <div className="video-hero-container">
            

            {/* Main Video Player */}
            <div className="video-player-wrapper">
              {(() => {
                const video = categoryVideos[currentVideoIndex];
                if (!video) return null;

                // Parse video qualities from label field
                let qualities = null;
                try {
                  if (video.label) {
                    const parsed = JSON.parse(video.label);
                    qualities = {};
                    Object.keys(parsed).forEach(q => {
                      qualities[q] = `${API_BASE}/photos/${video.category}/${parsed[q]}`;
                    });
                  }
                } catch (e) {
                    //console.log('[VIDEO] No qualities found, using original');
                }

                // Determine video source with proper fallback chain:
                // 1. Try 720p WebM from qualities (best quality)
                // 2. Try 480p WebM from qualities (medium quality)
                // 3. Try 360p WebM from qualities (low quality)
                // 4. Fall back to video.url (database path - should be 720p WebM)
                let videoSrc = `${API_BASE}${video.url}`; // Default fallback (720p WebM from DB)
                let fallbackSrc = null;

                if (qualities) {
                  if (qualities['720p']) {
                    videoSrc = qualities['720p'];
                    fallbackSrc = qualities['480p'] || qualities['360p'];
                  } else if (qualities['480p']) {
                    videoSrc = qualities['480p'];
                    fallbackSrc = qualities['360p'];
                  } else if (qualities['360p']) {
                    videoSrc = qualities['360p'];
                  }
                }

                const thumbnail = `${API_BASE}${video.thumbnail || video.url}`;

                // Detect video type from URL
                const getVideoType = (url) => {
                  if (url.endsWith('.webm')) return 'video/webm';
                  if (url.endsWith('.mp4') || url.endsWith('.m4v')) return 'video/mp4';
                  if (url.endsWith('.mov')) return 'video/quicktime';
                  return 'video/mp4'; // default fallback
                };

                //console.log('[VIDEO HERO] Playing:', videoSrc);
                //console.log('[VIDEO HERO] Fallback:', fallbackSrc);
                //console.log('[VIDEO HERO] Qualities:', qualities);

                return (
                  <>
                    <video
                      key={videoSrc}
                      className="hero-video-player"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={thumbnail}
                      onClick={() => openModal(videoSrc, video.title || `Video ${currentVideoIndex + 1}`, true, qualities)}
                      onError={(e) => {
                        console.error('[VIDEO HERO] Failed to load:', videoSrc);
                        if (fallbackSrc && e.target.src !== fallbackSrc) {
                          //console.log('[VIDEO HERO] Trying fallback quality:', fallbackSrc);
                          e.target.src = fallbackSrc;
                        } else {
                          console.error('[VIDEO HERO] No fallback available');
                        }
                      }}
                    >
                      {/* Primary video source (720p, 480p, or 360p based on availability) */}
                      <source src={videoSrc} type="video/webm" />
                      {/* Fallback to lower quality if available */}
                      {fallbackSrc && <source src={fallbackSrc} type="video/webm" />}
                      Your browser does not support the video tag.
                    </video>

                    

                    {/* Click to expand hint */}
                    <div className="video-expand-hint">
                      Click to view fullscreen
                    </div>
                  </>
                );
              })()}

              {/* Navigation Buttons */}
              {categoryVideos.length > 1 && (
                <>
                  <button
                    className="video-nav-btn video-nav-prev"
                    onClick={() => setCurrentVideoIndex((prev) =>
                      prev === 0 ? categoryVideos.length - 1 : prev - 1
                    )}
                    disabled={categoryVideos.length <= 1}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <button
                    className="video-nav-btn video-nav-next"
                    onClick={() => setCurrentVideoIndex((prev) =>
                      prev === categoryVideos.length - 1 ? 0 : prev + 1
                    )}
                    disabled={categoryVideos.length <= 1}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {categoryVideos.length > 1 && (
              <div className="video-thumbnails-nav">
                {categoryVideos.map((video, idx) => {
                  const thumbnail = `${API_BASE}${video.thumbnail || video.url}`;
                  return (
                    <div
                      key={video.id || idx}
                      className={`video-thumb ${idx === currentVideoIndex ? 'active' : ''}`}
                      onClick={() => setCurrentVideoIndex(idx)}
                    >
                      <img src={thumbnail} alt={video.title || `Video ${idx + 1}`} loading="lazy" width="120" height="90" />
                      {idx === currentVideoIndex && (
                        <div className="video-thumb-active-indicator" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {modalOpen && (
        <div
          className="modal active"
          onClick={closeModal}
          style={{ display: "block" }}
        >
          <span className="modal-close" onClick={closeModal}>
            &times;
          </span>
          {modalIsVideo ? (
            <div onClick={(e) => e.stopPropagation()}>
              {/* Quality selector */}
              {window.currentVideoQualities && (
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  right: '20px',
                  zIndex: 10
                }}>
                  <select
                    value={selectedQuality}
                    onChange={(e) => {
                      setSelectedQuality(e.target.value);
                      const newSrc = window.currentVideoQualities[e.target.value];
                      if (newSrc) setModalSrc(newSrc);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                    <option value="360p">360p (Low)</option>
                  </select>
                </div>
              )}
              <video
                className="modal-content"
                controls
                autoPlay
                loop
                preload="metadata"
                style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                key={modalSrc}
              >
                <source src={modalSrc} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <img className="modal-content" src={modalSrc} alt="Preview" />
          )}
        </div>
      )}
    </>
  );
};

export default Portfolio;
