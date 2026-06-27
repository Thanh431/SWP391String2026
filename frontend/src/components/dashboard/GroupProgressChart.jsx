import { Card, ProgressBar } from 'react-bootstrap';

const GroupProgressChart = ({ data }) => {
  return (
    <Card className="border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center pb-3 pt-2 px-2">
        <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.95rem' }}>Group Progress Overview</h6>
        <a href="#" className="text-success text-decoration-none fw-semibold small" style={{ color: '#103d2b', fontSize: '0.8rem' }}>View All</a>
      </Card.Header>
      
      <Card.Body className="d-flex flex-column justify-content-between pt-0 pb-2">
        {data.map((group) => (
          <div key={group.id} className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '0.82rem' }}>
              <span className="fw-bold text-dark">{group.id} - {group.name}</span>
              <span className="text-dark fw-bold">{group.progress}%</span>
            </div>
            <ProgressBar 
              now={group.progress} 
              style={{ height: '7px', backgroundColor: '#eef2f0' }}
              className="rounded-pill custom-progress-bar"
            />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default GroupProgressChart;