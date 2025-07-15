import{ useEffect, useState } from 'react';
import './css/portfolio.css';
import Navigation from './Navigation';

const API_BASE = "https://api.gudinocustom.com";

const Portfolio = () => {
  const [allPhotos, setAllPhotos] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const categories = ['kitchen', 'bathroom', 'livingroom', 'laundryroom', 'bedroom', 'showcase'];

  useEffect(() => {
    loadPhotos();
    setupKeyboardNavigation();
    const interval = setInterval(loadPhotos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allPhotos.length > 0) {
      for (let cat of categories) {
        const match = allPhotos.find(p =>
          (p.category && p.category.toLowerCase() === cat) ||
          (p.label && p.label.toLowerCase().includes(cat))
        );
        if (match) {
          selectCategory(cat);
          break;
        }
      }
    }
  }, [allPhotos]);

  const getAuthToken = () =>
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null;

  const loadPhotos = async () => {
    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/photos`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAllPhotos(data);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      const saved = localStorage.getItem('cabinetPhotos');
      if (saved) {
        setAllPhotos(JSON.parse(saved));
      }
    }
  };

  const selectCategory = (category) => {
    setCurrentCategory(category);
    setCurrentIndex(0);
    setRotationAngle(0);

    let filtered = allPhotos.filter(photo => {
      const str = JSON.stringify(photo).toLowerCase();
      return str.includes(category.toLowerCase());
    });

    if (filtered.length === 0) {
      filtered = allPhotos.filter(photo =>
        (photo.category && photo.category.toLowerCase() === category.toLowerCase()) ||
        (photo.label && photo.label.toLowerCase().includes(category.toLowerCase())) ||
        (photo.title && photo.title.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (filtered.length === 0) {
      filtered = allPhotos.slice(0, Math.min(3, allPhotos.length));
    }

    setPhotos(filtered);
  };

  const rotateCarousel = (direction) => {
    const angleStep = 360 / photos.length;
    setRotationAngle(prev => prev - direction * angleStep);
    setCurrentIndex(prev => {
      let newIndex = prev + direction;
      if (newIndex < 0) return photos.length - 1;
      if (newIndex >= photos.length) return 0;
      return newIndex;
    });
  };

  const goToSlide = (index) => {
    const angleStep = 360 / photos.length;
    const targetAngle = index * angleStep;
    let currentAngle = rotationAngle % 360;
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    setRotationAngle(currentAngle + diff);
    setCurrentIndex(index);
  };

  const setupKeyboardNavigation = () => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') rotateCarousel(-1);
      if (e.key === 'ArrowRight') rotateCarousel(1);
      if (e.key === 'Escape') document.getElementById('imageModal')?.classList.remove('active');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState('');
  const [modalCaption, setModalCaption] = useState('');

  const openModal = (src, caption) => {
    setModalSrc(src);
    setModalCaption(caption);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const radius = 350;
  const angleStep = 360 / (photos.length || 1);

  return (
    <>
        <Navigation />
      <div className="category-container">
        <h2 className="text-white mb-4">Select a Category</h2>
        <div className="category-buttons">
          {categories.map(cat => (
            <button key={cat} className={`category-button ${cat === currentCategory ? 'active' : ''}`} onClick={() => selectCategory(cat)}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className={`carousel-3d-container ${photos.length > 0 ? 'active' : ''}`} id="carousel3dContainer">
        <div className="carousel-3d" id="carousel3d" style={{ transform: `rotateY(${-rotationAngle}deg)` }}>
          {photos.map((photo, i) => {
            const itemAngle = angleStep * i;
            const zIndex = i === currentIndex ? 999 : 100 - Math.abs(i - currentIndex) * 10;
            const opacity = i === currentIndex ? 1 : Math.max(0.5, 1 - Math.abs(i - currentIndex) * 0.15);
            const brightness = i === currentIndex ? 1 : 0.6 + (0.4 * (1 - Math.abs(i - currentIndex) / (photos.length / 2)));
            const imgSrc = `${API_BASE}${photo.thumbnail || photo.url}`;
            const fullImg = `${API_BASE}${photo.url}`;
            const caption = photo.title || photo.label || `Cabinet ${i + 1}`;

            return (
              <div
                key={i}
                className={`carousel-item-3d ${i === currentIndex ? 'active' : ''}`}
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  zIndex,
                  opacity,
                  filter: `brightness(${brightness})`
                }}
                onClick={() => i === currentIndex ? openModal(fullImg, caption) : goToSlide(i)}
              >
                <img src={imgSrc} alt={caption} />
                <div className="caption">{caption}</div>
              </div>
            );
          })}
        </div>

        <div className="carousel-controls">
          <div className="carousel-prev" onClick={() => rotateCarousel(-1)}></div>
          <div className="carousel-next" onClick={() => rotateCarousel(1)}></div>
        </div>

        <div className="dots-3d-container" id="dots3dContainer">
          {photos.map((_, i) => (
            <span key={i} className={`dot-3d ${i === currentIndex ? 'active' : ''}`} onClick={() => goToSlide(i)}></span>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div id="imageModal" className="modal active" onClick={closeModal}>
          <span id="modalClose" className="modal-close" onClick={closeModal}>&times;</span>
          <img id="modalImage" className="modal-content" src={modalSrc} alt="Preview" />
          <div id="modalCaption" className="modal-caption">{modalCaption}</div>
        </div>
      )}
    </>
  );
};

export default Portfolio;
