import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../auth/AuthContext';

const RegisterPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isValidFptEmail = (value) => /^[^\s@]+@fpt\.edu\.vn$/i.test(value.trim());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (!isValidFptEmail(email)) {
      setError('Email phải có đuôi @fpt.edu.vn.');
      return;
    }

    const result = await auth.register({ username: email.trim(), password, role: 'Student' });
    if (!result.success) {
      setError(result.message);
      return;
    }

    setMessage('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
    setEmail('');
    setPassword('');
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f3f6fb' }}>
      <Card className="shadow-sm" style={{ width: '100%', maxWidth: '520px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Đăng ký Student</h2>
            <p className="text-muted mb-0">Tạo tài khoản học viên mới với email @fpt.edu.vn.</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="registerEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Tên của bạn@fpt.edu.vn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="registerPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Form.Group>

            <Button type="submit" className="w-100 py-2" style={{ backgroundColor: '#103d2b', borderColor: '#103d2b' }}>
              Đăng ký
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RegisterPage;
