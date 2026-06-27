import { useCallback, useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Button, Table, ProgressBar } from 'react-bootstrap';
import {
  FaChartBar,
  FaDownload,
  FaPrint,
  FaUsers,
  FaFolderOpen,
  FaClipboardCheck,
  FaUserGraduate,
} from 'react-icons/fa';
import { getAdminReports } from '../../../api/adminService';

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await getAdminReports());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const lines = [
      ['SmartTeam PIMS - System Report'].join(','),
      ['Exported', new Date().toLocaleDateString('vi-VN')].join(','),
      '',
      ['=== SUMMARY ==='].join(','),
      ['Students', report.totalStudents].join(','),
      ['Mentors', report.totalMentors].join(','),
      ['Committee', report.totalCommittee].join(','),
      ['Groups', report.totalGroups].join(','),
      ['Classes', report.totalClasses].join(','),
      ['Projects', report.totalProjects].join(','),
      ['Active Projects', report.activeProjects].join(','),
      ['Completed Projects', report.completedProjects].join(','),
      ['Pending Accounts', report.pendingAccounts].join(','),
      ['Defense Schedules', report.totalDefenses].join(','),
      ['Evaluations Submitted', report.evaluationCount].join(','),
      '',
      ['=== GROUP PROGRESS ==='].join(','),
      ['Group', 'Name', 'Project', 'Progress', 'Mentor', 'Semester'].join(','),
      ...(report.groupProgress || []).map((g) =>
        [g.groupCode, g.groupName, g.project, g.progress, g.mentorName, g.semester].join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-system-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-4 text-muted">Loading reports...</div>;
  }

  if (!report) {
    return <div className="p-4 text-muted">No report data available.</div>;
  }

  const defenseStatuses = report.defenseByStatus || {};
  const recommendations = report.recommendationCounts || {};

  return (
    <div className="px-1 py-2">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaChartBar className="text-success" /> System Reports
          </h3>
          <p className="text-muted small m-0 mt-1">
            Comprehensive overview of users, projects, defenses, and evaluations.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-3 bg-white d-flex align-items-center gap-2"
            onClick={() => window.print()}
          >
            <FaPrint size={12} /> Print
          </Button>
          <Button
            size="sm"
            className="rounded-3 border-0 d-flex align-items-center gap-2"
            style={{ backgroundColor: '#103d2b' }}
            onClick={exportCsv}
          >
            <FaDownload size={12} /> Export CSV
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[
          { label: 'Students', value: report.totalStudents, icon: FaUserGraduate, sub: `${report.pendingAccounts} pending accounts` },
          { label: 'Groups & Classes', value: `${report.totalGroups} / ${report.totalClasses}`, icon: FaUsers, sub: `${report.totalMentors} mentors` },
          { label: 'Projects', value: report.totalProjects, icon: FaFolderOpen, sub: `${report.activeProjects} active · ${report.completedProjects} done` },
          { label: 'Defense & Evaluations', value: `${report.totalDefenses} / ${report.evaluationCount}`, icon: FaClipboardCheck, sub: `${report.pendingEvaluations} pending grades` },
        ].map((kpi) => (
          <Col key={kpi.label} sm={6} lg={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    {kpi.label}
                  </span>
                  <div className="p-2 rounded-3 bg-light">
                    <kpi.icon className="text-success" />
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
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Defense Schedule Status</h6>
              {Object.keys(defenseStatuses).length === 0 ? (
                <p className="text-muted small mb-0">No defense schedules.</p>
              ) : (
                Object.entries(defenseStatuses).map(([status, count]) => (
                  <div key={status} className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">{status}</span>
                      <span className="fw-bold">{count}</span>
                    </div>
                    <ProgressBar
                      now={(count / report.totalDefenses) * 100}
                      style={{ height: 8 }}
                      className="rounded-pill"
                    />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Evaluation Results</h6>
              {Object.keys(recommendations).length === 0 ? (
                <p className="text-muted small mb-0">No evaluations submitted yet.</p>
              ) : (
                Object.entries(recommendations).map(([rec, count]) => (
                  <div key={rec} className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light mb-2">
                    <Badge
                      bg={rec === 'Pass' ? 'success' : rec === 'Fail' ? 'danger' : 'warning'}
                      className="rounded-2"
                    >
                      {rec}
                    </Badge>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3">Group Progress Report</h6>
          <Table responsive borderless className="align-middle mb-0 small">
            <thead>
              <tr className="text-muted text-uppercase border-bottom">
                <th>Group</th>
                <th>Project</th>
                <th>Mentor</th>
                <th>Semester</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {(report.groupProgress || []).map((g) => (
                <tr key={g.groupCode} className="border-bottom border-light">
                  <td className="fw-semibold">
                    {g.groupCode}
                    <br />
                    <small className="text-muted fw-normal">{g.groupName}</small>
                  </td>
                  <td>{g.project}</td>
                  <td>{g.mentorName}</td>
                  <td>{g.semester}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <ProgressBar now={g.progress} style={{ height: 6, width: 64 }} className="rounded-pill" />
                      <span className="fw-bold">{g.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3">Recent Projects</h6>
          <Table responsive borderless className="align-middle mb-0 small">
            <thead>
              <tr className="text-muted text-uppercase border-bottom">
                <th>Project</th>
                <th>Group</th>
                <th>Mentor</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(report.recentProjects || []).map((p) => (
                <tr key={p.id} className="border-bottom border-light">
                  <td className="fw-semibold">{p.name}</td>
                  <td>{p.groupId}</td>
                  <td>{p.mentorName}</td>
                  <td>
                    <Badge bg="secondary" className="bg-opacity-10 text-dark rounded-2">{p.status}</Badge>
                  </td>
                  <td>{p.progress}%</td>
                  <td className="text-muted">{p.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminReports;
