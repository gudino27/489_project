import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import '../css/navigation.css';

const Navigation = () => {
    const location = useLocation();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);

    // Add this useEffect to dynamically set body padding
    useEffect(() => {
        const updatePadding = () => {
            const navbar = document.getElementById('main-nav');
            if (navbar) {
                const navHeight = navbar.offsetHeight;
                document.body.style.paddingTop = `${navHeight + 1}px`;
            }
        };

        updatePadding();
        window.addEventListener('resize', updatePadding);

        return () => window.removeEventListener('resize', updatePadding);
    }, []);

    // Helper function to determine if a link is active
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.includes(path)) return true;
        return false;
    };

    const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

    return (
        <nav className="navbar navbar-expand-lg" id="main-nav">
            <Link className={`navbar-brand ${isActive('/') ? 'active' : ''}`} to="/">
                <img src="/O.png" alt="Home" width="250" />
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