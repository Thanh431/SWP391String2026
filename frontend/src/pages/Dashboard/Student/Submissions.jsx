import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Form, Nav, Spinner } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext';
import { getSubmissions, submitPhase } from '../../../api/studentService';

const phaseStatusMeta = {
  Locked: { label: 'Chưa mở', variant: 'secondary', icon: 'bi-lock-fill' },
  Open: { label: 'Đang mở cổng', variant: 'success', icon: 'bi-unlock-fill' },
  Reviewing: { label: 'Chờ đánh giá', variant: 'warning', icon: 'bi-hourglass-split' },
  Completed: { label: 'Đã hoàn thành', variant: 'success', icon: 'bi-check-circle-fill' },
};

const submissionStatusMeta = {
  Approved: { label: 'Đã thông qua', className: 'bg-success' },
  Reviewing: { label: 'Chờ đánh giá', className: 'bg-warning text-dark' },
  Rejected: { label: 'Cần sửa lại', className: 'bg-danger' },
};

const phaseLabels = {
  1: 'M1',
  2: 'M2',
  3: 'M3',
  4: 'Final',
};

const Submissions = () => {
  const auth = useAuth();
  const studentId = auth.user?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitData, setSubmitData] = useState({ repoLink: '', docLink: '', note: '' });

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const result = await getSubmissions(studentId);
      setData(result);
      if (result.activePhaseId) {
        setSelectedPhaseId(result.activePhaseId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu nộp bài.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPhase = data?.phases?.find((p) => p.id === selectedPhaseId);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!studentId || !selectedPhase) return;

    if (!submitData.repoLink.trim() && !submitData.docLink.trim()) {
      setError('Vui lòng nhập ít nhất một liên kết GitHub hoặc Google Drive.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await submitPhase(studentId, selectedPhase.id, {
        repoLink: submitData.repoLink.trim(),
        docLink: submitData.docLink.trim(),
        note: submitData.note.trim(),
      });
      setData(result);
      setSubmitData({ repoLink: '', docLink: '', note: '' });
      const audience = selectedPhase.submitToCommittee
        ? 'Mentor và Committee'
        : 'Mentor';
      setMessage(`Đã nộp ${selectedPhase.shortTitle} thành công — gửi tới ${audience}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3 mb-0">Đang tải cổng nộp bài...</p>
      </div>
    );
  }

  if (!data?.hasTeam) {
    return (
      <div className="container-fluid">
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">Nộp sản phẩm & Báo cáo</h2>
        </div>
        <Alert variant="info">
          {data?.message || 'Bạn chưa tham gia nhóm nào.'}{' '}
          <Link to="/team-management">Team Management</Link> hoặc{' '}
          <Link to="/my-courses">My Courses</Link>.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Nộp sản phẩm & Báo cáo</h2>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">Submissions</li>
          </ol>
        </nav>
        <p className="text-muted small mb-0 mt-2">
          Nhóm <strong>{data.groupName}</strong> — Dự án: <strong>{data.projectTitle}</strong>
        </p>
        <p className="text-muted small mb-0">
          4 giai đoạn đánh giá Capstone (15% + 20% + 25% + 40%). Giai đoạn 1–3 nộp cho <strong>Mentor</strong>;
          Giai đoạn 4 nộp cho <strong>Mentor + Committee</strong>.
        </p>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}

      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <Nav variant="pills" className="gap-2 flex-wrap">
            {data.phases.map((phase) => {
              const meta = phaseStatusMeta[phase.status] || phaseStatusMeta.Locked;
              return (
                <Nav.Item key={phase.id}>
                  <Nav.Link
                    active={selectedPhaseId === phase.id}
                    onClick={() => setSelectedPhaseId(phase.id)}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="fw-semibold">
                      GD {phase.id} · {phaseLabels[phase.id]}
                    </span>
                    <Badge bg="dark" className="ms-1" style={{ fontSize: '9px' }}>{phase.weight}</Badge>
                    <span className={`badge ms-2 bg-${meta.variant}`} style={{ fontSize: '10px' }}>
                      <i className={`bi ${meta.icon} me-1`} />
                      {meta.label}
                    </span>
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-5 col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              {selectedPhase ? (
                <>
                  <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4 flex-wrap gap-2">
                    <h5 className="fw-bold text-dark mb-0">Cổng nộp bài</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      <Badge bg={selectedPhase.submitToCommittee ? 'primary' : 'secondary'}>
                        <i className={`bi ${selectedPhase.submitToCommittee ? 'bi-people-fill' : 'bi-person-check'} me-1`} />
                        {selectedPhase.submitAudience}
                      </Badge>
                      <span className={`badge bg-${phaseStatusMeta[selectedPhase.status]?.variant || 'secondary'} px-2.5 py-1 rounded`}>
                        {phaseStatusMeta[selectedPhase.status]?.label || selectedPhase.status}
                      </span>
                    </div>
                  </div>

                  <div
                    className="bg-light p-3 rounded mb-4"
                    style={{ borderLeft: `4px solid ${selectedPhase.id === 4 ? '#0d6efd' : '#198754'}` }}
                  >
                    <h6 className="fw-bold text-dark mb-2">{selectedPhase.title}</h6>

                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <Badge bg="light" text="dark" className="border">{selectedPhase.week}</Badge>
                      <Badge bg="light" text="dark" className="border">Trọng số {selectedPhase.weight}</Badge>
                      <Badge bg="light" text="dark" className="border">{selectedPhase.assessmentType}</Badge>
                      <Badge bg="light" text="dark" className="border">{selectedPhase.duration}</Badge>
                    </div>

                    <p className="mb-2 text-muted small">
                      <strong>CLO:</strong> {selectedPhase.clo}
                    </p>
                    <p className="mb-2 text-muted small">{selectedPhase.description}</p>

                    <p className="mb-1 text-danger small">
                      <i className="bi bi-clock-fill me-1" />
                      <strong>Hạn chót: {selectedPhase.deadline}</strong>
                    </p>
                    <p className="mb-3 text-muted small" style={{ fontSize: '12px' }}>
                      Định dạng: {selectedPhase.allowedFormats} (Tối đa {selectedPhase.maxSize})
                    </p>

                    <h6 className="fw-bold small text-dark mb-1">Tiêu chí chấm điểm (Grading Guide)</h6>
                    <ul className="mb-3 ps-3 text-secondary small">
                      {selectedPhase.gradingCriteria?.map((item) => (
                        <li key={item} className="mb-1">{item}</li>
                      ))}
                    </ul>

                    <h6 className="fw-bold small text-dark mb-1">Sản phẩm cần nộp</h6>
                    <ul className="mb-0 ps-3 text-secondary small">
                      {selectedPhase.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedPhase.submitToCommittee && (
                    <Alert variant="primary" className="small py-2">
                      <i className="bi bi-info-circle me-1" />
                      Giai đoạn cuối: bài nộp sẽ được gửi đồng thời tới <strong>Mentor</strong> và{' '}
                      <strong>Committee</strong> (hội đồng bảo vệ).
                    </Alert>
                  )}

                  {selectedPhase.status === 'Locked' && (
                    <Alert variant="secondary" className="small mb-0">
                      Hoàn thành và được mentor chấp nhận giai đoạn trước để mở cổng nộp bài.
                    </Alert>
                  )}

                  {selectedPhase.status === 'Reviewing' && selectedPhase.latestSubmission && (
                    <Alert variant="warning" className="small mb-0">
                      Bài nộp đang chờ đánh giá (nộp lúc {selectedPhase.latestSubmission.submittedAt}).
                      {selectedPhase.submitToCommittee && ' Mentor và Committee đã nhận bài.'}
                    </Alert>
                  )}

                  {selectedPhase.status === 'Completed' && (
                    <Alert variant="success" className="small mb-0">
                      Giai đoạn đã hoàn thành. Xem phản hồi ở cột bên phải.
                    </Alert>
                  )}

                  {selectedPhase.status === 'Open' && (
                    <Form onSubmit={handleSubmitForm}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary small">GitHub Repository</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-white text-muted border-end-0">
                            <i className="bi bi-github" />
                          </span>
                          <Form.Control
                            type="url"
                            className="border-start-0 ps-1 small"
                            value={submitData.repoLink}
                            onChange={(e) => setSubmitData({ ...submitData, repoLink: e.target.value })}
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary small">
                          Google Drive (Báo cáo / Slide / Video demo)
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-white text-muted border-end-0">
                            <i className="bi bi-google" />
                          </span>
                          <Form.Control
                            type="url"
                            className="border-start-0 ps-1 small"
                            value={submitData.docLink}
                            onChange={(e) => setSubmitData({ ...submitData, docLink: e.target.value })}
                            placeholder="https://drive.google.com/file/d/..."
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold text-secondary small">
                          Ghi chú gửi {selectedPhase.submitToCommittee ? 'Mentor & Committee' : 'Mentor'}
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          className="small"
                          value={submitData.note}
                          onChange={(e) => setSubmitData({ ...submitData, note: e.target.value })}
                          placeholder="Mô tả ngắn về sản phẩm nộp, AI logs, test cases..."
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        variant={selectedPhase.submitToCommittee ? 'primary' : 'success'}
                        className="w-100 py-2 fw-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-check me-1" />
                            Nộp Giai đoạn {selectedPhase.id}
                            {selectedPhase.submitToCommittee ? ' (Mentor + Committee)' : ' (Mentor)'}
                          </>
                        )}
                      </Button>
                    </Form>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">Chọn một giai đoạn để xem chi tiết.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-7 col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-dark mb-4">Lịch sử nộp bài & Đánh giá</h5>

              {data.history.length === 0 ? (
                <Alert variant="light" className="mb-0 border">
                  Chưa có bài nộp nào. Hãy bắt đầu với Giai đoạn 1 (Milestone 1).
                </Alert>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {data.history.map((sub) => {
                    const statusMeta = submissionStatusMeta[sub.status] || {
                      label: sub.status,
                      className: 'bg-secondary',
                    };
                    return (
                      <div
                        key={sub.id}
                        className="p-3 border rounded"
                        style={{ backgroundColor: '#fff', border: '1px solid #eef1f4' }}
                      >
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                          <div>
                            <h6 className="fw-bold text-dark mb-1 small">{sub.phaseTitle}</h6>
                            <span className="text-muted small" style={{ fontSize: '11px' }}>
                              <i className="bi bi-person me-1" />
                              {sub.submittedBy} | <i className="bi bi-calendar3 me-1" />
                              {sub.submittedAt}
                            </span>
                            {sub.submitAudience && (
                              <div className="mt-1">
                                <Badge bg={sub.submitToCommittee ? 'primary' : 'secondary'} style={{ fontSize: '10px' }}>
                                  Gửi tới: {sub.submitAudience}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <span className={`badge rounded-pill px-2.5 py-1 ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        {sub.links?.length > 0 && (
                          <div className="mb-3 d-flex flex-column gap-1.5">
                            {sub.links.map((link) => (
                              <div
                                key={link.url}
                                className="d-flex align-items-center text-truncate small bg-light p-2 rounded border border-light"
                                style={{ fontSize: '12px' }}
                              >
                                <i className={`bi ${link.type === 'github' ? 'bi-github' : 'bi-link-45deg'} me-2 text-primary`} />
                                <span className="text-muted me-2">{link.label}:</span>
                                <a href={link.url} target="_blank" rel="noreferrer" className="text-decoration-none text-primary text-truncate">
                                  {link.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {sub.note && (
                          <p className="small text-muted mb-3">
                            <strong>Ghi chú sinh viên:</strong> {sub.note}
                          </p>
                        )}

                        <div className="p-3 bg-light rounded" style={{ borderLeft: '3px solid #6c757d' }}>
                          <div className="fw-bold text-dark small mb-1" style={{ fontSize: '12px' }}>
                            <i className="bi bi-chat-left-text me-1" />
                            Phản hồi từ: {sub.reviewer}
                            {sub.rating && <span className="badge bg-secondary ms-2">{sub.rating}</span>}
                          </div>
                          <p className="mb-0 text-secondary small">{sub.feedback}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submissions;
