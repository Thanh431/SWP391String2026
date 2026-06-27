import { useState } from 'react';
import { Card, Badge, Form, Row, Col, Alert, Button } from 'react-bootstrap';
import { FaCommentDots, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { feedbackRatings, getCommitteeFeedbacks } from '../../../api/committeeService';
import { useCommitteeData } from './useCommitteeSession';

const ratingStyle = {
  Excellent: 'success',
  Good: 'primary',
  'Needs Improvement': 'warning',
  'At Risk': 'danger',
};

const CommitteeFeedback = () => {
  const [search, setSearch] = useState('');
  const { data: feedbacks, loading, error, reload } = useCommitteeData(getCommitteeFeedbacks, []);

  const filtered = (feedbacks ?? []).filter(
    (item) =>
      item.groupId?.toLowerCase().includes(search.toLowerCase()) ||
      item.project?.toLowerCase().includes(search.toLowerCase()) ||
      item.mentor?.toLowerCase().includes(search.toLowerCase()) ||
      item.student?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0">Feedback từ Mentor</h3>
        <p className="text-muted small m-0 mt-1">Nhận xét mentor cho các nhóm bạn phụ trách chấm bảo vệ.</p>
      </div>

      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Form.Control placeholder="Tìm theo nhóm, mentor, sinh viên, đề tài..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-3 py-2" />
        </Col>
      </Row>

      <Row className="g-3">
        {filtered.map((item) => (
          <Col key={item.id} lg={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold m-0">{item.groupId} — {item.groupName}</h5>
                    <small className="text-muted">{item.project}</small>
                  </div>
                  <Badge bg={ratingStyle[item.rating] || 'secondary'} className="bg-opacity-10 text-dark rounded-2">{item.rating || feedbackRatings[0]}</Badge>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3 small">
                  <div>
                    <span className="text-muted d-flex align-items-center gap-1 mb-1"><FaChalkboardTeacher size={12} /> Mentor</span>
                    <span className="fw-semibold small d-block">{item.mentor}</span>
                    <small className="text-muted">{item.mentorEmail}</small>
                  </div>
                  <div>
                    <span className="text-muted d-flex align-items-center gap-1 mb-1"><FaUserGraduate size={12} /> Sinh viên</span>
                    <span className="fw-semibold">{item.student}</span>
                  </div>
                </div>
                <p className="small text-secondary mb-2"><strong>Milestone:</strong> {item.milestone} · <strong>Ngày:</strong> {item.date}</p>
                <div className="p-3 rounded-3 bg-light">
                  <FaCommentDots className="text-success mb-2" size={14} />
                  <p className="mb-0 small text-dark" style={{ lineHeight: 1.6 }}>{item.feedback}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {filtered.length === 0 && !error && (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 text-muted">
          <p className="mb-0">Chưa có feedback nào từ mentor cho nhóm của bạn.</p>
        </Card>
      )}
    </div>
  );
};

export default CommitteeFeedback;
