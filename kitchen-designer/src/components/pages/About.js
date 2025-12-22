import React, { useState, useEffect } from 'react';
import Navigation from '../ui/Navigation';
import Footer from '../ui/Footer';
import SEO from '../ui/SEO';
import { useLanguage } from '../../contexts/LanguageContext';
import '../css/about.css';
import { useAnalytics } from '../../hooks/useAnalytics';

const About = () => {
    // Analytics tracking
    useAnalytics('/about');

    // Language context
    const { t } = useLanguage();

    const [teamMembers, setTeamMembers] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [modalImages, setModalImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [imageOrientations, setImageOrientations] = useState({}); // Track orientation for each image

    // API base URL
    const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';
    const icons = {
        user: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        ),
        mail: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
            </svg>
        ),
        phone: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
        ),
        calendar: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        )
    };

    useEffect(() => {
        loadTeamMembers();
        loadTestimonials();
    }, []);

    const loadTeamMembers = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/employees`);

            if (!response.ok) {
                throw new Error('Failed to load team members');
            }

            const employees = await response.json();
            setTeamMembers(employees);
            setLoading(false);
        } catch (err) {
            console.error('Error loading team members:', err);
            setError('Unable to load team members. Please try again later.');
            setLoading(false);
        }
    };

    const loadTestimonials = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/testimonials`);

            if (response.ok) {
                const testimonials = await response.json();
                // Only show visible testimonials on the public page
                const visibleTestimonials = testimonials.filter(t => t.is_visible !== false);
                setTestimonials(visibleTestimonials);
            }
            setTestimonialsLoading(false);
        } catch (err) {
            console.error('Error loading testimonials:', err);
            setTestimonialsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const openImageModal = (photos, index) => {
        setModalImages(photos);
        setCurrentImageIndex(index);
        setModalImage(photos[index]);
    };

    const closeModal = () => {
        setModalImage(null);
        setModalImages([]);
        setCurrentImageIndex(0);
    };

    const navigateImage = (direction) => {
        const newIndex = direction === 'next'
            ? (currentImageIndex + 1) % modalImages.length
            : (currentImageIndex - 1 + modalImages.length) % modalImages.length;
        setCurrentImageIndex(newIndex);
        setModalImage(modalImages[newIndex]);
    };

    const handleKeyDown = (e) => {
        if (!modalImage) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'ArrowRight') navigateImage('next');
    };

    // Swipe gesture handlers for mobile
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && modalImages.length > 1) {
            navigateImage('next');
        }
        if (isRightSwipe && modalImages.length > 1) {
            navigateImage('prev');
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalImage, currentImageIndex]);

    // Handle image load to detect orientation and set appropriate sizing
    const handleTestimonialImageLoad = (e, testimonialId, photoIndex) => {
        const img = e.target;
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;

        let orientation, containerClass;

        if (aspectRatio < 0.8) {
            orientation = "portrait";
            containerClass = "testimonial-photo-portrait";
        } else if (aspectRatio < 1.2) {
            orientation = "square";
            containerClass = "testimonial-photo-square";
        } else if (aspectRatio < 1.8) {
            orientation = "landscape";
            containerClass = "testimonial-photo-landscape";
        } else {
            orientation = "panoramic";
            containerClass = "testimonial-photo-panoramic";
        }

        // Store orientation info
        setImageOrientations(prev => ({
            ...prev,
            [`${testimonialId}-${photoIndex}`]: { orientation, containerClass }
        }));

        // Apply the class to the container
        const container = img.closest('.testimonial-photo');
        if (container) {
            container.className = `testimonial-photo ${containerClass}`;
        }

        // Mark image as loaded
        img.setAttribute('data-loaded', 'true');
    };

    return (
        <>
            <SEO
                title="About Us - Master Carpenters & Woodworking Experts"
                description="Meet the craftsmen behind Gudino Custom. Family-owned carpentry business serving Washington since 2010. Expert kitchen and bathroom remodeling with dedication to quality."
                keywords="about us, carpentry team, master carpenters, family owned business, Washington contractors, craftsmen, woodworking experts"
                canonical="https://gudinocustom.com/about"
            />
            <Navigation />
            <div className="container">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1>{t('about.heroTitle')}</h1>
                    <p>{t('about.heroSubtitle')}</p>
                </div>
                {/* Company Info */}
                <div className="company-info">
                    <h3>{t('about.companyTitle')}</h3>
                    <p>{t('about.companyDescription')}</p>
                </div>
                {/* Team Section */}
                <div className="section-title">
                    <h2>{t('about.teamTitle')}</h2>
                    <p>{t('about.teamSubtitle')}</p>
                </div>
                <div id="teamGrid" className="team-grid">
                    {loading && (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>{t('about.loadingTeam')}</p>
                        </div>
                    )}
                    {error && (
                        <div className="error-message">{error}</div>
                    )}
                    {!loading && !error && teamMembers.length === 0 && (
                        <p className="loading" style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {t('about.noTeamMembers')}
                        </p>
                    )}
                    {!loading && !error && teamMembers.map((employee, index) => (
                        <div
                            key={employee.id || index}
                            className="team-member"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {employee.photo_url ? (
                                <img
                                    src={`${API_BASE}${employee.photo_url}`}
                                    alt={employee.name}
                                    className="member-photo"
                                />
                            ) : (
                                <div className="member-photo placeholder">
                                    {icons.user}
                                </div>
                            )}

                            <div className="member-info">
                                <h3 className="member-name">{employee.name}</h3>
                                <p className="member-position">{employee.position}</p>
                                {employee.bio && <p className="member-bio">{employee.bio}</p>}

                                <div className="member-contact">
                                    {employee.email && (
                                        <div className="contact-item">
                                            {icons.mail}
                                            <span>{employee.email}</span>
                                        </div>
                                    )}
                                    {employee.phone && (
                                        <div className="contact-item">
                                            {icons.phone}
                                            <span>{employee.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {employee.joined_date && (
                                    <div className="joined-date">
                                        {icons.calendar}
                                        <span>{t('about.joined')} {formatDate(employee.joined_date)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonials Section */}
                <div className="section-title">
                    <h2>{t('about.testimonialsTitle')}</h2>
                    <p>{t('about.testimonialsSubtitle')}</p>
                </div>

                {testimonialsLoading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>{t('about.loadingTestimonials')}</p>
                    </div>
                ) : testimonials.length > 0 ? (
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={testimonial.id || index} className="testimonial-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="testimonial-content">
                                    <div className="testimonial-stars">
                                        {'★'.repeat(testimonial.rating || 5)}
                                    </div>
                                    <p className="testimonial-text">"{testimonial.message}"</p>

                                    {testimonial.photos && testimonial.photos.length > 0 && (
                                        <div className="testimonial-photos">
                                            {testimonial.photos.map((photo, photoIndex) => (
                                                <div 
                                                    key={photoIndex} 
                                                    className="testimonial-photo"
                                                >
                                                    <img
                                                        src={`${API_BASE}${photo.thumbnail_path || photo.file_path}`}
                                                        alt={`${t('about.projectPhoto')} ${photoIndex + 1}`}
                                                        onClick={() => openImageModal(testimonial.photos, photoIndex)}
                                                        onLoad={(e) => handleTestimonialImageLoad(e, testimonial.id, photoIndex)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="testimonial-author">
                                        <strong>{testimonial.client_name}</strong>
                                        {testimonial.project_type && (
                                            <span className="project-type">{testimonial.project_type}</span>
                                        )}
                                        <span className="testimonial-date">
                                            {formatDate(testimonial.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-testimonials">
                        <p>{t('about.noTestimonials')}</p>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {modalImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        overflow: 'hidden'
                    }}
                    onClick={closeModal}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.7)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.75rem',
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            touchAction: 'manipulation'
                        }}
                        aria-label="Close modal"
                    >
                        ×
                    </button>

                    {/* Navigation Buttons (only show if multiple images) */}
                    {modalImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateImage('prev');
                                }}
                                style={{
                                    position: 'absolute',
                                    left: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1.75rem',
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    touchAction: 'manipulation'
                                }}
                                aria-label="Previous image"
                            >
                                ‹
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateImage('next');
                                }}
                                style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1.75rem',
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    touchAction: 'manipulation'
                                }}
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Image Container */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            position: 'relative',
                            maxWidth: '95vw',
                            maxHeight: '90vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <img
                            src={`${API_BASE}${modalImage.file_path}`}
                            alt="Testimonial photo"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                touchAction: 'pan-y pinch-zoom',
                                userSelect: 'none'
                            }}
                        />
                        {/* Image Counter */}
                        {modalImages.length > 1 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '1rem',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {currentImageIndex + 1} / {modalImages.length}
                            </div>
                        )}
                    </div>
                </div>
            )}

        <Footer />
        </>
    );
};

export default About;