import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Homepage.css';

const FEATURES = [
  { emoji: '👥', title: 'Study Together', desc: 'Join groups of learners working toward the same goals.' },
  { emoji: '📚', title: 'Shared Resources', desc: 'Post notes, links, and materials your whole group can access.' },
  { emoji: '💬', title: 'Group Discussions', desc: 'Ask questions and get answers from peers who get it.' },
  { emoji: '🚀', title: 'Track Progress', desc: 'Stay on top of what your community is working on.' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user first, then immediately fetch classrooms in the same function
    const fetchData = async () => {
      try {
        // Step 1: get user
        const userRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/getuser`, {
          credentials: 'include',
        });
        const userData = await userRes.json();
        if (!userRes.ok) return;

        const fetchedUser = userData.data;
        setUser(fetchedUser);

        // Step 2: get classrooms based on role
        const isTeacher = fetchedUser.role === 'teacher';
        const url = isTeacher
          ? `${process.env.REACT_APP_API_BASE_URL}/class/classroomscreatedbyme`
          : `${process.env.REACT_APP_API_BASE_URL}/class/classroomsforstudent`;

        const classRes = await fetch(url, { credentials: 'include' });
        const classData = await classRes.json();

        if (classRes.ok) {
          setClassrooms(classData.data || []);
        } else {
          setClassrooms([]);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setClassrooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // runs once on mount

  const isTeacher = user?.role === 'teacher';

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <h1>Due Tomorrow?<br />Due Now.</h1>
        <p>
          DeadlineGang is your community for focused study groups,
          shared resources, and peer-driven learning.
        </p>
        <Link to="/profile" className="hero-btn">
          Go to My Profile →
        </Link>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="home-section">
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-item" key={f.title}>
                <div className="feature-emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Classrooms ── */}
      <section className="home-section">
        <div className="section-header">
          <h2>{isTeacher ? 'My Classrooms' : 'Joined Classrooms'}</h2>
          {isTeacher && (
            <Link to="/profile" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              + Create Classroom
            </Link>
          )}
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading classrooms...</p></div>
        ) : classrooms.length === 0 ? (
          <div className="empty-state">
            <p>
              {isTeacher
                ? 'No classrooms yet. Create one from your profile!'
                : "You haven't joined any classrooms yet."}
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {classrooms.map((room) => (
              <div
                key={room._id}
                className="classroom-card"
                onClick={() => navigate(`/classes/${room._id}`)}
              >
                <div className="classroom-card-header">
                  <div className="classroom-avatar">
                    {room.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{room.name}</h3>
                    <span className="classroom-meta">
                      {room.students?.length ?? 0} students
                    </span>
                  </div>
                </div>
                <p>{room.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;