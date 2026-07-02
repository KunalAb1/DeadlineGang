import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import SearchPopup from './SearchPopup';

const Navbar = () => {
    const { auth, logout } = useAuth();

    const [showPopup, setShowPopup] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const menuRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isOnProfile = location.pathname === '/profile';

    const handleProfileClick = () => {
        setShowMenu(false);

        if (isOnProfile) {
            navigate(-1);
        } else {
            navigate('/profile');
        }
    };

    return (
        <nav className="navbar">

            <div className="navbar-left">

                <Link to="/" className="logo">
                    DeadlineGang
                </Link>

                <svg
                    onClick={() => setShowPopup(!showPopup)}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                </svg>

                {showPopup && (
                    <SearchPopup
                        onClose={() => setShowPopup(false)}
                    />
                )}

            </div>

            <div className="navbar-right" ref={menuRef}>

                <button
                    className="theme-toggle-btn"
                    onClick={() => setDarkMode(!darkMode)}
                >
                    {darkMode ? "☀️" : "🌙"}
                </button>

                {auth.user ? (
                    <>
                        <div className="desktop-actions">

                            <button
                                className={`profile-icon-btn ${isOnProfile ? 'profile-icon-active' : ''}`}
                                onClick={handleProfileClick}
                            >
                                {isOnProfile ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>

                            <button
                                className="logout-btn"
                                onClick={logout}
                            >
                                Logout
                            </button>

                        </div>

                        <button
                            className="menu-btn"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            ☰
                        </button>

                        {showMenu && (
                            <div className="mobile-menu">

                                <button onClick={handleProfileClick}>
                                    👤 Profile
                                </button>

                                <button onClick={logout}>
                                    🚪 Logout
                                </button>

                            </div>
                        )}

                    </>
                ) : (
                    <Link
                        to="/login"
                        className="login-btn"
                    >
                        Login
                    </Link>
                )}

            </div>

        </nav>
    );
};

export default Navbar;