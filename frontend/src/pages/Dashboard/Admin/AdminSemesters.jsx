import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { FaCalendarAlt, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import {
  createSemester,
  deleteSemester,
  getSemesters,
  semesterStatuses,
  updateSemester,
} from '../../../api/adminService';

const statusVariant = {
  Planning: 'secondary',
  Active: 'success',
  Completed: 'primary',
};

const emptyForm = {
  code: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'Planning',
};

const AdminSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSemesters(await getSemesters());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description || '',
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await updateSemester(editingId, form);
        setMessage('✓ Đã cập nhật kỳ học.');
      } else {
        await createSemester(form);
        setMessage('✓ Đã tạo kỳ học mới.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể lưu kỳ học.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa kỳ học này?')) return;
    try {
      await deleteSemester(id);
      setMessage('✓ Đã xóa kỳ học.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể xóa kỳ học.');
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaCalendarAlt className="text-success" /> Quản lý kỳ học
          </h3>
          <p className="text-muted small m-0 mt-1">Tạo và quản lý các kỳ Capstone / SWP391</p>
        </div>
        <Button
          className="border-0 rounded-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: '#103d2b' }}
          onClick={openCreate}
        >
          <FaPlus size={12} /> Tạo kỳ mới
        </Button>
      </div>

      {message && (
        <Alert variant={message.includes('✓') ? 'success' : 'danger'} dismissible onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4 py-3">Mã kỳ</th>
                <th className="py-3">Tên kỳ</th>
                <th className="py-3">Thời gian</th>
                <th className="py-3">Trạng thái</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((s) => (
                <tr key={s.id}>
                  <td className="ps-4 fw-bold">{s.code}</td>
                  <td>
                    <div className="fw-semibold">{s.name}</div>
                    <small className="text-muted">{s.description}</small>
                  </td>
                  <td className="small">{s.startDate} → {s.endDate}</td>
                  <td>
                    <Badge bg={statusVariant[s.status] || 'secondary'} className="rounded-2">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="pe-4 text-end">
                    <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(s)}>
                      <FaEdit size={12} />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>
                      <FaTrash size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
              {semesters.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Chưa có kỳ học nào.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingId ? 'Sửa kỳ học' : 'Tạo kỳ học mới'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mã kỳ *</Form.Label>
                  <Form.Control
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="FA24_CAP391"
                    required
                    disabled={Boolean(editingId)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Trạng thái</Form.Label>
                  <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {semesterStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Tên kỳ *</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Capstone Fall 2024"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Ngày bắt đầu *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Ngày kết thúc *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>Huỷ</Button>
            <Button type="submit" style={{ backgroundColor: '#103d2b', border: 'none' }}>Lưu</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminSemesters;
