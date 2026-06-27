import api from './api';

export const getSemesters = async () => {
  const response = await api.get('/admin/semesters');
  return response.data;
};

export const createSemester = async (payload) => {
  const response = await api.post('/admin/semesters', payload);
  return response.data;
};

export const updateSemester = async (id, payload) => {
  const response = await api.put(`/admin/semesters/${id}`, payload);
  return response.data;
};

export const deleteSemester = async (id) => {
  const response = await api.delete(`/admin/semesters/${id}`);
  return response.data;
};

export const getDefenseSchedules = async () => {
  const response = await api.get('/admin/defense-schedules');
  return response.data;
};

export const createDefenseSchedule = async (payload) => {
  const response = await api.post('/admin/defense-schedules', payload);
  return response.data;
};

export const updateDefenseSchedule = async (id, payload) => {
  const response = await api.put(`/admin/defense-schedules/${id}`, payload);
  return response.data;
};

export const deleteDefenseSchedule = async (id) => {
  const response = await api.delete(`/admin/defense-schedules/${id}`);
  return response.data;
};

export const getAdminStudentGroups = async () => {
  const response = await api.get('/admin/student-groups');
  return response.data;
};

export const getCommitteeUsers = async () => {
  const response = await api.get('/users/committee');
  return (response.data || []).filter((user) => user.approved);
};

export const getCommitteeSchedules = async () => {
  const response = await api.get('/committee/schedules');
  return response.data;
};

export const getMentorClasses = async () => {
  const response = await api.get('/admin/classes');
  return response.data;
};

export const createMentorClass = async (payload) => {
  const response = await api.post('/admin/classes', payload);
  return response.data;
};

export const updateMentorClass = async (id, payload) => {
  const response = await api.put(`/admin/classes/${id}`, payload);
  return response.data;
};

export const deleteMentorClass = async (id) => {
  const response = await api.delete(`/admin/classes/${id}`);
  return response.data;
};

export const getMentors = async () => {
  const response = await api.get('/users/mentors');
  return response.data;
};

export const getAdminEvaluations = async () => {
  const response = await api.get('/admin/evaluations');
  return response.data;
};

export const submitAdminDefenseGrade = async (defenseId, payload) => {
  const response = await api.post(`/admin/evaluations/${defenseId}/grade`, payload);
  return response.data;
};

export const getAdminReports = async () => {
  const response = await api.get('/admin/reports');
  return response.data;
};

export const getAdminFinalGrades = async (params = {}) => {
  const response = await api.get('/admin/final-grades', { params });
  return response.data;
};

export const aiLoadAdminFinalGrades = async (query) => {
  const response = await api.post('/admin/final-grades/ai-load', { query });
  return response.data;
};

export const publishAdminFinalGrades = async (payload) => {
  const response = await api.post('/admin/final-grades/publish', payload);
  return response.data;
};

export const semesterStatuses = ['Planning', 'Active', 'Completed'];
export const defenseStatuses = ['Scheduled', 'In Progress', 'Completed', 'Rescheduled'];
export const campusOptions = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Quy Nhon'];
