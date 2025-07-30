import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import './css/home.css';
import { useAnalytics } from '../hooks/useAnalytics'; 

const Home = () => {
  // Analytics tracking
  useAnalytics('/');
  
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isWorkTypesOpen, setIsWorkTypesOpen] = useState(false);

  const workTypes = [
    { title: "Kitchen Remodeling", description: "Custom cabinets, countertops, and complete kitchen transformations" },
    { title: "Bathroom Renovations", description: "Vanities, storage solutions, and spa-like bathroom designs" },
    { title: "Living Room Built-ins", description: "Entertainment centers, bookshelves, and custom storage" },
    { title: "Bedroom Solutions", description: "Closet organizers, wardrobes, and bedroom furniture" },
    { title: "Laundry Room Design", description: "Efficient storage and organizational systems" },
    { title: "Commercial Projects", description: "Office furniture, retail displays, and commercial woodwork" }
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
    };
    
    checkIfMobile();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile]);

  return (
    <>
      <Navigation />

      {/* Hero Section with Video Background */}
      <div className="hero-section" style={{
        paddingBottom: isMobile ? '80px' : '250px',
        paddingTop: isMobile ? '80px' : '250px'
      }}>
        <div className="video-background">
          <video autoPlay muted loop playsInline onError={(e) => console.warn('Video failed to load:', e)}>
            <source src="/videos/woodworking-hero.mp4" type="video/mp4" />
            <source src="/videos/woodworking-hero.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="company-name">GUDINO</h1>
            <h2 className="company-tagline">Custom WoodWorking</h2>
            <p className="hero-description">Crafting exceptional spaces with precision and artistry</p>
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
          <div className="section-content" style={{transform: isMobile ? 'none' : `translateY(${scrollY * 0.01}px)`}}>
            <div className="quote">
              Proudly serving homeowners and businesses for decades.
              Trusted members of the Washington and surrounding state communities.
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image" style={{transform: isMobile ? 'none' : `translateY(${scrollY * 0.02}px)`}}>
            <img src="/home-page-images/whitekitchen.jpg" alt="White Kitchen" />
          </div>
        </section>

        <section className="content-section">
          <div className="section-content">
            <div className="quote">
              "Behind every great space is a team that cares about the details.
              We at Gudino Custom Woodworking strive to foster a team who believes just that."
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>Unlimited Scope</h2>
            </div>
            <div className="feature-description">
              Gudino Custom Woodworking offers a wide range of services, materials, 
              and expertise—so you don't have to juggle multiple contractors. 
              Our diverse team brings experience across disciplines, 
              ready to take on any project you can imagine.
            </div>
            <div className="feature-button">
              <Link to="/contact" className="cta-button">Contact Us</Link>
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image" style={{transform: isMobile ? 'none' : `translateY(${scrollY * 0.015}px)`}}>
            <img src="/home-page-images/diningroom.jpg" alt="Dining Room" />
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>Our Creations</h2>
            </div>
            <div className="feature-description">
              Gudino Custom Woodworking has completed hundreds of projects over the years, 
              building a rich and diverse portfolio of work. From modern kitchen remodels to full-home renovations, 
              our team has delivered exceptional results across residential and commercial spaces.
            </div>
            
            <div className="work-types-dropdown">
              <button 
                className="dropdown-toggle"
                onClick={toggleWorkTypes}
                aria-expanded={isWorkTypesOpen}
              >
                <span>See What We Do</span>
                <svg 
                  className={`dropdown-arrow ${isWorkTypesOpen ? 'open' : ''}`}
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
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
              <Link to="/portfolio" className="cta-button">View our Portfolio</Link>
            </div>
          </div>
        </section>

        <section className="image-section parallax-section">
          <div className="parallax-image" style={{transform: isMobile ? 'none' : `translateY(${scrollY * 0.01}px)`}}>
            <img src="/home-page-images/blueprint.jpg" alt="Blueprint" />
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-content">
            <div className="feature-header">
              <h2>Make it Yourself</h2>
            </div>
            <div className="feature-description">
              Have something else in mind? Bring your vision to life with our easy-to-use design tool. 
              Customize layouts, experiment with finishes, and plan your dream space—your way.
            </div>
            <div className="feature-button">
              <Link to="/design" className="cta-button">Use our Designer</Link>
            </div>
          </div>
        </section>

        <section className="final-section">
          <div className="final-content">
            <div className="feature-header">
              <h2>Would you Like to Know More?</h2>
            </div>
            <div className="feature-description">
              We're more than just the spaces we build. Click below to learn about our roots, 
              hear from real customers, and get to know the team behind Gudino Custom Woodworking.
            </div>
            <div className="feature-button">
              <Link to="/about" className="cta-button">About Us</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;