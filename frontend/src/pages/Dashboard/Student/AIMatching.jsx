// src/pages/Dashboard/Student/AIMatching.jsx
import React, { useState } from 'react';

const AIMatching = () => {
  // Mock dữ liệu thông tin đề tài hiện tại của nhóm để AI phân tích
  const [projectSkills] = useState({
    title: 'Hệ thống Quản lý Bãi xe Thông minh (Smart Parking System)',
    techStack: ['Java Web', 'ReactJS', 'IoT (Arduino/ESP32)', 'MySQL', 'Machine Learning (License Plate Recognition)'],
    domain: 'Smart City / IoT / Web Application'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(true);

  // Mock danh sách Mentor được AI gợi ý dựa trên Tech Stack và Domain
  const [recommendedMentors, setRecommendedMentors] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      avatar: 'A',
      matchScore: 96,
      tags: ['Java Expert', 'IoT Architecture', 'Smart System'],
      reason: 'Thầy có 5 năm nghiên cứu về hệ thống nhúng và đã hướng dẫn thành công 4 đề tài Smart Parking các kỳ trước. Rất mạnh về tối ưu hóa cơ sở dữ liệu Java.',
      status: 'Còn trống 1 slot'
    },
    {
      id: 2,
      name: 'Lê Hoàng D',
      avatar: 'D',
      matchScore: 88,
      tags: ['Cloud Computing', 'Web Fullstack', 'AI/ML Integration'],
      reason: 'Mạnh về mảng lập trình Web (React/Java) và triển khai hệ thống lên Cloud. Có thể hỗ trợ nhóm tối ưu module nhận diện biển số xe bằng AI.',
      status: 'Còn trống 3 slot'
    },
    {
      id: 3,
      name: 'Trần Thị B',
      avatar: 'B',
      matchScore: 75,
      tags: ['Mobile Application', 'Database Design', 'Software Testing'],
      reason: 'Có kinh nghiệm dày dặn về quy trình kiểm thử và thiết kế kiến trúc phần mềm chuẩn MVC/Microservices. Phù hợp nếu nhóm có mở rộng làm Mobile App.',
      status: 'Còn trống 2 slot'
    }
  ]);

  // Hàm giả lập quét AI Matching
  const handleRetriggerAI = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000); // Chờ 2 giây để tạo hiệu ứng AI chạy
  };

  return (
    <div className="container-fluid">
      {/* Tiêu đề trang */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">AI Matching Mentor</h2>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><a href="/dashboard" className="text-decoration-none">Dashboard</a></li>
            <li className="breadcrumb-item active" aria-current="page">AI Matching</li>
          </ol>
        </nav>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: THÔNG TIN INPUT ĐỂ AI PHÂN TÍCH */}
        <div className="col-xl-4 col-lg-5">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success text-white rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-cpu-fill"></i>
                </div>
                <h5 className="card-title fw-bold text-dark mb-0">Dữ liệu phân tích của nhóm</h5>
              </div>
              <p className="text-muted small mb-4">
                Hệ thống AI tự động trích xuất các từ khóa công nghệ và lĩnh vực từ thông tin đăng ký nhóm của bạn để tìm Mentor tương thích nhất.
              </p>

              <div className="mb-3">
                <label className="fw-semibold text-secondary small mb-1">Tên đề tài</label>
                <p className="text-dark fw-bold border-bottom pb-2">{projectSkills.title}</p>
              </div>

              <div className="mb-3">
                <label className="fw-semibold text-secondary small mb-1">Lĩnh vực (Domain)</label>
                <div>
                  <span className="badge bg-info text-dark px-2.5 py-1.5 rounded mb-1 me-1">{projectSkills.domain}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="fw-semibold text-secondary small mb-1">Từ khóa công nghệ (Tech Stack)</label>
                <div className="d-flex flex-wrap gap-1">
                  {projectSkills.techStack.map((tech, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-2 py-1.5 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-success w-100 py-2.5 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={handleRetriggerAI}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    AI đang phân tích...
                  </>
                ) : (
                  <>
                    Phân tích lại bằng AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ GỢI Ý TỪ AI */}
        <div className="col-xl-8 col-lg-7">
          {isAnalyzing && (
            <div className="text-center py-5 card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="spinner-grow text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                <h5 className="fw-bold text-dark">Thuật toán AI đang quét danh sách giảng viên...</h5>
                <p className="text-muted small">So khớp kỹ năng chuyên môn, đề tài nghiên cứu khoa học và slot trống thực tế.</p>
              </div>
            </div>
          )}

          {showResults && !isAnalyzing && (
            <div className="d-flex flex-column gap-4">
              <div className="card border-0 shadow-sm p-3 bg-success-light" style={{ borderRadius: '12px', borderLeft: '5px solid #198754' }}>
                <div className="card-body py-2">
                  <h6 className="fw-bold text-success mb-1">Tìm thấy {recommendedMentors.length} Giảng viên phù hợp xuất sắc!</h6>
                  <p className="text-muted small mb-0">Danh sách được sắp xếp theo tỷ lệ phần trăm tương thích từ cao xuống thấp.</p>
                </div>
              </div>

              {recommendedMentors.map((mentor) => (
                <div key={mentor.id} className="card border-0 shadow-sm position-relative overflow-hidden" style={{ borderRadius: '12px' }}>
                  
                  {/* Điểm số Match ở góc phải */}
                  <div className="position-absolute end-0 top-0 p-4 text-center">
                    <div className="text-success fw-bold lh-1" style={{ fontSize: '2rem' }}>{mentor.matchScore}%</div>
                    <small className="text-muted fw-semibold small uppercase">Match</small>
                  </div>

                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3">
                      {/* Avatar Giả lập */}
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm" style={{ width: '60px', height: '60px', minWidth: '60px' }}>
                        {mentor.avatar}
                      </div>

                      {/* Thông tin chính */}
                      <div className="pe-5 me-4">
                        <h5 className="fw-bold text-dark mb-1">Mentor: {mentor.name}</h5>
                        <div className="mb-2">
                          <span className={`badge bg-opacity-10 text-dark rounded-pill px-2.5 py-1 small me-2 ${mentor.status.includes('Full') ? 'bg-danger text-danger' : 'bg-success text-success'}`}>
                            {mentor.status}
                          </span>
                        </div>

                        {/* Các tag từ khóa thế mạnh */}
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          {mentor.tags.map((tag, idx) => (
                            <span key={idx} className="badge bg-primary-light text-primary rounded-pill px-2.5 py-1 small font-medium" style={{ fontSize: '11px' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Lý do AI lựa chọn */}
                        <div className="bg-light p-3 rounded" style={{ borderLeft: '3px solid #6c757d' }}>
                          <p className="mb-0 text-secondary small italic">
                            <strong className="text-dark">Lý do gợi ý từ AI:</strong> "{mentor.reason}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nút Hành Động */}
                    <div className="d-flex justify-content-end mt-3 border-top pt-3">
                      <a href="/mentor-requests" className="btn btn-outline-success btn-sm px-4 fw-semibold py-2 rounded">
                        Gửi yêu cầu ngay lập tức
                      </a>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMatching;