import { Table, Card, Badge, ProgressBar } from 'react-bootstrap';
import { FaSlidersH } from 'react-icons/fa';

const RecentProjectsTable = ({ projects }) => {
  // Trả về style badge dựa trên trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Progress': 
        return <Badge bg="success" className="bg-opacity-25 text-success px-2.5 py-1.5 rounded-pill fw-semibold">In Progress</Badge>;
      case 'Completed': 
        return <Badge bg="secondary" className="bg-opacity-25 text-secondary px-2.5 py-1.5 rounded-pill fw-semibold">Completed</Badge>;
      case 'On Hold': 
        return <Badge bg="danger" className="bg-opacity-25 text-danger px-2.5 py-1.5 rounded-pill fw-semibold">On Hold</Badge>;
      default: 
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4 mt-4 p-3">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center p-2">
        <h6 className="fw-bold m-0 text-dark">Recent Projects</h6>
        <button className="btn btn-link text-muted p-0"><FaSlidersH /></button>
      </Card.Header>
      
      <Card.Body className="p-0">
        <Table responsive hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.85rem' }}>
          <thead className="table-light text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            <tr>
              <th className="border-0 py-3 ps-3">Group / Project Name</th>
              <th className="border-0 py-3">Mentor</th>
              <th className="border-0 py-3">Status</th>
              <th className="border-0 py-3" style={{ width: '150px' }}>Progress</th>
              <th className="border-0 py-3">Last Updated</th>
              <th className="border-0 py-3 pe-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, idx) => (
              <tr key={idx}>
                <td className="py-3 ps-3">
                  <div className="fw-bold text-dark">{project.projectName}</div>
                  <small className="text-muted">{project.groupId}</small>
                </td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary fw-bold" 
                         style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                      {project.mentorInitials}
                    </div>
                    <span>{project.mentorName}</span>
                  </div>
                </td>
                <td className="py-3">{getStatusBadge(project.status)}</td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2">
                    <ProgressBar 
                      now={project.progress} 
                      style={{ height: '6px', width: '80px', backgroundColor: '#e9ecef' }} 
                      variant={project.status === 'On Hold' ? 'danger' : 'success'} 
                      className="rounded-pill"
                    />
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{project.progress}%</span>
                  </div>
                </td>
                <td className="py-3 text-secondary">{project.lastUpdated}</td>
                <td className="py-3 pe-3"></td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {/* View All Footer */}
        <div className="text-center py-3 border-top mt-2">
          <a href="#" className="text-success text-decoration-none fw-bold small">View All Projects</a>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RecentProjectsTable;