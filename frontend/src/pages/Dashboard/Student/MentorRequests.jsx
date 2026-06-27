import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import {
  createMentorRequest,
  getAvailableMentors,
  getStudentMentorRequests,
} from '../../../api/mentorService';

const MentorRequests = () => {
  const auth = useAuth();
  const [availableMentors, setAvailableMentors] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [proposalLink, setProposalLink] = useState('');
  const [message, setMessage] = useState('');
  const [groupCode, setGroupCode] = useState('SE1705');
  const [groupName, setGroupName] = useState('Team Capstone');
  const [projectTitle, setProjectTitle] = useState('Capstone Project');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    try {
      const [mentors, history] = await Promise.all([
        getAvailableMentors(),
        getStudentMentorRequests(auth.user.id),
      ]);
      setAvailableMentors(mentors);
      setRequestHistory(history);
    } catch {
      setError('Không tải được dữ liệu. Hãy chạy backend trước.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [auth.user?.id]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedMentor) {
      setError('Vui lòng chọn Giảng viên bạn muốn gửi yêu cầu!');
      return;
    }

    try {
      await createMentorRequest({
        mentorId: selectedMentor,
        studentId: String(auth.user.id),
        groupCode,
        groupName,
        projectTitle,
        memberCount: '4',
        major: auth.user.department || 'Software Engineering',
        message,
        proposalLink,
      });
      setSelectedMentor('');
      setProposalLink('');
      setMessage('');
      loadData();
      alert('Đã gửi yêu cầu hướng dẫn thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Không gửi được yêu cầu.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Chờ phản hồi':
        return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Chờ phản hồi</span>;
      case 'Đồng ý':
        return <span className="badge bg-success px-3 py-2 rounded-pill">Đồng ý</span>;
      case 'Từ chối':
        return <span className="badge bg-danger px-3 py-2 rounded-pill">Từ chối</span>;
      default:
        return <span className="badge bg-secondary px-3 py-2 rounded-pill">{status}</span>;
    }
  };

  if (loading) {
    return <div className="container-fluid p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Yêu cầu Mentor (GVHD)</h2>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><a href="/dashboard" className="text-decoration-none">Dashboard</a></li>
            <li className="breadcrumb-item active" aria-current="page">Mentor Requests</li>
          </ol>
        </nav>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-xl-4 col-lg-5">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-success mb-3">Gửi yêu cầu mới</h5>
              <form onSubmit={handleSubmitRequest}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">Chọn Giảng viên</label>
                  <select
                    className="form-select"
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn Giảng viên --</option>
                    {availableMentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id} disabled={mentor.full}>
                        {mentor.name} ({mentor.department}) - Slot: {mentor.slots}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">Mã nhóm</label>
                  <input type="text" className="form-control" value={groupCode} onChange={(e) => setGroupCode(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">Tên nhóm</label>
                  <input type="text" className="form-control" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">Đề tài</label>
                  <input type="text" className="form-control" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">Link tài liệu đề tài</label>
                  <input type="url" className="form-control" placeholder="https://docs.google.com/..." value={proposalLink} onChange={(e) => setProposalLink(e.target.value)} required />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark small">Lời nhắn gửi tới Mentor</label>
                  <textarea className="form-control" rows="4" value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-success w-100 py-2 fw-semibold shadow-sm">
                  Gửi yêu cầu hướng dẫn
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-8 col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-dark mb-4">Lịch sử gửi yêu cầu</h5>
              {requestHistory.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">Nhóm chưa gửi yêu cầu hướng dẫn nào.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {requestHistory.map((req) => (
                    <div key={req.id} className="p-3 rounded border border-light shadow-sm" style={{ backgroundColor: '#fcfdfe', borderLeft: '4px solid #198754' }}>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                        <div>
                          <h6 className="fw-bold text-dark mb-0 fs-5">Mentor: {req.mentorName}</h6>
                          <small className="text-muted">Ngày gửi: {req.dateSent}</small>
                        </div>
                        {renderStatusBadge(req.status)}
                      </div>
                      <div className="mt-2 text-dark small">
                        <p className="mb-1"><strong>Tài liệu:</strong> <a href={req.proposalLink} target="_blank" rel="noreferrer">{req.proposalLink}</a></p>
                        <p className="mb-1 text-secondary"><strong>Lời nhắn:</strong> "{req.message}"</p>
                      </div>
                      {req.feedback && (
                        <div className="mt-3 p-2 bg-danger bg-opacity-10 text-danger rounded small">
                          <strong>Phản hồi từ Mentor:</strong> {req.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorRequests;
