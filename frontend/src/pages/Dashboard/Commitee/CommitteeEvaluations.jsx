import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { FaCheckSquare, FaEdit, FaPaperPlane } from 'react-icons/fa';
import {
  getCommitteeEvaluations,
  getCommitteeEvaluationStats,
  recommendations,
  recommendationStyle,
  submitCommitteeEvaluation,
} from '../../../api/committeeService';
import { useCommitteeSession } from './useCommitteeSession';

const emptyForm = {
  technicalScore: '',
  presentationScore: '',
  innovationScore: '',
  feedback: '',
  recommendation: 'Pass',
};

const CommitteeEvaluations = () => {
  const { committeeId, isReady, getApiError } = useCommitteeSession();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!isReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const [evalItems, evalStats] = await Promise.all([
        getCommitteeEvaluations(committeeId),
        getCommitteeEvaluationStats(committeeId),
      ]);
      setItems(evalItems);
      setStats({
        total: evalStats.totalAssigned ?? 0,
        completed: evalStats.completed ?? 0,
        pending: evalStats.pending ?? 0,
      });
    } catch (err) {
      setMessage(getApiError(err, 'Không thể tải danh sách chấm điểm.'));
    } finally {
      setLoading(false);
    }
  }, [committeeId, getApiError, isReady]);

  useEffect(() => {
    load();
  }, [load]);

  const overallPreview = useMemo(() => {
    const t = parseFloat(form.technicalScore);
    const p = parseFloat(form.presentationScore);
    const i = parseFloat(form.innovationScore);
    if ([t, p, i].some((v) => Number.isNaN(v))) return '—';
    return (Math.round(((t + p + i) / 3) * 10) / 10).toFixed(1);
  }, [form]);

  const openGrade = (item) => {
    setActiveItem(item);
    if (item.evaluation) {
      setForm({
        technicalScore: String(item.evaluation.technicalScore ?? ''),
        presentationScore: String(item.evaluation.presentationScore ?? ''),
        innovationScore: String(item.evaluation.innovationScore ?? ''),
        feedback: item.evaluation.feedback || '',
        recommendation: item.evaluation.recommendation || 'Pass',
      });
    } else {
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem || !committeeId) return;
    setSubmitting(true);
    setMessage('');
    try {
      await submitCommitteeEvaluation(committeeId, {
        defenseId: String(activeItem.defenseId),
        ...form,
      });
      setMessage('✓ Đã gửi điểm chấm thành công.');
      setShowModal(false);
      load();
    } catch (err) {
      setMessage(getApiError(err, 'Không thể gửi điểm chấm.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaCheckSquare className="text-success" /> Chấm điểm bảo vệ
          </h3>
          <p className="text-muted small m-0 mt-1">Hội đồng tự nhập và gửi điểm trực tiếp — không cần Admin duyệt.</p>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="secondary" className="rounded-3 px-3 py-2">Tổng: {stats.total}</Badge>
          <Badge bg="success" className="rounded-3 px-3 py-2">Đã chấm: {stats.completed}</Badge>
          <Badge bg="warning" text="dark" className="rounded-3 px-3 py-2">Chờ chấm: {stats.pending}</Badge>
        </div>
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
                <th className="py-3">Đề tài</th>
                <th className="py-3">Lịch chấm</th>
                <th className="py-3">Điểm TB</th>
                <th className="py-3">Kết luận</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const ev = item.evaluation;
                return (
                  <tr key={item.defenseId}>
                    <td className="ps-4">
                      <div className="fw-bold">{item.groupCode}</div>
                      <small className="text-muted">{item.groupName}</small>
                    </td>
                    <td className="small">{item.project}</td>
                    <td className="small">
                      <div>{item.defenseDate}</div>
                      <div className="text-muted">{item.timeSlot} · {item.location}</div>
                    </td>
                    <td>{ev ? <span className="fw-bold text-success">{ev.overallScore}</span> : <span className="text-muted">—</span>}</td>
                    <td>
                      {ev ? (
                        <Badge bg={recommendationStyle[ev.recommendation] || 'secondary'} className="rounded-2">{ev.recommendation}</Badge>
                      ) : (
                        <Badge bg="warning" text="dark" className="rounded-2">Chưa chấm</Badge>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      <Button size="sm" className="border-0 rounded-3 d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#103d2b' }} onClick={() => openGrade(item)}>
                        {ev ? <FaEdit size={11} /> : <FaPaperPlane size={11} />}
                        {ev ? 'Sửa điểm' : 'Chấm điểm'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Chưa có nhóm nào được phân công cho bạn.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{activeItem?.evaluation ? 'Cập nhật điểm' : 'Nộp điểm chấm'} — {activeItem?.groupCode}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <p className="text-muted small mb-3">{activeItem?.groupName} · {activeItem?.project}</p>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Kỹ thuật (0–10) *</Form.Label>
                  <Form.Control type="number" min="0" max="10" step="0.1" value={form.technicalScore} onChange={(e) => setForm({ ...form, technicalScore: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Trình bày (0–10) *</Form.Label>
                  <Form.Control type="number" min="0" max="10" step="0.1" value={form.presentationScore} onChange={(e) => setForm({ ...form, presentationScore: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Sáng tạo (0–10) *</Form.Label>
                  <Form.Control type="number" min="0" max="10" step="0.1" value={form.innovationScore} onChange={(e) => setForm({ ...form, innovationScore: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Điểm trung bình</Form.Label>
                  <Form.Control value={overallPreview} readOnly className="fw-bold text-success" />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Kết luận *</Form.Label>
                  <Form.Select value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}>
                    {recommendations.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Nhận xét</Form.Label>
                  <Form.Control as="textarea" rows={4} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Nhận xét chi tiết về dự án..." />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>Huỷ</Button>
            <Button type="submit" disabled={submitting} className="border-0 d-flex align-items-center gap-2" style={{ backgroundColor: '#103d2b' }}>
              <FaPaperPlane size={12} />
              {submitting ? 'Đang gửi...' : 'Gửi điểm'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CommitteeEvaluations;
