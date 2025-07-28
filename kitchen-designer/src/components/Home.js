import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import './css/home.css'; 

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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
      <div className="hero-section">
        <div className="video-background">
          <video autoPlay muted loop playsInline>
            <source src="/videos/woodworking-hero.mp4" type="video/mp4" />
            <source src="/videos/woodworking-hero.webm" type="video/webm" />
          </video>
          <div className="video-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="company-name">GUDINO</h1>
            <h2 className="company-tagline">Custom WoodWorking</h2>
            <p className="hero-description">Crafting exceptional spaces with precision and artistry</p>
          </div>
        </div>
        
        <div className="curved-bottom"></div>
        <div className="scroll-indicator">
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