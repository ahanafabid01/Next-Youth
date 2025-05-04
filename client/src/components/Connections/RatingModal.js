import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes, FaArrowLeft, FaSpinner } from 'react-icons/fa';
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

    useEffect(() => {
        if (viewOnly && isOpen) {
            fetchUserRatings();
        }
    }, [viewOnly, isOpen]);

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
            // Ensure we have the applicant ID, either as string or from object
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

    if (!isOpen) return null;

    const renderRatingStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className="star"
                color={index < rating ? "#ffc107" : "#e4e5e9"}
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

    if (viewOnly) {
        return (
            <div className="rating-modal-overlay">
                <div className="rating-modal ratings-view">
                    <button className="close-modal" onClick={onClose}>
                        <FaTimes />
                    </button>

                    <h2>My Ratings & Reviews</h2>

                    <div className="ratings-summary">
                        <div className="average-rating">
                            <h3>Overall Rating</h3>
                            <div className="rating-display">
                                {renderRatingStars(averageRating)}
                                <span className="rating-number">
                                    {averageRating.toFixed(1)}
                                </span>
                            </div>
                            <p className="total-reviews">
                                ({userRatings.length} {userRatings.length === 1 ? 'review' : 'reviews'})
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-spinner">
                            <FaSpinner className="spin" /> Loading ratings...
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : userRatings.length === 0 ? (
                        <div className="no-ratings-message">
                            <p>You haven't received any ratings yet.</p>
                        </div>
                    ) : (
                        <div className="ratings-list">
                            {userRatings.map((item, index) => (
                                <div key={index} className="rating-item">
                                    <div className="rating-header">
                                        <div className="rating-stars">
                                            {renderRatingStars(item.rating)}
                                        </div>
                                        <span className="rating-date">
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                    <div className="rating-job-details">
                                        <h4 className="rating-job-title">
                                            Job: {item.job?.title || 'Unknown job'}
                                        </h4>
                                        <p className="rating-job-scope">
                                            {item.job?.scope || 'Not specified'}
                                        </p>
                                        <div className="rating-job-budget">
                                            Budget: {formatBudget(item.job)}
                                        </div>
                                        {item.job?.skills?.length > 0 && (
                                            <div className="rating-skills">
                                                {item.job.skills.slice(0, 5).map((skill, idx) => (
                                                    <span key={idx} className="skill-tag">{skill}</span>
                                                ))}
                                                {item.job.skills.length > 5 && (
                                                    <span className="skill-tag">+{item.job.skills.length - 5} more</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="rating-review">{item.review}</p>
                                    <div className="rating-employer">
                                        Rated by: {item.employer?.name || 'Unknown employer'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rating-modal-overlay">
            <div className="rating-modal">
                <button className="close-modal" onClick={onClose}>
                    <FaTimes />
                </button>

                <h2>Rate Applicant</h2>
                <div className="rating-job-info">
                    <h3>{jobTitle || 'Job'}</h3>
                    <p>Applicant: {applicant?.name || 'Applicant'}</p>
                </div>

                <div className="star-rating">
                    {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name="rating"
                                    value={ratingValue}
                                    onClick={() => setRating(ratingValue)}
                                />
                                <FaStar
                                    className="star"
                                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                />
                            </label>
                        );
                    })}
                </div>

                <textarea
                    placeholder="Write your review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    maxLength={500}
                    className="review-input"
                ></textarea>

                {error && <div className="error-message">{error}</div>}

                <button 
                    className="submit-rating-btn"
                    onClick={handleSubmit}
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
    );
};

export default RatingModal;