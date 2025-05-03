import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../../actions/authActions';
import { useTheme } from '../../hooks/useTheme';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const { loading, success, error: authError } = useSelector((state) => state.auth);

  useEffect(() => {
    if (success) {
      setMessage('Password reset link sent to your email.');
      setError('');
    } else if (authError) {
      setError(authError);
      setMessage('');
    }
  }, [success, authError]);

  // Fix useEffect missing dependency
  useEffect(() => {
    // Apply themes based on dark mode
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Additional theming code
  }, [isDarkMode]); // Added isDarkMode as a dependency

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  return (
    <div className="forgot-password">
      <h2>Forgot Password</h2>
      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;