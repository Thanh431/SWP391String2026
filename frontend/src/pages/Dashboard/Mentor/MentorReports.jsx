import { useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Button, Table, ProgressBar, Form } from 'react-bootstrap';
import {
  FaChartBar,
  FaDownload,
  FaPrint,
  FaUsers,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
} from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import {
  getMentorDashboard,
  getMentorProgress,
  getMentorReviewQueue,
  getMentorIncomingRequests,
  getMentorClasses,
} from '../../../api/mentorService';
import './MentorReports.css';

const riskMeta = {
  high: { label: 'Cao', color: '#dc3545', className: 'mentor-report-bar--danger' },
  medium: { label: 'Trung bình', color: '#ffc107', className: 'mentor-report-bar--warning' },
  low: { label: 'Ổn định', color: '#198754', className: 'mentor-report-bar--success' },
};

const MentorReports = () => {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Fall 2024');
  const [dashboard, setDashboard] = useState(null);
  const [progress, setProgress] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [classes, setClasses] = useState([]);

  const loadReports = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    try {
      const id = auth.user.id;
      const [dash, prog, queue, reqs, cls] = await Promise.all([
        getMentorDashboard(id),
        getMentorProgress(id),
        getMentorReviewQueue(id),
        getMentorIncomingRequests(id),
        getMentorClasses(id),
      ]);
      setDashboard(dash);
      setProgress(prog);
      setReviews(queue);
      setRequests(reqs);
      setClasses(cls);
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const stats = useMemo(() => {
    const graded = reviews.filter((r) => r.status === 'Graded').length;
    const pending = reviews.filter((r) => r.status === 'Pending').length;
    const overdue = reviews.filter((r) => r.overdue).length;
    const totalReviews = reviews.length;
    const completionRate = totalReviews ? Math.round((graded / totalReviews) * 100) : 0;

    const riskCounts = { high: 0, medium: 0, low: 0 };
    progress.forEach((g) => {
      if (riskCounts[g.risk] !== undefined) riskCounts[g.risk] += 1;
    });

    const acceptedReq = requests.filter((r) => r.status === 'Accepted').length;
    const pendingReq = requests.filter((r) => r.status === 'Pending').length;
    const declinedReq = requests.filter((r) => r.status === 'Declined').length;

    const ratingCounts = {};
    reviews
      .filter((r) => r.rating)
      .forEach((r) => {
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      });

    return {
      graded,
      pending,
      overdue,
      totalReviews,
      completionRate,
      riskCounts,
      acceptedReq,
      pendingReq,
      declinedReq,
      ratingCounts,
      totalGroups: progress.length,
      avgProgress: dashboard?.avgProgress ?? 0,
      assignedGroups: dashboard?.assignedGroups ?? progress.length,
    };
  }, [reviews, progress, requests, dashboard]);

  const exportCsv = () => {
    const lines = [
      ['Báo cáo Mentor', auth.user?.fullName || auth.user?.username, period].join(','),
      ['Ngày xuất', new Date().toLocaleDateString('vi-VN')].join(','),
      '',
      ['=== TIẾN ĐỘ NHÓM ==='],
      ['Mã nhóm', 'Tên nhóm', 'Đề tài', 'Lớp', 'Tiến độ %', 'Milestone', 'Risk', 'Hoạt động'].join(','),
      ...progress.map((g) =>
        [
          g.id,
          g.name,
          g.project,
          g.className,
          g.progress,
          `${g.milestoneDone}/${g.milestoneTotal}`,
          g.risk,
          g.lastActive,
        ].join(',')
      ),
      '',
      ['=== REVIEW QUEUE ==='],
      ['Nhóm', 'Bài nộp', 'Milestone', 'Trạng thái', 'Quá hạn', 'Rating'].join(','),
      ...reviews.map((r) =>
        [r.groupId, r.submission, r.milestone, r.status, r.overdue ? 'Yes' : 'No', r.rating || ''].join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mentor-report-${period.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải báo cáo...</div>;
  }

  const maxProgress = Math.max(...progress.map((g) => g.progress), 1);
  const totalRisk = stats.riskCounts.high + stats.riskCounts.medium + stats.riskCounts.low || 1;

  return (
    <div className="mentor-reports px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4 mentor-reports-no-print">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaChartBar className="text-success" />
            Reports
          </h3>
          <p className="text-muted small m-0 mt-1">
            Báo cáo tổng hợp tiến độ nhóm, chấm bài và yêu cầu mentor — {period}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            size="sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '160px' }}
            className="rounded-3"
          >
            <option>Fall 2024</option>
            <option>Spring 2025</option>
          </Form.Select>
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-3 bg-white d-flex align-items-center gap-2"
            onClick={() => window.print()}
          >
            <FaPrint size={12} /> In báo cáo
          </Button>
          <Button
            size="sm"
            className="rounded-3 border-0 d-flex align-items-center gap-2"
            style={{ backgroundColor: '#103d2b' }}
            onClick={exportCsv}
          >
            <FaDownload size={12} /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* KPI */}
      <Row className="g-3 mb-4">
        {[
          {
            label: 'Nhóm đang hướng dẫn',
            value: stats.assignedGroups,
            icon: FaUsers,
            sub: `${classes.length} lớp học phần`,
          },
          {
            label: 'Tiến độ trung bình',
            value: `${stats.avgProgress}%`,
            icon: FaChartBar,
            sub: `${stats.totalGroups} nhóm theo dõi`,
          },
          {
            label: 'Tỷ lệ chấm xong',
            value: `${stats.completionRate}%`,
            icon: FaClipboardCheck,
            sub: `${stats.graded}/${stats.totalReviews} bài đã chấm`,
          },
          {
            label: 'Cần xử lý',
            value: stats.pending + stats.overdue,
            icon: FaExclamationTriangle,
            sub: `${stats.pending} chờ · ${stats.overdue} quá hạn`,
            alert: stats.overdue > 0,
          },
        ].map((kpi) => (
          <Col key={kpi.label} sm={6} lg={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    {kpi.label}
                  </span>
                  <div className={`p-2 rounded-3 ${kpi.alert ? 'bg-danger bg-opacity-10' : 'bg-light'}`}>
                    <kpi.icon className={kpi.alert ? 'text-danger' : 'text-success'} />
                  </div>
                </div>
                <h2 className="fw-bold m-0 text-dark">{kpi.value}</h2>
                <small className="text-muted">{kpi.sub}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        {/* Risk distribution */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Phân bổ mức rủi ro nhóm</h6>
              <div className="mentor-report-stacked mb-3">
                {(['high', 'medium', 'low']).map((key) => (
                  <div
                    key={key}
                    className={riskMeta[key].className}
                    style={{ width: `${(stats.riskCounts[key] / totalRisk) * 100}%` }}
                    title={`${riskMeta[key].label}: ${stats.riskCounts[key]}`}
                  />
                ))}
              </div>
              <div className="d-flex flex-wrap gap-3">
                {(['high', 'medium', 'low']).map((key) => (
                  <div key={key} className="d-flex align-items-center gap-2 small">
                    <span
                      className="rounded-circle d-inline-block"
                      style={{ width: 10, height: 10, backgroundColor: riskMeta[key].color }}
                    />
                    <span className="text-muted">{riskMeta[key].label}</span>
                    <strong>{stats.riskCounts[key]}</strong>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Review status */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Trạng thái chấm bài</h6>
              {[
                { label: 'Đã chấm', count: stats.graded, variant: 'success', icon: FaCheckCircle },
                { label: 'Chờ chấm', count: stats.pending, variant: 'warning', icon: FaClock },
                { label: 'Quá hạn', count: stats.overdue, variant: 'danger', icon: FaExclamationTriangle },
              ].map((item) => (
                <div key={item.label} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="d-flex align-items-center gap-2 text-muted">
                      <item.icon size={12} /> {item.label}
                    </span>
                    <span className="fw-bold">{item.count}</span>
                  </div>
                  <ProgressBar
                    now={stats.totalReviews ? (item.count / stats.totalReviews) * 100 : 0}
                    variant={item.variant}
                    style={{ height: 8 }}
                    className="rounded-pill"
                  />
                </div>
              ))}
              <hr className="my-3" />
              <h6 className="fw-bold mb-2 small text-muted text-uppercase">Yêu cầu mentor</h6>
              <div className="d-flex gap-2 flex-wrap">
                <Badge bg="success" className="bg-opacity-10 text-success px-2 py-1 rounded-2">
                  Chấp nhận {stats.acceptedReq}
                </Badge>
                <Badge bg="warning" className="bg-opacity-10 text-dark px-2 py-1 rounded-2">
                  Chờ {stats.pendingReq}
                </Badge>
                <Badge bg="danger" className="bg-opacity-10 text-danger px-2 py-1 rounded-2">
                  Từ chối {stats.declinedReq}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Group progress chart */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-4">So sánh tiến độ theo nhóm</h6>
          <div className="d-flex flex-column gap-3">
            {progress.map((group) => (
              <div key={group.id}>
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="fw-semibold">
                    {group.id} — {group.name}
                    <span className="text-muted fw-normal ms-2">{group.project}</span>
                  </span>
                  <Badge
                    bg={group.risk === 'high' ? 'danger' : group.risk === 'medium' ? 'warning' : 'success'}
                    className="bg-opacity-10 text-dark rounded-2"
                    style={{ fontSize: '0.68rem' }}
                  >
                    {riskMeta[group.risk]?.label || group.risk}
                  </Badge>
                </div>
                <div className="mentor-report-hbar-track">
                  <div
                    className={`mentor-report-hbar-fill mentor-report-bar--${
                      group.risk === 'high' ? 'danger' : group.risk === 'medium' ? 'warning' : 'success'
                    }`}
                    style={{ width: `${(group.progress / maxProgress) * 100}%` }}
                  />
                  <span className="mentor-report-hbar-label">{group.progress}%</span>
                </div>
              </div>
            ))}
            {progress.length === 0 && (
              <p className="text-muted small mb-0 text-center py-3">Chưa có dữ liệu nhóm.</p>
            )}
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        {/* Group table */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Báo cáo chi tiết nhóm</h6>
              <Table responsive borderless className="align-middle mb-0 small mentor-reports-table">
                <thead>
                  <tr className="text-muted text-uppercase border-bottom">
                    <th className="ps-0">Nhóm</th>
                    <th>Đề tài</th>
                    <th>Tiến độ</th>
                    <th>Milestone</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((g) => (
                    <tr key={g.id} className="border-bottom border-light">
                      <td className="ps-0 fw-semibold">{g.id}<br /><small className="text-muted fw-normal">{g.name}</small></td>
                      <td className="text-secondary">{g.project}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={g.progress}
                            variant={g.risk === 'high' ? 'danger' : g.risk === 'medium' ? 'warning' : 'success'}
                            style={{ height: 6, width: 64 }}
                            className="rounded-pill"
                          />
                          <span className="fw-bold">{g.progress}%</span>
                        </div>
                      </td>
                      <td>{g.milestoneDone}/{g.milestoneTotal}</td>
                      <td>
                        <Badge
                          bg={g.risk === 'high' ? 'danger' : g.risk === 'medium' ? 'warning' : 'success'}
                          className="bg-opacity-10 text-dark rounded-2"
                        >
                          {riskMeta[g.risk]?.label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Graded reviews + ratings */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Đánh giá đã chấm</h6>
              {Object.keys(stats.ratingCounts).length === 0 ? (
                <p className="text-muted small">Chưa có bài được chấm điểm.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-4">
                  {Object.entries(stats.ratingCounts).map(([rating, count]) => (
                    <div key={rating} className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                      <span className="small fw-semibold">{rating}</span>
                      <Badge bg="secondary" className="rounded-pill">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <h6 className="fw-bold mb-2 small text-muted text-uppercase">Bài nộp gần đây</h6>
              <div className="d-flex flex-column gap-2">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-2 rounded-3 border border-light small">
                    <div className="fw-semibold">{r.groupId} · {r.submission}</div>
                    <div className="text-muted d-flex justify-content-between mt-1">
                      <span>{r.submittedAt}</span>
                      <Badge
                        bg={r.status === 'Graded' ? 'success' : r.overdue ? 'danger' : 'warning'}
                        className="bg-opacity-10 text-dark rounded-2"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {r.status}{r.overdue ? ' · Overdue' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* At-risk highlight */}
      {stats.riskCounts.high > 0 && (
        <Card className="border-0 shadow-sm rounded-4 border-start border-4 border-danger">
          <Card.Body className="p-4">
            <h6 className="fw-bold text-danger mb-3 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> Nhóm cần can thiệp ({stats.riskCounts.high})
            </h6>
            <Row className="g-2">
              {progress
                .filter((g) => g.risk === 'high')
                .map((g) => (
                  <Col key={g.id} md={6} lg={4}>
                    <div className="p-3 rounded-3 bg-danger bg-opacity-10">
                      <div className="fw-bold small">{g.id} — {g.name}</div>
                      <div className="text-muted small">{g.project}</div>
                      <div className="small mt-1">
                        Tiến độ <strong className="text-danger">{g.progress}%</strong>
                        · Hoạt động: {g.lastActive}
                      </div>
                    </div>
                  </Col>
                ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default MentorReports;
