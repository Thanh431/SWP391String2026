import { Alert, Badge, Card, Col, Row, Table } from 'react-bootstrap';
import { FaGraduationCap } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const gradeStatusMeta = {
  GRADED: { label: 'Đã chấm', className: 'bg-success-subtle text-success' },
  REVIEWING: { label: 'Chờ chấm', className: 'bg-warning-subtle text-warning' },
  PENDING: { label: 'Chưa nộp', className: 'bg-secondary-subtle text-secondary' },
  LOCKED: { label: 'Chưa mở', className: 'bg-light text-muted border' },
  PENDING_PUBLISH: { label: 'Chờ công bố', className: 'bg-info-subtle text-info' },
};

export const formatScore = (score) => (score != null ? Number(score).toFixed(1) : '—');

const StudentGradesPanel = ({ grades, compact = false }) => {
  if (!grades) return null;

  if (!grades.hasTeam) {
    return (
      <Alert variant="info" className="mb-0">
        {grades.message || 'Bạn chưa tham gia nhóm. Hãy vào Team Management hoặc My Courses để tham gia nhóm trước khi xem điểm.'}
        {' '}
        <Link to="/team-management">Tham gia nhóm</Link>
      </Alert>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-sm p-3 rounded-4 bg-white">
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <div className="fw-bold text-dark small">Điểm môn học</div>
            <div className="text-muted small">
              {grades.finalScore != null ? (
                <>Tổng: <span className="fw-bold text-success">{formatScore(grades.finalScore)}</span>/10</>
              ) : grades.ongoingScore != null ? (
                <>Tích lũy: <span className="fw-bold text-primary">{formatScore(grades.ongoingScore)}</span>/10</>
              ) : (
                'Chưa có điểm'
              )}
            </div>
          </div>
          <Badge
            bg={grades.result === 'PASS' ? 'success' : grades.result === 'FAIL' ? 'danger' : 'warning'}
            className="px-2 py-1 rounded-3"
          >
            {grades.resultLabel || grades.statusLabel}
          </Badge>
          {!grades.adminPublished && grades.hasTeam && (
            <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>Chờ admin công bố</div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm p-4 rounded-4 bg-white">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
            <FaGraduationCap className="text-success" />
            Điểm môn học
          </h5>
          <p className="text-muted small mb-0 mt-1">
            {grades.groupName && <span className="fw-medium text-dark">{grades.groupName}</span>}
            {grades.groupName && grades.projectTitle && ' · '}
            {grades.projectTitle}
          </p>
          <p className="text-muted small mb-0">
            {grades.courseName}
            {grades.courseCode && grades.courseCode !== '—' && (
              <> · <span className="fw-medium">{grades.courseCode}</span></>
            )}
          </p>
        </div>
        <div className="text-end">
          <Badge
            bg={
              grades.result === 'PASS' ? 'success'
                : grades.result === 'FAIL' ? 'danger'
                  : grades.adminPublished ? 'info'
                    : grades.status === 'PENDING_PUBLISH' ? 'warning' : 'warning'
            }
            className="px-3 py-2 rounded-3 fw-normal mb-2"
            style={{ fontSize: '0.75rem' }}
          >
            {grades.resultLabel || grades.statusLabel}
          </Badge>
          {grades.adminPublished && grades.publishedAt && (
            <div className="text-muted small mb-1">Công bố: {grades.publishedAt}</div>
          )}
          <div>
            {grades.finalScore != null ? (
              <>
                <span className="text-muted small me-2">Điểm tổng kết:</span>
                <span className="fw-bold fs-3 text-success">{formatScore(grades.finalScore)}</span>
                <span className="text-muted">/10</span>
                {grades.letterGrade && (
                  <Badge bg="success-subtle" className="text-success ms-2 px-2 py-1">{grades.letterGrade}</Badge>
                )}
              </>
            ) : grades.ongoingScore != null ? (
              <>
                <span className="text-muted small me-2">Điểm tích lũy ({grades.gradedPhases}/{grades.totalPhases} giai đoạn):</span>
                <span className="fw-bold fs-4 text-primary">{formatScore(grades.ongoingScore)}</span>
                <span className="text-muted">/10</span>
                {grades.weightedScore != null && (
                  <span className="text-muted small ms-2">(đóng góp: {formatScore(grades.weightedScore)} điểm)</span>
                )}
                {!grades.adminPublished && (
                  <div className="text-warning small mt-2">
                    Điểm tổng kết và điểm hội đồng sẽ hiển thị sau khi admin công bố.
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted small">Chưa có điểm được ghi nhận</span>
            )}
          </div>
          {grades.result === 'FAIL' && grades.failReasons?.length > 0 && (
            <Alert variant="danger" className="small py-2 px-3 mt-2 mb-0 text-start">
              {grades.failReasons.join(' · ')}
            </Alert>
          )}
        </div>
      </div>

      <Alert variant="light" className="small border mb-4">
        <strong>Công thức:</strong> Mentor 60% (15% + 20% + 25%) · Hội đồng 40% · Tổng ≥ 5.0 · Không có điểm 0 · Hội đồng ≥ 4.0
        {grades.mentorSubtotal != null && (
          <div className="mt-2 text-dark">
            <strong>Tổng mentor đã chấm (60%):</strong>{' '}
            <span className="fw-bold text-success">{formatScore(grades.mentorSubtotal)}</span>/10
            {grades.mentorComplete === false && (
              <span className="text-muted ms-2">— còn milestone chưa được mentor chấm</span>
            )}
          </div>
        )}
      </Alert>

      <div className="table-responsive">
        <Table hover align="middle" className="mb-0 border-top">
          <thead className="table-light">
            <tr className="text-muted small" style={{ fontSize: '0.78rem' }}>
              <th className="border-0">GIAI ĐOẠN</th>
              <th className="border-0">LOẠI</th>
              <th className="border-0 text-center">TRỌNG SỐ</th>
              <th className="border-0 text-center">ĐIỂM</th>
              <th className="border-0 text-center">ĐÓNG GÓP</th>
              <th className="border-0">NGƯỜI CHẤM</th>
              <th className="border-0">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {(grades.components || []).map((item) => {
              const meta = gradeStatusMeta[item.status] || gradeStatusMeta.PENDING;
              return (
                <tr key={item.phaseId} style={{ fontSize: '0.85rem' }}>
                  <td className="py-3">
                    <div className="fw-bold text-dark">{item.title}</div>
                    <div className="text-muted small">{item.week}</div>
                  </td>
                  <td className="text-muted small">{item.assessmentType}</td>
                  <td className="text-center fw-medium">{item.weight}</td>
                  <td className="text-center">
                    {item.score != null ? (
                      <>
                        <span className="fw-bold text-success">{formatScore(item.score)}</span>
                        {item.rating && (
                          <div className="small text-muted">{item.rating}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center text-muted">
                    {item.weightedContribution != null ? formatScore(item.weightedContribution) : '—'}
                  </td>
                  <td className="text-muted small">{item.evaluator || '—'}</td>
                  <td>
                    <Badge className={`${meta.className} border-0 px-2 py-1 rounded-3`} style={{ fontSize: '0.72rem' }}>
                      {meta.label}
                    </Badge>
                    {item.status === 'GRADED' && item.feedback && item.feedback !== '—' && (
                      <div className="small text-muted mt-1 fst-italic" style={{ maxWidth: 220 }}>
                        {item.feedback}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {grades.defenseEvaluation && (
        <div className="mt-4 p-3 rounded-3 bg-light">
          <div className="fw-bold small text-dark mb-2">Lịch bảo vệ cuối kỳ</div>
          <Row className="g-2 small text-muted">
            <Col md={4}><span className="fw-medium text-dark">Ngày:</span> {grades.defenseEvaluation.defenseDate}</Col>
            <Col md={4}><span className="fw-medium text-dark">Ca:</span> {grades.defenseEvaluation.timeSlot}</Col>
            <Col md={4}><span className="fw-medium text-dark">Phòng:</span> {grades.defenseEvaluation.location}</Col>
          </Row>
          {grades.defenseEvaluation.published && (
            <Row className="g-2 mt-2 small">
              <Col xs={6} md={3}><span className="text-muted">Kỹ thuật:</span> <span className="fw-bold">{formatScore(grades.defenseEvaluation.technicalScore)}</span></Col>
              <Col xs={6} md={3}><span className="text-muted">Trình bày:</span> <span className="fw-bold">{formatScore(grades.defenseEvaluation.presentationScore)}</span></Col>
              <Col xs={6} md={3}><span className="text-muted">Đổi mới:</span> <span className="fw-bold">{formatScore(grades.defenseEvaluation.innovationScore)}</span></Col>
              <Col xs={6} md={3}><span className="text-muted">Tổng HĐ:</span> <span className="fw-bold text-success">{formatScore(grades.defenseEvaluation.overallScore)}</span></Col>
              {grades.defenseEvaluation.feedback && (
                <Col xs={12} className="mt-2">
                  <span className="text-muted">Nhận xét hội đồng:</span>{' '}
                  <span className="text-dark">{grades.defenseEvaluation.feedback}</span>
                </Col>
              )}
            </Row>
          )}
          {!grades.defenseEvaluation.published && (
            <p className="text-muted small mb-0 mt-2">
              {grades.adminPublished
                ? 'Điểm bảo vệ cuối kỳ (40%) sẽ hiển thị sau khi hội đồng công bố kết quả.'
                : 'Điểm bảo vệ cuối kỳ (40%) sẽ hiển thị sau khi admin công bố điểm tổng kết.'}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default StudentGradesPanel;
