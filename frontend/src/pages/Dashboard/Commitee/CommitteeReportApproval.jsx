import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { getPendingReports, reviewReport } from '../../../api/committeeService';
import { useCommitteeSession } from './useCommitteeSession';

const CommitteeReportApproval = ({ embedded = false, onReviewed }) => {
  const { committeeId, isReady, getApiError } = useCommitteeSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!isReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setReports(await getPendingReports(committeeId));
    } catch (err) {
      setMessage(getApiError(err, 'Không thể tải danh sách báo cáo.'));
    } finally {
      setLoading(false);
    }
  }, [committeeId, getApiError, isReady]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (action) => {
    if (!selected) return;
    setSubmitting(true);
    setMessage('');
    try {
      await reviewReport(committeeId, selected.submissionId, { action, note });
      setMessage(`✓ Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} báo cáo.`);
      setSelected(null);
      setNote('');
      await load();
      onReviewed?.();
    } catch (err) {
      setMessage(getApiError(err, 'Không thể xử lý báo cáo.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className={embedded ? '' : 'px-1 py-2'} style={embedded ? undefined : { backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {!embedded && (
        <div className="mb-4">
          <h3 className="fw-bold text-dark m-0">Duyệt báo cáo</h3>
          <p className="text-muted small m-0 mt-1">Báo cáo milestone đã được mentor chấm — chờ hội đồng phê duyệt.</p>
        </div>
      )}

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
                <th className="py-3">Milestone</th>
                <th className="py-3">Mentor</th>
                <th className="py-3">Rating</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item) => (
                <tr key={item.submissionId}>
                  <td className="ps-4">
                    <div className="fw-bold">{item.groupId}</div>
                    <small className="text-muted">{item.project}</small>
                  </td>
                  <td className="small">{item.milestone}</td>
                  <td className="small">{item.mentor}</td>
                  <td><Badge bg="info" className="rounded-2">{item.rating}</Badge></td>
                  <td className="pe-4 text-end">
                    <Button size="sm" className="border-0 rounded-3" style={{ backgroundColor: '#103d2b' }} onClick={() => { setSelected(item); setNote(''); }}>
                      Xem & duyệt
                    </Button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">Không có báo cáo chờ duyệt.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Duyệt báo cáo — {selected?.groupId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">{selected?.milestone}</p>
          <div className="p-3 rounded-3 bg-light mb-3"><p className="mb-0 small">{selected?.feedback}</p></div>
          <Form.Group>
            <Form.Label className="small fw-semibold">Ghi chú hội đồng (tuỳ chọn)</Form.Label>
            <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-danger" disabled={submitting} onClick={() => handleReview('reject')}><FaTimes className="me-1" /> Từ chối</Button>
          <Button disabled={submitting} className="border-0" style={{ backgroundColor: '#103d2b' }} onClick={() => handleReview('approve')}><FaCheck className="me-1" /> Duyệt</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CommitteeReportApproval;
