import { useState, useEffect, useRef } from 'react';
import { FaBell, FaSearch, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../../api/services';

const getDisplayName = (user) => {
  if (!user) return 'User';
  if (user.fullName?.trim()) return user.fullName.trim();
  return user.username?.split('@')[0] || 'User';
};

const Header = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const displayName = getDisplayName(auth.user);
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const hasAvatar = Boolean(auth.user?.avatarUrl) && !avatarError;

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userId = auth.user?.id;

  const fetchNotifications = async () => {
    if (userId) {
      const data = await getAllNotifications(userId);
      setNotifications(data || []);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !(n.read || n.isRead)).length;

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top justify-content-between shadow-sm">
      <div style={{ width: '300px' }}>
        <InputGroup className="bg-light rounded-pill border-0 px-2 align-items-center">
          <FaSearch className="text-muted ms-2" size={14} />
          <Form.Control
            placeholder="Search..."
            className="bg-transparent border-0 shadow-none ps-2"
            style={{ fontSize: '0.9rem' }}
          />
        </InputGroup>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="position-relative" ref={dropdownRef}>
          <button
            type="button"
            className="btn btn-link text-secondary p-2 position-relative rounded-circle bg-light border-0"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ transition: 'all 0.2s' }}
          >
            <FaBell size={16} />
            {unreadCount > 0 && (
              <span 
                className="position-absolute translate-middle badge rounded-pill bg-danger border border-light" 
                style={{ 
                  fontSize: '0.62rem', 
                  padding: '0.25em 0.5em',
                  top: '6px',
                  left: '26px'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              className="position-absolute end-0 mt-2 card shadow-lg border-0"
              style={{
                width: '350px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                border: '1px solid rgba(225, 225, 225, 0.7)'
              }}
            >
              <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center py-3 px-3">
                <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-link text-primary p-0 border-0 fw-semibold text-decoration-none"
                    style={{ fontSize: '0.78rem' }}
                    onClick={handleMarkAllAsRead}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
              <div
                className="card-body p-0"
                style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin'
                }}
              >
                {notifications.length === 0 ? (
                  <div className="text-center text-muted py-5 px-3">
                    <FaBell size={24} className="text-muted mb-2 opacity-50" />
                    <p className="mb-0" style={{ fontSize: '0.82rem' }}>Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {notifications.map((notification) => {
                      const isNotificationRead = notification.read || notification.isRead;
                      return (
                        <div
                          key={notification.id}
                          className={`list-group-item list-group-item-action d-flex align-items-start gap-2 border-0 px-3 py-3 position-relative ${!isNotificationRead ? 'bg-light bg-opacity-75 fw-semibold' : ''}`}
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            borderBottom: '1px solid rgba(240, 240, 240, 0.8)'
                          }}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          {!isNotificationRead && (
                            <span
                              className="position-absolute bg-primary rounded-circle"
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                left: '8px',
                                top: '22px'
                              }}
                            />
                          )}
                          <div className="flex-grow-1" style={{ paddingLeft: !isNotificationRead ? '8px' : '0' }}>
                            <div className="text-dark fw-bold mb-1" style={{ fontSize: '0.82rem' }}>{notification.title}</div>
                            <div className="text-secondary mb-1" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>{notification.message}</div>
                            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                              {new Date(notification.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </small>
                          </div>
                          <button
                            type="button"
                            className="btn btn-link text-muted p-1 border-0 align-self-center opacity-50 hover-danger"
                            onClick={(e) => handleDelete(e, notification.id)}
                            style={{ borderRadius: '5px' }}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 border-start ps-3">
          <div className="text-end">
            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{displayName}</div>
            <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>
              {auth.user?.role ? `${auth.user.role} • FPT University` : 'FPT University'}
            </small>
          </div>
          {hasAvatar ? (
            <img
              src={auth.user.avatarUrl}
              alt={displayName}
              className="rounded-circle"
              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div
              className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}
            >
              {avatarInitial}
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-outline-danger btn-sm px-2 py-1"
          onClick={handleLogout}
          style={{ fontSize: '0.78rem' }}
        >
          <FaSignOutAlt className="me-1" size={12} />
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default Header;
