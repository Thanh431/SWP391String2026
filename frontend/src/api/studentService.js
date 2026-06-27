import api from './api';

export const getMyCourses = async (studentId) => {
  const response = await api.get(`/student/${studentId}/courses`);
  return response.data;
};

export const joinCourse = async (studentId, classCode) => {
  const response = await api.post(`/student/${studentId}/courses/join`, { classCode });
  return response.data;
};

export const getCourseTopics = async (studentId, classSlug) => {
  const response = await api.get(`/student/${studentId}/courses/${classSlug}/topics`);
  return response.data;
};

export const joinTopicGroup = async (studentId, topicId) => {
  const response = await api.post(`/student/${studentId}/topics/${topicId}/join`);
  return response.data;
};

export const getMyTeam = async (studentId) => {
  const response = await api.get(`/student/${studentId}/team`);
  return response.data;
};

export const getSubmissions = async (studentId) => {
  const response = await api.get(`/student/${studentId}/submissions`);
  return response.data;
};

export const getStudentDashboard = async (studentId) => {
  const response = await api.get(`/student/${studentId}/dashboard`);
  return response.data;
};

export const getStudentGrades = async (studentId) => {
  const response = await api.get(`/student/${studentId}/grades`);
  return response.data;
};

export const submitPhase = async (studentId, phaseId, payload) => {
  const response = await api.post(`/student/${studentId}/submissions/${phaseId}`, payload);
  return response.data;
};

export const joinTeamByCode = async (studentId, groupCode) => {
  const response = await api.post(`/student/${studentId}/team/join-code`, { groupCode });
  return response.data;
};

export const inviteTeamMember = async (studentId, email) => {
  const response = await api.post(`/student/${studentId}/team/invite`, { email });
  return response.data;
};

export const acceptTeamInvitation = async (studentId, invitationId) => {
  const response = await api.post(`/student/${studentId}/team/invitations/${invitationId}/accept`);
  return response.data;
};

export const declineTeamInvitation = async (studentId, invitationId) => {
  const response = await api.post(`/student/${studentId}/team/invitations/${invitationId}/decline`);
  return response.data;
};
