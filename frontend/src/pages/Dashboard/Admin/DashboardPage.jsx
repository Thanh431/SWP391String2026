import React from 'react';
import { useAuth } from '../../../auth/AuthContext';
import StudentDashboard from '../Student/StudentDashboard';
import MentorDashboard from '../Mentor/MentorDashboard';
import AdminDashboard from './AdminDashboard';

const DashboardPage = () => {
  const auth = useAuth();
  const userRole = auth?.user?.role;

  if (userRole === 'Student') {
    return <StudentDashboard />;
  }

  if (userRole === 'Mentor') {
    return <MentorDashboard />;
  }

  if (userRole === 'Admin') {
    return <AdminDashboard />;
  }

  return null;
};

export default DashboardPage;
