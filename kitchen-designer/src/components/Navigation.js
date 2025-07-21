import React,{ Link, useLocation } from 'react-router-dom';

const Navigation = () => {
    const location = useLocation();

    // Helper function to determine if a link is active
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.includes(path)) return true;
        return false;
    };

    return (
        <nav className="navbar navbar-expand" id="main-nav" style={{ backgroundColor: 'rgb(0, 0, 0)' }}>
            <Link className={`nav-link text-white ${isActive('/') ? 'active' : ''}`} to="/">
                Home
            </Link>
            <div className="container-fluid justify-content-end">
                <div className="navbar-expand" id="navbarNav">
                    <div className="navbar-nav d-flex justify-content-end w-100">
                        <Link className={`nav-link text-white ${isActive('/portfolio') ? 'active' : ''}`} to="/portfolio">
                            Portfolio
                        </Link>
                        <Link className={`nav-link text-white ${isActive('/design') ? 'active' : ''}`} to="/design">
                            Design
                        </Link>
                        <Link className={`nav-link text-white ${isActive('/about') ? 'active' : ''}`} to="/about">
                            About
                        </Link>
                        <Link className={`nav-link text-white ${isActive('/contact') ? 'active' : ''}`} to="/contact">
                            Contact
                        </Link>
                        <Link className={`nav-link text-white ${isActive('/admin') ? 'active' : ''}`} to="/admin">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;