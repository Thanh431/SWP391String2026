import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Table, ProgressBar, Nav, Form, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaFolderOpen, FaUsers, FaUserGraduate, FaLightbulb, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import {
  createMentorClassTopic,
  deleteMentorClassTopic,
  getMentorClassDetail,
  getMentorClassTopics,
} from '../../../api/mentorService';

const emptyTopicForm = { title: '', description: '', maxMembers: '5' };

const MentorClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [classData, setClassData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topics');
  const [topicForm, setTopicForm] = useState(emptyTopicForm);
  const [message, setMessage] = useState('');

  const loadTopics = useCallback(async () => {
    if (!auth.user?.id || !classId) return;
    setTopics(await getMentorClassTopics(auth.user.id, classId));
  }, [auth.user?.id, classId]);

  useEffect(() => {
    if (!auth.user?.id || !classId) return;
    getMentorClassDetail(auth.user.id, classId)
      .then(setClassData)
      .finally(() => setLoading(false));
    loadTopics();
  }, [auth.user?.id, classId, loadTopics]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await createMentorClassTopic(auth.user.id, classId, topicForm);
      setTopicForm(emptyTopicForm);
      setMessage('✓ Đã tạo đề tài nhóm.');
      loadTopics();
      getMentorClassDetail(auth.user.id, classId).then(setClassData);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể tạo đề tài.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Xóa đề tài này?')) return;
    try {
      await deleteMentorClassTopic(auth.user.id, topicId);
      loadTopics();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể xóa đề tài.');
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  if (!classData) {
    return (
      <div className="p-4">
        <p className="text-muted">Không tìm thấy lớp học.</p>
        <Button variant="outline-secondary" onClick={() => navigate('/mentor/classes')}>
          Quay lại danh sách Class
        </Button>
      </div>
    );
  }

  const statusVariant = (status) => {
    if (status === 'In Progress') return 'primary';
    if (status === 'On Hold') return 'warning';
    return 'secondary';
  };

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Button
        variant="link"
        className="text-decoration-none text-secondary p-0 mb-3 d-flex align-items-center gap-2"
        onClick={() => navigate('/mentor/classes')}
      >
        <FaArrowLeft size={12} /> Quay lại Class
      </Button>

      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0">{classData.name}</h3>
        <p className="text-muted small m-0 mt-1">
          {classData.code} · {classData.semester} · {classData.campus} · Tối đa 40 SV · Nhóm 4–5 người
        </p>
      </div>

      {message && (
        <Alert variant={message.includes('✓') ? 'success' : 'danger'} dismissible onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Nav variant="pills" className="mb-4 gap-2 flex-wrap">
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'topics'}
            onClick={() => setActiveTab('topics')}
            className="rounded-3 px-4 fw-semibold"
            style={activeTab === 'topics' ? { backgroundColor: '#103d2b' } : {}}
          >
            <FaLightbulb className="me-2" size={14} />
            Đề tài nhóm ({topics.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
            className="rounded-3 px-4 fw-semibold"
            style={activeTab === 'projects' ? { backgroundColor: '#103d2b' } : {}}
          >
            <FaFolderOpen className="me-2" size={14} />
            Project ({classData.projects?.length || 0})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            className="rounded-3 px-4 fw-semibold"
            style={activeTab === 'students' ? { backgroundColor: '#103d2b' } : {}}
          >
            <FaUserGraduate className="me-2" size={14} />
            Sinh viên ({classData.enrolledStudents?.length || 0})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'groups'}
            onClick={() => setActiveTab('groups')}
            className="rounded-3 px-4 fw-semibold"
            style={activeTab === 'groups' ? { backgroundColor: '#103d2b' } : {}}
          >
            <FaUsers className="me-2" size={14} />
            Nhóm dự án ({classData.groups?.length || 0})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'topics' && (
        <>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Tạo đề tài cho nhóm sinh viên</h6>
              <Form onSubmit={handleCreateTopic}>
                <Row className="g-3">
                  <Col md={5}>
                    <Form.Control
                      placeholder="Tên đề tài *"
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      placeholder="Mô tả đề tài"
                      value={topicForm.description}
                      onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    />
                  </Col>
                  <Col md={1}>
                    <Form.Select
                      value={topicForm.maxMembers}
                      onChange={(e) => setTopicForm({ ...topicForm, maxMembers: e.target.value })}
                    >
                      <option value="4">4 SV</option>
                      <option value="5">5 SV</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Button type="submit" className="w-100 border-0" style={{ backgroundColor: '#103d2b' }}>
                      <FaPlus className="me-1" size={11} /> Thêm
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Row className="g-3">
            {topics.map((topic) => (
              <Col key={topic.id} lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <Badge bg="secondary" className="me-2">Nhóm {topic.groupNumber}</Badge>
                        <Badge bg="info" className="bg-opacity-10 text-info">{topic.groupCode}</Badge>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={topic.status === 'Open' ? 'success' : 'warning'}>{topic.status}</Badge>
                        {topic.memberCount === 0 && (
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTopic(topic.id)}>
                            <FaTrash size={11} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h5 className="fw-bold">{topic.title}</h5>
                    <p className="text-muted small">{topic.description || '—'}</p>
                    <p className="small mb-2">
                      <strong>{topic.memberCount}/{topic.maxMembers}</strong> thành viên
                    </p>
                    {topic.members?.length > 0 && (
                      <p className="small text-secondary mb-0">
                        {topic.members.map((m) => m.name).join(', ')}
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {topics.length === 0 && (
              <Col>
                <Card className="border-0 shadow-sm rounded-4 text-center p-4 text-muted">
                  Chưa có đề tài. Tạo danh sách để sinh viên xem và chọn nhóm.
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}

      {activeTab === 'projects' && (
        <Row className="g-3">
          {(classData.projects || []).map((project) => (
            <Col key={project.id} lg={6}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold m-0">{project.title}</h5>
                    <Badge bg={statusVariant(project.status)} className="bg-opacity-10 text-dark rounded-2">
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-muted small mb-3">{project.topic}</p>
                  <div className="d-flex justify-content-between small mb-2">
                    <span className="text-secondary">Tiến độ</span>
                    <span className="fw-bold">{project.progress}%</span>
                  </div>
                  <ProgressBar now={project.progress} variant="success" style={{ height: 6 }} className="rounded-pill" />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {activeTab === 'students' && (
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-0">
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Email</th>
                  <th className="py-3">Họ tên</th>
                  <th className="py-3">Ngành</th>
                  <th className="pe-4 py-3">Ngày join lớp</th>
                </tr>
              </thead>
              <tbody>
                {(classData.enrolledStudents || []).map((student) => (
                  <tr key={student.id}>
                    <td className="ps-4 small">{student.email}</td>
                    <td className="fw-semibold">{student.name}</td>
                    <td className="small text-secondary">{student.department}</td>
                    <td className="pe-4 small text-muted">{student.enrolledAt}</td>
                  </tr>
                ))}
                {(classData.enrolledStudents || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Chưa có sinh viên nào join lớp bằng mã {classData.code}.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'groups' && (
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-0">
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Mã nhóm</th>
                  <th className="py-3">Tên nhóm</th>
                  <th className="py-3">Đề tài / Project</th>
                  <th className="py-3">Thành viên</th>
                  <th className="py-3">Tiến độ</th>
                  <th className="pe-4 py-3">Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {(classData.groups || []).map((group) => (
                  <tr key={group.id}>
                    <td className="ps-4 fw-bold">{group.id}</td>
                    <td>{group.name}</td>
                    <td>{group.project}</td>
                    <td className="small text-secondary">{group.members?.join(', ')}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="d-flex align-items-center gap-2">
                        <ProgressBar now={group.progress} variant="success" style={{ height: 6, flex: 1 }} className="rounded-pill" />
                        <span className="small fw-bold">{group.progress}%</span>
                      </div>
                    </td>
                    <td className="pe-4 small text-muted">{group.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default MentorClassDetail;
