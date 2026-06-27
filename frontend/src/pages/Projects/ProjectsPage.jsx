import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import api from '../../api/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning',
    groupId: '',
    progress: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
      setError('');
    } catch (err) {
      setError('Lỗi khi tải danh sách dự án');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        groupId: project.groupId,
        progress: project.progress,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'Planning',
        groupId: '',
        progress: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      fetchProjects();
      handleCloseModal();
    } catch (err) {
      setError('Lỗi khi lưu dự án');
      console.error(err);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa dự án này?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        fetchProjects();
      } catch (err) {
        setError('Lỗi khi xóa dự án');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variantMap = {
      'Planning': 'secondary',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'warning',
    };
    return <Badge bg={variantMap[status] || 'light'}>{status}</Badge>;
  };

  if (loading) return <Container className="py-5"><p>Đang tải...</p></Container>;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Quản lý Dự án</h3>
        <Button variant="success" onClick={() => handleShowModal()}>
          <FaPlus /> Thêm dự án
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm rounded-4">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Tên dự án</th>
              <th>Nhóm</th>
              <th>Trạng thái</th>
              <th>Tiến độ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  Chưa có dự án nào
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id}>
                  <td className="fw-semibold">{project.name}</td>
                  <td>{project.groupId}</td>
                  <td>{getStatusBadge(project.status)}</td>
                  <td>
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${project.progress}%` }}
                      >
                        {project.progress}%
                      </div>
                    </div>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleShowModal(project)}
                      className="me-2"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(project.id)}
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
          <Modal.Title>{editingProject ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tên dự án</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>On Hold</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>ID Nhóm</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Tiến độ (%)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              />
            </Form.Group>
            <Button type="submit" className="w-100" style={{ backgroundColor: '#103d2b' }}>
              {editingProject ? 'Cập nhật' : 'Tạo'} dự án
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProjectsPage;
