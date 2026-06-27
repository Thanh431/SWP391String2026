import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext';
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  getMyTeam,
  inviteTeamMember,
  joinTeamByCode,
} from '../../../api/studentService';

const statusVariant = (status) => {
  if (!status) return 'secondary';
  if (status.includes('hoàn thành') || status.includes('Đủ')) return 'success';
  if (status.includes('Tạm') || status.includes('tuyển')) return 'warning';
  return 'primary';
};

const TeamManagement = () => {
  const auth = useAuth();
  const studentId = auth.user?.id;

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      setTeam(await getMyTeam(studentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin nhóm.');
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !studentId) return;
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const data = await inviteTeamMember(studentId, inviteEmail.trim());
      setTeam(data);
      setInviteEmail('');
      setMessage(`Đã gửi lời mời tới ${inviteEmail.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lời mời.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || !studentId) return;
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const data = await joinTeamByCode(studentId, joinCode.trim());
      setTeam(data);
      setJoinCode('');
      setMessage('Đã tham gia nhóm thành công.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tham gia nhóm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvite = async (invitationId) => {
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const data = await acceptTeamInvitation(studentId, invitationId);
      setTeam(data);
      setMessage('Đã chấp nhận lời mời và tham gia nhóm.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể chấp nhận lời mời.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineInvite = async (invitationId) => {
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const data = await declineTeamInvitation(studentId, invitationId);
      setTeam(data);
      setMessage('Đã từ chối lời mời.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể từ chối lời mời.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <Spinner animation="border" size="sm" className="me-2" />
        Đang tải thông tin nhóm...
      </div>
    );
  }

  if (!team?.hasTeam) {
    const incomingInvites = team?.incomingInvites || [];

    return (
      <div className="container-fluid">
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">Quản lý nhóm</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard" className="text-decoration-none">Dashboard</Link></li>
              <li className="breadcrumb-item active">Team Management</li>
            </ol>
          </nav>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Alert variant="info">
          {team?.message || 'Bạn chưa tham gia nhóm nào.'}
          {' '}Vào <Link to="/my-courses">My Courses</Link> để chọn đề tài, hoặc nhập mã nhóm bên dưới.
        </Alert>

        {incomingInvites.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Lời mời tham gia nhóm ({incomingInvites.length})</h5>
              {incomingInvites.map((invite) => (
                <div key={invite.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div>
                    <div className="fw-semibold">{invite.topicGroupCode}</div>
                    <small className="text-muted">Từ nhóm · {invite.createdAt}</small>
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="success" disabled={submitting} onClick={() => handleAcceptInvite(invite.id)}>
                      Chấp nhận
                    </Button>
                    <Button size="sm" variant="outline-secondary" disabled={submitting} onClick={() => handleDeclineInvite(invite.id)}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', maxWidth: '480px' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Tham gia bằng mã nhóm</h5>
            <Form onSubmit={handleJoinByCode}>
              <div className="input-group">
                <Form.Control
                  placeholder="VD: FA24_CAP391-G01"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
                <Button type="submit" variant="success" disabled={submitting}>
                  Tham gia
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  const members = team.members || [];
  const pendingInvites = team.pendingInvites || [];

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Quản lý nhóm</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard" className="text-decoration-none">Dashboard</Link></li>
              <li className="breadcrumb-item active">Team Management</li>
            </ol>
          </nav>
        </div>
        <span className={`badge bg-${statusVariant(team.status)} p-2 fs-6`}>
          {team.status}
        </span>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}

      <div className="row g-4">
        <div className="col-xl-8 col-lg-7">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-success mb-3">Thông tin Đề tài & Nhóm</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <p className="mb-1 text-muted small">Tên nhóm</p>
                  <p className="fw-semibold fs-5 text-dark">{team.groupName}</p>
                  <p className="text-muted small mb-0">{team.teamName}</p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1 text-muted small">Mã tham gia nhóm (Join Code)</p>
                  <div className="d-flex align-items-center">
                    <code className="fw-bold fs-5 text-danger bg-light px-2 py-1 rounded me-2">{team.joinCode}</code>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-1 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(team.joinCode);
                        setMessage('Đã sao chép mã nhóm.');
                      }}
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <p className="mb-1 text-muted small">Lớp học</p>
                  <p className="fw-semibold">{team.className} ({team.classCode})</p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1 text-muted small">Tiến độ</p>
                  <p className="fw-semibold">{team.progress ?? 0}%</p>
                </div>
                <div className="col-12 border-top pt-3 mt-3">
                  <p className="mb-1 text-muted small">Đề tài đăng ký</p>
                  <p className="fw-bold text-dark fs-5 mb-1">{team.projectTitle}</p>
                  {team.projectDescription && (
                    <p className="text-muted small mb-0">{team.projectDescription}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title fw-bold text-dark mb-0">
                  Thành viên nhóm ({members.length}/{team.maxMembers})
                </h5>
                <span className="text-muted small">Tối đa: {team.maxMembers} thành viên</span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary">
                    <tr>
                      <th scope="col" className="ps-3">Họ và Tên</th>
                      <th scope="col">MSSV</th>
                      <th scope="col">Email</th>
                      <th scope="col">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className={member.isMe ? 'table-success' : ''}>
                        <td className="ps-3 fw-semibold">
                          {member.name}
                          {member.isMe && <span className="badge bg-primary ms-1">Tôi</span>}
                        </td>
                        <td><span className="badge bg-light text-dark">{member.rollNumber}</span></td>
                        <td className="text-muted small">{member.email}</td>
                        <td>
                          <span className={`badge ${member.role === 'Leader' ? 'bg-danger' : 'bg-secondary'} rounded-pill px-3`}>
                            {member.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-5">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-dark mb-3">Giảng viên hướng dẫn</h5>
              <div className="d-flex align-items-center">
                <div
                  className="bg-primary bg-opacity-10 rounded-circle p-3 text-primary fw-bold me-3 text-center"
                  style={{ width: '50px', height: '50px', lineHeight: '20px' }}
                >
                  M
                </div>
                <div>
                  <p className="mb-0 fw-bold text-dark">{team.mentor}</p>
                  <p className="mb-0 text-muted small">{team.mentorEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {team.isLeader && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="card-title fw-bold text-dark mb-2">Mời thành viên</h5>
                <p className="text-muted small mb-3">
                  Nhập email FPT của sinh viên đã tham gia cùng lớp học.
                </p>

                <Form onSubmit={handleInvite} className="mb-4">
                  <div className="input-group">
                    <Form.Control
                      type="email"
                      placeholder="example@fpt.edu.vn"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      disabled={submitting || members.length >= team.maxMembers}
                    />
                    <Button className="btn btn-success" type="submit" disabled={submitting || members.length >= team.maxMembers}>
                      Gửi
                    </Button>
                  </div>
                </Form>

                <div>
                  <h6 className="fw-bold text-secondary mb-2 small text-uppercase">
                    Lời mời đang chờ ({pendingInvites.length})
                  </h6>
                  {pendingInvites.length === 0 ? (
                    <p className="text-muted small mb-0">Không có lời mời nào đang chờ.</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} className="list-group-item px-0 d-flex justify-content-between align-items-center py-2 border-0 border-bottom">
                          <div>
                            <p className="mb-0 small fw-semibold text-dark">{invite.email}</p>
                            <span className="text-muted" style={{ fontSize: '11px' }}>{invite.rollNumber}</span>
                          </div>
                          <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '11px' }}>
                            {invite.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!team.isLeader && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <p className="text-muted small mb-0">
                  Chia sẻ mã nhóm <strong>{team.joinCode}</strong> để bạn cùng lớp tham gia.
                  Chỉ trưởng nhóm mới có thể gửi lời mời qua email.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
