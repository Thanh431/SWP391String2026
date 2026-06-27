import api from './api';

export const getMentorDashboard = async (mentorId) => {
  const response = await api.get(`/mentor/dashboard/${mentorId}`);
  return response.data;
};

export const getMentorClasses = async (mentorId) => {
  const response = await api.get(`/mentor/classes/${mentorId}`);
  return response.data;
};

export const getMentorClassDetail = async (mentorId, slug) => {
  const response = await api.get(`/mentor/classes/${mentorId}/${slug}`);
  return response.data;
};

export const getMentorIncomingRequests = async (mentorId) => {
  const response = await api.get(`/mentor/requests/${mentorId}`);
  return response.data;
};

export const acceptMentorRequest = async (mentorId, requestId) => {
  const response = await api.put(`/mentor/requests/${mentorId}/${requestId}/accept`);
  return response.data;
};

export const declineMentorRequest = async (mentorId, requestId, reason) => {
  const response = await api.put(`/mentor/requests/${mentorId}/${requestId}/decline`, { reason });
  return response.data;
};

export const getMentorReviewQueue = async (mentorId) => {
  const response = await api.get(`/mentor/review-queue/${mentorId}`);
  return response.data;
};

export const gradeSubmission = async (mentorId, submissionId, feedback, rating, score) => {
  const response = await api.put(`/mentor/review-queue/${mentorId}/${submissionId}/grade`, {
    feedback,
    rating,
    score: score != null ? String(score) : undefined,
  });
  return response.data;
};

export const getMentorProgress = async (mentorId) => {
  const response = await api.get(`/mentor/progress/${mentorId}`);
  return response.data;
};

export const getMentorClassTopics = async (mentorId, classSlug) => {
  const response = await api.get(`/mentor/classes/${mentorId}/${classSlug}/topics`);
  return response.data;
};

export const createMentorClassTopic = async (mentorId, classSlug, payload) => {
  const response = await api.post(`/mentor/classes/${mentorId}/${classSlug}/topics`, payload);
  return response.data;
};

export const deleteMentorClassTopic = async (mentorId, topicId) => {
  const response = await api.delete(`/mentor/classes/${mentorId}/topics/${topicId}`);
  return response.data;
};

export const getAvailableMentors = async () => {
  const response = await api.get('/mentor-requests/mentors');
  return response.data;
};

export const getStudentMentorRequests = async (studentId) => {
  const response = await api.get(`/mentor-requests/student/${studentId}`);
  return response.data;
};

export const createMentorRequest = async (payload) => {
  const response = await api.post('/mentor-requests', payload);
  return response.data;
};

export const getCommitteeFeedbacks = async () => {
  const response = await api.get('/committee/feedbacks');
  return response.data;
};

export const feedbackRatings = ['Excellent', 'Good', 'Needs Improvement', 'At Risk'];
