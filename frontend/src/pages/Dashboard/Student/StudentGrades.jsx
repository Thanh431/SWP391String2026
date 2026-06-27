import { useCallback, useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../../auth/AuthContext';
import { getStudentGrades } from '../../../api/studentService';
import StudentGradesPanel from './StudentGradesPanel';

const StudentGrades = () => {
  const auth = useAuth();
  const studentId = auth.user?.id;

  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      setGrades(await getStudentGrades(studentId));
    } catch {
      setError('Không thể tải điểm môn học.');
      setGrades(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="px-2 py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3 mb-0">Đang tải điểm...</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-3" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
          <FaGraduationCap className="text-success" />
          Xem điểm môn học
        </h3>
        <p className="text-muted small m-0 mt-1">
          Điểm mentor chấm từng milestone (M1/M2/M3) và điểm bảo vệ hội đồng — cập nhật theo Review Queue của mentor.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      <StudentGradesPanel grades={grades} />
    </div>
  );
};

export default StudentGrades;
