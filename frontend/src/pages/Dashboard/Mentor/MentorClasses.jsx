import { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaGraduationCap, FaUsers, FaFolderOpen, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { getMentorClasses } from '../../../api/mentorService';

const MentorClasses = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.user?.id) return;
    getMentorClasses(auth.user.id)
      .then(setClasses)
      .catch(() => setError('Không tải được danh sách lớp.'))
      .finally(() => setLoading(false));
  }, [auth.user?.id]);

  if (loading) {
    return <div className="p-4 text-muted">Đang tải...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0">Class</h3>
        <p className="text-muted small m-0 mt-1">
          Các lớp bạn được phân công hướng dẫn — chọn lớp để xem Project và nhóm sinh viên.
        </p>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <Row className="g-3">
        {classes.map((item) => (
          <Col key={item.id} lg={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 48, height: 48, backgroundColor: 'rgba(16, 61, 43, 0.1)' }}
                    >
                      <FaGraduationCap className="text-success" size={20} />
                    </div>
                    <div>
                      <h5 className="fw-bold m-0">{item.name}</h5>
                      <small className="text-muted">{item.code}</small>
                    </div>
                  </div>
                  <Badge bg="success" className="bg-opacity-10 text-success px-2 py-1 rounded-2">
                    {item.semester}
                  </Badge>
                </div>

                <p className="text-muted small mb-3">
                  Campus: {item.campus} · {item.studentCount} sinh viên đã join · {item.groupCount} nhóm dự án
                </p>

                <div className="d-flex gap-4 mb-4">
                  <div className="d-flex align-items-center gap-2 text-secondary small">
                    <FaFolderOpen size={14} />
                    <span>{item.projects?.length || 0} Projects</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-secondary small">
                    <FaUsers size={14} />
                    <span>{item.enrolledStudents?.length || item.studentCount || 0} SV trong lớp</span>
                  </div>
                </div>

                <Button
                  className="w-100 border-0 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#103d2b' }}
                  onClick={() => navigate(`/mentor/classes/${item.id}`)}
                >
                  Vào lớp <FaArrowRight size={12} />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {classes.length === 0 && !error && (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 text-muted">
          <p className="mb-0">Chưa có lớp nào được phân công.</p>
        </Card>
      )}
    </div>
  );
};

export default MentorClasses;
