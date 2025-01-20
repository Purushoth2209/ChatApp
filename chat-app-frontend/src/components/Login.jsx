import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './styles/Login.css';
import { useNavigate } from 'react-router-dom';
import Logo from "../Logo.png";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const socketInstance = io(apiUrl);
    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [apiUrl]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
         `${apiUrl || 'http://localhost:5000'}/api/auth/login`,
        { phoneNumber, password }
      );

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('profileId', response.data.profileId);
        localStorage.setItem('username', response.data.username);

        if (socket) {
          socket.emit('setUser', response.data.profileId);
        }

        navigate('/chat');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="logo-container">
        <img src={Logo} alt="App Logo" className="app-logo" />
        <h1 className="app-title">Sparrow</h1>
      </div>
      <h2 className="greeting-text">Welcome Back! Please Login to Continue</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button type="submit" className="login-btn">Login</button>
      </form>
      <div className="signup-link">
        <a href="/signup">Don't have an account? Sign up</a>
      </div>
    </div>
  );
};

export default Login;
