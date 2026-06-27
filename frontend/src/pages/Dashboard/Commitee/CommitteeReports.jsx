import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Nav, Tab } from 'react-bootstrap';
import { FaChartBar, FaFileDownload } from 'react-icons/fa';
import {
  downloadExportCsv,
  exportCommitteeReport,
  getCommitteeReportsSummary,
} from '../../../api/committeeService';
import CommitteeReportApproval from './CommitteeReportApproval';
import { useCommitteeData, useCommitteeSession } from './useCommitteeSession';

const CommitteeReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { committeeId, getApiError } = useCommitteeSession();
  const initialTab = location.state?.tab === 'approval' ? 'approval' : 'stats';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: summary, loading, error, reload } = useCommitteeData(getCommitteeReportsSummary, []);

  useEffect(() => {
    if (location.state?.tab === 'approval') {
      setActiveTab('approval');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state?.tab, navigate]);

  const handleExport = async () => {
    if (!committeeId) return;
    try {
      downloadExportCsv(await exportCommitteeReport(committeeId));
    } catch (err) {
      alert(getApiError(err, 'Không thể xuất file CSV.'));
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  const statCards = [
    { label: 'Nhóm phụ trách', value: summary?.assignedGroups ?? 0 },
    { label: 'Báo cáo mentor chấm', value: summary?.mentorGradedReports ?? 0 },
    { label: 'Hội đồng duyệt', value: summary?.committeeApproved ?? 0 },
    { label: 'Hội đồng từ chối', value: summary?.committeeRejected ?? 0 },
    { label: 'Đã chấm bảo vệ', value: summary?.evaluationsCompleted ?? 0 },
    { label: 'Đã công bố', value: summary?.resultsPublished ?? 0 },
  ];

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2"><FaChartBar className="text-success" /> Reports</h3>
          <p className="text-muted small m-0 mt-1">Thống kê và duyệt báo cáo hội đồng.</p>
        </div>
        <Button className="border-0 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#103d2b' }} onClick={handleExport}>
          <FaFileDownload size={12} /> Export CSV
        </Button>
      </div>

      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'stats')}>
        <Nav variant="tabs" className="mb-4 border-0 gap-2">
          <Nav.Item><Nav.Link eventKey="stats" className="rounded-3 border">Thống kê</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="approval" className="rounded-3 border">Duyệt báo cáo</Nav.Link></Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="stats">
            <Row className="g-3 mb-4">
              {statCards.map((card) => (
                <Col key={card.label} xs={6} md={4} lg={2}>
                  <Card className="border-0 shadow-sm rounded-4 text-center h-100">
                    <Card.Body className="py-4">
                      <h3 className="fw-bold m-0">{card.value}</h3>
                      <small className="text-muted">{card.label}</small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body>
                <h5 className="fw-bold mb-3">Phân bổ kết quả bảo vệ</h5>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="success" className="rounded-3 px-3 py-2">Pass: {summary?.passCount ?? 0}</Badge>
                  <Badge bg="warning" text="dark" className="rounded-3 px-3 py-2">Conditional: {summary?.conditionalCount ?? 0}</Badge>
                  <Badge bg="danger" className="rounded-3 px-3 py-2">Fail: {summary?.failCount ?? 0}</Badge>
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>
          <Tab.Pane eventKey="approval">
            <CommitteeReportApproval embedded onReviewed={reload} />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

export default CommitteeReports;
