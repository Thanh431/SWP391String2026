import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { FaClipboardCheck, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import {
  createDefenseSchedule,
  deleteDefenseSchedule,
  defenseStatuses,
  getAdminStudentGroups,
  getCommitteeUsers,
  getDefenseSchedules,
  getSemesters,
  updateDefenseSchedule,
} from '../../../api/adminService';

const statusVariant = {
  Scheduled: 'info',
  'In Progress': 'warning',
  Completed: 'success',
  Rescheduled: 'secondary',
};

const emptyForm = {
  semesterId: '',
  studentGroupId: '',
  committeeId: '',
  defenseDate: '',
  defenseTime: '08:00',
  timeSlot: '',
  location: '',
  status: 'Scheduled',
  notes: '',
};

const AdminDefenseSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleData, semesterData, groupData, committeeData] = await Promise.all([
        getDefenseSchedules(),
        getSemesters(),
        getAdminStudentGroups(),
        getCommitteeUsers(),
      ]);
      setSchedules(scheduleData);
      setSemesters(semesterData);
      setGroups(groupData);
      setCommittees(committeeData);
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
      semesterId: item.semesterId ? String(item.semesterId) : '',
      studentGroupId: String(item.studentGroupId),
      committeeId: item.committeeId ? String(item.committeeId) : '',
      defenseDate: item.defenseDate,
      defenseTime: item.defenseTime,
      timeSlot: item.timeSlot,
      location: item.location,
      status: item.status,
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await updateDefenseSchedule(editingId, {
          semesterId: form.semesterId,
          studentGroupId: form.studentGroupId,
          committeeId: form.committeeId,
          defenseDate: form.defenseDate,
          defenseTime: form.defenseTime,
          timeSlot: form.timeSlot,
          location: form.location,
          status: form.status,
          notes: form.notes,
        });
        setMessage('✓ Đã cập nhật lịch chấm.');
      } else {
        await createDefenseSchedule(form);
        setMessage('✓ Đã tạo lịch chấm mới.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể lưu lịch chấm.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch chấm này? Điểm đánh giá hội đồng liên quan cũng sẽ bị xóa.')) return;
    setMessage('');
    try {
      await deleteDefenseSchedule(id);
      setMessage('✓ Đã xóa lịch chấm.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể xóa lịch chấm.');
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
            <FaClipboardCheck className="text-success" /> Lịch chấm điểm
          </h3>
          <p className="text-muted small m-0 mt-1">Phân công nhóm, phòng, ca chấm và thành viên hội đồng</p>
        </div>
        <Button
          className="border-0 rounded-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: '#103d2b' }}
          onClick={openCreate}
        >
          <FaPlus size={12} /> Thêm lịch chấm
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
                <th className="ps-4 py-3">Nhóm</th>
                <th className="py-3">Kỳ học</th>
                <th className="py-3">Ngày / Ca</th>
                <th className="py-3">Phòng</th>
                <th className="py-3">Hội đồng</th>
                <th className="py-3">Trạng thái</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td className="ps-4">
                    <div className="fw-bold">{s.groupCode}</div>
                    <small className="text-muted">{s.groupName}</small>
                  </td>
                  <td className="small">{s.semesterName}</td>
                  <td className="small">
                    <div>{s.defenseDate}</div>
                    <div className="text-muted">{s.timeSlot} · {s.defenseTime}</div>
                  </td>
                  <td>{s.location}</td>
                  <td className="small">{s.committeeName}</td>
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
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">Chưa có lịch chấm nào.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingId ? 'Sửa lịch chấm' : 'Thêm lịch chấm mới'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Kỳ học</Form.Label>
                  <Form.Select
                    value={form.semesterId}
                    onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
                  >
                    <option value="">— Không chọn —</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Nhóm sinh viên *</Form.Label>
                  <Form.Select
                    value={form.studentGroupId}
                    onChange={(e) => setForm({ ...form, studentGroupId: e.target.value })}
                    required={!editingId}
                  >
                    <option value="">Chọn nhóm</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.groupCode} — {g.groupName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Thành viên hội đồng *</Form.Label>
                  <Form.Select
                    value={form.committeeId}
                    onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
                    required={!editingId}
                  >
                    <option value="">Chọn Committee</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.username} — {c.username}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Committee chỉ thấy lịch được gán đúng email này. Hãy chọn trùng tài khoản họ đăng nhập.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Ngày chấm *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.defenseDate}
                    onChange={(e) => setForm({ ...form, defenseDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Giờ bắt đầu</Form.Label>
                  <Form.Control
                    type="time"
                    value={form.defenseTime}
                    onChange={(e) => setForm({ ...form, defenseTime: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Trạng thái</Form.Label>
                  <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {defenseStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Ca chấm *</Form.Label>
                  <Form.Control
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    placeholder="Ca 1: 08:00 — 10:30"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Phòng *</Form.Label>
                  <Form.Control
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="P.301 — Tòa Alpha"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

export default AdminDefenseSchedule;
