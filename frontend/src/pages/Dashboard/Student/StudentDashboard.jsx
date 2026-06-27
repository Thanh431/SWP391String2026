import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Button, Table, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { getStudentDashboard } from '../../../api/studentService';
import StudentGradesPanel from './StudentGradesPanel';
import { 
  FaPlus, FaBrain, FaRegCommentDots, 
  FaChevronRight, FaChevronLeft
} from 'react-icons/fa';
import { BiCalendarExclamation } from 'react-icons/bi';

const ratingScore = (rating) => {
  switch (rating) {
    case 'Excellent': return '9.5';
    case 'Good': return '8.5';
    case 'Needs Improvement': return '6.5';
    case 'At Risk': return '5.0';
    default: return '—';
  }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const studentId = auth.user?.id;
  const displayName = auth.user?.fullName?.trim() || auth.user?.username?.split('@')[0] || 'bạn';

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      setDashboard(await getStudentDashboard(studentId));
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const team = dashboard?.team;
  const teamMembers = team?.hasTeam ? (team.members || []) : [];
  const progress = dashboard?.progress ?? 0;
  const maxMembers = dashboard?.maxMembers ?? 5;
  const latestEvaluation = dashboard?.latestEvaluation;
  const activePhase = dashboard?.activePhase;
  const recentFeedback = dashboard?.recentFeedback || [];
  const courseGrades = dashboard?.courseGrades;

  // ================= STATE QUẢN LÝ KANBAN TASKS (local UI) =================
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Database Schema Review', description: 'Review constraints with team.', status: 'To Do', priority: 'High', assignees: ['AN', 'SC'] },
    { id: 2, title: 'UI Component Library', description: 'Implementing design system...', status: 'In Progress', priority: 'Normal', assignees: ['AN'] },
    { id: 3, title: 'Topic Approval', description: 'Defended successfully.', status: 'Completed', priority: 'Done', assignees: ['SD&F'] }
  ]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('To Do');
  const [newTaskPriority, setNewTaskPriority] = useState('Normal');

  // ================= XỬ LÝ HÀM CHỨC NĂNG =================
  
  // 1. Thêm công việc mới vào bảng Kanban
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      description: newTaskDesc,
      status: newTaskStatus,
      priority: newTaskPriority,
      assignees: ['AN'] // Mặc định gán cho user hiện tại đăng nhập
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskStatus('To Do');
    setNewTaskPriority('Normal');
    setShowTaskModal(false);
  };

  // 2. Dịch chuyển trạng thái Task (Ví dụ: To Do -> In Progress -> Completed)
  const moveTaskStatus = (id, currentStatus, direction) => {
    const statuses = ['To Do', 'In Progress', 'Completed'];
    let currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < statuses.length) {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: statuses[nextIndex], priority: statuses[nextIndex] === 'Completed' ? 'Done' : t.priority } : t));
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3 mb-0">Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-3" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Header Chào hỏi */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Xin chào, {displayName}</h3>
        <p className="text-muted small m-0 mt-1">
          {dashboard?.hasTeam ? (
            <>
              Nhóm <strong className="text-dark">{dashboard.groupName}</strong> — Dự án:{' '}
              <strong className="text-dark">{dashboard.projectTitle}</strong>
            </>
          ) : (
            <>Chưa tham gia nhóm — <Button variant="link" className="p-0 align-baseline" onClick={() => navigate('/team-management')}>Tham gia ngay</Button></>
          )}
        </p>
      </div>

      {!dashboard?.hasTeam && (
        <Alert variant="info" className="mb-4">
          {dashboard?.message || 'Hãy vào Team Management hoặc My Courses để tham gia nhóm.'}
        </Alert>
      )}

      {/* 4 Thẻ Thống kê hàng đầu (Stats Cards) */}
      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm p-3 rounded-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ fontSize: '0.75rem' }}>Project Progress</span>
                <h3 className="fw-bold my-1">{progress}%</h3>
              </div>
              {dashboard?.hasTeam && (
                <Badge bg="success-subtle" className="text-success border-0 px-2 py-1 rounded-3 small">
                  {team?.status || 'Đang thực hiện'}
                </Badge>
              )}
            </div>
            <ProgressBar variant="success" now={progress} style={{ height: '6px' }} className="mt-2 rounded-pill" />
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm p-3 rounded-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ fontSize: '0.75rem' }}>Giai đoạn nộp bài</span>
                <h3 className="fw-bold my-1">{dashboard?.openPhaseCount ?? 0}</h3>
                <span className="text-muted small">
                  {activePhase?.title ? `Hiện tại: ${activePhase.title}` : 'Chưa có giai đoạn mở'}
                </span>
              </div>
              {activePhase?.status === 'Reviewing' && (
                <Badge bg="warning" className="px-2 py-1 rounded-3 fw-normal" style={{ fontSize: '0.72rem' }}>Chờ chấm</Badge>
              )}
            </div>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm p-3 rounded-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ fontSize: '0.75rem' }}>Latest Evaluation</span>
                <h3 className="fw-bold my-1">
                  {latestEvaluation ? ratingScore(latestEvaluation.rating) : '—'}
                  {latestEvaluation?.rating && <span className="text-muted fs-6 fw-normal">/10</span>}
                </h3>
                <span className="text-muted small">{latestEvaluation?.phaseTitle || 'Chưa có đánh giá'}</span>
              </div>
              {latestEvaluation?.rating && (
                <Badge bg={latestEvaluation.status === 'Rejected' ? 'warning' : 'success'} className="px-2 py-1 rounded-3 fw-normal" style={{ fontSize: '0.72rem' }}>
                  {latestEvaluation.rating}
                </Badge>
              )}
            </div>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm p-3 rounded-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ fontSize: '0.75rem' }}>Team Status</span>
                {/* Đếm số lượng động dựa vào mảng state teamMembers */}
                <h3 className="fw-bold my-1">{teamMembers.length}/{maxMembers}</h3>
                <span className="text-muted small">{dashboard?.mentor ? `Mentor: ${dashboard.mentor}` : `${maxMembers - teamMembers.length} slot(s) remaining`}</span>
              </div>
              <Button 
                variant="primary-subtle" 
                className="text-primary px-2 py-1 rounded-3 fw-medium border-0 btn-sm" 
                style={{ fontSize: '0.72rem' }}
                onClick={() => navigate('/team-management')}
              >
                Quản lý nhóm
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tóm tắt điểm + link trang xem chi tiết */}
      <div className="mb-4 d-flex flex-wrap align-items-stretch gap-3">
        <div className="flex-grow-1" style={{ minWidth: '240px' }}>
          <StudentGradesPanel grades={courseGrades} compact />
        </div>
        <Button
          variant="success"
          className="rounded-4 px-4 align-self-center"
          onClick={() => navigate('/my-grades')}
        >
          Xem điểm chi tiết
        </Button>
      </div>

      {/* Khối chính bên dưới tách làm 2 cột */}
      <Row className="g-4">
        {/* CỘT TRÁI: Tasks và Team Management */}
        <Col lg={8}>
          
          {/* Project Tasks (Kanban Board) */}
          <Card className="border-0 shadow-sm p-4 rounded-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark m-0" style={{ fontSize: '1.05rem' }}>Project Tasks</h5>
              <Button variant="dark" size="sm" className="rounded-3 px-3 py-1.5 d-flex align-items-center gap-1 small" onClick={() => setShowTaskModal(true)}>
                <FaPlus size={11} /> New Task
              </Button>
            </div>
            
            <Row className="g-3">
              {/* CỘT TO DO */}
              <Col md={4}>
                <div className="p-2 rounded-3" style={{ backgroundColor: '#fdfdfd' }}>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="rounded-circle bg-secondary d-inline-block" style={{ width: '7px', height: '7px' }} />
                    <span className="fw-bold text-secondary small text-uppercase">To Do</span>
                    <Badge bg="light" className="text-dark border rounded-pill ms-auto">
                      {tasks.filter(t => t.status === 'To Do').length}
                    </Badge>
                  </div>
                  
                  {tasks.filter(t => t.status === 'To Do').map(task => (
                    <Card key={task.id} className="border border-light-subtle shadow-sm p-3 rounded-3 mb-2 bg-white">
                      <h6 className="fw-bold mb-1 small text-dark">{task.title}</h6>
                      {task.description && <p className="text-muted small mb-2" style={{ fontSize: '0.72rem' }}>{task.description}</p>}
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="d-flex gap-1">
                          {task.assignees.map((as, i) => (
                            <span key={i} className="rounded-circle bg-success-subtle text-success small d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '9px' }}>{as}</span>
                          ))}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Badge bg="danger-subtle" className="text-danger border-0 small">{task.priority}</Badge>
                          <Button variant="link" className="p-0 text-primary ms-1" onClick={() => moveTaskStatus(task.id, task.status, 'next')} title="Move to In Progress">
                            <FaChevronRight size={12} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>

              {/* CỘT IN PROGRESS */}
              <Col md={4}>
                <div className="p-2 rounded-3">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="rounded-circle bg-primary d-inline-block" style={{ width: '7px', height: '7px' }} />
                    <span className="fw-bold text-primary small text-uppercase">In Progress</span>
                    <Badge bg="primary-subtle" className="text-primary rounded-pill ms-auto">
                      {tasks.filter(t => t.status === 'In Progress').length}
                    </Badge>
                  </div>
                  
                  {tasks.filter(t => t.status === 'In Progress').map(task => (
                    <Card key={task.id} className="border border-light-subtle shadow-sm p-3 rounded-3 mb-2 bg-white" style={{ borderLeft: '3px solid #0d6efd' }}>
                      <h6 className="fw-bold mb-1 small text-dark">{task.title}</h6>
                      {task.description && <p className="text-muted small mb-2" style={{ fontSize: '0.72rem' }}>{task.description}</p>}
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <Button variant="link" className="p-0 text-secondary" onClick={() => moveTaskStatus(task.id, task.status, 'prev')} title="Move back to To Do">
                          <FaChevronLeft size={12} />
                        </Button>
                        <div className="d-flex align-items-center gap-1">
                          <Badge bg="primary-subtle" className="text-primary border-0 small">{task.priority}</Badge>
                          <Button variant="link" className="p-0 text-success ms-1" onClick={() => moveTaskStatus(task.id, task.status, 'next')} title="Move to Completed">
                            <FaChevronRight size={12} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>

              {/* CỘT COMPLETED */}
              <Col md={4}>
                <div className="p-2 rounded-3">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="rounded-circle bg-success d-inline-block" style={{ width: '7px', height: '7px' }} />
                    <span className="fw-bold text-success small text-uppercase">Completed</span>
                    <Badge bg="success-subtle" className="text-success rounded-pill ms-auto">
                      {tasks.filter(t => t.status === 'Completed').length}
                    </Badge>
                  </div>
                  
                  {tasks.filter(t => t.status === 'Completed').map(task => (
                    <Card key={task.id} className="border border-light-subtle shadow-sm p-3 rounded-3 mb-2 bg-white opacity-75">
                      <h6 className="fw-bold mb-1 small text-decoration-line-through text-muted">{task.title}</h6>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <Button variant="link" className="p-0 text-secondary" onClick={() => moveTaskStatus(task.id, task.status, 'prev')} title="Move back to In Progress">
                          <FaChevronLeft size={12} />
                        </Button>
                        <Badge bg="success-subtle" className="text-success border border-success-subtle small">Done</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Team Management Table */}
          <Card className="border-0 shadow-sm p-4 rounded-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0" style={{ fontSize: '1.05rem' }}>Team Management</h5>
              <Button variant="outline-primary" size="sm" className="rounded-3 px-3 py-1 small" onClick={() => navigate('/team-management')}>Team Management</Button>
            </div>
            <div className="table-responsive">
              {teamMembers.length === 0 ? (
                <p className="text-muted small mb-0">Chưa có thành viên trong nhóm.</p>
              ) : (
              <Table hover align="middle" className="border-0 mb-0">
                <thead className="table-light border-0">
                  <tr className="text-muted small" style={{ fontSize: '0.78rem' }}>
                    <th className="border-0">MEMBER</th>
                    <th className="border-0">ROLE</th>
                    <th className="border-0">MSSV</th>
                    <th className="border-0">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id || member.email || member.name} style={{ fontSize: '0.85rem' }}>
                      <td className="border-0 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-dark-subtle text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                            {(member.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">
                              {member.name}
                              {member.isMe && <Badge bg="primary" className="ms-2">Bạn</Badge>}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>{member.email || member.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-0 text-muted">{member.role}</td>
                      <td className="border-0 text-dark fw-medium">{member.rollNumber || '—'}</td>
                      <td className="border-0">
                        <span className="d-flex align-items-center gap-2">
                          <span className="rounded-circle bg-success" style={{ width: '6px', height: '6px' }} />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )}
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: AI Matching và Recent Feedback */}
        <Col lg={4}>
          
          {/* AI Matching Widget */}
          <Card className="border-0 shadow-sm p-4 rounded-4 mb-4 text-white" style={{ backgroundColor: '#064e3b' }}>
            <h5 className="fw-bold m-0 d-flex align-items-center gap-2 mb-2" style={{ fontSize: '1.05rem' }}>
              <FaBrain className="text-success-subtle" />
              AI Matching
              <Badge bg="success" className="bg-opacity-25 text-success border border-success-subtle px-1.5 py-0.5 rounded text-uppercase" style={{ fontSize: '0.62rem' }}>Beta</Badge>
            </h5>
            <p className="text-white-50 small mb-3" style={{ fontSize: '0.78rem' }}>
              Tìm mentor phù hợp với đề tài của nhóm
            </p>
            <Button
              variant="light"
              size="sm"
              className="w-100 rounded-2 fw-bold small py-2 text-success"
              onClick={() => navigate('/ai-matching')}
            >
              Mở AI Matching
            </Button>
          </Card>

          {/* Recent Feedback & Activity Log */}
          <Card className="border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 className="fw-bold text-dark mb-4" style={{ fontSize: '1.05rem' }}>Recent Feedback</h5>

            {recentFeedback.length === 0 ? (
              <p className="text-muted small mb-0">Chưa có phản hồi từ mentor. Nộp bài tại Submissions để nhận đánh giá.</p>
            ) : (
              recentFeedback.map((item) => (
                <div key={item.id} className="d-flex gap-3 mb-4 align-items-start">
                  <div className="p-2 rounded-3 bg-light text-primary">
                    <FaRegCommentDots className="fs-5" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold small text-dark">{item.reviewer}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{item.submittedAt}</span>
                    </div>
                    <div className="small text-muted mb-1">{item.phaseTitle}</div>
                    <p className="text-muted small mt-1 mb-0" style={{ lineHeight: '1.4' }}>
                      {item.feedback}
                    </p>
                  </div>
                </div>
              ))
            )}

            {activePhase?.status === 'Open' && (
              <div className="d-flex gap-3 align-items-start mb-3">
                <div className="p-2 rounded-3 bg-danger-subtle text-danger">
                  <BiCalendarExclamation className="fs-5" />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold small text-dark">Giai đoạn đang mở</div>
                  <p className="text-muted small mt-1 mb-0" style={{ lineHeight: '1.4' }}>
                    {activePhase.title} — Hạn: {activePhase.deadline}
                  </p>
                </div>
              </div>
            )}

            <hr className="my-3 text-light-subtle" />
            <div className="text-center">
              <Button variant="link" className="text-decoration-none text-success fw-semibold small p-0" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/submissions')}>
                View All Submissions
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ================= MODAL 1: THÊM MỚI TASK KANBAN ================= */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered>
        <Form onSubmit={handleCreateTask}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold text-dark" style={{ fontSize: '1.15rem' }}>Create Project Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Task Title *</Form.Label>
              <Form.Control type="text" placeholder="e.g., Design API endpoints" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Description</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Short summary of implementation steps..." value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Initial Column</Form.Label>
                  <Form.Select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value)}>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Priority Level</Form.Label>
                  <Form.Select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" size="sm" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button variant="dark" size="sm" type="submit">Add Task</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default StudentDashboard;