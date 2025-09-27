import React, { useState, useEffect } from 'react';
import Navigation from '../ui/Navigation';
import Footer from '../ui/Footer';
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

    return (
        <>
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
                                                <div key={photoIndex} className="testimonial-photo">
                                                    <img
                                                        src={`${API_BASE}${photo.thumbnail_path || photo.file_path}`}
                                                        alt={`${t('about.projectPhoto')} ${photoIndex + 1}`}
                                                        onClick={() => {
                                                            // Open full size image in modal or new tab
                                                            window.open(`${API_BASE}${photo.file_path}`, '_blank');
                                                        }}
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
        <Footer />
        </>
    );
};

export default About;