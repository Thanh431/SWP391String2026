import { useCallback, useEffect, useState } from 'react';
import { Card, Badge, Button, Row, Col, Modal, Form } from 'react-bootstrap';
import { FaUserPlus, FaCheck, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import {
  acceptMentorRequest,
  declineMentorRequest,
  getMentorIncomingRequests,
} from '../../../api/mentorService';

const MentorIncomingRequests = () => {
  const auth = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const loadRequests = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    try {
      const data = await getMentorIncomingRequests(auth.user.id);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  const handleAccept = async (id) => {
    await acceptMentorRequest(auth.user.id, id);
    loadRequests();
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    await declineMentorRequest(auth.user.id, declineTarget.id, declineReason);
    setDeclineTarget(null);
    setDeclineReason('');
    loadRequests();
  };

  const statusBadge = (status) => {
    if (status === 'Accepted') return 'success';
    if (status === 'Declined') return 'danger';
    return 'warning';
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Mentor Requests</h3>
          <p className="text-muted small m-0 mt-1">
            Duyệt yêu cầu xin hướng dẫn từ các nhóm sinh viên.
          </p>
        </div>
        <Badge bg="warning" className="bg-opacity-10 text-warning px-3 py-2 rounded-3">
          {pendingCount} chờ duyệt
        </Badge>
      </div>

      <Row className="g-3">
        {requests.map((item) => (
          <Col key={item.id} lg={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold m-0">{item.groupName}</h5>
                    <small className="text-muted">
                      {item.groupId} · {item.members} thành viên · {item.major}
                    </small>
                  </div>
                  <Badge bg={statusBadge(item.status)} className="bg-opacity-10 text-dark rounded-2">
                    {item.status}
                  </Badge>
                </div>

                <p className="fw-semibold text-dark small mb-1">{item.project}</p>
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  {item.message}
                </p>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <FaExternalLinkAlt size={12} className="text-secondary" />
                  <a href={item.proposalLink} target="_blank" rel="noreferrer" className="small">
                    Xem proposal
                  </a>
                  <span className="text-muted small ms-auto">Gửi: {item.dateSent}</span>
                </div>

                {item.declineReason && (
                  <div className="p-2 rounded-3 bg-light small text-secondary mb-3">
                    Lý do từ chối: {item.declineReason}
                  </div>
                )}

                {item.status === 'Pending' && (
                  <div className="d-flex gap-2 mt-auto">
                    <Button
                      className="flex-grow-1 border-0 rounded-3 fw-semibold"
                      style={{ backgroundColor: '#103d2b' }}
                      onClick={() => handleAccept(item.id)}
                    >
                      <FaCheck className="me-2" size={12} /> Accept
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="flex-grow-1 rounded-3 fw-semibold"
                      onClick={() => setDeclineTarget(item)}
                    >
                      <FaTimes className="me-2" size={12} /> Decline
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {requests.length === 0 && (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 text-muted">
          <FaUserPlus size={32} className="mb-3 opacity-50" />
          <p className="mb-0">Chưa có yêu cầu mentor nào.</p>
        </Card>
      )}

      <Modal show={Boolean(declineTarget)} onHide={() => setDeclineTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Từ chối yêu cầu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            Nhóm: <strong>{declineTarget?.groupName}</strong> — {declineTarget?.project}
          </p>
          <Form.Group>
            <Form.Label className="small fw-semibold">Lý do (tuỳ chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Ví dụ: Thầy đã nhận đủ số nhóm trong kỳ này..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeclineTarget(null)}>Huỷ</Button>
          <Button variant="danger" onClick={handleDecline}>Xác nhận từ chối</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MentorIncomingRequests;
