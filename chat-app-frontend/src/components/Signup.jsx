import React, { useState } from 'react';
import axios from 'axios';
import './styles/Signup.css';
import Logo from "../Logo.png";

const Signup = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${apiUrl}/api/auth/register`,
        { phoneNumber, password, username }
      );

      alert('Registration successful. Please login.');
      window.location.href = '/login';

    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert('Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="logo-container">
        <img src={Logo} alt="App Logo" className="app-logo" />
        <h1 className="app-title">Sparrow</h1>
      </div>
      <h2 className="greeting-text">Create your account</h2>
      <form onSubmit={handleSignup} className="signup-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="signup-input"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />
        <button type="submit" className="signup-btn">Signup</button>
      </form>
      <div className="login-link">
        <a href="/login">Already have an account? Login</a>
      </div>
    </div>
  );
};

export default Signup;
