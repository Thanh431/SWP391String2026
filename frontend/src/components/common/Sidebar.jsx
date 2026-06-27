// src/components/common/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaThLarge, FaCalendarAlt, FaUserGraduate, FaUsers, 
  FaFolderOpen, FaClipboardCheck, FaChartBar, FaCog,
  FaGraduationCap, FaBrain, FaHandshake, FaFileAlt,
  FaUserPlus, FaClipboardList, FaCheckSquare, FaChartLine,
  FaPlay 
} from 'react-icons/fa';

// Import useAuth để nhận biết role tài khoản đang đăng nhập
import { useAuth } from '../../auth/AuthContext';

const Sidebar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const userRole = auth?.user?.role;

  // 1. DANH SÁCH MENU CHO STUDENT (Khớp thiết kế image_da4a9f.png)
  const studentMenuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaThLarge },
    { path: '/my-courses', name: 'My Courses', icon: FaGraduationCap },
    { path: '/team-management', name: 'Team Management', icon: FaUsers },
    { path: '/ai-matching', name: 'AI Matching', icon: FaBrain },
    { path: '/mentor-requests', name: 'Mentor Requests', icon: FaHandshake },
    { path: '/submissions', name: 'Submissions', icon: FaFileAlt },
    { path: '/my-grades', name: 'My Grades', icon: FaChartLine },
  ];

  // 2. DANH SÁCH MENU CHO MENTOR
  const mentorMenuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaThLarge },
    { path: '/mentor/classes', name: 'Class', icon: FaGraduationCap },
    { path: '/mentor/requests', name: 'Mentor Requests', icon: FaUserPlus },
    { path: '/mentor/review-queue', name: 'Review Queue', icon: FaClipboardList, badge: 3 },
    { path: '/mentor/progress', name: 'Progress Tracking', icon: FaChartLine },
    { path: '/reports', name: 'Reports', icon: FaChartBar },
  ];

  // 3. DANH SÁCH MENU CHO COMMITTEE
  const committeeMenuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaThLarge },
    { path: '/committee/feedback', name: 'Mentor Feedback', icon: FaClipboardList },
    { path: '/committee/grading-schedule', name: 'Lịch chấm điểm', icon: FaCalendarAlt },
    { path: '/final-evaluations', name: 'Final Evaluation List', icon: FaCheckSquare },
    { path: '/project-archives', name: 'Project Archives', icon: FaFolderOpen },
    { path: '/published-results', name: 'Published Results', icon: FaClipboardCheck },
    { path: '/reports', name: 'Reports', icon: FaChartBar },
  ];

  // 4. DANH SÁCH MENU CHO ADMIN / STAFF (Bộ khung cũ hình image_d9c794.png)
  const adminMenuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaThLarge },
    { path: '/semesters', name: 'Semesters', icon: FaCalendarAlt },
    { path: '/classes', name: 'Classes', icon: FaGraduationCap },
    { path: '/users', name: 'Users', icon: FaUserGraduate },
    { path: '/defense', name: 'Defense Schedule', icon: FaClipboardCheck },
    { path: '/evaluations', name: 'Evaluations', icon: FaChartBar },
    { path: '/final-grades', name: 'Final Grades', icon: FaGraduationCap },
    { path: '/reports', name: 'Reports', icon: FaChartBar },
  ];

  // 5. KIỂM TRA ROLE ĐỂ CHỌN BỘ MENU PHÙ HỢP
  let menuItems = adminMenuItems; // Mặc định ban đầu là Admin
  if (userRole === 'Student') menuItems = studentMenuItems;
  if (userRole === 'Mentor') menuItems = mentorMenuItems;
  if (userRole === 'Committee') menuItems = committeeMenuItems; 

  return (
    <div 
      className="d-flex flex-column text-white p-3" 
      style={{ 
        width: '260px', 
        minWidth: '260px',      // Thêm: Khóa cứng chiều rộng tối thiểu
        maxWidth: '260px',      // Thêm: Khóa cứng chiều rộng tối đa
        flexShrink: 0,          // Thêm: Chống bị co rúm khi trang bên phải tràn nội dung
        backgroundColor: '#103d2b', 
        height: '100vh',        // Khóa chiều cao cố định theo viewport màn hình
        position: 'sticky',     // Ghim chặt thanh menu trái
        top: 0                  
      }}
    >
      
      {/* Logo Header */}
      <div className="text-center my-4">
        <div className="bg-white bg-opacity-10 p-2.5 rounded-3 d-inline-block mb-2">
          <FaUserGraduate size={24} className="text-white" />
        </div>
        <h5 className="fw-bold m-0" style={{ letterSpacing: '-0.3px' }}>SmartTeam PIMS</h5>
        <small className="text-white-50 text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
          Academic Excellence
        </small>
      </div>

      {/* NÚT START REVIEW ĐẶC THÙ CHO COMMITTEE */}
      {userRole === 'Committee' && (
        <div className="mb-3 px-1">
          <button 
            className="btn btn-light w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm transition-all"
            style={{ color: '#103d2b', fontSize: '0.82rem' }}
            onClick={() => navigate('/final-evaluations')}
          >
            <FaPlay size={10} style={{ transform: 'translateY(-0.5px)' }} />
            <span>Start Review</span>
          </button>
        </div>
      )}

      {/* Danh sách các Menu điều hướng động */}
      <div className="nav flex-column flex-grow-1 gap-1" style={{ overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'} // Tránh kích hoạt nhầm trạng thái active cho trang chủ
            className={({ isActive }) => 
              `d-flex align-items-center justify-content-between px-3 py-2.5 rounded-3 text-decoration-none fw-medium transition-all ${
                isActive 
                  ? 'bg-white bg-opacity-25 text-white fw-bold' 
                  : 'text-white text-opacity-75'
              }`
            }
            style={{ fontSize: '0.85rem' }}
          >
            {/* Khối chứa Icon và Tên Menu */}
            <div className="d-flex align-items-center gap-3">
              <item.icon size={16} />
              <span>{item.name}</span>
            </div>

            {/* Nếu menu có cấu hình badge thông báo */}
            {item.badge && (
              <span className="badge rounded-circle bg-danger d-flex align-items-center justify-content-center fw-bold" 
                    style={{ width: '16px', height: '16px', fontSize: '10px', padding: 0 }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Menu Settings ở dưới đáy */}
      <div className="border-top border-white border-opacity-10 pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 text-decoration-none fw-medium ${
              isActive ? 'bg-white bg-opacity-25 text-white' : 'text-white text-opacity-75'
            }`
          }
          style={{ fontSize: '0.85rem' }}
        >
          <FaCog size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;