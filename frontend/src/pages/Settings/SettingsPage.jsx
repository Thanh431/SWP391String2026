import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Table, Alert, Badge } from 'react-bootstrap';
import { FaFacebook, FaLinkedin, FaGithub, FaTwitter, FaGlobe, FaCameraRetro, FaUser, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../auth/AuthContext';

const SettingsPage = () => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Student profile fields
  const [fullName, setFullName] = useState(auth.user?.fullName || '');
  const [phone, setPhone] = useState(auth.user?.phone || '');
  const [department, setDepartment] = useState(auth.user?.department || '');
  const [className, setClassName] = useState(auth.user?.className || '');
  const [semester, setSemester] = useState(auth.user?.semester || '');
  const [campus, setCampus] = useState(auth.user?.campus || '');
  const [avatarUrl, setAvatarUrl] = useState(auth.user?.avatarUrl || '');
  const [avatarPreview, setAvatarPreview] = useState(auth.user?.avatarUrl || '');

  // Social media fields
  const [facebook, setFacebook] = useState('');
  const [zalo, setZalo] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  // Admin fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountRole, setNewAccountRole] = useState('Mentor');
  const [adminMessage, setAdminMessage] = useState('');
  const [pendingAccounts, setPendingAccounts] = useState([]);

  const loadPendingAccounts = async () => {
    const result = await auth.getPendingAccounts();
    if (result.success) {
      setPendingAccounts(result.accounts);
    } else {
      setAdminMessage(result.message);
    }
  };

  useEffect(() => {
    if (auth.user?.role === 'Admin') {
      loadPendingAccounts();
      setActiveTab('admin');
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) return;
    setFullName(auth.user.fullName || '');
    setPhone(auth.user.phone || '');
    setDepartment(auth.user.department || '');
    setClassName(auth.user.className || '');
    setSemester(auth.user.semester || '');
    setCampus(auth.user.campus || '');
    setAvatarUrl(auth.user.avatarUrl || '');
    setAvatarPreview(auth.user.avatarUrl || '');
  }, [auth.user]);

  const compressAvatar = (img) => {
    let maxSize = 256;
    let quality = 0.82;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      if (compressed.length <= 180000) {
        return compressed;
      }
      quality -= 0.12;
      maxSize = Math.round(maxSize * 0.85);
    }
    return null;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setMessage('File ảnh tối đa 5MB. Hãy nén hoặc chọn ảnh nhỏ hơn.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Chỉ chấp nhận file ảnh (JPG, PNG, ...).');
      return;
    }

    setMessage('');

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const compressed = compressAvatar(img);
        if (!compressed) {
          setMessage('Không nén được ảnh. Hãy chọn ảnh nhỏ hoặc độ phân giải thấp hơn.');
          return;
        }
        setAvatarPreview(compressed);
        setAvatarUrl(compressed);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    if (!fullName.trim() || !phone.trim() || !department.trim()) {
      setMessage('Vui lòng điền đủ thông tin bắt buộc (Họ tên, Số điện thoại, Đơn vị).');
      setLoading(false);
      return;
    }

    const isStudent = auth.user?.role === 'Student';

    const result = await auth.updateProfileExtended({
      fullName: fullName.trim(),
      phone: phone.trim(),
      department: department.trim(),
      className: isStudent ? className.trim() : '',
      semester: isStudent ? semester.trim() : '',
      campus: isStudent ? campus.trim() : '',
      avatarUrl,
    });

    if (!result.success) {
      setMessage(result.message);
    } else {
      setMessage('✓ Đã lưu! Tên hiển thị trên Dashboard: ' + fullName.trim());
    }
    setLoading(false);
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setAdminMessage('');

    const result = await auth.createAccount({
      username: newAccountEmail,
      password: newAccountPassword,
      role: newAccountRole,
    });

    if (!result.success) {
      setAdminMessage(result.message);
      return;
    }

    setAdminMessage(`✓ Tạo tài khoản ${newAccountRole} thành công. Chờ duyệt.`);
    setNewAccountEmail('');
    setNewAccountPassword('');
    loadPendingAccounts();
  };

  const handleApprove = async (account) => {
    setAdminMessage('');
    const result = await auth.approveAccount(account.id);
    if (!result.success) {
      setAdminMessage(result.message);
      return;
    }
    setAdminMessage(`✓ Đã duyệt ${account.username}.`);
    loadPendingAccounts();
  };

  // Student, Mentor & Committee Settings UI
  if (auth.user?.role === 'Student' || auth.user?.role === 'Mentor' || auth.user?.role === 'Committee') {
    const isStudent = auth.user?.role === 'Student';

    return (
      <div className="px-1 py-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Hồ sơ cá nhân</h3>
            <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.82rem' }}>
              {isStudent
                ? 'Cập nhật thông tin cá nhân, học tập, liên kết mạng xã hội và ảnh đại diện'
                : 'Cập nhật thông tin cá nhân, liên kết mạng xã hội và ảnh đại diện'}
            </p>
          </div>
        </div>

        {message && (
          <Alert 
            variant={message.includes('✓') ? 'success' : 'warning'}
            dismissible
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <Form onSubmit={handleSaveProfile}>
          {/* Avatar Section */}
          <Card className="shadow-sm p-4 rounded-4 mb-4">
            <h5 className="fw-bold mb-3"><FaCameraRetro className="me-2" />Ảnh đại diện</h5>
            <Row className="align-items-center">
              <Col md={3} className="text-center mb-3 mb-md-0">
                <div 
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    backgroundImage: `url('${avatarPreview || 'https://via.placeholder.com/150'}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '3px solid #e0e0e0',
                    margin: '0 auto'
                  }}
                />
              </Col>
              <Col md={9}>
                <Form.Group className="mb-3">
                  <Form.Label>Chọn ảnh đại diện</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Form.Text className="text-muted">
                    Chấp nhận JPG, PNG — file gốc tối đa 5MB. Hệ thống tự nén trước khi lưu.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card>

          {/* Personal Information */}
          <Card className="shadow-sm p-4 rounded-4 mb-4">
            <h5 className="fw-bold mb-3"><FaUser className="me-2" />Thông tin cá nhân</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="settingsFullName" className="mb-3">
                  <Form.Label>Tên hiển thị (Họ và tên) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ví dụ: TS. Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Tên này hiện ở góc phải Dashboard và lời chào trang chủ.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="settingsPhone" className="mb-3">
                  <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="settingsDepartment" className="mb-3">
                  <Form.Label>Đơn vị / Bộ môn <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ví dụ: Công nghệ Phần mềm"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="settingsEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={auth.user?.username || ''}
                    disabled
                  />
                  <Form.Text className="text-muted">Email không thể thay đổi</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card>

          {isStudent && (
          <Card className="shadow-sm p-4 rounded-4 mb-4">
            <h5 className="fw-bold mb-3"><FaGraduationCap className="me-2" />Thông tin học tập</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="settingsClassName" className="mb-3">
                  <Form.Label>Lớp học</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ví dụ: SE1618"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="settingsSemester" className="mb-3">
                  <Form.Label>Kỳ học</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ví dụ: Fall 2024"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group controlId="settingsCampus" className="mb-3">
                  <Form.Label>Cơ sở / Địa điểm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ví dụ: FPT University - Hà Nội"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card>
          )}

          {/* Social Media Links */}
          <Card className="shadow-sm p-4 rounded-4 mb-4">
            <h5 className="fw-bold mb-3"><FaGlobe className="me-2" />Liên kết mạng xã hội</h5>
            <p className="text-muted small mb-3">Thêm các liên kết mạng xã hội của bạn để mọi người dễ dàng kết nối</p>
            
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaFacebook className="text-primary me-2" />Facebook
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://facebook.com/username"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>💬 Zalo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0987654321"
                    value={zalo}
                    onChange={(e) => setZalo(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaLinkedin className="text-info me-2" />LinkedIn
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaGithub className="text-dark me-2" />GitHub
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://github.com/username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaTwitter className="text-info me-2" />Twitter / X
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://twitter.com/username"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FaGlobe className="me-2" />Website cá nhân</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card>

          {/* Action Buttons */}
          <div className="d-flex gap-2 justify-content-end mb-4">
            <Button
              variant="light"
              className="px-4"
              onClick={() => {
                setFullName(auth.user?.fullName || '');
                setPhone(auth.user?.phone || '');
                setDepartment(auth.user?.department || '');
                setMessage('');
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="px-5"
            >
              {loading ? 'Đang lưu...' : '✓ Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  // Admin Settings UI
  return (
    <div className="px-1 py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Cài đặt tài khoản</h3>
          <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.82rem' }}>
            Quản lý tài khoản và duyệt các yêu cầu từ Mentor/Committee
          </p>
        </div>
      </div>

      {adminMessage && (
        <Alert 
          variant={adminMessage.includes('✓') ? 'success' : 'info'}
          dismissible
          onClose={() => setAdminMessage('')}
        >
          {adminMessage}
        </Alert>
      )}

      <Card className="shadow-sm p-4 rounded-4 mb-4">
        <h5 className="fw-bold mb-3">Tạo tài khoản mới</h5>
        <Form onSubmit={handleCreateAccount}>
          <Row className="g-3">
            <Col md={5}>
              <Form.Group controlId="adminNewUserEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="example@fpt.edu.vn"
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="adminNewUserPassword" className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId="adminNewUserRole" className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={newAccountRole}
                  onChange={(e) => setNewAccountRole(e.target.value)}
                >
                  <option>Mentor</option>
                  <option>Committee</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="primary"
                type="submit"
                className="w-100"
              >
                Tạo
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {pendingAccounts.length > 0 && (
        <Card className="shadow-sm p-4 rounded-4">
          <h5 className="fw-bold mb-3">
            Tài khoản chờ duyệt <Badge bg="danger">{pendingAccounts.length}</Badge>
          </h5>
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.username}</td>
                    <td>
                      <Badge bg="info">{account.role}</Badge>
                    </td>
                    <td>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(account)}
                      >
                        ✓ Duyệt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
