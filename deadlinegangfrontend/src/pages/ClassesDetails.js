import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {  } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './ClassesDetails.css';

const ClassesDetails = () => {
  const { classid } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Edit/Delete menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const menuRef = useRef(null);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/getclassbyid/${classid}`, {
        method: 'GET', credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) setClassroom(data.data);
      else toast.error(data.message || 'Failed to fetch class details');
    } catch {
      toast.error('Error fetching class details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchClassDetails(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classid]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/getuser`, {
          method: 'GET', credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) setUser(data.data);
        else toast.error(data.message || 'Failed to fetch user data');
      } catch {
        toast.error('An error occurred while fetching user data');
      }
    };
    fetchUser();
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmitPost = async () => {
    if (!postTitle.trim()) {
      toast.error('Post title is required');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', postTitle);
      formData.append('description', postDescription);
      formData.append('classId', classid);
      if (selectedFile) formData.append('file', selectedFile);

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/addpost`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Post created successfully');
        setPostTitle('');
        setPostDescription('');
        setSelectedFile(null);
        setShowPopup(false);
        fetchClassDetails();
      } else {
        toast.error(data.message || 'Failed to create post');
      }
    } catch {
      toast.error('An error occurred while creating the post');
    } finally {
      setUploading(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/request-to-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: classid, studentEmail: user?.email }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setShowJoinPopup(false);
        setShowOtpPopup(true);
        toast.success('OTP sent to the class owner');
      } else {
        toast.error(data.message || 'Failed to send join request');
      }
    } catch {
      toast.error('An error occurred while sending join request');
    }
  };

  const handleSubmitOtp = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: classid, studentEmail: user?.email, otp }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setOtp('');
        setShowOtpPopup(false);
        toast.success('Successfully joined the class');
        fetchClassDetails();
      } else {
        setOtpError(data.message || 'Failed to verify OTP');
      }
    } catch {
      toast.error('An error occurred while verifying OTP');
    }
  };

  // ── Edit Post ──
  const openEditPopup = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description || '');
    setOpenMenuId(null);
  };

  const handleEditSubmit = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/editpost/${editingPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Post updated successfully');
        setEditingPost(null);
        fetchClassDetails();
      } else {
        toast.error(data.message || 'Failed to update post');
      }
    } catch {
      toast.error('An error occurred while updating the post');
    }
  };

  // ── Delete Post ──
  const handleDeletePost = async (postId) => {
    setOpenMenuId(null);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/class/deletepost/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Post deleted');
        fetchClassDetails();
      } else {
        toast.error(data.message || 'Failed to delete post');
      }
    } catch {
      toast.error('An error occurred while deleting the post');
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📎';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📑';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
    return '📎';
  };

  // View: open file directly. For images, open as-is.
  // For raw files (pdf/doc/etc), use Google Docs Viewer for inline preview.
  const getViewUrl = (post) => {
    if (!post.fileUrl) return '#';
    if (post.fileType?.includes('image')) return post.fileUrl;
    return `https://docs.google.com/viewer?url=${encodeURIComponent(post.fileUrl)}&embedded=true`;
  };

  // Download: always the direct Cloudinary URL, with fl_attachment for raw files
  const getDownloadUrl = (post) => {
    if (!post.fileUrl) return '#';
    if (post.fileType?.includes('image')) {
      return post.fileUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    return post.fileUrl.replace('/upload/', '/upload/fl_attachment/');
  };

  if (loading) return <div className="loading">Loading...</div>;

  const isStudent = classroom?.students?.includes(user?.email);
  const isOwner = classroom?.owner === user?._id;
  const avatarLetter = classroom?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="class-details">

      {/* ── Hero Card ── */}
      <div className="section1">
        <div className="class-avatar">{avatarLetter}</div>
        <h1 className="class-name">{classroom?.name}</h1>
        <p className="class-description">{classroom?.description}</p>

        <div className="class-meta">
          <span className="meta-badge">👥 {classroom?.students?.length ?? 0} students</span>
          {isOwner && <span className="meta-badge owner-badge">👑 You own this</span>}
          {isStudent && <span className="meta-badge student-badge">✅ Joined</span>}
        </div>

        {isOwner && (
          <button className="add-post-btn" onClick={() => setShowPopup(true)}>
            + Add Post
          </button>
        )}
        {!isStudent && !isOwner && (
          <button className="add-post-btn join-btn" onClick={() => setShowJoinPopup(true)}>
            Join Class
          </button>
        )}
      </div>

      {/* ── Posts ── */}
      {(isStudent || isOwner) ? (
        classroom?.posts?.length > 0 ? (
          <div className="post-grid">
            {classroom.posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-card-top">
                  <h3>{post.title}</h3>
                  <div className="post-card-actions">
                    <span className="post-date">
                      {new Date(post.createdAt).toLocaleDateString('en-GB')}
                    </span>
                    {isOwner && (
                      <div className="post-menu-wrapper" ref={openMenuId === post._id ? menuRef : null}>
                        <button
                          className="post-menu-btn"
                          onClick={() => setOpenMenuId(openMenuId === post._id ? null : post._id)}
                        >
                          ⋯
                        </button>
                        {openMenuId === post._id && (
                          <div className="post-menu-dropdown">
                            <button onClick={() => openEditPopup(post)}>✏️ Edit</button>
                            <button onClick={() => handleDeletePost(post._id)} className="delete-option">
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p>{post.description}</p>

                {post.fileUrl && (
                  <div className="file-actions">
                    <a
                      href={getViewUrl(post)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-view-btn"
                    >
                      {getFileIcon(post.fileType)} {post.fileName || 'View File'}
                    </a>
                    <a
                      href={getDownloadUrl(post)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-download-btn-small"
                    >
                      ⬇️ Download
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <p>📭 No posts yet. {isOwner ? 'Add the first post!' : 'Check back later.'}</p>
          </div>
        )
      ) : (
        <div className="no-posts">
          <p>🔒 Join this class to see posts.</p>
        </div>
      )}

      {/* ── Add Post Modal ── */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Add Post</h3>
            <input
              type="text"
              placeholder="Post title"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
            />
            <div className="file-upload-area">
              <label htmlFor="file-input" className="file-upload-label">
                {selectedFile ? (
                  <span>📎 {selectedFile.name}</span>
                ) : (
                  <span>📎 Attach a file (optional)</span>
                )}
              </label>
              <input
                id="file-input"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {selectedFile && (
                <button className="remove-file-btn" onClick={() => setSelectedFile(null)}>
                  ✕ Remove
                </button>
              )}
            </div>
            <div className="popup-buttons">
              <button onClick={() => { setShowPopup(false); setSelectedFile(null); }}>
                Cancel
              </button>
              <button onClick={handleSubmitPost} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Post Modal ── */}
      {editingPost && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Edit Post</h3>
            <input
              type="text"
              placeholder="Post title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="popup-buttons">
              <button onClick={() => setEditingPost(null)}>Cancel</button>
              <button onClick={handleEditSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Join Modal ── */}
      {showJoinPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Join Class</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '16px' }}>
              An OTP will be sent to the class owner for approval.
            </p>
            <div className="popup-buttons">
              <button onClick={() => setShowJoinPopup(false)}>Cancel</button>
              <button onClick={handleJoinRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* ── OTP Modal ── */}
      {showOtpPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Enter OTP</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '12px' }}>
              Enter the OTP sent to the class owner's email.
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {otpError && <p className="otp-error">{otpError}</p>}
            <div className="popup-buttons">
              <button onClick={() => { setShowOtpPopup(false); setOtpError(''); }}>Cancel</button>
              <button onClick={handleSubmitOtp}>Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesDetails;