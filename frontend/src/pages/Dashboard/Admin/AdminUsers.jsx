import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaClipboardList, FaUserShield } from 'react-icons/fa';
import { getApprovedUsers, getUsersByRole } from '../../../api/services';

const roleVariant = {
  Student: 'info',
  Mentor: 'primary',
  Committee: 'warning',
  Admin: 'danger',
};

const roleLabel = {
  Student: 'Student',
  Mentor: 'Mentor',
  Committee: 'Committee',
  Admin: 'Admin',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = filter === 'All' ? await getApprovedUsers() : await getUsersByRole(filter);
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = [
    { key: 'All', label: 'All', icon: FaUsers },
    { key: 'Student', label: 'Students', icon: FaUsers },
    { key: 'Mentor', label: 'Mentors', icon: FaUserTie },
    { key: 'Committee', label: 'Committee', icon: FaClipboardList },
    { key: 'Admin', label: 'Admin', icon: FaUserShield },
  ];

  if (loading) {
    return <div className="p-4 text-muted">Loading users...</div>;
  }

  return (
    <div className="px-1 py-2">
      <div className="mb-4">
        <h3 className="fw-bold m-0">User Management</h3>
        <p className="text-muted small mt-1">
          View all approved accounts. Create and approve new accounts in Settings.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-2 mb-4">
        {filters.map(({ key, label, icon: Icon }) => (
          <Col key={key} xs={6} md={4} lg={2}>
            <Button
              variant={filter === key ? 'dark' : 'outline-secondary'}
              className="w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
              style={filter === key ? { backgroundColor: '#103d2b', border: 'none' } : {}}
              onClick={() => setFilter(key)}
            >
              <Icon size={12} /> {label}
            </Button>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4 py-3">Email</th>
                <th className="py-3">Full Name</th>
                <th className="py-3">Role</th>
                <th className="py-3">Department</th>
                <th className="py-3">Phone</th>
                <th className="pe-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="ps-4 fw-semibold">{user.username}</td>
                    <td>{user.fullName || '—'}</td>
                    <td>
                      <Badge bg={roleVariant[user.role] || 'secondary'} className="rounded-2">
                        {roleLabel[user.role] || user.role}
                      </Badge>
                    </td>
                    <td>{user.department || '—'}</td>
                    <td>{user.phone || '—'}</td>
                    <td className="pe-4">
                      {user.approved ? (
                        <Badge bg="success" className="bg-opacity-10 text-success rounded-2">Approved</Badge>
                      ) : (
                        <Badge bg="warning" text="dark" className="rounded-2">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminUsers;
