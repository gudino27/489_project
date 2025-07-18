import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import './css/home.css'; 

const Home = () => {
  return (
    <>
      <Navigation />
      
      <div class="container">
        <div class="banner">
            Master Build Cabinets
        </div>
      </div>

      <div className="introduction">
        Proudly serving homeowners and businesses for decades.
        Trusted members of the Pullman and Everett communities.
      </div>

      <div className="intro-image">
        <img src="/home-page-images/whitekitchen.jpg" alt="White Kitchen" />
      </div>

      <div className="quote">
        "Behind every great space is a team that cares about the details.
        We at Master Build Cabinets strive to foster a team who believes just that."
      </div>

      <div className="intro-image">
        <img src="/home-page-images/bathroom.jpg" alt="Bathroom" />
      </div>

      <div className="description-header">
        Unlimited Scope
      </div>

      <div className="description">
        Master Build Cabinets offers a wide range of services, materials, 
        and expertise—so you don't have to juggle multiple contractors. 
        Our diverse team brings experience across disciplines, 
        ready to take on any project you can imagine. 
      </div>

      <div className="button">
        <Link to="/contact" className="btn btn-secondary">Contact Us</Link>
      </div>

      <div class="intro-image">
        <img src="home-page-images/diningroom.jpg"/>
      </div>

      <div className="description-header">
        Our Creations
      </div>

      <div className="description">
        Master Build Cabinets has completed hundreds of projects over the years, 
        building a rich and diverse portfolio of work. From modern kitchen remodels to full-home renovations, 
        our team has delivered exceptional results across residential and commercial spaces. 
        Every project reflects our commitment to quality, craftsmanship, and client satisfaction.
      </div>

      <div className="button">
        <Link to="/portfolio" className="btn btn-secondary">View our Portfolio</Link>
      </div>

      <div class="intro-image">
        <img src="home-page-images/blueprint.jpg"/>
      </div>

      <div className="description-header">
        Make it Yourself
      </div>

      <div className="description">
        Have something else in mind? Bring your vision to life with our easy-to-use design tool. Customize layouts, 
        experiment with finishes, and plan your dream space—your way.
      </div>

      <div className="button">
        <Link to="/design" className="btn btn-secondary">Use our Designer</Link>
      </div>

      <div className="description-header">
        Would you Like to Know More?
      </div>

      <div className="description">
        We're more than just the spaces we build. Click below to learn about our roots, 
        hear from real customers, and get to know the team behind Master Build Cabinets.
      </div>

      <div className="button">
        <Link to="/about" className="btn btn-secondary">About Us</Link>
      </div>
    </>
  );
};

export default Home;