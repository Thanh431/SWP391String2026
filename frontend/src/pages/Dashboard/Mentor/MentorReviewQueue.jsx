import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button, Table, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaClipboardList, FaEye, FaGithub, FaGoogle, FaStar } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import {
  feedbackRatings,
  getMentorReviewQueue,
  gradeSubmission,
} from '../../../api/mentorService';

const linkIcon = (type) => {
  if (type === 'github') return <FaGithub className="me-2" />;
  if (type === 'drive') return <FaGoogle className="me-2" />;
  return <i className="bi bi-link-45deg me-2" />;
};

const ratingFromScore = (score) => {
  const value = parseFloat(score);
  if (Number.isNaN(value)) return 'Good';
  if (value >= 9) return 'Excellent';
  if (value >= 8) return 'Good';
  if (value >= 6.5) return 'Needs Improvement';
  return 'At Risk';
};

const formatScore = (score) => (score != null ? Number(score).toFixed(1) : '—');

const SubmissionContent = ({ item }) => {
  const hasLinks = item?.links?.length > 0;
  const hasNote = Boolean(item?.studentNote?.trim());

  return (
    <div className="p-3 rounded-3 bg-light border">
      <h6 className="fw-bold text-dark mb-3">
        <i className="bi bi-inbox me-2 text-success" />
        Nội dung sinh viên nộp
      </h6>

      <Row className="g-3 mb-3">
        <Col md={6}>
          <small className="text-muted d-block">Người nộp</small>
          <span className="fw-semibold">{item?.studentName || '—'}</span>
        </Col>
        <Col md={6}>
          <small className="text-muted d-block">Giai đoạn / Milestone</small>
          <span className="fw-semibold">{item?.milestone || '—'}</span>
        </Col>
        <Col md={6}>
          <small className="text-muted d-block">Loại bài nộp</small>
          <span className="fw-semibold">{item?.submission || '—'}</span>
        </Col>
        <Col md={6}>
          <small className="text-muted d-block">Thời gian nộp</small>
          <span className="fw-semibold">{item?.submittedAt || '—'}</span>
        </Col>
        {item?.dueDate && (
          <Col md={6}>
            <small className="text-muted d-block">Hạn nộp</small>
            <span className={`fw-semibold ${item.overdue ? 'text-danger' : ''}`}>{item.dueDate}</span>
          </Col>
        )}
      </Row>

      {hasLinks ? (
        <div className="d-flex flex-column gap-2 mb-3">
          {item.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="d-flex align-items-center text-decoration-none small bg-white border rounded p-2"
            >
              {linkIcon(link.type)}
              <span className="text-muted me-2">{link.label}:</span>
              <span className="text-primary text-truncate">{link.url}</span>
            </a>
          ))}
        </div>
      ) : (
        <Alert variant="secondary" className="small py-2 mb-3">
          Sinh viên chưa đính kèm link GitHub hoặc Google Drive.
        </Alert>
      )}

      {hasNote && (
        <div className="small">
          <small className="text-muted d-block mb-1">Ghi chú từ sinh viên</small>
          <p className="mb-0 text-secondary bg-white border rounded p-2">{item.studentNote}</p>
        </div>
      )}
    </div>
  );
};

const MentorReviewQueue = () => {
  const auth = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('Good');
  const [score, setScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    try {
      const data = await getMentorReviewQueue(auth.user.id);
      setQueue(data);
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const pendingCount = queue.filter((item) => item.status === 'Pending').length;

  const openReview = (item) => {
    setSelected(item);
    setFeedback(item.feedback || '');
    setRating(item.rating || 'Good');
    setScore(item.score != null ? String(item.score) : '');
    setError('');
  };

  const handleScoreChange = (value) => {
    setScore(value);
    if (value !== '' && !Number.isNaN(parseFloat(value))) {
      setRating(ratingFromScore(value));
    }
  };

  const scorePreview = useMemo(() => {
    const value = parseFloat(score);
    return Number.isNaN(value) ? null : value.toFixed(1);
  }, [score]);

  const submitReview = async () => {
    if (!selected || !feedback.trim() || score === '') return;
    const numericScore = parseFloat(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      setError('Điểm chấm phải từ 0 đến 10.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await gradeSubmission(auth.user.id, selected.id, feedback.trim(), rating, numericScore);
      setSelected(null);
      setFeedback('');
      setRating('Good');
      setScore('');
      loadQueue();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi điểm chấm.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Review Queue</h3>
          <p className="text-muted small m-0 mt-1">
            Xem nội dung sinh viên nộp, nhập điểm (0–10) và gửi feedback.
          </p>
        </div>
        <Badge bg="danger" className="bg-opacity-10 text-danger px-3 py-2 rounded-3">
          {pendingCount} cần review
        </Badge>
      </div>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {queue.length === 0 ? (
            <div className="p-4 text-muted">Chưa có bài nộp nào trong hàng đợi.</div>
          ) : (
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Nhóm</th>
                  <th className="py-3">Sinh viên</th>
                  <th className="py-3">Bài nộp</th>
                  <th className="py-3">Giai đoạn</th>
                  <th className="py-3 text-center">Điểm</th>
                  <th className="py-3">Ngày nộp</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="pe-4 py-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4">
                      <div className="fw-semibold">{item.groupId} — {item.groupName}</div>
                      <small className="text-muted">{item.project}</small>
                    </td>
                    <td>{item.studentName}</td>
                    <td>{item.submission}</td>
                    <td className="small">{item.milestone}</td>
                    <td className="text-center">
                      {item.score != null ? (
                        <span className="fw-bold text-success">{formatScore(item.score)}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div>{item.submittedAt}</div>
                      {item.overdue && <small className="text-danger fw-semibold">Quá hạn</small>}
                    </td>
                    <td>
                      <Badge
                        bg={item.status === 'Graded' ? 'success' : item.overdue ? 'danger' : 'warning'}
                        className="bg-opacity-10 text-dark rounded-2"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="pe-4 text-end">
                      <Button
                        size="sm"
                        variant={item.status === 'Graded' ? 'outline-secondary' : 'outline-success'}
                        className="rounded-2 px-3"
                        onClick={() => openReview(item)}
                      >
                        {item.status === 'Graded' ? (
                          <><FaEye className="me-1" size={11} /> Xem</>
                        ) : (
                          'Review'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={Boolean(selected)} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FaClipboardList className="text-success" />
            Review — {selected?.groupId} · {selected?.submission}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 d-flex flex-column" style={{ maxHeight: '75vh' }}>
          <div className="flex-grow-1 overflow-auto p-3">
            <Row className="g-3 mb-3">
              <Col md={6}>
                <small className="text-muted d-block">Nhóm</small>
                <span className="fw-semibold">{selected?.groupId} — {selected?.groupName}</span>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Đề tài</small>
                <span className="fw-semibold">{selected?.project}</span>
              </Col>
            </Row>

            <SubmissionContent item={selected} />

            {selected?.submitAudience && (
              <Badge bg={selected.submitToCommittee ? 'primary' : 'secondary'} className="mt-3">
                Gửi tới: {selected.submitAudience}
              </Badge>
            )}
          </div>

          <div className="border-top p-3 bg-white">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FaStar className="text-warning" />
              Chấm điểm & Feedback
            </h6>

            {error && <Alert variant="danger" className="small py-2">{error}</Alert>}

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Điểm chấm (0–10) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    placeholder="VD: 8.5"
                    disabled={selected?.status === 'Graded'}
                    className="fw-bold"
                  />
                  {scorePreview && (
                    <Form.Text className="text-success fw-semibold">
                      Điểm: {scorePreview}/10
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mức đánh giá</Form.Label>
                  <Form.Select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    disabled={selected?.status === 'Graded'}
                  >
                    {feedbackRatings.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Tự gợi ý theo điểm — có thể chỉnh lại nếu cần.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Feedback cho nhóm *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết sau khi đã xem bài nộp..."
                    disabled={selected?.status === 'Graded'}
                  />
                </Form.Group>
              </Col>
            </Row>

            {selected?.status === 'Graded' && (
              <div className="mt-3 p-3 rounded-3 bg-light small text-secondary">
                Đã chấm {formatScore(selected.score)}/10 · {selected.rating} — Committee có thể xem trong Mentor Feedback.
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setSelected(null)}>Đóng</Button>
          {selected?.status !== 'Graded' && (
            <Button
              style={{ backgroundColor: '#103d2b', border: 'none' }}
              onClick={submitReview}
              disabled={submitting || !feedback.trim() || score === ''}
            >
              {submitting ? 'Đang gửi...' : 'Gửi điểm & feedback'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MentorReviewQueue;
