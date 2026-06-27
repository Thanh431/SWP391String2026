import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaClipboardList } from 'react-icons/fa';
import api from '../../api/api';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchMembers();
  }, [filter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      let endpoint = '/users/approved';
      if (filter && filter !== 'All') {
        endpoint = `/users/role/${filter}`;
      } else {
        endpoint = '/users/approved';
      }
      const response = await api.get(endpoint);
      setMembers(response.data);
      setError('');
    } catch (err) {
      setError('Lỗi khi tải danh sách thành viên');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const variantMap = {
      'Student': 'info',
      'Mentor': 'primary',
      'Committee': 'warning',
      'Admin': 'danger',
    };
    const labels = {
      'Student': 'Học viên',
      'Mentor': 'Hướng dẫn viên',
      'Committee': 'Ban quản lý',
      'Admin': 'Quản trị viên',
    };
    return <Badge bg={variantMap[role] || 'light'}>{labels[role] || role}</Badge>;
  };

  if (loading) return <Container className="py-5"><p>Đang tải...</p></Container>;

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold m-0">Quản lý Thành viên</h3>
        <p className="text-muted small mt-2">Danh sách tất cả thành viên trong hệ thống</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col md={3} className="d-flex gap-2">
          <Button
            variant={filter === 'All' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('All')}
            className="flex-fill"
          >
            <FaUsers /> Tất cả
          </Button>
        </Col>
        <Col md={3}>
          <Button
            variant={filter === 'Student' ? 'info' : 'outline-info'}
            onClick={() => setFilter('Student')}
            className="w-100"
          >
            Học viên
          </Button>
        </Col>
        <Col md={3}>
          <Button
            variant={filter === 'Mentor' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('Mentor')}
            className="w-100"
          >
            <FaUserTie /> Hướng dẫn viên
          </Button>
        </Col>
        <Col md={3}>
          <Button
            variant={filter === 'Committee' ? 'warning' : 'outline-warning'}
            onClick={() => setFilter('Committee')}
            className="w-100"
          >
            <FaClipboardList /> Ban quản lý
          </Button>
        </Col>
      </Row>

      <Card className="shadow-sm rounded-4">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Bộ môn</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  Chưa có thành viên nào
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td className="fw-semibold">{member.username}</td>
                  <td>{member.fullName || 'Chưa cập nhật'}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>{member.department || 'Chưa cập nhật'}</td>
                  <td>{member.phone || 'Chưa cập nhật'}</td>
                  <td>
                    {member.approved ? (
                      <Badge bg="success">Đã duyệt</Badge>
                    ) : (
                      <Badge bg="warning">Chờ duyệt</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default MembersPage;
