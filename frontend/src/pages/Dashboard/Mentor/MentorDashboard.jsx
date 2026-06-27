import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Badge, ProgressBar, Table } from 'react-bootstrap';
import {
  FaUsers, FaClipboardList, FaUserPlus, FaChartLine,
  FaDownload, FaPlus, FaExclamationTriangle, FaCalendarAlt,
  FaCheck, FaTimes, FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import { acceptMentorRequest, declineMentorRequest, getMentorDashboard } from '../../../api/mentorService';

const MentorDashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    if (!auth.user?.id) return;
    try {
      const result = await getMentorDashboard(auth.user.id);
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [auth.user?.id]);

  const handleAccept = async (id) => {
    await acceptMentorRequest(auth.user.id, id);
    loadDashboard();
  };

  const handleDecline = async (id) => {
    await declineMentorRequest(auth.user.id, id, 'Không phù hợp lịch hướng dẫn hiện tại.');
    loadDashboard();
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải dashboard...</div>;
  }

  const reviewQueue = data?.reviewQueue || [];
  const groupProgress = data?.groupProgress || [];
  const incomingRequests = data?.incomingRequests || [];
  const highRiskGroups = groupProgress.filter((g) => g.variant === 'danger');

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Dashboard</h3>
          <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.82rem' }}>Overview of your mentor activities for Fall 2024.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" className="bg-white text-dark border-light shadow-sm px-3 py-2 rounded-3 small fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
            <FaDownload size={12} className="text-secondary" /> Export Report
          </Button>
          <Button className="border-0 px-3 py-2 rounded-3 small fw-bold d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: '#103d2b', fontSize: '0.82rem' }}>
            <FaPlus size={12} /> New Announcement
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Row className="g-3 h-100">
            <Col sm={6}>
              <div className="bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-between h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Assigned Groups</span>
                  <div className="p-2 rounded-3 bg-light"><FaUsers className="text-success" /></div>
                </div>
                <h1 className="fw-bold m-0 text-dark">{data?.assignedGroups ?? 0}</h1>
              </div>
            </Col>
            <Col sm={6}>
              <div className="bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-between h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Pending Reviews</span>
                  <Badge bg="danger" className="bg-opacity-10 text-danger px-2 py-1 rounded-2" style={{ fontSize: '0.65rem' }}>High Priority</Badge>
                </div>
                <h1 className="fw-bold m-0 text-dark">{data?.pendingReviews ?? 0}</h1>
              </div>
            </Col>
            <Col sm={6}>
              <div className="bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-between h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Mentor Requests</span>
                  {(data?.newRequests ?? 0) > 0 && (
                    <Badge bg="info" className="bg-opacity-10 text-info px-2 py-1 rounded-2" style={{ fontSize: '0.65rem' }}>{data.newRequests} New</Badge>
                  )}
                </div>
                <h1 className="fw-bold m-0 text-dark">{data?.mentorRequests ?? 0}</h1>
              </div>
            </Col>
            <Col sm={6}>
              <div className="bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-between h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Avg Progress</span>
                  <div className="p-2 rounded-3 bg-light"><FaChartLine className="text-primary" /></div>
                </div>
                <div>
                  <h1 className="fw-bold m-0 text-dark mb-2">{data?.avgProgress ?? 0}%</h1>
                  <ProgressBar now={data?.avgProgress ?? 0} variant="success" style={{ height: '6px' }} className="rounded-pill" />
                </div>
              </div>
            </Col>
          </Row>
        </Col>

        <Col lg={4}>
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                  <FaExclamationTriangle className="text-danger" size={14} /> Risk Monitor
                </h6>
              </div>
              <p className="text-muted small mb-3">{highRiskGroups.length} nhóm cần chú ý</p>
              <div className="d-flex flex-column gap-2.5">
                {highRiskGroups.slice(0, 2).map((g) => (
                  <div key={g.id} className="p-3 rounded-3 bg-light bg-opacity-70 border-start border-4 border-danger d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold d-block text-dark small">{g.id} - {g.name}</span>
                    </div>
                    <Badge bg="danger" className="rounded-2 px-2 py-1" style={{ fontSize: '0.7rem' }}>High Risk</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-3 pt-2 border-top border-light">
              <Button variant="link" className="text-decoration-none text-success p-0 fw-bold small w-100" onClick={() => navigate('/reports')}>
                View All Risk Reports <FaExternalLinkAlt size={10} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0 text-dark">Review & Grading Queue</h6>
              <Badge bg="danger" className="bg-opacity-10 text-danger px-2 py-1 rounded-2 fw-bold" style={{ fontSize: '0.72rem' }}>
                {data?.pendingReviews ?? 0} Pending
              </Badge>
            </div>
            <Table responsive borderless className="align-middle mb-0 text-dark" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr className="border-bottom border-light text-muted small text-uppercase">
                  <th className="py-2.5 ps-0">Group Name</th>
                  <th className="py-2.5">Submission</th>
                  <th className="py-2.5">Submission Date</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-end pe-0">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.map((item) => (
                  <tr key={item.id} className="border-bottom border-light border-opacity-50">
                    <td className="py-3 ps-0 fw-semibold">{item.groupId} — {item.groupName}</td>
                    <td className="py-3 text-secondary">{item.submission}</td>
                    <td className="py-3 text-secondary">{item.submittedAt}</td>
                    <td className="py-3">
                      <Badge bg={item.status === 'Graded' ? 'success' : item.overdue ? 'danger' : 'warning'} className="bg-opacity-10 rounded-2 px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        ● {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-end pe-0">
                      <Button variant="outline-success" className="px-3 py-1 rounded-2 fw-semibold small" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/mentor/review-queue')}>
                        {item.status === 'Graded' ? 'View' : 'Review'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>

        <Col lg={4}>
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold m-0 text-dark">Milestone Schedule</h6>
              <FaCalendarAlt className="text-secondary opacity-50" size={14} />
            </div>
            <div className="position-relative ps-3 border-start border-light border-2 d-flex flex-column gap-4" style={{ marginLeft: '8px' }}>
              <div className="position-relative">
                <div className="position-absolute rounded-circle bg-danger" style={{ width: '10px', height: '10px', left: '-22px', top: '5px' }} />
                <span className="text-danger fw-bold small d-block mb-0.5">Midterm Reviews</span>
                <span className="fw-bold text-dark d-block small">Midterm Report Reviews Due</span>
              </div>
              <div className="position-relative">
                <div className="position-absolute rounded-circle bg-success" style={{ width: '10px', height: '10px', left: '-22px', top: '5px' }} />
                <span className="text-success fw-bold small d-block mb-0.5">Final Defense</span>
                <span className="fw-bold text-dark d-block small">Final Defense Scheduling</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={5}>
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0 text-dark">Mentor Requests</h6>
              <Badge bg="success" className="bg-opacity-10 text-success px-2 py-1 rounded-2" style={{ fontSize: '0.72rem' }}>Incoming</Badge>
            </div>
            {incomingRequests.map((req) => (
              <div key={req.id} className="p-3 border border-light rounded-3 bg-light bg-opacity-50 mb-2.5">
                <span className="fw-bold text-dark small d-block mb-0.5">{req.groupName} - {req.project}</span>
                <span className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>Members: {req.members} | {req.major}</span>
                <div className="bg-white p-2 rounded border border-light mb-3 text-secondary" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                  "{req.message?.slice(0, 100)}..."
                </div>
                <div className="d-flex gap-2">
                  <Button size="sm" className="border-0 px-3 py-1.5 rounded-2 fw-bold text-white small flex-grow-1" style={{ backgroundColor: '#103d2b' }} onClick={() => handleAccept(req.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline-secondary" className="px-3 py-1.5 rounded-2 small bg-white" onClick={() => handleDecline(req.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="link" className="text-decoration-none text-success p-0 fw-bold small w-100 mt-2" onClick={() => navigate('/mentor/requests')}>
              View All Requests
            </Button>
          </div>
        </Col>

        <Col lg={7}>
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <h6 className="fw-bold text-dark mb-4">Supervised Groups Progress</h6>
            <div className="d-flex flex-column gap-3.5">
              {groupProgress.map((group) => (
                <div key={group.id}>
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '0.82rem' }}>
                    <span className="fw-semibold text-dark">{group.id} - {group.name}</span>
                    <div className="d-flex align-items-center gap-2">
                      {group.alert && <span className="text-danger fw-bold" style={{ fontSize: '0.72rem' }}>⚠️ {group.alert}</span>}
                      <span className="fw-bold text-secondary">{group.value}%</span>
                    </div>
                  </div>
                  <ProgressBar now={group.value} variant={group.variant} style={{ height: '7px' }} className="rounded-pill" />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MentorDashboard;
