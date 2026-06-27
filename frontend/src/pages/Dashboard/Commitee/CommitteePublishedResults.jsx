import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { FaGlobe, FaEyeSlash } from 'react-icons/fa';
import { getPublishedResults, publishResult, unpublishResult, recommendationStyle } from '../../../api/committeeService';
import { useCommitteeData, useCommitteeSession } from './useCommitteeSession';
import { COMMITTEE_PATHS } from './committeePaths';

const CommitteePublishedResults = () => {
  const navigate = useNavigate();
  const { committeeId, getApiError } = useCommitteeSession();
  const { data: results, loading, error, reload } = useCommitteeData(getPublishedResults, []);
  const [message, setMessage] = useState('');

  const togglePublish = async (item) => {
    if (!item.hasEvaluation) return;
    setMessage('');
    try {
      if (item.published) {
        await unpublishResult(committeeId, item.defenseId);
        setMessage('✓ Đã ẩn kết quả.');
      } else {
        await publishResult(committeeId, item.defenseId);
        setMessage('✓ Đã công bố kết quả.');
      }
      reload();
    } catch (err) {
      setMessage(getApiError(err, 'Không thể cập nhật trạng thái công bố.'));
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  const rows = results ?? [];
  const publishedCount = rows.filter((r) => r.published).length;
  const gradableCount = rows.filter((r) => r.hasEvaluation).length;

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Published Results</h3>
          <p className="text-muted small m-0 mt-1">Công bố hoặc ẩn kết quả chấm bảo vệ cho sinh viên.</p>
        </div>
        <Badge bg="success" className="rounded-3 px-3 py-2">{publishedCount}/{gradableCount} đã công bố</Badge>
      </div>

      {message && <Alert variant={message.includes('✓') ? 'success' : 'danger'} dismissible onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4 py-3">Nhóm</th>
                <th className="py-3">Đề tài</th>
                <th className="py-3">Điểm TB</th>
                <th className="py-3">Kết luận</th>
                <th className="py-3">Trạng thái</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.defenseId}>
                  <td className="ps-4">
                    <div className="fw-bold">{item.groupCode}</div>
                    <small className="text-muted">{item.groupName}</small>
                  </td>
                  <td className="small">{item.project}</td>
                  <td className="fw-bold text-success">{item.hasEvaluation ? item.overallScore : '—'}</td>
                  <td>
                    {item.hasEvaluation ? (
                      <Badge bg={recommendationStyle[item.recommendation] || 'secondary'} className="rounded-2">{item.recommendation}</Badge>
                    ) : (
                      <Badge bg="warning" text="dark" className="rounded-2">Chưa chấm</Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={item.published ? 'success' : 'secondary'} className="rounded-2">
                      {item.published ? 'Đã công bố' : 'Chưa công bố'}
                    </Badge>
                  </td>
                  <td className="pe-4 text-end">
                    {item.hasEvaluation ? (
                      <Button size="sm" variant={item.published ? 'outline-secondary' : 'success'} className="rounded-3 d-inline-flex align-items-center gap-1" onClick={() => togglePublish(item)}>
                        {item.published ? <FaEyeSlash size={11} /> : <FaGlobe size={11} />}
                        {item.published ? 'Ẩn' : 'Công bố'}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline-success" className="rounded-3" onClick={() => navigate(COMMITTEE_PATHS.evaluations)}>Chấm điểm</Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-4">Chưa có nhóm nào được phân công.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CommitteePublishedResults;
