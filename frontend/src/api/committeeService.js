import api from './api';

const cid = (committeeId) => encodeURIComponent(Number(committeeId));

export const getCommitteeDashboard = async (committeeId) => {
  const response = await api.get(`/committee/dashboard/${cid(committeeId)}`);
  return response.data;
};

export const getCommitteeFeedbacks = async (committeeId) => {
  const response = await api.get(`/committee/feedbacks/${cid(committeeId)}`);
  return response.data;
};

export const getCommitteeSchedules = async (committeeId) => {
  const response = await api.get(`/committee/schedules/${cid(committeeId)}`);
  return response.data;
};

export const getCommitteeEvaluations = async (committeeId) => {
  const response = await api.get(`/committee/evaluations/${cid(committeeId)}`);
  return response.data;
};

export const getCommitteeEvaluationStats = async (committeeId) => {
  const response = await api.get(`/committee/evaluations/${cid(committeeId)}/stats`);
  return response.data;
};

export const submitCommitteeEvaluation = async (committeeId, payload) => {
  const response = await api.post(`/committee/evaluations/${cid(committeeId)}`, payload);
  return response.data;
};

export const getPendingReports = async (committeeId) => {
  const response = await api.get(`/committee/reports/${cid(committeeId)}/pending`);
  return response.data;
};

export const reviewReport = async (committeeId, submissionId, payload) => {
  const response = await api.put(`/committee/reports/${cid(committeeId)}/${submissionId}/review`, payload);
  return response.data;
};

export const getPublishedResults = async (committeeId) => {
  const response = await api.get(`/committee/published-results/${cid(committeeId)}`);
  return response.data;
};

export const publishResult = async (committeeId, defenseId) => {
  const response = await api.post(`/committee/published-results/${cid(committeeId)}/${defenseId}`);
  return response.data;
};

export const unpublishResult = async (committeeId, defenseId) => {
  const response = await api.delete(`/committee/published-results/${cid(committeeId)}/${defenseId}`);
  return response.data;
};

export const getProjectArchives = async (committeeId) => {
  const response = await api.get(`/committee/archives/${cid(committeeId)}`);
  return response.data;
};

export const getCommitteeReportsSummary = async (committeeId) => {
  const response = await api.get(`/committee/reports/${cid(committeeId)}/summary`);
  return response.data;
};

export const exportCommitteeReport = async (committeeId) => {
  const response = await api.get(`/committee/export/${cid(committeeId)}`);
  return response.data;
};

export const recommendations = ['Pass', 'Conditional Pass', 'Fail'];

export const recommendationStyle = {
  Pass: 'success',
  'Conditional Pass': 'warning',
  Fail: 'danger',
};

export const feedbackRatings = ['Excellent', 'Good', 'Needs Improvement', 'At Risk'];

export const downloadExportCsv = (rows, filename = 'committee-evaluation-report.csv') => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
