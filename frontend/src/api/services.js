import api from './api';

// Dashboard API
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

export const getUserStats = async (userId) => {
  try {
    const response = await api.get(`/dashboard/user/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};

// Projects API
export const getAllProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};

export const getProjectsByGroup = async (groupId) => {
  try {
    const response = await api.get(`/projects/group/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects by group:', error);
    return [];
  }
};

export const getProjectsByStatus = async (status) => {
  try {
    const response = await api.get(`/projects/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects by status:', error);
    return [];
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
};

export const updateProjectProgress = async (id, progress) => {
  try {
    const response = await api.put(`/projects/${id}/progress`, { progress });
    return response.data;
  } catch (error) {
    console.error('Error updating project progress:', error);
    return null;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    return null;
  }
};

// Tasks API
export const getAllTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    return null;
  }
};

export const getTasksByProject = async (projectId) => {
  try {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    return [];
  }
};

export const getTasksByStatus = async (status) => {
  try {
    const response = await api.get(`/tasks/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    return [];
  }
};

export const getTasksAssignedToUser = async (userId) => {
  try {
    const response = await api.get(`/tasks/assigned/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return [];
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
};

export const updateTaskStatus = async (id, status) => {
  try {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    return null;
  }
};

export const updateTaskProgress = async (id, progress) => {
  try {
    const response = await api.put(`/tasks/${id}/progress`, { progress });
    return response.data;
  } catch (error) {
    console.error('Error updating task progress:', error);
    return null;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    return null;
  }
};

// Users API
export const getUsersByRole = async (role) => {
  try {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
};

export const getAllMentors = async () => {
  try {
    const response = await api.get('/users/mentors');
    return response.data;
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return [];
  }
};

export const getAllStudents = async () => {
  try {
    const response = await api.get('/users/students');
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const getAllCommittee = async () => {
  try {
    const response = await api.get('/users/committee');
    return response.data;
  } catch (error) {
    console.error('Error fetching committee:', error);
    return [];
  }
};

export const getApprovedUsers = async () => {
  try {
    const response = await api.get('/users/approved');
    return response.data;
  } catch (error) {
    console.error('Error fetching approved users:', error);
    return [];
  }
};

// Notifications API
export const getAllNotifications = async (userId) => {
  try {
    const response = await api.get(`/notifications?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const getUnreadNotifications = async (userId) => {
  try {
    const response = await api.get(`/notifications/unread?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const response = await api.put(`/notifications/read-all?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return null;
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return null;
  }
};
