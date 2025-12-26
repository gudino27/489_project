import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navigation from '../ui/Navigation';
import Footer from '../ui/Footer';
import SEO from '../ui/SEO';
import InstagramFeed from '../ui/InstagramFeed';
import { useLanguage } from '../../contexts/LanguageContext';
import '../css/home.css';
import { useAnalytics } from '../../hooks/useAnalytics';

const Home = () => {
  // Analytics tracking
  useAnalytics('/');

  // Language context
  const { t } = useLanguage();

  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isWorkTypesOpen, setIsWorkTypesOpen] = useState(false);
  const [visibleQuotes, setVisibleQuotes] = useState([]);

  const workTypes = [
    { title: t('home.workTypes.kitchen'), description: t('home.workTypes.kitchenDesc') },
    { title: t('home.workTypes.bathroom'), description: t('home.workTypes.bathroomDesc') },
    { title: t('home.workTypes.carpentry'), description: t('home.workTypes.carpentryDesc') },
    { title: t('home.workTypes.cabinets'), description: t('home.workTypes.cabinetsDesc') },
    { title: t('home.workTypes.remodeling'), description: t('home.workTypes.remodelingDesc') },
    { title: t('home.workTypes.commercial'), description: t('home.workTypes.commercialDesc') },
    { title: t('home.workTypes.insurance'), description: t('home.workTypes.insuranceDesc') }
  ];

  const toggleWorkTypes = () => {
    setIsWorkTypesOpen(!isWorkTypesOpen);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleScroll = () => {
      if (!isMobile) {
        setScrollY(window.scrollY);
      }

      // Check which quotes are in view
      const quotes = document.querySelectorAll('.quote, .feature-content, .final-content');
      quotes.forEach((quote, index) => {
        const rect = quote.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;

        if (isInView && !visibleQuotes.includes(index)) {
          setVisibleQuotes(prev => [...prev, index]);
          quote.classList.add('animate-in');
        }
      });
    };

    checkIfMobile();
    handleScroll(); // Check on mount
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile, visibleQuotes]);

  return (
    <>
      <SEO
        title="Expert Carpenters & Cabinet Makers in Washington"
        description="Professional kitchen remodeling, bathroom renovations, and custom cabinet installation throughout Washington. Expert carpentry services with 15+ years of experience."
        keywords="carpenter, carpentry, kitchen remodeling, bathroom renovation, custom cabinets, cabinet maker, woodworking, Washington, Spokane"
        canonical="https://gudinocustom.com/"
      />
      <Navigation />

      {/* Hero Section with Video Background */}
      <div className="hero-section" style={{
        paddingBottom: isMobile ? '80px' : '250px',
        paddingTop: isMobile ? '80px' : '250px'
      }}>
        <div className="video-background">
          <video
            autoPlay={!isMobile}
            muted
            loop
            playsInline
            preload={isMobile ? "none" : "metadata"}
            poster="/home-page-images/kitchen-island.jpeg"
            onError={(e) => console.warn('Video failed to load:', e)}
          >
            <source src="/videos/woodworking-hero.webm" type="video/webm" />
            <source src="/videos/woodworking-hero.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="company-name">{t('home.companyName')}</h1>
            <h2 className="company-tagline">{t('home.tagline')}</h2>
            <p className="hero-description">{t('home.heroDescription')}</p>
          </div>
        </div>

        <div className="curved-bottom"></div>

        <div className="scroll-indicator" onClick={() => {
          const targetPosition = window.innerHeight;
          const startPosition = window.pageYOffset;
          const distance = targetPosition - startPosition;
          const duration = 1500; // 1.5 seconds
          let start = null;

          const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const progressPercentage = Math.min(progress / duration, 1);

            // Easing function for smooth acceleration and deceleration
            const easeInOutCubic = progressPercentage < 0.5
              ? 4 * progressPercentage * progressPercentage * progressPercentage
              : 1 - Math.pow(-2 * progressPercentage + 2, 3) / 2;

            window.scrollTo(0, startPosition + distance * easeInOutCubic);

            if (progress < duration) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
        }}>
          <div className="scroll-arrow"></div>
        </div>
      </div>

      <div className="home-container">

        {/* Content Sections with Parallax Effects */}
        <section className="content-section">
          <div className="section-content" style={{ transform: isMobile ? 'none' : `translateY(${scrollY * 0.01}px)` }}>
            <div className="quote">
              {t('home.quote1')}
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image zoomed-out" style={{ transform: isMobile ? 'none' : `translateY(${scrollY * 0.03}px)` }}>
            <img src="/home-page-images/kitchen-island.jpeg" alt="Kitchen Island" loading="lazy" width="1920" height="1280" />
          </div>
        </section>

        <section className="content-section">
          <div className="section-content">
            <div className="quote">
              {t('home.quote2')}
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>{t('home.unlimitedScope')}</h2>
            </div>
            <div className="feature-description">
              {t('home.scopeDescription')}
            </div>
            <div className="feature-button">
              <Link to="/contact" className="cta-button">{t('home.contactUs')}</Link>
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image zoomed-out" style={{ transform: isMobile ? 'none' : `translateY(${scrollY * 0.015}px)` }}>
            <img src="/home-page-images/kitchen.jpg" alt="Kitchen" loading="lazy" width="1920" height="1280" />
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>{t('home.ourCreations')}</h2>
            </div>
            <div className="feature-description">
              {t('home.creationsDescription')}
            </div>

            <div className="work-types-dropdown">
              <button
                className="dropdown-toggle"
                onClick={toggleWorkTypes}
                aria-expanded={isWorkTypesOpen}
              >
                <span>{t('home.seeWhatWeDo')}</span>
                <svg
                  className={`dropdown-arrow ${isWorkTypesOpen ? 'open' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </button>

              <div className={`dropdown-content ${isWorkTypesOpen ? 'open' : ''}`}>
                <div className="work-types-grid">
                  {workTypes.map((workType, index) => (
                    <div key={index} className="work-type-item">
                      <h4>{workType.title}</h4>
                      <p>{workType.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feature-button">
              <Link to="/portfolio" className="cta-button">{t('home.viewPortfolio')}</Link>
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image" style={{ transform: isMobile ? 'none' : `translateY(${scrollY * 0.01}px)` }}>
            <img src="/home-page-images/blueprint.jpg" alt="Blueprint" loading="lazy" width="1920" height="1280" />
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>{t('home.makeItYourself')}</h2>
            </div>
            <div className="feature-description">
              {t('home.designDescription')}
            </div>
            <div className="feature-button">
              <Link to="/design" className="cta-button">{t('home.useDesigner')}</Link>
            </div>
          </div>
        </section>

        <section className="final-section">
          <div className="final-content">
            <div className="feature-header">
              <h2>{t('home.knowMore')}</h2>
            </div>
            <div className="feature-description">
              {t('home.knowMoreDescription')}
            </div>
            <div className="feature-button">
              <Link to="/about" className="cta-button">{t('home.aboutUs')}</Link>
            </div>
          </div>
        </section>

        {/* Instagram Feed Section */}
        <InstagramFeed limit={6} showTitle={true} />
      </div>
      <Footer />
    </>
  );
};

export default Home;