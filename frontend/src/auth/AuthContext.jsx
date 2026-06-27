import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);
const STORAGE_USER_KEY = 'pims-user';

const loadUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    // ignore parse errors
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [user]);

  const getErrorMessage = (error, fallback) => {
    if (!error.response) {
      return 'Không kết nối được backend. Hãy chạy backend trước (npm run backend).';
    }
    return error.response?.data?.message || fallback;
  };

  const login = async ({ username, password, role }) => {
    try {
      const response = await api.post('/auth/login', {
        username: username.trim().toLowerCase(),
        password,
        role,
      });

      const payload = response.data;
      setUser(payload);
      return { success: true, user: payload };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Không thể đăng nhập.'),
      };
    }
  };

  const register = async ({ username, password, role }) => {
    try {
      const response = await api.post('/auth/register', {
        username: username.trim().toLowerCase(),
        password,
        role,
      });
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Không thể đăng ký.'),
      };
    }
  };

  const createAccount = async ({ username, password, role }) => {
    try {
      const response = await api.post('/auth/create', {
        username: username.trim().toLowerCase(),
        password,
        role,
      });
      return { success: true, account: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tạo tài khoản.',
      };
    }
  };

  const getPendingAccounts = async () => {
    try {
      const response = await api.get('/auth/pending');
      return { success: true, accounts: response.data };
    } catch (error) {
      return { success: false, message: 'Không thể tải danh sách doanh.' };
    }
  };

  const approveAccount = async (id) => {
    try {
      const response = await api.put(`/auth/approve/${id}`);
      return { success: true, account: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể duyệt tài khoản.',
      };
    }
  };

  const completeProfile = async ({ fullName, phone, department }) => {
    if (!user) {
      return { success: false, message: 'Người dùng chưa đăng nhập.' };
    }

    try {
      const response = await api.put('/auth/profile', {
        username: user.username,
        fullName,
        phone,
        department,
      });
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật hồ sơ.',
      };
    }
  };

  const updateProfileExtended = async ({ fullName, phone, department, className, semester, campus, avatarUrl }) => {
    if (!user) {
      return { success: false, message: 'Người dùng chưa đăng nhập.' };
    }

    try {
      const response = await api.put('/auth/profile', {
        username: user.username,
        fullName,
        phone,
        department,
        className,
        semester,
        campus,
        avatarUrl,
      });
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật hồ sơ.',
      };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      register,
      createAccount,
      getPendingAccounts,
      approveAccount,
      completeProfile,
      updateProfileExtended,
      isAuthenticated: Boolean(user),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
