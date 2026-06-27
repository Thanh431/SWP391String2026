import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LoginPage.css';

const roleOptions = [
  { value: 'Student', label: 'Sinh viên' },
  { value: 'Admin', label: 'Quản trị' },
  { value: 'Mentor', label: 'Giảng viên' },
  { value: 'Committee', label: 'Hội đồng' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidFptEmail = (value) => /^[^\s@]+@fpt\.edu\.vn$/i.test(value.trim());
  const roleLabel = roleOptions.find((r) => r.value === role)?.label ?? role;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (!isValidFptEmail(email)) {
      setError('Email phải có đuôi @fpt.edu.vn.');
      return;
    }

    setSubmitting(true);
    const result = await auth.login({ username: email.trim(), password, role });
    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  const handleRegister = () => {
    if (role === 'Student') {
      navigate('/register');
      return;
    }
    window.location.href =
      'mailto:trintse180561@fpt.edu.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20t%C3%A0i%20kho%E1%BA%A3n%20Mentor%20ho%E1%BA%B7c%20Committee&body=Xin%20ch%C3%A0o%20Admin%2C%0A%0AT%C3%B4i%20mu%E1%BB%91n%20%C4%83ng%20k%C3%BD%20vai%20tr%C3%B2%20' +
      encodeURIComponent(role) +
      '.%0A%0AMong%20admin%20h%E1%BB%8Fi%20tr%E1%BB%A3.%0A';
  };

  return (
    <div className="login-page">
      {/* Panel trái — branding FPT */}
      <div className="login-brand-panel">
        <div className="login-brand-bg" />
        <div className="login-brand-overlay" />
        <div className="login-brand-content">
          <div className="login-brand-colors">
            <i /><i /><i />
          </div>
          <div className="login-brand-badge">
            <span /> SWP391 · FPT University
          </div>

          <div className="login-slogan">
            <span className="login-slogan-code">SWP391</span>
            <h1 className="login-slogan-main">
              <span className="login-slogan-line">đưa bạn từng bước</span>
              <span className="login-slogan-highlight">đến dự án triệu đô</span>
            </h1>
          </div>

          <p className="login-brand-desc">
            SmartTeam PIMS — nền tảng quản lý Capstone giúp sinh viên, giảng viên
            và hội đồng đồng hành trên hành trình biến ý tưởng thành sản phẩm thực tế.
          </p>

          <div className="login-brand-features">
            <div className="login-brand-feature">
              <strong>01</strong>
              <span>Lên kế hoạch &amp; quản lý nhóm</span>
            </div>
            <div className="login-brand-feature">
              <strong>02</strong>
              <span>Theo dõi milestone &amp; tiến độ</span>
            </div>
            <div className="login-brand-feature">
              <strong>03</strong>
              <span>Đánh giá &amp; bảo vệ dự án</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel phải — form đăng nhập */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-form-logo">
            <img src="/images/fpt-logo.png" alt="FPT" />
            <div className="login-form-logo-text">
              <h2>SmartTeam PIMS</h2>
              <p className="login-form-tagline">SWP391 · Capstone Project Platform</p>
            </div>
          </div>

          <div className="login-form-header">
            <h3>Đăng nhập</h3>
            <p>Bắt đầu hành trình dự án của bạn ngay hôm nay</p>
          </div>

          {error && <div className="alert-danger-login">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group-login">
              <label htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                type="email"
                className="form-control-login"
                placeholder="tenban@fpt.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
              />
            </div>

            <div className="form-group-login">
              <label>Vai trò truy cập</label>
              <div className="role-pills">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`role-pill${option.value === role ? ' active' : ''}`}
                    onClick={() => setRole(option.value)}
                    disabled={submitting}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group-login">
              <label htmlFor="loginPassword">Mật khẩu</label>
              <input
                id="loginPassword"
                type="password"
                className="form-control-login"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-login-primary" disabled={submitting}>
              {submitting ? 'Đang xác thực...' : `Đăng nhập — ${roleLabel}`}
            </button>
          </form>

          <button type="button" className="btn-login-secondary" onClick={handleRegister} disabled={submitting}>
            {role === 'Student' ? 'Đăng ký tài khoản mới' : 'Liên hệ quản trị viên'}
          </button>

          <div className="login-form-footer">
            Hỗ trợ kỹ thuật:{' '}
            <a href="mailto:trintse180561@fpt.edu.vn">trintse180561@fpt.edu.vn</a>
            <br />
            Hotline: 0394436546
          </div>
        </div>

        <p className="login-copyright">© 2026 SWP391 · FPT University — SmartTeam PIMS</p>
      </div>
    </div>
  );
};

export default LoginPage;
