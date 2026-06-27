// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const MainLayout = () => {
  return (
    // 1. Khóa cứng chiều cao toàn bộ bố cục là 100vh, ngăn không cho Sidebar bị cuộn trôi
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#f8faf9' }}>
      
      {/* Sidebar cố định bên trái lề màn hình */}
      <Sidebar />

      {/* 2. Vùng nội dung bên phải: Tự động kích hoạt thanh cuộn dọc (overflowY) khi nội dung trang con quá dài */}
      {/* ĐÃ THÊM minWidth: 0 để ép các trang con (như AI Matching) không được đẩy tràn làm hỏng layout tổng */}
      <div 
        className="d-flex flex-column flex-grow-1" 
        style={{ 
          height: '100vh', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          minWidth: 0 // ◄ QUAN TRỌNG: Chống tràn chiều rộng, giữ Sidebar đúng tỷ lệ 260px
        }}
      >
        <Header />
        
        {/* Nơi render các trang con (Dashboard, Milestones, Submissions...) */}
        <main className="p-4 flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;