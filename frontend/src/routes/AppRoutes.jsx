// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/Login/LoginPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import RegisterPage from '../pages/Register/RegisterPage';
import { useAuth } from '../auth/AuthContext';
import TeamManagement from '../pages/Dashboard/Student/TeamManagement';
import MentorRequests from '../pages/Dashboard/Student/MentorRequests';
import AIMatching from '../pages/Dashboard/Student/AIMatching';
import Submissions from '../pages/Dashboard/Student/Submissions';
import StudentGrades from '../pages/Dashboard/Student/StudentGrades';

// IMPORT CÁC DASHBOARD PHÂN THEO QUYỀN (ROLE)
import AdminDashboard from '../pages/Dashboard/Admin/DashboardPage';
import StudentDashboard from '../pages/Dashboard/Student/StudentDashboard';
import MentorDashboard from '../pages/Dashboard/Mentor/MentorDashboard';
import CommitteeDashboard from '../pages/Dashboard/Commitee/CommitteeDashboard';
import MentorClasses from '../pages/Dashboard/Mentor/MentorClasses';
import MentorClassDetail from '../pages/Dashboard/Mentor/MentorClassDetail';
import CommitteeFeedback from '../pages/Dashboard/Commitee/CommitteeFeedback';
import CommitteeGradingSchedule from '../pages/Dashboard/Commitee/CommitteeGradingSchedule';
import CommitteeEvaluations from '../pages/Dashboard/Commitee/CommitteeEvaluations';
import CommitteeProjectArchives from '../pages/Dashboard/Commitee/CommitteeProjectArchives';
import CommitteePublishedResults from '../pages/Dashboard/Commitee/CommitteePublishedResults';
import CommitteeReports from '../pages/Dashboard/Commitee/CommitteeReports';
import MentorIncomingRequests from '../pages/Dashboard/Mentor/MentorIncomingRequests';
import MentorReviewQueue from '../pages/Dashboard/Mentor/MentorReviewQueue';
import MentorProgressTracking from '../pages/Dashboard/Mentor/MentorProgressTracking';
import MentorReports from '../pages/Dashboard/Mentor/MentorReports';
import AdminSemesters from '../pages/Dashboard/Admin/AdminSemesters';
import AdminDefenseSchedule from '../pages/Dashboard/Admin/AdminDefenseSchedule';
import AdminClasses from '../pages/Dashboard/Admin/AdminClasses';
import AdminUsers from '../pages/Dashboard/Admin/AdminUsers';
import AdminEvaluations from '../pages/Dashboard/Admin/AdminEvaluations';
import AdminFinalGrades from '../pages/Dashboard/Admin/AdminFinalGrades';
import AdminReports from '../pages/Dashboard/Admin/AdminReports';

// IMPORT TRANG MY COURSE CỦA STUDENT
import MyCourse from '../pages/Dashboard/Student/MyCourse';

// Component tạm thời hiển thị cho các chức năng đang phát triển
const PlaceholderPage = ({ name }) => (
  <div className="p-4">
    <h3 className="text-secondary">{name} Page đang trong quá trình thiết kế...</h3>
  </div>
);

// BỘ ĐIỀU HƯỚNG DASHBOARD DỰA TRÊN ROLE CỦA USER KHI ĐĂNG NHẬP
const DashboardResolver = () => {
  const auth = useAuth();
  const role = auth.user?.role;

  switch (role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Student':
      return <StudentDashboard />;
    case 'Mentor':
      return <MentorDashboard />;
    case 'Committee':
      return <CommitteeDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const RoleRoute = ({ role, children }) => {
  const auth = useAuth();
  if (auth.user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Component bảo vệ tuyến đường (Chỉ cho phép truy cập nếu đã login)
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ReportsResolver = () => {
  const auth = useAuth();
  if (auth.user?.role === 'Mentor') {
    return <MentorReports />;
  }
  if (auth.user?.role === 'Admin') {
    return <AdminReports />;
  }
  if (auth.user?.role === 'Committee') {
    return <CommitteeReports />;
  }
  return <PlaceholderPage name="Reports" />;
};

const AppRoutes = () => {
  const auth = useAuth();
  const defaultRedirect = auth.isAuthenticated ? '/dashboard' : '/login';

  return (
    <Routes>
      {/* Route gốc / điều hướng linh hoạt */}
      <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
      
      {/* Route Login */}
      <Route
        path="/login"
        element={
          auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      
      {/* Route Register */}
      <Route path="/register" element={<RegisterPage />} />

      {/* TẤT CẢ CÁC ROUTE BÊN TRONG ĐỀU ĐƯỢC BẢO VỆ VÀ THỪA HƯỞNG MAINLAYOUT */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        
        {/* Dashboard động: Tự nhận diện giao diện theo Role */}
        <Route path="/dashboard" element={<DashboardResolver />} />
        
        {/* CÁC ROUTE CHỨC NĂNG CỦA STUDENT */}
        <Route path="/my-courses" element={<MyCourse />} />
        <Route path="/my-course" element={<MyCourse />} />
        <Route path="/team-management" element={<TeamManagement />} /> 
        <Route path="/ai-matching" element={<AIMatching />} /> 
        <Route path="/mentor-requests" element={<MentorRequests />} /> 
        
        {/* ĐÃ THAY THẾ PLACEHOLDER THÀNH COMPONENT THẬT Ở ĐÂY */}
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/my-grades" element={<StudentGrades />} />

        {/* MENTOR */}
        <Route path="/mentor/classes" element={<RoleRoute role="Mentor"><MentorClasses /></RoleRoute>} />
        <Route path="/mentor/classes/:classId" element={<RoleRoute role="Mentor"><MentorClassDetail /></RoleRoute>} />
        <Route path="/mentor/requests" element={<RoleRoute role="Mentor"><MentorIncomingRequests /></RoleRoute>} />
        <Route path="/mentor/review-queue" element={<RoleRoute role="Mentor"><MentorReviewQueue /></RoleRoute>} />
        <Route path="/mentor/progress" element={<RoleRoute role="Mentor"><MentorProgressTracking /></RoleRoute>} />

        {/* COMMITTEE */}
        <Route path="/committee/feedback" element={<RoleRoute role="Committee"><CommitteeFeedback /></RoleRoute>} />
        <Route path="/committee/grading-schedule" element={<RoleRoute role="Committee"><CommitteeGradingSchedule /></RoleRoute>} />
        <Route path="/final-evaluations" element={<RoleRoute role="Committee"><CommitteeEvaluations /></RoleRoute>} />
        <Route path="/project-archives" element={<RoleRoute role="Committee"><CommitteeProjectArchives /></RoleRoute>} />
        <Route path="/published-results" element={<RoleRoute role="Committee"><CommitteePublishedResults /></RoleRoute>} />

        {/* CÁC ROUTE KHÁC CHO ADMIN / HỆ THỐNG */}
        <Route path="/classes" element={<RoleRoute role="Admin"><AdminClasses /></RoleRoute>} />
        <Route path="/semesters" element={<RoleRoute role="Admin"><AdminSemesters /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute role="Admin"><AdminUsers /></RoleRoute>} />
        <Route path="/defense" element={<RoleRoute role="Admin"><AdminDefenseSchedule /></RoleRoute>} />
        <Route path="/evaluations" element={<RoleRoute role="Admin"><AdminEvaluations /></RoleRoute>} />
        <Route path="/final-grades" element={<RoleRoute role="Admin"><AdminFinalGrades /></RoleRoute>} />
        <Route path="/reports" element={<ReportsResolver />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback route nếu đi sai đường dẫn sẽ tự đẩy về trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;