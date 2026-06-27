import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, ProgressBar, Alert, Table, Badge } from 'react-bootstrap';
import { FaClipboardList, FaCalendarDay, FaCheckCircle, FaPercentage, FaFileDownload } from 'react-icons/fa';
import { exportCommitteeReport, getCommitteeDashboard, downloadExportCsv } from '../../../api/committeeService';
import { useCommitteeData, useCommitteeSession } from './useCommitteeSession';
import { COMMITTEE_PATHS } from './committeePaths';

const CommitteeDashboard = () => {
  const navigate = useNavigate();
  const { committeeId, getApiError } = useCommitteeSession();
  const { data: stats, loading, error, reload } = useCommitteeData(getCommitteeDashboard, []);

  const handleExport = async () => {
    if (!committeeId) return;
    try {
      downloadExportCsv(await exportCommitteeReport(committeeId));
    } catch (err) {
      alert(getApiError(err, 'Không thể xuất báo cáo.'));
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải dashboard...</div>;
  }

  const cards = [
    {
      label: 'AWAITING',
      value: String(stats?.awaiting ?? 0),
      desc: 'Projects Awaiting Evaluation',
      icon: FaClipboardList,
      color: '#4e73df',
      bgIcon: 'rgba(78, 115, 223, 0.1)',
      action: () => navigate(COMMITTEE_PATHS.evaluations),
    },
    {
      label: 'TODAY',
      value: String(stats?.todayScheduled ?? 0),
      desc: 'Scheduled Defenses',
      icon: FaCalendarDay,
      color: '#1cc88a',
      bgIcon: 'rgba(28, 200, 138, 0.1)',
      action: () => navigate(COMMITTEE_PATHS.gradingSchedule),
    },
    {
      label: 'TOTAL',
      value: String(stats?.completedEvaluations ?? 0),
      desc: 'Completed Evaluations',
      icon: FaCheckCircle,
      color: '#36b9cc',
      bgIcon: 'rgba(54, 185, 204, 0.1)',
      action: () => navigate(COMMITTEE_PATHS.publishedResults),
    },
    {
      label: 'RATE',
      value: `${stats?.publishRate ?? 0}%`,
      desc: 'Published Results',
      icon: FaPercentage,
      color: '#f6c23e',
      bgIcon: 'rgba(246, 194, 62, 0.1)',
      hasProgress: true,
      progressValue: stats?.publishRate ?? 0,
      action: () => navigate(COMMITTEE_PATHS.publishedResults),
    },
  ];

  return (
    <div className="px-2 py-3" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-light">
        <div>
          <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px', fontSize: '1.75rem' }}>
            Committee Evaluation
          </h3>
          <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.85rem' }}>
            {stats?.totalAssigned ?? 0} nhóm được phân công · {stats?.pendingReports ?? 0} báo cáo chờ duyệt
          </p>
        </div>
        <Button
          variant="white"
          className="border shadow-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2 bg-white text-secondary fw-semibold"
          style={{ fontSize: '0.8rem' }}
          onClick={handleExport}
        >
          <FaFileDownload size={13} />
          <span>Export Report</span>
        </Button>
      </div>

      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      <Row className="g-4 mb-4">
        {cards.map((item, index) => (
          <Col key={index} xs={12} sm={6} lg={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 bg-white h-100" role="button" onClick={item.action} style={{ cursor: 'pointer' }}>
              <Card.Body className="p-0 d-flex flex-column justify-content-between">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '40px', height: '40px', backgroundColor: item.bgIcon, color: item.color }}>
                    <item.icon size={18} />
                  </div>
                  <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>{item.label}</span>
                </div>
                <h2 className="fw-bold m-0 text-dark mb-1" style={{ fontSize: '2rem' }}>{item.value}</h2>
                <p className="text-muted m-0" style={{ fontSize: '0.82rem' }}>{item.desc}</p>
                {item.hasProgress && (
                  <div className="mt-3 pt-1">
                    <ProgressBar now={item.progressValue} className="rounded-pill" style={{ height: '4px', backgroundColor: '#eaecf4' }} variant="success" />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0">Tóm tắt nhanh</h5>
            {(stats?.pendingReports ?? 0) > 0 && (
              <Button size="sm" className="border-0 rounded-3" style={{ backgroundColor: '#103d2b' }} onClick={() => navigate(COMMITTEE_PATHS.reports, { state: { tab: 'approval' } })}>
                Duyệt báo cáo ({stats.pendingReports})
              </Button>
            )}
          </div>
          <Table responsive className="mb-0 align-middle">
            <tbody>
              <tr><td className="text-muted">Nhóm được phân công</td><td className="fw-bold">{stats?.totalAssigned ?? 0}</td></tr>
              <tr><td className="text-muted">Đã chấm điểm</td><td><Badge bg="success">{stats?.completedEvaluations ?? 0}</Badge></td></tr>
              <tr><td className="text-muted">Đã công bố kết quả</td><td><Badge bg="primary">{stats?.publishedCount ?? 0}</Badge></td></tr>
              <tr>
                <td className="text-muted">Báo cáo chờ duyệt</td>
                <td>
                  <Badge bg="warning" text="dark" role="button" style={{ cursor: 'pointer' }} onClick={() => navigate(COMMITTEE_PATHS.reports, { state: { tab: 'approval' } })}>
                    {stats?.pendingReports ?? 0}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CommitteeDashboard;
