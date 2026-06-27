import { useCallback, useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, InputGroup, Nav, Table, Badge, Alert, ListGroup } from 'react-bootstrap';
import { FaBookOpen, FaPlus, FaFolderOpen, FaTasks, FaUsers, FaDownload, FaArrowLeft, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { getCourseTopics, getMyCourses, joinCourse, joinTopicGroup } from '../../../api/studentService';

const MyCourse = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const studentId = auth.user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [topics, setTopics] = useState([]);
  const [joiningTopicId, setJoiningTopicId] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ show: false, message: '', variant: 'danger' });

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await getMyCourses(studentId);
      setCourses(data);
      setSelectedCourse((prev) => {
        if (prev) {
          return data.find((c) => c.id === prev.id) || data[0] || null;
        }
        return data[0] || null;
      });
    } catch {
      showAlert('Không thể tải danh sách khóa học.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadTopics = useCallback(async () => {
    if (!studentId || !selectedCourse?.id) {
      setTopics([]);
      return;
    }
    try {
      setTopics(await getCourseTopics(studentId, selectedCourse.id));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể tải danh sách đề tài.', 'danger');
    }
  }, [studentId, selectedCourse?.id]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const showAlert = (message, variant) => {
    setAlertConfig({ show: true, message, variant });
    setTimeout(() => setAlertConfig((prev) => ({ ...prev, show: false })), 5000);
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();
    if (!cleanCode || !studentId) return;

    setJoining(true);
    try {
      const joined = await joinCourse(studentId, cleanCode);
      setInputCode('');
      showAlert(`Chúc mừng! Bạn đã tham gia thành công vào lớp ${joined.name}.`, 'success');
      await load();
      setSelectedCourse(joined);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể tham gia lớp học.', 'danger');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinTopic = async (topicId) => {
    if (!studentId) return;
    setJoiningTopicId(topicId);
    try {
      await joinTopicGroup(studentId, topicId);
      showAlert('Đã tham gia nhóm. Bạn không thể rời nhóm cho đến khi hoàn thành đề tài.', 'success');
      loadTopics();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể tham gia nhóm.', 'danger');
    } finally {
      setJoiningTopicId(null);
    }
  };

  const lockedIn = topics.some((t) => t.joined);

  if (loading) {
    return <div className="p-4 text-muted">Đang tải khóa học...</div>;
  }

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Button
        variant="link"
        className="text-decoration-none text-secondary p-0 mb-3 small d-flex align-items-center gap-2"
        onClick={() => navigate('/dashboard')}
      >
        <FaArrowLeft size={12} /> Quay lại Dashboard
      </Button>

      <Row className="align-items-center g-3 mb-4">
        <Col md={6}>
          <h3 className="fw-bold text-dark m-0">Khóa Học Của Tôi</h3>
          <p className="text-muted small m-0 mt-1">
            Nhập mã lớp do Admin tạo (ví dụ: FA24_CAP391) để tham gia khóa học.
          </p>
        </Col>
        <Col md={6} className="d-flex justify-content-md-end">
          <Form onSubmit={handleJoinCourse} style={{ maxWidth: '400px', width: '100%' }}>
            <InputGroup className="shadow-sm rounded-3 overflow-hidden">
              <Form.Control
                placeholder="Nhập Mã Lớp (Ví dụ: FA24_CAP391)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="border-end-0 px-3"
              />
              <Button
                variant="success"
                type="submit"
                disabled={joining}
                className="px-3 d-flex align-items-center gap-2 fw-semibold"
              >
                <FaPlus size={12} /> {joining ? 'Đang vào...' : 'Vào Lớp'}
              </Button>
            </InputGroup>
          </Form>
        </Col>
      </Row>

      {alertConfig.show && (
        <Alert variant={alertConfig.variant} className="border-0 shadow-sm rounded-3 mb-4 py-2.5 small">
          {alertConfig.message}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm p-3 rounded-4 bg-white">
            <span className="text-muted small fw-bold text-uppercase mb-3 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              Danh sách lớp học ({courses.length})
            </span>
            {courses.length === 0 ? (
              <p className="text-muted small mb-0">Chưa tham gia lớp nào. Nhập mã lớp ở trên để bắt đầu.</p>
            ) : (
              <ListGroup variant="flush" className="gap-2">
                {courses.map((course) => {
                  const isSelected = selectedCourse && selectedCourse.id === course.id;
                  return (
                    <ListGroup.Item
                      key={course.enrollmentId}
                      onClick={() => { setSelectedCourse(course); setActiveTab('topics'); }}
                      className="border rounded-3 p-3 text-start position-relative shadow-sm"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                        borderColor: isSelected ? '#22c55e' : '#e5e7eb',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem', maxWidth: '85%' }}>
                          {course.name}
                        </span>
                        <Badge bg={course.status === 'Active' ? 'success-subtle' : 'secondary-subtle'} className={course.status === 'Active' ? 'text-success' : 'text-secondary'}>
                          {course.status}
                        </Badge>
                      </div>
                      <div className="text-muted small d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem' }}>
                        <span>Mã: <strong>{course.code}</strong></span>
                        <span className="text-truncate" style={{ maxWidth: '50%' }}>{course.teacher}</span>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm p-4 rounded-4 bg-white h-100">
            {selectedCourse ? (
              <>
                <div className="border-bottom pb-3 mb-3">
                  <div className="d-flex align-items-center gap-2 text-success mb-1">
                    <FaBookOpen className="fs-5" />
                    <span className="fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>{selectedCourse.code}</span>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">{selectedCourse.name}</h4>
                  <span className="text-muted small">
                    Giảng viên: <strong className="text-dark">{selectedCourse.teacher}</strong>
                    {' '}| Mã lớp: <strong className="text-dark">{selectedCourse.code}</strong>
                    {' '}| {selectedCourse.semester} · {selectedCourse.campus}
                  </span>
                </div>

                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-bottom mb-3 small fw-semibold">
                  <Nav.Item>
                    <Nav.Link eventKey="topics" className="d-flex align-items-center gap-2 py-2 px-3 text-secondary">
                      <FaLightbulb size={13} /> Đề tài nhóm ({topics.length})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="materials" className="d-flex align-items-center gap-2 py-2 px-3 text-secondary">
                      <FaFolderOpen size={13} /> Tài Liệu Môn Học
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="assignments" className="d-flex align-items-center gap-2 py-2 px-3 text-secondary">
                      <FaTasks size={13} /> Bài Tập & Tiến Độ
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="members" className="d-flex align-items-center gap-2 py-2 px-3 text-secondary">
                      <FaUsers size={13} /> Thành Viên Lớp
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <div className="py-2">
                  {activeTab === 'topics' && (
                    <>
                      {lockedIn && (
                        <Alert variant="info" className="small">
                          Bạn đã chọn nhóm và bị khóa — phải hoàn thành đề tài, không thể rời nhóm.
                        </Alert>
                      )}
                      <Row className="g-3">
                        {topics.map((topic) => (
                          <Col md={6} key={topic.id}>
                            <Card className="border h-100 rounded-3">
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between mb-2">
                                  <Badge bg="secondary">Nhóm {topic.groupNumber}</Badge>
                                  <Badge bg={topic.joined ? 'success' : 'light'} text={topic.joined ? 'white' : 'dark'}>
                                    {topic.memberCount}/{topic.maxMembers} SV
                                  </Badge>
                                </div>
                                <h6 className="fw-bold">{topic.title}</h6>
                                <p className="text-muted small mb-2">{topic.description || '—'}</p>
                                <p className="small text-secondary mb-3">
                                  Mã nhóm: <strong>{topic.groupCode}</strong> · {topic.status}
                                </p>
                                {topic.joined ? (
                                  <Badge bg="success">Bạn đang ở nhóm này</Badge>
                                ) : topic.canJoin ? (
                                  <Button
                                    size="sm"
                                    variant="success"
                                    disabled={joiningTopicId === topic.id}
                                    onClick={() => handleJoinTopic(topic.id)}
                                  >
                                    {joiningTopicId === topic.id ? 'Đang join...' : 'Tham gia nhóm'}
                                  </Button>
                                ) : (
                                  <Badge bg="secondary">{topic.status === 'Full' ? 'Đã đủ người' : 'Không thể join'}</Badge>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                        {topics.length === 0 && (
                          <Col>
                            <p className="text-muted small mb-0">Mentor chưa tạo đề tài cho lớp này.</p>
                          </Col>
                        )}
                      </Row>
                    </>
                  )}

                  {activeTab === 'materials' && (
                    <div className="table-responsive">
                      <Table hover align="middle" className="border-0 mb-0">
                        <thead>
                          <tr className="table-light text-muted small" style={{ fontSize: '0.75rem' }}>
                            <th className="border-0">TÊN TÀI LIỆU</th>
                            <th className="border-0">LOẠI</th>
                            <th className="border-0">NGÀY ĐĂNG</th>
                            <th className="border-0 text-center">TẢI VỀ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCourse.materials?.map((material, idx) => (
                            <tr key={idx} style={{ fontSize: '0.82rem' }}>
                              <td className="border-0 py-3 fw-medium text-dark">{material.title}</td>
                              <td className="border-0">
                                <Badge bg={material.type === 'Slide' ? 'primary-subtle' : 'info-subtle'} className={material.type === 'Slide' ? 'text-primary' : 'text-info'}>
                                  {material.type}
                                </Badge>
                              </td>
                              <td className="border-0 text-muted">{material.date}</td>
                              <td className="border-0 text-center">
                                <Button variant="light" size="sm" className="rounded-circle p-1.5 border" title="Tải xuống">
                                  <FaDownload size={11} className="text-secondary" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {activeTab === 'assignments' && (
                    selectedCourse.assignments?.length > 0 ? (
                      <div className="table-responsive">
                        <Table hover align="middle" className="border-0 mb-0">
                          <thead>
                            <tr className="table-light text-muted small" style={{ fontSize: '0.75rem' }}>
                              <th className="border-0">BÀI TẬP / CỘT MỐC GIAO</th>
                              <th className="border-0">HẠN CHÓT</th>
                              <th className="border-0">TRẠNG THÁI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCourse.assignments.map((asm, idx) => (
                              <tr key={idx} style={{ fontSize: '0.82rem' }}>
                                <td className="border-0 py-3 fw-medium text-dark">{asm.title}</td>
                                <td className="border-0 text-danger fw-semibold">{asm.deadline}</td>
                                <td className="border-0">{asm.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted small mb-0">Chưa có bài tập được giao cho lớp này.</p>
                    )
                  )}

                  {activeTab === 'members' && (
                    <div className="table-responsive">
                      <Table hover align="middle" className="border-0 mb-0">
                        <thead>
                          <tr className="table-light text-muted small" style={{ fontSize: '0.75rem' }}>
                            <th className="border-0">MÃ THÀNH VIÊN</th>
                            <th className="border-0">HỌ VÀ TÊN</th>
                            <th className="border-0">VAI TRÒ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCourse.members?.map((member, idx) => (
                            <tr key={idx} style={{ fontSize: '0.85rem' }}>
                              <td className="border-0 py-2.5 font-monospace fw-bold text-secondary">{member.id}</td>
                              <td className="border-0 fw-medium text-dark">{member.name}</td>
                              <td className="border-0">
                                <Badge bg={member.role === 'Teacher' ? 'danger-subtle' : 'light'} className={member.role === 'Teacher' ? 'text-danger' : 'text-dark border'}>
                                  {member.role === 'Teacher' ? 'Giảng Viên' : 'Sinh Viên'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted small">Nhập mã lớp do Admin tạo để tham gia khóa học.</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyCourse;
