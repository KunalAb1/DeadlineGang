import React, { useEffect, useState, useRef } from 'react';
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProfilePage from './pages/ProfilePage';
import ClassesDetails from './pages/ClassesDetails';

const ProtectedRoute = ({ children }) => {
  const { auth, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/checklogin`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          login({ userId: data.userId });
        } else {
          toast.error(data.message || 'Session expired. Please log in again.');
          navigate('/login');
        }
      } catch (error) {
        toast.error('Error checking login status.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    checkLoginStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div>Loading...</div>;
  }

  return auth.user ? children : <Navigate to="/login" />;
}

const App = () => {
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/`).catch(() => {});
    const keepAlive = setInterval(() => {
      fetch(`${process.env.REACT_APP_API_BASE_URL}/`).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:classid"
            element={
              <ProtectedRoute>
                <ClassesDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </Router>
    </AuthProvider>
  )
}

export default App
