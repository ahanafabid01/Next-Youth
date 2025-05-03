import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../actions/authActions';
import { clearErrors } from '../../actions/errorActions';
import PropTypes from 'prop-types';

const Register = ({ isAuthenticated, error }) => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const [msg, setMsg] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (error.id === 'REGISTER_FAIL') {
      setMsg(error.msg.msg);
    } else {
      setMsg(null);
    }
  }, [error]);

  useEffect(() => {
    if (isAuthenticated) {
      history.push('/');
    }
  }, [isAuthenticated, history]);

  // Fix useEffect missing dependency
  useEffect(() => {
    // Apply themes based on dark mode
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // Additional theming code
  }, [isDarkMode]); // Added isDarkMode as a dependency

  const onChange = e => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();

    const { name, email, password, password2 } = user;

    // Create user object
    const newUser = {
      name,
      email,
      password,
      password2
    };

    // Attempt to register
    dispatch(registerUser(newUser));
  };

  return (
    <div className="register">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={user.name}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={user.email}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={user.password}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password2">Confirm Password</label>
          <input
            type="password"
            name="password2"
            id="password2"
            value={user.password2}
            onChange={onChange}
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

Register.propTypes = {
  isAuthenticated: PropTypes.bool,
  error: PropTypes.object
};

export default Register;