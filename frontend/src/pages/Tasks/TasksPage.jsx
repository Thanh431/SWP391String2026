import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../../api/api';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 2,
    dueDate: '',
    projectId: '',
    progress: 0,
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/project/1');
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Lỗi khi tải danh sách công việc');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.split('T')[0] || '',
        projectId: task.projectId,
        progress: task.progress,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'To Do',
        priority: 2,
        dueDate: '',
        projectId: projectId || projects[0]?.id || '',
        progress: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        projectId: parseInt(formData.projectId),
        priority: parseInt(formData.priority),
        progress: parseInt(formData.progress),
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, submitData);
      } else {
        await api.post('/tasks', submitData);
      }
      fetchTasks();
      handleCloseModal();
    } catch (err) {
      setError('Lỗi khi lưu công việc');
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa công việc này?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchTasks();
      } catch (err) {
        setError('Lỗi khi xóa công việc');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variantMap = {
      'To Do': 'secondary',
      'In Progress': 'primary',
      'In Review': 'info',
      'Completed': 'success',
    };
    return <Badge bg={variantMap[status] || 'light'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const labels = { 1: 'Thấp', 2: 'Trung bình', 3: 'Cao' };
    const variants = { 1: 'success', 2: 'warning', 3: 'danger' };
    return <Badge bg={variants[priority] || 'light'}>{labels[priority]}</Badge>;
  };

  if (loading) return <Container className="py-5"><p>Đang tải...</p></Container>;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Quản lý Công việc</h3>
        <Button variant="success" onClick={() => handleShowModal()}>
          <FaPlus /> Thêm công việc
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm rounded-4">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Ưu tiên</th>
              <th>Tiến độ</th>
              <th>Hạn chót</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  Chưa có công việc nào
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td className="fw-semibold">{task.title}</td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td>
                    <div className="progress" style={{ height: '20px', width: '100px' }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${task.progress}%` }}
                      >
                        {task.progress}%
                      </div>
                    </div>
                  </td>
                  <td>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleShowModal(task)}
                      className="me-2"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(task.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tiêu đề</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>In Review</option>
                    <option>Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ưu tiên</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  >
                    <option value={1}>Thấp</option>
                    <option value={2}>Trung bình</option>
                    <option value={3}>Cao</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Hạn chót</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tiến độ (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" className="w-100 mt-3" style={{ backgroundColor: '#103d2b' }}>
              {editingTask ? 'Cập nhật' : 'Tạo'} công việc
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TasksPage;
