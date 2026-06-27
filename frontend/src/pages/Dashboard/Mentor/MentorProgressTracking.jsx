import { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import { getMentorProgress } from '../../../api/mentorService';

const riskConfig = {
  high: { label: 'High Risk', variant: 'danger' },
  medium: { label: 'Medium Risk', variant: 'warning' },
  low: { label: 'On Track', variant: 'success' },
};

const MentorProgressTracking = () => {
  const auth = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user?.id) return;
    getMentorProgress(auth.user.id)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [auth.user?.id]);

  const highRisk = groups.filter((g) => g.risk === 'high').length;

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Progress Tracking</h3>
          <p className="text-muted small m-0 mt-1">
            Theo dõi tiến độ milestone và nhóm có nguy cơ chậm tiến độ.
          </p>
        </div>
        {highRisk > 0 && (
          <Badge bg="danger" className="bg-opacity-10 text-danger px-3 py-2 rounded-3 d-flex align-items-center gap-2">
            <FaExclamationTriangle size={12} />
            {highRisk} nhóm cần chú ý
          </Badge>
        )}
      </div>

      <Row className="g-3">
        {groups.map((group) => {
          const risk = riskConfig[group.risk] || riskConfig.low;
          return (
            <Col key={group.id} lg={6}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold m-0">{group.id} — {group.name}</h5>
                      <small className="text-muted">{group.className}</small>
                    </div>
                    <Badge bg={risk.variant} className="bg-opacity-10 text-dark rounded-2">
                      {risk.label}
                    </Badge>
                  </div>

                  <p className="text-secondary small mb-3">{group.project}</p>

                  <div className="d-flex justify-content-between small mb-2">
                    <span className="text-muted">Tiến độ tổng</span>
                    <span className="fw-bold">{group.progress}%</span>
                  </div>
                  <ProgressBar
                    now={group.progress}
                    variant={group.risk === 'high' ? 'danger' : group.risk === 'medium' ? 'warning' : 'success'}
                    style={{ height: 8 }}
                    className="rounded-pill mb-3"
                  />

                  <div className="d-flex justify-content-between small text-muted">
                    <span>
                      <FaChartLine className="me-1" size={12} />
                      Milestone: {group.milestoneDone}/{group.milestoneTotal}
                    </span>
                    <span>Hoạt động: {group.lastActive}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {groups.length === 0 && (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 text-muted">
          <p className="mb-0">Chưa có nhóm nào được gán.</p>
        </Card>
      )}
    </div>
  );
};

export default MentorProgressTracking;
