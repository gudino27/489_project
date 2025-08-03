import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Navigation from './Navigation';
import './css/testimonial-form.css';

const TestimonialForm = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        client_name: '',
        message: '',
        rating: 5,
        project_type: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isValidToken, setIsValidToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const API_BASE = window.location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://api.gudinocustom.com";

    const projectTypes = [
        'Kitchen Remodeling',
        'Bathroom Renovation',
        'Custom Carpentry',
        'Cabinet Installation',
        'Home Remodeling',
        'Commercial Project',
        'Other'
    ];

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/testimonials/validate-token/${token}`);
            setIsValidToken(response.ok);
        } catch (error) {
            console.error('Error validating token:', error);
            setIsValidToken(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const maxFiles = 5;
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        if (selectedFiles.length + files.length > maxFiles) {
            setError(`You can only upload up to ${maxFiles} photos.`);
            return;
        }

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError('Please only upload image files.');
                return false;
            }
            if (file.size > maxFileSize) {
                setError('Each file must be less than 10MB.');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setSelectedFiles(prev => [...prev, ...validFiles]);

        // Create preview URLs
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrls(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });

        setError('');
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUploadProgress(0);

        try {
            const formDataWithFiles = new FormData();
            formDataWithFiles.append('client_name', formData.client_name);
            formDataWithFiles.append('message', formData.message);
            formDataWithFiles.append('rating', formData.rating);
            formDataWithFiles.append('project_type', formData.project_type);
            formDataWithFiles.append('token', token);

            // Add photos
            selectedFiles.forEach((file, index) => {
                formDataWithFiles.append('photos', file);
            });

            const response = await fetch(`${API_BASE}/api/testimonials/submit`, {
                method: 'POST',
                body: formDataWithFiles,
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to submit testimonial');
            }
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            setError('Failed to submit testimonial. Please try again.');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (isValidToken === null) {
        return (
            <>
                <Navigation />
                <div className="testimonial-container">
                    <div className="loading-spinner"></div>
                    <p>Validating access...</p>
                </div>
            </>
        );
    }

    if (!isValidToken) {
        return (
            <>
                <Navigation />
                <div className="testimonial-container">
                    <div className="error-card">
                        <h2>Invalid or Expired Link</h2>
                        <p>This testimonial link is not valid or has expired. Please contact Gudino Custom Woodworking for a new link.</p>
                        <button onClick={() => navigate('/')} className="btn-primary">
                            Return Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (submitted) {
        return (
            <>
                <Navigation />
                <div className="testimonial-container">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <h2>Thank You!</h2>
                        <p>Your testimonial has been submitted successfully. We appreciate your feedback and will review it shortly.</p>
                        <button onClick={() => navigate('/')} className="btn-primary">
                            Return Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation />
            <div className="testimonial-container">
                <div className="testimonial-form-card">
                    <h2>Share Your Experience</h2>
                    <p className="form-description">
                        We'd love to hear about your experience with Gudino Custom Woodworking.
                        Your testimonial helps other homeowners discover our services.
                    </p>

                    <form onSubmit={handleSubmit} className="testimonial-form">
                        <div className="form-group">
                            <label htmlFor="client_name">Your Name</label>
                            <input
                                type="text"
                                id="client_name"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="project_type">Project Type</label>
                            <select
                                id="project_type"
                                name="project_type"
                                value={formData.project_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select project type</option>
                                {projectTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="rating">Rating</label>
                            <div className="rating-container">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star ${formData.rating >= star ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="rating-text">({formData.rating} star{formData.rating !== 1 ? 's' : ''})</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Your Testimonial</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="5"
                                placeholder="Tell us about your experience with our carpentry services..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Photos of Your Project (Optional)</label>
                            <p className="form-help-text">
                                Share photos of your completed cabinets or project. Up to 5 photos, 10MB each.
                            </p>

                            <div className="photo-upload-area">
                                <input
                                    type="file"
                                    id="photos"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="file-input-hidden"
                                />
                                <label htmlFor="photos" className="file-upload-label">
                                    <Upload className="upload-icon" />
                                    <span>Click to upload photos or drag and drop</span>
                                    <span className="file-upload-subtitle">
                                        PNG, JPG, WebP up to 10MB each
                                    </span>
                                </label>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="photo-previews">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="photo-preview">
                                            <img src={url} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="remove-photo-btn"
                                                aria-label="Remove photo"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? (
                                <div className="submit-progress">
                                    <div className="loading-spinner"></div>
                                    {selectedFiles.length > 0 && uploadProgress > 0 ?
                                        `Uploading... ${uploadProgress}%` :
                                        'Submitting...'
                                    }
                                </div>
                            ) : (
                                'Submit Testimonial'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default TestimonialForm;