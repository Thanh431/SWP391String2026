import { useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { FaUserGraduate, FaUsers, FaFolderOpen, FaIdCard, FaDownload } from 'react-icons/fa';
import StatCard from '../../../components/dashboard/StatCard';
import ProjectStatusChart from '../../../components/dashboard/ProjectStatusChart';
import GroupProgressChart from '../../../components/dashboard/GroupProgressChart';
import RecentProjectsTable from '../../../components/dashboard/RecentProjectsTable';
import { getDashboardStats, getAllProjects } from '../../../api/services';
import { getSemesters, getMentors, getAdminStudentGroups } from '../../../api/adminService';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSemester, setFilterSemester] = useState('All');
  const [filterMentor, setFilterMentor] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, projectsData, groupsData, semestersData, mentorsData] = await Promise.all([
        getDashboardStats(),
        getAllProjects(),
        getAdminStudentGroups(),
        getSemesters(),
        getMentors(),
      ]);
      setStats(statsData);
      setProjects(projectsData || []);
      setGroups(groupsData || []);
      setSemesters(semestersData || []);
      setMentors(mentorsData || []);
    } catch {
      setError('Không thể tải dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;
      if (filterMentor !== 'All' && String(p.mentor?.id) !== filterMentor) return false;
      if (filterSemester !== 'All') {
        const group = groups.find((g) => g.groupCode === p.groupId);
        if (!group || group.semester !== filterSemester) return false;
      }
      return true;
    });
  }, [projects, groups, filterSemester, filterMentor, filterStatus]);

  const pieChartData = useMemo(() => {
    const counts = { 'In Progress': 0, Completed: 0, 'On Hold': 0 };
    filteredProjects.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status] += 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
    }));
  }, [filteredProjects]);

  const groupProgressData = useMemo(() => {
    let list = groups;
    if (filterSemester !== 'All') {
      list = list.filter((g) => g.semester === filterSemester);
    }
    if (filterMentor !== 'All') {
      list = list.filter((g) => String(g.mentorId) === filterMentor);
    }
    return list
      .slice()
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
      .map((g) => ({ id: g.groupCode, name: g.groupName, progress: g.progress }));
  }, [groups, filterSemester, filterMentor]);

  const recentProjectsData = useMemo(() => {
    return filteredProjects
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((p) => ({
        projectName: p.name,
        groupId: p.groupId,
        mentorInitials: getInitials(p.mentor?.fullName || p.mentor?.username),
        mentorName: p.mentor?.fullName || p.mentor?.username || '—',
        status: p.status,
        progress: p.progress,
        lastUpdated: formatDate(p.updatedAt),
      }));
  }, [filteredProjects]);

  const exportReport = () => {
    const lines = [
      ['SmartTeam PIMS - Admin Dashboard Report'].join(','),
      ['Exported', new Date().toLocaleDateString('vi-VN')].join(','),
      '',
      ['KPI', 'Value'].join(','),
      ['Total Students', stats?.totalStudents ?? 0].join(','),
      ['Total Groups', stats?.totalGroups ?? 0].join(','),
      ['Active Projects', stats?.activeProjects ?? 0].join(','),
      ['Mentors', stats?.totalMentors ?? 0].join(','),
      ['Pending Accounts', stats?.pendingAccounts ?? 0].join(','),
      '',
      ['Projects'].join(','),
      ['Name', 'Group', 'Status', 'Progress', 'Mentor'].join(','),
      ...filteredProjects.map((p) =>
        [p.name, p.groupId, p.status, p.progress, p.mentor?.fullName || p.mentor?.username || ''].join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-4 text-muted">Đang tải dashboard...</div>;
  }

  return (
    <div className="px-1 py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Dashboard Overview</h3>
          <p className="text-muted small m-0 mt-1" style={{ fontSize: '0.82rem' }}>
            Monitor academic project progress and group statuses.
          </p>
        </div>
        <Button
          variant="outline-secondary"
          className="bg-white text-dark border-opacity-50 px-3 py-2 rounded-3 fw-semibold small d-flex align-items-center gap-2 shadow-sm"
          style={{ fontSize: '0.82rem' }}
          onClick={exportReport}
        >
          <FaDownload size={12} className="text-secondary" /> Export Report
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="bg-white p-3.5 rounded-4 shadow-sm mb-4 border border-light">
        <Row className="g-3 align-items-end">
          <Col lg={3} md={6}>
            <Form.Label className="text-secondary small fw-bold mb-1.5" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Semester
            </Form.Label>
            <Form.Select
              className="bg-light bg-opacity-50 border-0 shadow-none py-2 px-3 rounded-3 text-dark fw-medium"
              style={{ fontSize: '0.85rem', height: '40px' }}
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="All">All Semesters</option>
              {[...new Set(semesters.map((s) => s.name))].map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={3} md={6}>
            <Form.Label className="text-secondary small fw-bold mb-1.5" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Mentor
            </Form.Label>
            <Form.Select
              className="bg-light bg-opacity-50 border-0 shadow-none py-2 px-3 rounded-3 text-dark fw-medium"
              style={{ fontSize: '0.85rem', height: '40px' }}
              value={filterMentor}
              onChange={(e) => setFilterMentor(e.target.value)}
            >
              <option value="All">All Mentors</option>
              {mentors.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.fullName || m.username}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={3} md={6}>
            <Form.Label className="text-secondary small fw-bold mb-1.5" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Status
            </Form.Label>
            <Form.Select
              className="bg-light bg-opacity-50 border-0 shadow-none py-2 px-3 rounded-3 text-dark fw-medium"
              style={{ fontSize: '0.85rem', height: '40px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </Form.Select>
          </Col>
          <Col lg={3} md={6}>
            <Button
              className="w-100 py-2 rounded-3 border-0 fw-bold shadow-sm"
              style={{ backgroundColor: '#103d2b', height: '40px' }}
              onClick={() => {
                setFilterSemester('All');
                setFilterMentor('All');
                setFilterStatus('All');
              }}
            >
              Reset Filter
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Total Students"
            value={String(stats?.totalStudents ?? 0)}
            subtext={`${stats?.pendingAccounts ?? 0} accounts pending approval`}
            icon={FaUserGraduate}
            trendUp={false}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Total Groups"
            value={String(stats?.totalGroups ?? 0)}
            subtext={`${stats?.totalClasses ?? 0} mentor classes`}
            icon={FaUsers}
            trendUp={false}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Active Projects"
            value={String(stats?.activeProjects ?? 0)}
            subtext={`${stats?.completedProjects ?? 0} completed · ${stats?.onHoldProjects ?? 0} on hold`}
            icon={FaFolderOpen}
            trendUp={false}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Mentors"
            value={String(stats?.totalMentors ?? 0)}
            subtext={`${stats?.totalCommittee ?? 0} committee members`}
            icon={FaIdCard}
            trendUp={false}
          />
        </Col>
      </Row>

      <Row className="g-3 mb-2">
        <Col xl={4} lg={5}>
          <ProjectStatusChart data={pieChartData} total={filteredProjects.length} />
        </Col>
        <Col xl={8} lg={7}>
          <GroupProgressChart data={groupProgressData.length ? groupProgressData : [{ id: '—', name: 'No groups', progress: 0 }]} />
        </Col>
      </Row>

      <RecentProjectsTable projects={recentProjectsData} />
    </div>
  );
};

export default AdminDashboard;
