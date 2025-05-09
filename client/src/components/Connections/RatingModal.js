import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaStar, FaTimes, FaSpinner, FaQuoteLeft, FaBriefcase, FaCalendarAlt, FaDollarSign, FaUser } from 'react-icons/fa';
import axios from 'axios';
import './RatingModal.css';

const RatingModal = ({ isOpen, onClose, jobTitle, applicant, jobId, onRatingSubmit, viewOnly = false }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userRatings, setUserRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const modalRef = useRef(null);
    const portalRef = useRef(null);

    useEffect(() => {
        let portalContainer = document.getElementById('rating-modal-portal');
        
        if (!portalContainer) {
            portalContainer = document.createElement('div');
            portalContainer.id = 'rating-modal-portal';
            document.body.appendChild(portalContainer);
        }
        
        portalRef.current = portalContainer;
        
        return () => {
            if (portalRef.current && portalRef.current.childNodes.length === 0) {
                document.body.removeChild(portalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (viewOnly && isOpen) {
            fetchUserRatings();
        }
    }, [viewOnly, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            const originalPaddingRight = document.body.style.paddingRight;
            const originalPosition = document.body.style.position;
            const originalWidth = document.body.style.width;
            const originalHeight = document.body.style.height;
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.top = `-${window.scrollY}px`; 
            
            const timer = setTimeout(() => setIsVisible(true), 10);
            
            return () => {
                clearTimeout(timer);
                const scrollY = document.body.style.top;
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
                document.body.style.position = originalPosition;
                document.body.style.width = originalWidth;
                document.body.style.height = originalHeight;
                document.body.style.top = '';
                
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
                
                setIsVisible(false);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isVisible) return;
        
        const modalElement = modalRef.current;
        if (!modalElement) return;
        
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (firstElement) {
            setTimeout(() => firstElement.focus(), 50);
        }
        
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleTabKey);
        
        return () => {
            document.removeEventListener('keydown', handleTabKey);
        };
    }, [isOpen, isVisible, onClose]);

    useEffect(() => {
        const checkTheme = () => {
            // Check for both dashboard themes and employee-specific themes
            const isDark = 
                document.body.classList.contains('dark-theme') || 
                document.body.classList.contains('employee-settings-dark-mode') ||
                document.querySelector('.dashboard-wrapper')?.classList.contains('dark-theme') ||
                document.querySelector('.employee-dark-mode') !== null ||
                localStorage.getItem('dashboard-theme') === 'dark';
                
            setIsDarkTheme(isDark);
        };
        
        checkTheme();
        
        // Set up an observer to watch for class changes
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    checkTheme();
                }
            }
        });
        
        // Observe body for class changes
        observer.observe(document.body, { attributes: true });
        
        // Also observe other potential theme containers
        const dashboardEl = document.querySelector('.dashboard-wrapper');
        if (dashboardEl) {
            observer.observe(dashboardEl, { attributes: true });
        }
        
        // Check for theme changes on storage events (localStorage changes)
        const handleStorageChange = (e) => {
            if (e.key === 'dashboard-theme') {
                checkTheme();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Initial check based on localStorage
        if (localStorage.getItem('dashboard-theme') === 'dark') {
            setIsDarkTheme(true);
        }
        
        return () => {
            observer.disconnect();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        // Use the same theme detection logic as all employee components
        const isDark = localStorage.getItem("dashboard-theme") === "dark";
        setIsDarkTheme(isDark);
        
        // Apply appropriate classes to modal for theme consistency
        if (modalRef.current) {
          if (isDark) {
            modalRef.current.classList.add('dark-theme');
          } else {
            modalRef.current.classList.remove('dark-theme');
          }
        }
        
        // Listen for theme changes in localStorage
        const handleStorageChange = (e) => {
          if (e.key === "dashboard-theme") {
            setIsDarkTheme(e.newValue === "dark");
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const fetchUserRatings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:4000/api/auth/my-ratings', {
                withCredentials: true
            });

            if (response.data.success) {
                const ratings = response.data.ratings.map(rating => ({
                    ...rating,
                    job: rating.job || { title: 'Unknown job', skills: [] },
                    employer: rating.employer || { name: 'Unknown employer' },
                    createdAt: new Date(rating.createdAt)
                }));

                setUserRatings(ratings);
                
                const avg = ratings.length > 0 
                    ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
                    : 0;
                setAverageRating(avg);
            } else {
                throw new Error(response.data.message || 'Failed to fetch ratings');
            }
        } catch (err) {
            console.error('Error fetching ratings:', err);
            setError(err.response?.data?.message || 'Failed to fetch ratings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (!review.trim()) {
            setError('Please write a review');
            return;
        }

        setSubmitting(true);
        try {
            const applicantId = typeof applicant === 'object' ? applicant._id : applicant;
            
            if (!applicantId) {
                throw new Error('Applicant information is incomplete');
            }

            const response = await axios.post(
                `http://localhost:4000/api/jobs/rate-applicant`,
                {
                    jobId,
                    applicantId,
                    rating,
                    review
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                onRatingSubmit && onRatingSubmit();
                onClose();
            } else {
                throw new Error(response.data.message || 'Failed to submit rating');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !portalRef.current) return null;

    const renderRatingStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className="star"
                color={index < rating ? "var(--rating-star-active)" : "var(--rating-star-inactive)"}
            />
        ));
    };

    const formatDate = (date) => {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            return 'Unknown date';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatBudget = (job) => {
        if (!job) return 'No budget information';
        
        if (job.budgetType === 'fixed') {
            return `$${job.fixedAmount || 0} Fixed`;
        } else if (job.budgetType === 'hourly') {
            return `$${job.hourlyFrom || 0}-${job.hourlyTo || 0}/hr`;
        }
        
        return 'No budget information';
    };

    const modalContent = (
        <div 
            className={`rating-modal-overlay ${isVisible ? 'visible' : ''} ${isDarkTheme ? 'dark-theme' : ''}`} 
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            aria-modal="true"
            role="dialog"
        >
            {viewOnly ? (
                <div 
                    className={`rating-modal ratings-view ${isDarkTheme ? 'dark-theme' : ''}`} 
                    ref={modalRef} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <FaTimes />
                    </button>

                    <div className="rating-modal-header">
                        <h2>Performance Ratings</h2>
                        <p className="rating-modal-subtitle">Review your professional feedback history</p>
                    </div>

                    <div className="ratings-summary">
                        <div className="average-rating">
                            <div className="rating-overview">
                                <div className="rating-number-display">{averageRating.toFixed(1)}</div>
                                <div className="rating-stars-display">
                                    {renderRatingStars(averageRating)}
                                    <p className="total-reviews">
                                        ({userRatings.length} {userRatings.length === 1 ? 'review' : 'reviews'})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <FaSpinner className="spin" /> 
                            <p>Loading your performance history...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                            <button className="retry-btn" onClick={fetchUserRatings}>Try Again</button>
                        </div>
                    ) : userRatings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <FaStar />
                            </div>
                            <h3>No Ratings Yet</h3>
                            <p>Complete jobs successfully to receive employer ratings and build your professional profile.</p>
                        </div>
                    ) : (
                        <div className="ratings-list">
                            {userRatings.map((item, index) => (
                                <div key={index} className="rating-card">
                                    <div className="rating-card-header">
                                        <div className="rating-stars-wrapper">
                                            {renderRatingStars(item.rating)}
                                        </div>
                                        <span className="rating-date">
                                            <FaCalendarAlt /> {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                    <div className="rating-job-details">
                                        <h4 className="rating-job-title">
                                            <FaBriefcase /> {item.job?.title || 'Unknown job'}
                                        </h4>
                                        <div className="rating-job-meta">
                                            <span className="job-scope">
                                                {item.job?.scope || 'Not specified'}
                                            </span>
                                            <span className="job-budget">
                                                <FaDollarSign /> {formatBudget(item.job)}
                                            </span>
                                        </div>
                                        
                                        {item.job?.skills?.length > 0 && (
                                            <div className="rating-skills">
                                                {item.job.skills.slice(0, 5).map((skill, idx) => (
                                                    <span key={idx} className="skill-pill">{skill}</span>
                                                ))}
                                                {item.job.skills.length > 5 && (
                                                    <span className="skill-pill more-skills">+{item.job.skills.length - 5}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="rating-review-content">
                                        <FaQuoteLeft className="quote-icon" />
                                        <p>{item.review}</p>
                                    </div>
                                    
                                    <div className="rating-employer-info">
                                        <FaUser className="employer-icon" />
                                        <span>{item.employer?.name || 'Unknown employer'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div 
                    className={`rating-modal rating-form-modal ${isDarkTheme ? 'dark-theme' : ''}`} 
                    ref={modalRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <FaTimes />
                    </button>

                    <div className="rating-modal-header">
                        <h2>Rate Project Performance</h2>
                        <p className="rating-modal-subtitle">Provide feedback for your completed project</p>
                    </div>

                    <div className="rating-job-info">
                        <div className="rating-job-title-wrapper">
                            <FaBriefcase className="job-icon" />
                            <h3>{jobTitle || 'Job'}</h3>
                        </div>
                        <div className="rating-applicant-info">
                            <FaUser className="applicant-icon" />
                            <p>Applicant: <strong>{applicant?.name || 'Applicant'}</strong></p>
                        </div>
                    </div>

                    <div className="rating-form">
                        <div className="rating-label">Performance Rating</div>
                        <div className="star-rating-container">
                            {[...Array(5)].map((_, index) => {
                                const ratingValue = index + 1;
                                return (
                                    <label key={index} onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="radio"
                                            name="rating"
                                            value={ratingValue}
                                            onClick={() => setRating(ratingValue)}
                                        />
                                        <FaStar
                                            className="star"
                                            color={ratingValue <= (hover || rating) ? "var(--rating-star-active)" : "var(--rating-star-inactive)"}
                                            onMouseEnter={() => setHover(ratingValue)}
                                            onMouseLeave={() => setHover(0)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        
                        <div className="review-label">Detailed Feedback</div>
                        <textarea
                            placeholder="Share your experience working with this applicant..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            maxLength={500}
                            className="review-textarea"
                        ></textarea>
                        <div className="chars-remaining">
                            {500 - review.length} characters remaining
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button 
                            className="submit-rating-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSubmit(e);
                            }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <FaSpinner className="spin" /> Submitting...
                                </>
                            ) : (
                                'Submit Rating'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(modalContent, portalRef.current);
};

export default RatingModal;