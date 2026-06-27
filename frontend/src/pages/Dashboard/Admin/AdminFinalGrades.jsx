import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Form, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import { FaBrain, FaCheckCircle, FaGraduationCap, FaEye, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import { aiLoadAdminFinalGrades, getAdminFinalGrades, publishAdminFinalGrades } from '../../../api/adminService';

const formatScore = (score) => (score != null ? Number(score).toFixed(1) : '—');

const ScoreCell = ({ score, rating, status }) => (
  <td className="text-center">
    {score != null ? (
      <span className="fw-bold text-success">{formatScore(score)}</span>
    ) : (
      <span className="text-muted">—</span>
    )}
    {rating && <div className="text-muted" style={{ fontSize: '0.68rem' }}>{rating}</div>}
    {status && status !== 'GRADED' && (
      <Badge bg="light" text="muted" className="border mt-1" style={{ fontSize: '0.62rem' }}>
        {status === 'REVIEWING' ? 'Chờ chấm' : status === 'PENDING' ? 'Chưa nộp' : 'Chưa mở'}
      </Badge>
    )}
  </td>
);

const resultStyle = {
  PASS: { bg: 'success', label: 'Đạt' },
  FAIL: { bg: 'danger', label: 'Fail' },
  INCOMPLETE: { bg: 'warning', label: 'Chưa đủ điểm' },
};

const SourceCheck = ({ ok, label }) => (
  <span className={`d-inline-flex align-items-center gap-1 small ${ok ? 'text-success' : 'text-muted'}`}>
    {ok ? <FaCheckCircle size={11} /> : <span style={{ width: 11, height: 11 }} className="d-inline-block rounded-circle border" />}
    {label}
  </span>
);

const VerificationCell = ({ percent, missing, alreadyPublished }) => (
  <td className="text-center" style={{ minWidth: 120 }}>
    <div className="fw-bold small mb-1">{percent ?? 0}%</div>
    <ProgressBar
      now={percent ?? 0}
      variant={percent === 100 ? 'success' : percent >= 60 ? 'info' : 'warning'}
      style={{ height: 6 }}
      className="rounded-pill"
    />
    {alreadyPublished && (
      <Badge bg="success" className="mt-1" style={{ fontSize: '0.62rem' }}>Đã công bố</Badge>
    )}
    {percent < 100 && missing?.length > 0 && (
      <div className="text-muted mt-1" style={{ fontSize: '0.62rem' }}>
        Thiếu: {missing.join(', ')}
      </div>
    )}
  </td>
);

const AdminFinalGrades = () => {
  const auth = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('students');
  const [semesterId, setSemesterId] = useState('');
  const [workflowStep, setWorkflowStep] = useState(1);
  const [aiQuery, setAiQuery] = useState('Load sinh viên kỳ Capstone Fall 2024 kèm điểm mentor và hội đồng');
  const [aiMessage, setAiMessage] = useState('');

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        result: filter,
        ...params,
      };
      if (semesterId) payload.semesterId = semesterId;
      setData(await getAdminFinalGrades(payload));
    } catch {
      setError('Không thể tải bảng tổng hợp điểm cuối kỳ.');
    } finally {
      setLoading(false);
    }
  }, [filter, semesterId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAiLoad = async (queryOverride) => {
    const query = (queryOverride ?? aiQuery).trim();
    if (!query) {
      setError('Vui lòng nhập yêu cầu cho AI (ví dụ: "Load sinh viên kỳ Fall 2024 bị fail").');
      return;
    }
    setAiLoading(true);
    setError('');
    setAiMessage('');
    try {
      const result = await aiLoadAdminFinalGrades(query);
      setData(result);
      if (result.aiAssist) {
        setAiMessage(result.aiAssist.interpretation);
        if (result.aiAssist.semesterId) {
          setSemesterId(String(result.aiAssist.semesterId));
        }
        if (result.aiAssist.resultFilter) {
          setFilter(result.aiAssist.resultFilter);
        }
      }
      setViewMode('students');
      setWorkflowStep(2);
      if (!queryOverride) setAiQuery(query);
    } catch {
      setError('AI không thể phân tích yêu cầu. Thử lại với câu rõ hơn.');
    } finally {
      setAiLoading(false);
    }
  };

  const sheetVerification = data?.gradeSheetVerification;
  const canPublish = sheetVerification?.canPublish && semesterId;

  const handlePublish = async () => {
    if (!semesterId) {
      setError('Vui lòng chọn kỳ học trước khi công bố điểm.');
      return;
    }
    if (!canPublish) {
      setError('Bảng điểm chưa đạt 100% kiểm tra. Vui lòng xem lại các nhóm thiếu điểm.');
      return;
    }
    setPublishLoading(true);
    setError('');
    setPublishMessage('');
    try {
      const result = await publishAdminFinalGrades({
        semesterId: Number(semesterId),
        adminId: auth?.user?.id,
      });
      setPublishMessage(result.message);
      setWorkflowStep(3);
      await load({ semesterId });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể công bố điểm. Vui lòng thử lại.');
    } finally {
      setPublishLoading(false);
    }
  };

  const groups = data?.groups || [];
  const students = data?.students || [];
  const semesters = data?.semesters || [];

  const filteredGroups = useMemo(() => {
    if (filter === 'ALL') return groups;
    return groups.filter((g) => g.result === filter);
  }, [groups, filter]);

  const filteredStudents = useMemo(() => {
    if (filter === 'ALL') return students;
    return students.filter((s) => s.result === filter);
  }, [students, filter]);

  if (loading && !data) {
    return <div className="p-4 text-muted">Đang tải tổng hợp điểm...</div>;
  }

  return (
    <div className="px-1 py-2">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaGraduationCap className="text-success" />
            Tổng hợp điểm cuối kỳ
          </h3>
          <p className="text-muted small m-0 mt-1">
            AI load sinh viên theo kỳ · Tự động điền điểm Mentor + Hội đồng · Admin kiểm tra · Công bố cho sinh viên
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Badge bg="info" className="rounded-3 px-3 py-2">Mentor đủ: {data?.mentorGradedStudents ?? 0}</Badge>
          <Badge bg="secondary" className="rounded-3 px-3 py-2">Mentor thiếu: {data?.mentorPendingStudents ?? 0}</Badge>
          <Badge bg="secondary" className="rounded-3 px-3 py-2">SV: {data?.totalStudents ?? 0}</Badge>
          <Badge bg="secondary" className="rounded-3 px-3 py-2">Nhóm: {data?.totalGroups ?? 0}</Badge>
          <Badge bg="success" className="rounded-3 px-3 py-2">Đạt: {data?.passCount ?? 0}</Badge>
          <Badge bg="danger" className="rounded-3 px-3 py-2">Fail: {data?.failCount ?? 0}</Badge>
          <Badge bg="warning" text="dark" className="rounded-3 px-3 py-2">Chưa đủ: {data?.incompleteCount ?? 0}</Badge>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {publishMessage && (
        <Alert variant="success" onClose={() => setPublishMessage('')} dismissible>
          {publishMessage}
        </Alert>
      )}
      {aiMessage && (
        <Alert variant="success" className="border-0 shadow-sm">
          <div>{aiMessage}</div>
          {data?.aiAssist?.appliedFilters?.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {data.aiAssist.appliedFilters.map((f) => (
                <Badge key={f} bg="light" text="dark" className="border">{f}</Badge>
              ))}
            </div>
          )}
        </Alert>
      )}

      {/* Workflow steps */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="py-3">
          <Row className="g-3 align-items-center">
            <Col md={8}>
              <div className="d-flex flex-wrap gap-3">
                {[
                  { step: 1, label: 'AI Load danh sách' },
                  { step: 2, label: 'Kiểm tra bảng điểm nháp' },
                  { step: 3, label: 'Công bố cho sinh viên' },
                ].map(({ step, label }) => (
                  <div
                    key={step}
                    className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 ${
                      workflowStep >= step ? 'bg-success bg-opacity-10 text-success' : 'bg-light text-muted'
                    }`}
                  >
                    <span className={`fw-bold rounded-circle d-inline-flex align-items-center justify-content-center ${
                      workflowStep >= step ? 'bg-success text-white' : 'bg-secondary text-white'
                    }`} style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {step}
                    </span>
                    <span className="small fw-medium">{label}</span>
                  </div>
                ))}
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              {sheetVerification && (
                <div className="small text-muted mb-2">
                  Kiểm tra: <strong className="text-dark">{sheetVerification.overallVerificationPercent ?? 0}%</strong>
                  {' · '}
                  {sheetVerification.verifiedGroups}/{sheetVerification.totalGroups} nhóm đủ 100%
                  {sheetVerification.allPublished && (
                    <Badge bg="success" className="ms-2">Đã công bố hết</Badge>
                  )}
                </div>
              )}
              <button
                type="button"
                className="btn btn-success rounded-3 fw-bold d-inline-flex align-items-center gap-2"
                onClick={handlePublish}
                disabled={publishLoading || !canPublish}
                title={!semesterId ? 'Chọn kỳ học' : !canPublish ? 'Chưa đủ 100% điểm' : 'Công bố điểm cho sinh viên'}
              >
                {publishLoading ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    Đang công bố...
                  </>
                ) : (
                  <>
                    <FaUpload size={13} />
                    Publish điểm cho sinh viên
                  </>
                )}
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* AI Assist */}
      <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#064e3b' }}>
        <Card.Body className="p-4 text-white">
          <div className="d-flex align-items-center gap-2 mb-3">
            <FaBrain size={20} />
            <h5 className="fw-bold m-0">AI Load danh sách sinh viên</h5>
            <Badge bg="light" text="dark" className="ms-1">Beta</Badge>
          </div>
          <p className="text-white-50 small mb-3">
            Ví dụ: &quot;Load sinh viên kỳ Fall 2024 kèm điểm mentor và hội đồng&quot;, &quot;Sinh viên mentor chưa chấm đủ&quot;
          </p>
          <Row className="g-2 align-items-end">
            <Col md={8}>
              <Form.Control
                className="rounded-3 border-0"
                placeholder='VD: "Load sinh viên kỳ Capstone Fall 2024 kèm điểm mentor và hội đồng"'
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiLoad()}
              />
            </Col>
            <Col md={4}>
              <button
                type="button"
                className="btn btn-light w-100 rounded-3 fw-bold text-success d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleAiLoad()}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    AI đang phân tích...
                  </>
                ) : (
                  <>
                    <FaBrain size={14} />
                    AI Load
                  </>
                )}
              </button>
            </Col>
          </Row>
          {data?.aiAssist?.suggestions?.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {data.aiAssist.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill"
                  onClick={() => handleAiLoad(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Bộ lọc thủ công */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="py-3">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="small fw-bold text-muted">Kỳ học</Form.Label>
              <Form.Select
                className="rounded-3"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
              >
                <option value="">Tất cả kỳ</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-bold text-muted">Kết quả</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {['ALL', 'PASS', 'FAIL', 'INCOMPLETE'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm rounded-3 ${filter === key ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setFilter(key)}
                  >
                    {key === 'ALL' ? 'Tất cả' : resultStyle[key]?.label || key}
                  </button>
                ))}
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-start-3 ${viewMode === 'students' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('students')}
                >
                  Theo sinh viên
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-end-3 ${viewMode === 'groups' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('groups')}
                >
                  Theo nhóm
                </button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        {(data?.rules || []).map((rule) => (
          <Col md={6} lg={4} key={rule.key}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="py-3">
                <div className="fw-bold small text-dark">{rule.label}</div>
                <div className="text-muted small">{rule.detail}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">
              <Spinner size="sm" animation="border" className="me-2" />
              Đang tải...
            </div>
          ) : viewMode === 'students' ? (
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Sinh viên</th>
                  <th className="py-3">Nhóm / Dự án</th>
                  <th className="py-3">Kỳ</th>
                  <th className="py-3">Mentor</th>
                  <th className="py-3 text-center">M1 (15%)</th>
                  <th className="py-3 text-center">M2 (20%)</th>
                  <th className="py-3 text-center">M3 (25%)</th>
                  <th className="py-3 text-center">Mentor (60%)</th>
                  <th className="py-3 text-center">HĐ (40%)</th>
                  <th className="py-3 text-center">Nguồn điểm</th>
                  <th className="py-3 text-center">Kiểm tra</th>
                  <th className="py-3 text-center">Tổng</th>
                  <th className="py-3">Kết quả</th>
                  <th className="pe-4 py-3 text-end">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((item, idx) => {
                  const style = resultStyle[item.result] || resultStyle.INCOMPLETE;
                  return (
                    <tr key={`${item.groupId}-${item.studentId || item.studentName}-${idx}`}>
                      <td className="ps-4">
                        <div className="fw-bold">{item.studentName}</div>
                        <small className="text-muted d-block">{item.studentEmail}</small>
                        <small className="text-muted">{item.rollNumber}</small>
                      </td>
                      <td className="small">
                        <div className="fw-medium">{item.groupCode}</div>
                        <div className="text-muted">{item.projectTitle}</div>
                      </td>
                      <td className="small">{item.semester}</td>
                      <td className="small text-muted">{item.mentorName}</td>
                      <ScoreCell score={item.mentorPhase1Score} rating={item.mentorPhase1Rating} status={item.mentorPhase1Status} />
                      <ScoreCell score={item.mentorPhase2Score} rating={item.mentorPhase2Rating} status={item.mentorPhase2Status} />
                      <ScoreCell score={item.mentorPhase3Score} rating={item.mentorPhase3Rating} status={item.mentorPhase3Status} />
                      <td className="text-center fw-bold text-primary">
                        {formatScore(item.mentorSubtotal)}
                        {item.mentorComplete === false && (
                          <div><Badge bg="warning" text="dark" className="mt-1" style={{ fontSize: '0.62rem' }}>Chưa đủ</Badge></div>
                        )}
                      </td>
                      <td className="text-center fw-medium text-secondary">{formatScore(item.committeeScore)}</td>
                      <td className="text-center">
                        <div className="d-flex flex-column gap-1 align-items-center">
                          <SourceCheck ok={item.sourceChecks?.mentorM1} label="M1" />
                          <SourceCheck ok={item.sourceChecks?.mentorM2} label="M2" />
                          <SourceCheck ok={item.sourceChecks?.mentorM3} label="M3" />
                          <SourceCheck ok={item.sourceChecks?.committee} label="HĐ" />
                        </div>
                      </td>
                      <VerificationCell
                        percent={item.verificationPercent}
                        missing={item.missingFields}
                        alreadyPublished={item.alreadyPublished}
                      />
                      <td className="text-center">
                        {item.finalScore != null ? (
                          <span className="fw-bold text-success">{formatScore(item.finalScore)}</span>
                        ) : (
                          <span className="text-muted small">{formatScore(item.weightedScore)}*</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={style.bg} className="rounded-2">{style.label}</Badge>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm border-0 rounded-3 d-inline-flex align-items-center gap-1 text-white"
                          style={{ backgroundColor: '#103d2b' }}
                          onClick={() => setSelected(item)}
                        >
                          <FaEye size={11} /> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={14} className="text-center text-muted py-4">
                      Chưa có sinh viên. Dùng AI Load hoặc chọn kỳ học phía trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          ) : (
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Nhóm / Sinh viên</th>
                  <th className="py-3">Dự án</th>
                  <th className="py-3 text-center">M1 (15%)</th>
                  <th className="py-3 text-center">M2 (20%)</th>
                  <th className="py-3 text-center">M3 (25%)</th>
                  <th className="py-3 text-center">Mentor (60%)</th>
                  <th className="py-3 text-center">HĐ (40%)</th>
                  <th className="py-3 text-center">Kiểm tra</th>
                  <th className="py-3 text-center">Tổng</th>
                  <th className="py-3">Kết quả</th>
                  <th className="pe-4 py-3 text-end">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((item) => {
                  const style = resultStyle[item.result] || resultStyle.INCOMPLETE;
                  return (
                    <tr key={item.groupId}>
                      <td className="ps-4">
                        <div className="fw-bold">{item.groupCode}</div>
                        <small className="text-muted d-block">{item.groupName}</small>
                        <small className="text-muted">
                          {(item.students || []).map((s) => s.name).join(', ') || '—'}
                        </small>
                      </td>
                      <td className="small">{item.projectTitle}</td>
                      <ScoreCell score={item.mentorPhase1Score} rating={item.mentorPhase1Rating} status={item.mentorPhase1Status} />
                      <ScoreCell score={item.mentorPhase2Score} rating={item.mentorPhase2Rating} status={item.mentorPhase2Status} />
                      <ScoreCell score={item.mentorPhase3Score} rating={item.mentorPhase3Rating} status={item.mentorPhase3Status} />
                      <td className="text-center fw-bold text-primary">{formatScore(item.mentorSubtotal)}</td>
                      <td className="text-center fw-medium text-secondary">{formatScore(item.committeeScore)}</td>
                      <VerificationCell
                        percent={item.verificationPercent}
                        missing={item.missingFields}
                        alreadyPublished={item.alreadyPublished}
                      />
                      <td className="text-center">
                        {item.finalScore != null ? (
                          <span className="fw-bold text-success">{formatScore(item.finalScore)}</span>
                        ) : (
                          <span className="text-muted small">{formatScore(item.weightedScore)}*</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={style.bg} className="rounded-2">{style.label}</Badge>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm border-0 rounded-3 d-inline-flex align-items-center gap-1 text-white"
                          style={{ backgroundColor: '#103d2b' }}
                          onClick={() => setSelected(item)}
                        >
                          <FaEye size={11} /> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-muted py-4">Không có dữ liệu.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Chi tiết điểm — {selected?.groupCode || selected?.studentName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <p className="text-muted small mb-3">
                {selected.studentName && <>{selected.studentName} · </>}
                {selected.groupName} · {selected.projectTitle} · Mentor: {selected.mentorName}
              </p>

              {(selected.mentorGrades || []).length > 0 && (
                <>
                  <h6 className="fw-bold small text-dark mb-2">Điểm mentor chấm (60%)</h6>
                  <Row className="g-2 mb-3">
                    {selected.mentorGrades.map((c) => (
                      <Col md={4} key={c.phaseId}>
                        <div className="p-3 rounded-3 border border-success border-opacity-25 bg-success bg-opacity-10">
                          <div className="small text-muted">{c.title} ({c.weight})</div>
                          <div className="fw-bold text-success">
                            {c.score != null ? formatScore(c.score) : '—'}
                            {c.rating && <span className="text-muted small ms-2">({c.rating})</span>}
                          </div>
                          <div className="small text-muted">Đóng góp: {formatScore(c.weightedContribution)}</div>
                          {c.feedback && <div className="small text-muted mt-1 fst-italic">{c.feedback}</div>}
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <div className="small mb-3">
                    <strong>Tổng mentor (60%):</strong>{' '}
                    <span className="fw-bold text-primary">{formatScore(selected.mentorSubtotal)}</span>
                  </div>
                </>
              )}

              <h6 className="fw-bold small text-dark mb-2">Tất cả giai đoạn</h6>
              <Row className="g-2 mb-3">
                {(selected.components || []).map((c) => (
                  <Col md={6} key={c.phaseId}>
                    <div className="p-3 rounded-3 bg-light">
                      <div className="small text-muted">{c.title} ({c.weight})</div>
                      <div className="fw-bold">
                        {c.score != null ? formatScore(c.score) : '—'}
                        {c.rating && <span className="text-muted small ms-2">({c.rating})</span>}
                      </div>
                      <div className="small text-muted">Đóng góp: {formatScore(c.weightedContribution)}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="mb-2">
                <strong>Tổng điểm: </strong>
                {selected.finalScore != null ? (
                  <span className="fw-bold text-success fs-5">{formatScore(selected.finalScore)}/10</span>
                ) : (
                  <span className="text-muted">Chưa đủ điểm tổng hợp ({formatScore(selected.weightedScore)} tạm tính)</span>
                )}
              </div>
              <div className="mb-3">
                <strong>Kết quả: </strong>
                <Badge bg={resultStyle[selected.result]?.bg || 'secondary'}>
                  {selected.resultLabel}
                </Badge>
              </div>
              {selected.failReasons?.length > 0 && (
                <Alert variant={selected.result === 'FAIL' ? 'danger' : 'info'} className="small mb-0">
                  <strong>Lý do:</strong>
                  <ul className="mb-0 mt-1">
                    {selected.failReasons.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminFinalGrades;
