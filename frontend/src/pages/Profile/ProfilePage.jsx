import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Form, Row, Alert } from 'react-bootstrap';
import { useAuth } from '../../auth/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [fullName, setFullName] = useState(auth.user?.fullName || '');
  const [phone, setPhone] = useState(auth.user?.phone || '');
  const [department, setDepartment] = useState(auth.user?.department || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.user) {
      navigate('/login', { replace: true });
      return;
    }
    if (auth.user.role === 'Admin' || auth.user.profileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fullName.trim() || !phone.trim() || !department.trim()) {
      setMessage('Vui lòng điền đủ thông tin hồ sơ.');
      return;
    }
    const result = await auth.completeProfile({ fullName, phone, department });
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="px-1 py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Hoàn thiện hồ sơ</h3>
          <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.82rem' }}>
            Vui lòng cập nhật thông tin tài khoản trước khi truy cập dashboard.
          </p>
        </div>
      </div>

      <Card className="shadow-sm p-4 rounded-4">
        {message && <Alert variant="warning">{message}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="profileFullName" className="mb-3">
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="profilePhone" className="mb-3">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group controlId="profileDepartment" className="mb-3">
                <Form.Label>Đơn vị / Bộ môn</Form.Label>
                <Form.Control
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Button type="submit" className="px-4 py-2" style={{ backgroundColor: '#103d2b', borderColor: '#103d2b' }}>
            Lưu hồ sơ và đi tới Dashboard
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;
