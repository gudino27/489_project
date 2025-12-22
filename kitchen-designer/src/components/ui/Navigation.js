import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import '../css/navigation.css';

const Navigation = () => {
    const location = useLocation();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Removed dynamic padding calculation to prevent CLS - now using fixed heights in CSS

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    // Helper function to determine if a link is active
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.includes(path)) return true;
        return false;
    };

    const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const closeDropdown = () => {
        setIsDropdownOpen(false);
        // On mobile, also collapse the main nav
        if (window.innerWidth < 992) {
            handleNavCollapse();
        }
    };

    return (
        <nav className="navbar navbar-expand-lg" id="main-nav">
            <Link className={`navbar-brand ${isActive('/') ? 'active' : ''}`} to="/">
                <img src="/O.png" alt="Gudino Custom Woodworking Logo" width="250" height="60" />
            </Link>

            <button
                className="navbar-toggler"
                type="button"
                onClick={handleNavCollapse}
                aria-controls="navbarNav"
                aria-expanded={!isNavCollapsed}
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className={`collapse navbar-collapse ${isNavCollapsed ? '' : 'show'}`} id="navbarNav">
                <div className="navbar-nav ms-auto">
                    <Link className={`nav-link text-white ${isActive('/portfolio') ? 'active' : ''}`} to="/portfolio" onClick={handleNavCollapse}>
                        <p>Portfolio</p>
                    </Link>
                    <Link className={`nav-link text-white ${isActive('/design') ? 'active' : ''}`} to="/design" onClick={handleNavCollapse}>
                        <p>Design</p>
                    </Link>
                    <Link className={`nav-link text-white ${isActive('/about') ? 'active' : ''}`} to="/about" onClick={handleNavCollapse}>
                        <p>About</p>
                    </Link>
                    <Link className={`nav-link text-white ${isActive('/contact') ? 'active' : ''}`} to="/contact" onClick={handleNavCollapse}>
                        <p>Contact</p>
                    </Link>

                    <div className={`nav-item dropdown ${isActive('/cabinet-care') || isActive('/why-choose-us') ? 'active' : ''} ${isDropdownOpen ? 'show' : ''}`}>
                        <button
                            className="nav-link dropdown-toggle text-white"
                            onClick={toggleDropdown}
                            aria-expanded={isDropdownOpen}
                        >
                            <p style={{fontSize:'17px', fontWeight:'200'}}>Learn More</p>
                        </button>
                        <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                            <li>
                                <Link className="dropdown-item text-left" to="/cabinet-care" onClick={closeDropdown}style={{border:"1px solid #ffffff8a"}}>
                                    Cabinet Care
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item text-center" to="/why-choose-us" onClick={closeDropdown}style={{border:"1px solid #ffffff8a"}}>
                                    Why Choose Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <Link className={`nav-link text-white ${isActive('/admin') ? 'active' : ''}`} to="/admin" onClick={handleNavCollapse}>
                        <p>Login</p>
                    </Link>
                    <div className="nav-item nav-divider">
                        <LanguageSelector className="nav-language-selector" />
                    </div>
                </div>
            </div>

        </nav >
    );
};

export default Navigation;