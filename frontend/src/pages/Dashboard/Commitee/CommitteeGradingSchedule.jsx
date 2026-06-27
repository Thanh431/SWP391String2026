import { useNavigate } from 'react-router-dom';
import { Card, Badge, Table, Accordion, Alert, Button } from 'react-bootstrap';
import { FaCalendarAlt, FaDoorOpen, FaClock, FaUsers } from 'react-icons/fa';
import { getCommitteeSchedules } from '../../../api/committeeService';
import { useCommitteeData, useCommitteeSession } from './useCommitteeSession';
import { COMMITTEE_PATHS } from './committeePaths';

const CommitteeGradingSchedule = () => {
  const navigate = useNavigate();
  const { user } = useCommitteeSession();
  const { data: schedules, loading, error, reload } = useCommitteeData(getCommitteeSchedules, []);

  if (loading) {
    return <div className="p-4 text-muted">Đang tải lịch chấm...</div>;
  }

  return (
    <div className="px-1 py-2" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0">Lịch chấm điểm</h3>
        <p className="text-muted small m-0 mt-1">
          Lịch bảo vệ các nhóm được phân công cho <strong>{user?.username}</strong>.
        </p>
      </div>

      {error && <Alert variant="danger">{error} <Button size="sm" variant="link" onClick={reload}>Thử lại</Button></Alert>}

      {(schedules?.length ?? 0) === 0 && !error && (
        <Alert variant="info">
          Chưa có lịch chấm nào được Admin phân công cho tài khoản <strong>{user?.username}</strong>.
          Admin cần chọn đúng email Committee này khi tạo lịch tại <strong>Defense Schedule</strong>.
        </Alert>
      )}

      <Accordion defaultActiveKey="0" className="d-flex flex-column gap-3">
        {(schedules ?? []).map((slot, index) => (
          <Accordion.Item eventKey={String(index)} key={slot.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Accordion.Header className="bg-white">
              <div className="d-flex flex-wrap align-items-center gap-3 w-100 pe-3">
                <div className="d-flex align-items-center gap-2">
                  <FaCalendarAlt className="text-success" />
                  <span className="fw-bold">{slot.dayLabel}</span>
                </div>
                <Badge bg="dark" className="rounded-2 px-2 py-1 fw-normal"><FaDoorOpen className="me-1" size={11} />{slot.room}</Badge>
                <Badge bg="primary" className="bg-opacity-10 text-primary rounded-2 px-2 py-1 fw-normal"><FaClock className="me-1" size={11} />{slot.timeSlot}</Badge>
                <Badge bg="success" className="bg-opacity-10 text-success rounded-2 px-2 py-1 ms-auto"><FaUsers className="me-1" size={11} />Chấm {slot.groupCount} nhóm</Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body className="bg-white pt-0">
              <p className="text-muted small mb-3">Trưởng ca: <strong>{slot.committeeLead}</strong></p>
              <Card className="border border-light rounded-3">
                <Card.Body className="p-0">
                  <Table responsive className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr className="small text-muted text-uppercase">
                        <th className="ps-4 py-3">Mã nhóm</th>
                        <th className="py-3">Tên nhóm</th>
                        <th className="py-3">Đề tài</th>
                        <th className="py-3">Trạng thái</th>
                        <th className="pe-4 py-3 text-end">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slot.groups.map((group) => (
                        <tr key={group.defenseId || group.id}>
                          <td className="ps-4 fw-bold">{group.id}</td>
                          <td>{group.name}</td>
                          <td>{group.topic}</td>
                          <td><Badge bg="info" className="bg-opacity-10 text-info rounded-2">{group.status}</Badge></td>
                          <td className="pe-4 text-end">
                            <Button size="sm" variant="outline-success" className="rounded-3" onClick={() => navigate(COMMITTEE_PATHS.evaluations)}>
                              Chấm điểm
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default CommitteeGradingSchedule;
