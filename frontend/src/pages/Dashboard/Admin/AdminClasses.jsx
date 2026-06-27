import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { FaGraduationCap, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import {
  campusOptions,
  createMentorClass,
  deleteMentorClass,
  getMentorClasses,
  getMentors,
  getSemesters,
  updateMentorClass,
} from '../../../api/adminService';

const emptyForm = {
  name: '',
  code: '',
  semester: '',
  campus: 'Hà Nội',
  mentorId: '',
};

const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classData, semesterData, mentorData] = await Promise.all([
        getMentorClasses(),
        getSemesters(),
        getMentors(),
      ]);
      setClasses(classData);
      setSemesters(semesterData);
      setMentors(mentorData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      semester: semesters[0]?.name || '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      semester: item.semester,
      campus: item.campus,
      mentorId: String(item.mentorId),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await updateMentorClass(editingId, form);
        setMessage('✓ Đã cập nhật class.');
      } else {
        await createMentorClass(form);
        setMessage('✓ Đã tạo class mới.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể lưu class.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa class này?')) return;
    try {
      await deleteMentorClass(id);
      setMessage('✓ Đã xóa class.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể xóa class.');
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
            <FaGraduationCap className="text-success" /> Quản lý Class
          </h3>
          <p className="text-muted small m-0 mt-1">
            Admin tạo class theo kỳ học và gán Mentor hướng dẫn
          </p>
        </div>
        <Button
          className="border-0 rounded-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: '#103d2b' }}
          onClick={openCreate}
        >
          <FaPlus size={12} /> Tạo class mới
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
                <th className="ps-4 py-3">Tên class</th>
                <th className="py-3">Mã môn</th>
                <th className="py-3">Kỳ / Campus</th>
                <th className="py-3">Mentor</th>
                <th className="py-3">Nhóm</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td className="ps-4">
                    <div className="fw-bold">{item.name}</div>
                    <small className="text-muted">{item.slug}</small>
                  </td>
                  <td className="fw-semibold">{item.code}</td>
                  <td className="small">
                    <div>{item.semester}</div>
                    <div className="text-muted">{item.campus}</div>
                  </td>
                  <td className="small">
                    <div className="fw-semibold">{item.mentorName}</div>
                    <div className="text-muted">{item.mentorEmail}</div>
                  </td>
                  <td>
                    <Badge bg="info" className="bg-opacity-10 text-info rounded-2">
                      {item.groupCount} nhóm
                    </Badge>
                  </td>
                  <td className="pe-4 text-end">
                    <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(item)}>
                      <FaEdit size={12} />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                      <FaTrash size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Chưa có class nào.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingId ? 'Sửa class' : 'Tạo class mới'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Tên class *</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Capstone Project"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mã môn *</Form.Label>
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
                  <Form.Label className="small fw-semibold">Kỳ học *</Form.Label>
                  <Form.Select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    required
                  >
                    <option value="">Chọn kỳ học</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.name}>{s.code} — {s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Campus *</Form.Label>
                  <Form.Select
                    value={form.campus}
                    onChange={(e) => setForm({ ...form, campus: e.target.value })}
                    required
                  >
                    {campusOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mentor phụ trách *</Form.Label>
                  <Form.Select
                    value={form.mentorId}
                    onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
                    required
                  >
                    <option value="">Chọn Mentor</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName || m.username} ({m.username})
                      </option>
                    ))}
                  </Form.Select>
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

export default AdminClasses;
