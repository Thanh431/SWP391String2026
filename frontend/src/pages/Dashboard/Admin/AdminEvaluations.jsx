import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Table, Badge, Alert, Modal, Row, Col } from 'react-bootstrap';
import { FaCheckSquare, FaEye } from 'react-icons/fa';
import { getAdminEvaluations } from '../../../api/adminService';
import { recommendationStyle } from '../../../api/committeeService';

const AdminEvaluations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getAdminEvaluations());
    } catch {
      setError('Không thể tải danh sách đánh giá hội đồng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const completed = items.filter((item) => item.evaluation).length;
    const pass = items.filter((item) => item.evaluation?.recommendation === 'Pass').length;
    const fail = items.filter((item) => item.evaluation?.recommendation === 'Fail').length;
    return { total: items.length, completed, pending: items.length - completed, pass, fail };
  }, [items]);

  if (loading) {
    return <div className="p-4 text-muted">Đang tải evaluations...</div>;
  }

  return (
    <div className="px-1 py-2">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <FaCheckSquare className="text-success" /> Giám sát chấm hội đồng
          </h3>
          <p className="text-muted small m-0 mt-1">
            Admin chỉ theo dõi điểm hội đồng (HĐ 40%). Chấm điểm do Committee thực hiện — Admin không sửa điểm.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Badge bg="secondary" className="rounded-3 px-3 py-2">Tổng: {stats.total}</Badge>
          <Badge bg="success" className="rounded-3 px-3 py-2">Đã chấm: {stats.completed}</Badge>
          <Badge bg="warning" text="dark" className="rounded-3 px-3 py-2">Chờ chấm: {stats.pending}</Badge>
          <Badge bg="success" className="bg-opacity-10 text-success rounded-3 px-3 py-2">Pass: {stats.pass}</Badge>
          <Badge bg="danger" className="bg-opacity-10 text-danger rounded-3 px-3 py-2">Fail: {stats.fail}</Badge>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4 py-3">Nhóm</th>
                <th className="py-3">Dự án</th>
                <th className="py-3">Kỳ</th>
                <th className="py-3">Hội đồng</th>
                <th className="py-3">Lịch bảo vệ</th>
                <th className="py-3">Điểm TB</th>
                <th className="py-3">Kết quả</th>
                <th className="pe-4 py-3 text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const ev = item.evaluation;
                return (
                  <tr key={item.defenseId}>
                    <td className="ps-4">
                      <div className="fw-bold">{item.groupCode}</div>
                      <small className="text-muted">{item.groupName}</small>
                    </td>
                    <td className="small">{item.project}</td>
                    <td className="small">{item.semesterName}</td>
                    <td className="small">{item.committeeName}</td>
                    <td className="small">
                      <div>{item.defenseDate}</div>
                      <div className="text-muted">{item.timeSlot} · {item.location}</div>
                    </td>
                    <td>
                      {ev ? (
                        <span className="fw-bold text-success">{ev.overallScore}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {ev ? (
                        <Badge bg={recommendationStyle[ev.recommendation] || 'secondary'} className="rounded-2">
                          {ev.recommendation}
                        </Badge>
                      ) : (
                        <Badge bg="warning" text="dark" className="rounded-2">Chờ hội đồng</Badge>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      {ev ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-1"
                          onClick={() => setSelected(item)}
                        >
                          <FaEye size={11} /> Xem
                        </button>
                      ) : (
                        <span className="text-muted small">Chờ Committee chấm</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Chưa có lịch bảo vệ nào.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Chi tiết điểm — {selected?.groupCode}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected?.evaluation && (
            <>
              <p className="text-muted small mb-3">
                {selected.groupName} · {selected.project} · Hội đồng: {selected.committeeName}
              </p>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <div className="p-3 rounded-3 bg-light text-center">
                    <div className="text-muted small">Kỹ thuật</div>
                    <div className="fw-bold fs-5">{selected.evaluation.technicalScore}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 rounded-3 bg-light text-center">
                    <div className="text-muted small">Trình bày</div>
                    <div className="fw-bold fs-5">{selected.evaluation.presentationScore}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 rounded-3 bg-light text-center">
                    <div className="text-muted small">Sáng tạo</div>
                    <div className="fw-bold fs-5">{selected.evaluation.innovationScore}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 rounded-3 bg-success bg-opacity-10 text-center">
                    <div className="text-muted small">Tổng</div>
                    <div className="fw-bold fs-5 text-success">{selected.evaluation.overallScore}</div>
                  </div>
                </Col>
              </Row>
              <div className="mb-2">
                <strong>Kết luận: </strong>
                <Badge bg={recommendationStyle[selected.evaluation.recommendation] || 'secondary'}>
                  {selected.evaluation.recommendation}
                </Badge>
              </div>
              <div>
                <strong>Nhận xét:</strong>
                <p className="text-muted small mt-1 mb-0">
                  {selected.evaluation.feedback || 'Chưa có nhận xét.'}
                </p>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminEvaluations;
