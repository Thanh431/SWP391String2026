import { Card } from 'react-bootstrap';

const StatCard = ({ title, value, subtext, icon: Icon, trendUp }) => {
  return (
    <Card className="border-0 shadow-sm rounded-4 position-relative overflow-hidden h-100 bg-white">
      <Card.Body className="p-4" style={{ minHeight: '130px' }}>
        <div className="text-secondary small fw-medium mb-1" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
          {title}
        </div>
        <h2 className="fw-bold mb-2 text-dark" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
          {value}
        </h2>
        <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
          {trendUp ? (
            <span className="text-success fw-semibold d-flex align-items-center">
              <span className="me-1">↗</span> {subtext}
            </span>
          ) : (
            <span className="text-secondary opacity-75">{subtext}</span>
          )}
        </div>

        {/* Khối decor vát xéo góc phải đặc trưng của bản thiết kế */}
        <div 
          className="position-absolute end-0 top-0 h-100 d-flex align-items-center justify-content-center" 
          style={{ 
            backgroundColor: '#f3faf7', 
            width: '75px', 
            borderRadius: '100px 0 0 100px',
            transform: 'scaleY(1.1) translateX(5px)',
            transition: 'all 0.3s ease'
          }}
        >
          <div className="bg-success bg-opacity-10 p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ transform: 'translateX(-4px)' }}>
            <Icon size={18} style={{ color: '#103d2b' }} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;