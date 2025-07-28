import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import './css/about.css';
import { useAnalytics } from '../hooks/useAnalytics';

const About = () => {
    // Analytics tracking
    useAnalytics('/about');
    
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // API base URL
    const API_BASE = window.location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://api.gudinocustom.com";
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
                    <h1>Meet Our Team</h1>
                    <p>Company General Description</p>
                </div>
                {/* Company Info */}
                <div className="company-info">
                    <h3>Company History</h3>
                    <p>Company History/mission</p>
                </div>
                {/* Team Section */}
                <div className="section-title">
                    <h2>Our Team</h2>
                    <p>Meet the Team who make Your Vision happen</p>
                </div>
                <div id="teamGrid" className="team-grid">
                    {loading && (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Loading team members...</p>
                        </div>
                    )}
                    {error && (
                        <div className="error-message">{error}</div>
                    )}
                    {!loading && !error && teamMembers.length === 0 && (
                        <p className="loading" style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            No team members found.
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
                                        <span>Joined {formatDate(employee.joined_date)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default About;