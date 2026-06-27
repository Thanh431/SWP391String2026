import { Card, Table, Badge, Alert, Row, Col, Button } from 'react-bootstrap';
import { FaArchive, FaFolderOpen } from 'react-icons/fa';
import { getProjectArchives, recommendationStyle } from '../../../api/committeeService';
import { useCommitteeData } from './useCommitteeSession';

const CommitteeProjectArchives = () => {
  const { data: archives, loading, error, reload } = useCommitteeData(getProjectArchives, []);

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  const items = archives ?? [];

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2"><FaArchive className="text-success" /> Project Archives</h3>
        <p className="text-muted small m-0 mt-1">Dự án đã hoàn thành bảo vệ thuộc phạm vi phân công của bạn.</p>
      </div>

      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      <Row className="g-3 mb-4">
        {items.map((item) => (
          <Col key={item.defenseId} md={6} lg={4}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start gap-2 mb-2">
                  <FaFolderOpen className="text-success mt-1" />
                  <div>
                    <h6 className="fw-bold m-0">{item.groupCode}</h6>
                    <small className="text-muted">{item.groupName}</small>
                  </div>
                </div>
                <p className="small fw-semibold mb-2">{item.project}</p>
                <p className="small text-muted mb-2">{item.description || '—'}</p>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {item.overallScore != null && <Badge bg="success" className="rounded-2">Điểm: {item.overallScore}</Badge>}
                  {item.recommendation && <Badge bg={recommendationStyle[item.recommendation] || 'secondary'} className="rounded-2">{item.recommendation}</Badge>}
                  {item.published && <Badge bg="primary" className="rounded-2">Đã công bố</Badge>}
                </div>
                <small className="text-muted">Bảo vệ: {item.defenseDate} · {item.location}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {items.length === 0 && !error && (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 text-muted"><p className="mb-0">Chưa có dự án nào hoàn thành bảo vệ.</p></Card>
      )}

      {items.length > 0 && (
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-0">
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4 py-3">Nhóm</th>
                  <th className="py-3">Đề tài</th>
                  <th className="py-3">Tiến độ</th>
                  <th className="py-3">Điểm</th>
                  <th className="pe-4 py-3">Kết luận</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`row-${item.defenseId}`}>
                    <td className="ps-4 fw-bold">{item.groupCode}</td>
                    <td>{item.project}</td>
                    <td>{item.progress != null ? `${item.progress}%` : '—'}</td>
                    <td>{item.overallScore ?? '—'}</td>
                    <td className="pe-4">{item.recommendation ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CommitteeProjectArchives;
