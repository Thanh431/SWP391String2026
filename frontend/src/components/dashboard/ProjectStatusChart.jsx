// src/components/dashboard/ProjectStatusChart.jsx
import { Card, Dropdown } from 'react-bootstrap';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FaEllipsisV } from 'react-icons/fa';

const ProjectStatusChart = ({ data, total }) => {
  // Định nghĩa bảng màu map chính xác theo trạng thái (Giống 100% ảnh mẫu)
  const colorMap = {
    'In Progress': '#103d2b', // Lục bảo đậm
    'Completed': '#9bf2ca',   // Xanh Mint tươi
    'On Hold': '#fecbc9',     // Hồng nhạt pastel
  };

  // Mảng màu dự phòng nếu có trạng thái phát sinh
  const fallbackColors = ['#103d2b', '#9bf2ca', '#fecbc9'];

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
      {/* Header của biểu đồ */}
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center pb-0 pt-2 px-2">
        <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
          Project Status
        </h6>
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="text-muted p-0 chart-dropdown shadow-none">
            <FaEllipsisV size={14} />
          </Dropdown.Toggle>
          <Dropdown.Menu className="border-0 shadow-sm dropdown-menu-end" style={{ fontSize: '0.85rem' }}>
            <Dropdown.Item className="py-2">View Details</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>
      
      {/* Thân biểu đồ */}
      <Card.Body className="d-flex flex-column align-items-center justify-content-center position-relative pt-4 pb-2">
        
        {/* Khung chứa biểu đồ vòng tròn khép kín */}
        <div className="position-relative w-100 d-flex justify-content-center align-items-center" style={{ height: '170px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}     // Điều chỉnh độ thanh mảnh của vòng tròn
                outerRadius={72}     // Khớp với tỷ lệ ảnh mẫu
                paddingAngle={4}     // Khoảng hở tinh tế giữa các phân đoạn màu
                startAngle={90}      // Bắt đầu vẽ từ đỉnh 12 giờ
                endAngle={-270}     // Đi trọn một vòng 360 độ khép kín
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colorMap[entry.name] || fallbackColors[index % fallbackColors.length]} 
                    style={{ outline: 'none' }} 
                  />
                ))}
              </Pie>
              <Tooltip cursor={{ fill: 'transparent' }} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Số hiển thị trung tâm nằm chính giữa tuyệt đối */}
          <div className="position-absolute text-center d-flex flex-column align-items-center justify-content-center" style={{ pointerEvents: 'none' }}>
            <h3 className="fw-bold m-0 text-dark" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
              {total ?? data.reduce((sum, item) => sum + item.value, 0)}
            </h3>
            <small className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
              Total
            </small>
          </div>
        </div>

        {/* Danh mục Legend hiển thị số phần trăm ở dưới */}
        <div className="w-100 px-2 mt-4 d-flex flex-column gap-2">
          {data.map((item, index) => {
            const currentColor = colorMap[item.name] || fallbackColors[index % fallbackColors.length];
            return (
              <div key={item.name} className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.85rem' }}>
                <div className="d-flex align-items-center gap-2.5">
                  <span 
                    className="rounded-circle d-inline-block" 
                    style={{ width: '9px', height: '9px', backgroundColor: currentColor }}
                  ></span>
                  <span className="text-secondary fw-medium" style={{ opacity: 0.9 }}>
                    {item.name}
                  </span>
                </div>
                <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                  {item.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProjectStatusChart;